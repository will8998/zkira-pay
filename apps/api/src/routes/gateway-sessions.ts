import { Hono } from 'hono';
import { db } from '../db/index.js';
import { gatewaySessions, gatewayBalances, gatewayLedger, merchants, ephemeralWallets } from '../db/schema.js';
import { eq, and, desc, sql, lte } from 'drizzle-orm';
import { deliverWebhook } from '../services/webhook.js';
import { randomUUID } from 'node:crypto';
import { Wallet } from 'ethers';
import { encryptPrivateKey } from '../services/crypto.js';
import { logAudit } from '../services/audit.js';
import { toBigInt6, fromBigInt6 } from '../utils/bigint-math.js';

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

    // Generate ephemeral wallet for deposit sessions
    if (session.sessionType === 'deposit') {
      const ephWallet = Wallet.createRandom();
      const encrypted = encryptPrivateKey(ephWallet.privateKey);
      
      // Insert ephemeral wallet
      await db.insert(ephemeralWallets).values({
        address: ephWallet.address.toLowerCase(),
        encryptedKey: encrypted.encrypted,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        salt: encrypted.salt,
        chain,
        token,
        amount: amount.toString(),
        flow: 'deposit',
        expiresAt,
      });
      
      // Update the session with ephemeral wallet address
      await db.update(gatewaySessions)
        .set({ ephemeralWallet: ephWallet.address.toLowerCase() })
        .where(eq(gatewaySessions.id, session.id));
      
      // Update the session object before returning
      session.ephemeralWallet = ephWallet.address.toLowerCase();
    }

    // Fire webhook (fire-and-forget)
    deliverWebhook({
      merchantId,
      sessionId: session.id,
      event: 'session.created',
      payload: { session },
    }).catch(console.warn);

    // Log audit event (fire-and-forget)
    logAudit({
      actor: merchantId,
      action: 'session.created',
      resourceType: 'session',
      resourceId: session.id,
      details: {
        sessionType: session.sessionType,
        playerRef: session.playerRef,
        amount: session.amount,
        token: session.token,
        chain: session.chain
      }
    }).catch(() => {});
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

    // Get session and validate, update status, handle balance, and insert ledger entry in transaction
    const { updatedSession, session } = await db.transaction(async (tx) => {
      const sessionResult = await tx
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
        throw new Error('Session not found or not pending');
      }

      const session = sessionResult[0];

      // Update session status
      const updatedSession = await tx
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
      const existingBalance = await tx
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
      const balanceAfter = fromBigInt6(toBigInt6(balanceBefore) + toBigInt6(confirmedAmount.toString()));

      if (existingBalance.length === 0) {
        await tx.insert(gatewayBalances).values({
          merchantId,
          playerRef: session.playerRef,
          currency: session.token,
          availableBalance: confirmedAmount.toString(),
          pendingBalance: '0',
          totalDeposited: confirmedAmount.toString(),
          totalWithdrawn: '0',
        });
      } else {
        await tx
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
      await tx.insert(gatewayLedger).values({
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

      return { updatedSession, session };
    });

    // Fire webhook (fire-and-forget)
    deliverWebhook({
      merchantId,
      sessionId,
      event: 'deposit.confirmed',
      payload: { session: updatedSession[0] },
    }).catch(console.warn);

    // Log audit event (fire-and-forget)
    logAudit({
      actor: 'system',
      action: 'deposit.confirmed',
      resourceType: 'session',
      resourceId: sessionId,
      details: {
        txHash,
        commitment,
        amount: confirmedAmount,
        playerRef: session.playerRef,
        token: session.token
      }
    }).catch(() => {});

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

// GET /api/gateway/sessions/:sessionId/public - Public session info (for payment page)
gatewaySessionRoutes.get('/api/gateway/sessions/:sessionId/public', async (c) => {
  const sessionId = c.req.param('sessionId');
  if (!sessionId) return c.json({ error: 'Session ID required' }, 400);
  
  try {
    const session = await db.select({
      id: gatewaySessions.id,
      status: gatewaySessions.status,
      amount: gatewaySessions.amount,
      token: gatewaySessions.token,
      chain: gatewaySessions.chain,
      ephemeralWallet: gatewaySessions.ephemeralWallet,
      expiresAt: gatewaySessions.expiresAt,
      createdAt: gatewaySessions.createdAt,
    }).from(gatewaySessions)
      .where(eq(gatewaySessions.id, sessionId))
      .limit(1);
    
    if (session.length === 0) return c.json({ error: 'Session not found' }, 404);
    return c.json({ session: session[0] });
  } catch (error) {
    return c.json({ error: 'Failed to get session' }, 500);
  }
});

export default gatewaySessionRoutes;