import { Hono } from 'hono';
import { db } from '../db/index.js';
import { gatewaySessions, gatewayBalances, gatewayLedger, merchants, distributors, distributorCommissions } from '../db/schema.js';
import { eq, and, desc, sql, lte } from 'drizzle-orm';
import { deliverWebhook } from '../services/webhook.js';
import { randomUUID } from 'node:crypto';

const gatewaySessionRoutes = new Hono<{ Variables: { merchantId: string } }>();

// POST /api/gateway/sessions - Create deposit session
gatewaySessionRoutes.post('/api/gateway/sessions', async (c) => {
  try {
    const body = await c.req.json();
    const { playerRef, amount, token, chain, metadata, idempotencyKey } = body;
    const merchantId = c.get('merchantId') as string;

    // Validation
    if (!playerRef || typeof playerRef !== 'string') {
      return c.json({ error: 'Valid playerRef is required' }, 400);
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return c.json({ error: 'Valid amount is required' }, 400);
    }

    if (!token || typeof token !== 'string') {
      return c.json({ error: 'Valid token is required' }, 400);
    }

    if (!chain || typeof chain !== 'string') {
      return c.json({ error: 'Valid chain is required' }, 400);
    }

    // Check for existing session with same idempotency key
    if (idempotencyKey) {
      const existingSession = await db
        .select()
        .from(gatewaySessions)
        .where(
          and(
            eq(gatewaySessions.merchantId, merchantId),
            eq(gatewaySessions.idempotencyKey, idempotencyKey)
          )
        )
        .limit(1);

      if (existingSession.length > 0) {
        return c.json({ session: existingSession[0] }, 200);
      }
    }

    // Set expiration to 30 minutes from now
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const result = await db.insert(gatewaySessions).values({
      merchantId,
      sessionType: 'deposit',
      playerRef,
      amount: amount.toString(),
      token,
      chain,
      status: 'pending',
      metadata,
      idempotencyKey,
      expiresAt,
    }).returning();

    const session = result[0];

    // Fire webhook (fire-and-forget)
    deliverWebhook({
      merchantId,
      sessionId: session.id,
      event: 'session.created',
      payload: { session },
    }).catch(console.warn);

    return c.json({ session }, 201);
  } catch (error) {
    console.error('Failed to create session:', error);
    return c.json({ error: 'Failed to create session' }, 500);
  }
});

// GET /api/gateway/sessions/:sessionId - Get session details
gatewaySessionRoutes.get('/api/gateway/sessions/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId');
  const merchantId = c.get('merchantId') as string;

  if (!sessionId) {
    return c.json({ error: 'Session ID parameter is required' }, 400);
  }

  try {
    const session = await db
      .select()
      .from(gatewaySessions)
      .where(
        and(
          eq(gatewaySessions.id, sessionId),
          eq(gatewaySessions.merchantId, merchantId)
        )
      )
      .limit(1);

    if (session.length === 0) {
      return c.json({ error: 'Session not found' }, 404);
    }

    return c.json({ session: session[0] });
  } catch (error) {
    console.error('Failed to get session:', error);
    return c.json({ error: 'Failed to get session' }, 500);
  }
});

// GET /api/gateway/sessions - List sessions
gatewaySessionRoutes.get('/api/gateway/sessions', async (c) => {
  const merchantId = c.get('merchantId') as string;
  const playerRef = c.req.query('playerRef');
  const status = c.req.query('status');
  const limitParam = c.req.query('limit');
  const offsetParam = c.req.query('offset');

  const limit = limitParam ? Math.min(parseInt(limitParam), 100) : 50;
  const offset = offsetParam ? parseInt(offsetParam) : 0;

  try {
    // Build where conditions
    const conditions = [eq(gatewaySessions.merchantId, merchantId)];
    
    if (playerRef) {
      conditions.push(eq(gatewaySessions.playerRef, playerRef));
    }
    
    if (status) {
      conditions.push(eq(gatewaySessions.status, status));
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    // Get sessions
    const sessions = await db
      .select()
      .from(gatewaySessions)
      .where(whereClause)
      .orderBy(desc(gatewaySessions.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(gatewaySessions)
      .where(whereClause);

    const total = totalResult[0].count;

    return c.json({ sessions, total });
  } catch (error) {
    console.error('Failed to list sessions:', error);
    return c.json({ error: 'Failed to list sessions' }, 500);
  }
});

// POST /api/gateway/sessions/:sessionId/confirm - Confirm deposit (internal)
gatewaySessionRoutes.post('/api/gateway/sessions/:sessionId/confirm', async (c) => {
  const sessionId = c.req.param('sessionId');
  const merchantId = c.get('merchantId') as string;

  if (!sessionId) {
    return c.json({ error: 'Session ID parameter is required' }, 400);
  }

  try {
    const body = await c.req.json();
    const { txHash, commitment, amount: confirmedAmount } = body;

    if (!txHash || typeof txHash !== 'string') {
      return c.json({ error: 'Valid txHash is required' }, 400);
    }

    if (!commitment || typeof commitment !== 'string') {
      return c.json({ error: 'Valid commitment is required' }, 400);
    }

    if (typeof confirmedAmount !== 'number' || confirmedAmount <= 0) {
      return c.json({ error: 'Valid amount is required' }, 400);
    }

    // Get session and validate
    const sessionResult = await db
      .select()
      .from(gatewaySessions)
      .where(
        and(
          eq(gatewaySessions.id, sessionId),
          eq(gatewaySessions.merchantId, merchantId),
          eq(gatewaySessions.status, 'pending')
        )
      )
      .limit(1);

    if (sessionResult.length === 0) {
      return c.json({ error: 'Session not found or not pending' }, 404);
    }

    const session = sessionResult[0];

    // Update session status
    const updatedSession = await db
      .update(gatewaySessions)
      .set({
        status: 'confirmed',
        txHash,
        commitment,
        updatedAt: new Date(),
      })
      .where(eq(gatewaySessions.id, sessionId))
      .returning();

    // Get or create balance
    const existingBalance = await db
      .select()
      .from(gatewayBalances)
      .where(
        and(
          eq(gatewayBalances.merchantId, merchantId),
          eq(gatewayBalances.playerRef, session.playerRef),
          eq(gatewayBalances.currency, session.token)
        )
      )
      .limit(1);

    const balanceBefore = existingBalance.length > 0 ? existingBalance[0].availableBalance : '0';
    const balanceAfter = (parseFloat(balanceBefore) + confirmedAmount).toFixed(6);

    if (existingBalance.length === 0) {
      await db.insert(gatewayBalances).values({
        merchantId,
        playerRef: session.playerRef,
        currency: session.token,
        availableBalance: confirmedAmount.toString(),
        pendingBalance: '0',
        totalDeposited: confirmedAmount.toString(),
        totalWithdrawn: '0',
      });
    } else {
      await db
        .update(gatewayBalances)
        .set({
          availableBalance: balanceAfter,
          totalDeposited: sql`${gatewayBalances.totalDeposited}::numeric + ${confirmedAmount}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(gatewayBalances.merchantId, merchantId),
            eq(gatewayBalances.playerRef, session.playerRef),
            eq(gatewayBalances.currency, session.token)
          )
        );
    }

    // Insert ledger entry
    await db.insert(gatewayLedger).values({
      merchantId,
      playerRef: session.playerRef,
      type: 'deposit',
      amount: confirmedAmount.toString(),
      currency: session.token,
      sessionId,
      balanceBefore,
      balanceAfter,
      description: `Deposit confirmed: ${txHash}`,
    });

    // Fire webhook (fire-and-forget)
    deliverWebhook({
      merchantId,
      sessionId,
      event: 'deposit.confirmed',
      payload: { session: updatedSession[0] },
    }).catch(console.warn);

    // === Auto-commission accrual ===
    // Look up merchant's distributor and accrue commission if applicable
    try {
      const merchantResult = await db
        .select({ distributorId: merchants.distributorId })
        .from(merchants)
        .where(eq(merchants.id, merchantId))
        .limit(1);

      const distId = merchantResult[0]?.distributorId;
      if (distId) {
        const distributorResult = await db
          .select({
            commissionPercent: distributors.commissionPercent,
            tier: distributors.tier,
            status: distributors.status,
          })
          .from(distributors)
          .where(eq(distributors.id, distId))
          .limit(1);

        const dist = distributorResult[0];
        if (dist && dist.status === 'active' && parseFloat(dist.commissionPercent) > 0) {
          const commissionAmount = (confirmedAmount * parseFloat(dist.commissionPercent) / 100).toFixed(6);

          await db.insert(distributorCommissions).values({
            distributorId: distId,
            merchantId,
            sessionId,
            amount: commissionAmount,
            currency: session.token,
            sourceAmount: confirmedAmount.toString(),
            tier: dist.tier,
            status: 'pending',
          });

          console.log(`Commission accrued: ${commissionAmount} ${session.token} for distributor ${distId} (session ${sessionId})`);
        }
      }
    } catch (commErr) {
      // Commission accrual should never block the deposit confirmation
      console.warn('Failed to accrue distributor commission:', commErr);
    }

    return c.json({ session: updatedSession[0] });
  } catch (error) {
    console.error('Failed to confirm deposit:', error);
    return c.json({ error: 'Failed to confirm deposit' }, 500);
  }
});

// POST /api/gateway/sessions/:sessionId/expire - Expire a session
gatewaySessionRoutes.post('/api/gateway/sessions/:sessionId/expire', async (c) => {
  const sessionId = c.req.param('sessionId');
  const merchantId = c.get('merchantId') as string;

  if (!sessionId) {
    return c.json({ error: 'Session ID parameter is required' }, 400);
  }

  try {
    // Get session and validate
    const sessionResult = await db
      .select()
      .from(gatewaySessions)
      .where(
        and(
          eq(gatewaySessions.id, sessionId),
          eq(gatewaySessions.merchantId, merchantId),
          eq(gatewaySessions.status, 'pending')
        )
      )
      .limit(1);

    if (sessionResult.length === 0) {
      return c.json({ error: 'Session not found or not pending' }, 404);
    }

    // Update session status to expired
    const updatedSession = await db
      .update(gatewaySessions)
      .set({
        status: 'expired',
        updatedAt: new Date(),
      })
      .where(eq(gatewaySessions.id, sessionId))
      .returning();

    // Fire webhook (fire-and-forget)
    deliverWebhook({
      merchantId,
      sessionId,
      event: 'session.expired',
      payload: { session: updatedSession[0] },
    }).catch(console.warn);

    return c.json({ session: updatedSession[0] });
  } catch (error) {
    console.error('Failed to expire session:', error);
    return c.json({ error: 'Failed to expire session' }, 500);
  }
});

export default gatewaySessionRoutes;