import { Hono } from 'hono';
import { db } from '../db/index.js';
import { gatewaySessions, gatewayBalances, gatewayLedger, merchants } from '../db/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import { deliverWebhook } from '../services/webhook.js';
import { processCommissions } from '../services/commission.js';

const gatewayWithdrawalRoutes = new Hono<{ Variables: { merchantId: string } }>();

// POST /api/gateway/withdrawals - Initiate withdrawal
gatewayWithdrawalRoutes.post('/api/gateway/withdrawals', async (c) => {
  try {
    const merchantId = c.get('merchantId') as string;
    const body = await c.req.json();
    const { playerRef, amount, token, chain, recipientAddress, metadata } = body;

    // Validate required fields
    if (!playerRef || typeof playerRef !== 'string') {
      return c.json({ error: 'Valid player reference is required' }, 400);
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return c.json({ error: 'Valid amount greater than 0 is required' }, 400);
    }

    if (!token || typeof token !== 'string') {
      return c.json({ error: 'Valid token is required' }, 400);
    }

    if (!chain || typeof chain !== 'string') {
      return c.json({ error: 'Valid chain is required' }, 400);
    }

    if (!recipientAddress || typeof recipientAddress !== 'string') {
      return c.json({ error: 'Valid recipient address is required' }, 400);
    }

    // Fetch merchant data for fee calculation
    const merchantResult = await db.select().from(merchants).where(
      eq(merchants.id, merchantId)
    ).limit(1);

    if (merchantResult.length === 0) {
      return c.json({ error: 'Merchant not found' }, 404);
    }

    const merchant = merchantResult[0];
    const platformFee = amount * parseFloat(merchant.feePercent) / 100;

    // Check player balance
    const balance = await db.select().from(gatewayBalances).where(
      and(
        eq(gatewayBalances.merchantId, merchantId),
        eq(gatewayBalances.playerRef, playerRef),
        eq(gatewayBalances.currency, token)
      )
    ).limit(1);

    if (balance.length === 0) {
      return c.json({ error: 'Insufficient balance' }, 400);
    }

    const currentBalance = balance[0];
    const availableBalance = parseFloat(currentBalance.availableBalance);

    if (availableBalance < amount) {
      return c.json({ error: 'Insufficient balance' }, 400);
    }
    // Place a hold: decrease availableBalance, increase pendingBalance
    const newAvailableBalance = (availableBalance - amount).toFixed(6);
    const newPendingBalance = (parseFloat(currentBalance.pendingBalance) + amount).toFixed(6);

    await db.update(gatewayBalances)
      .set({
        availableBalance: newAvailableBalance,
        pendingBalance: newPendingBalance,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(gatewayBalances.merchantId, merchantId),
          eq(gatewayBalances.playerRef, playerRef),
          eq(gatewayBalances.currency, token)
        )
      );

    // Create withdrawal session
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    const sessionResult = await db.insert(gatewaySessions).values({
      merchantId,
      sessionType: 'withdrawal',
      playerRef,
      amount: amount.toString(),
      token,
      chain,
      recipientAddress,
      referrerAddress: merchant.referrerAddress,
      platformFee: platformFee.toString(),
      metadata,
      status: 'pending',
      expiresAt
    }).returning();

    const session = sessionResult[0];

    // Insert ledger entry for withdrawal hold
    await db.insert(gatewayLedger).values({
      merchantId,
      playerRef,
      type: 'withdrawal_hold',
      amount: (-amount).toString(),
      currency: token,
      sessionId: session.id,
      balanceBefore: availableBalance.toString(),
      balanceAfter: newAvailableBalance,
      description: `Withdrawal hold for session ${session.id}`
    });

    // Fire webhook (fire-and-forget)
    deliverWebhook({
      merchantId,
      sessionId: session.id,
      event: 'withdrawal.initiated',
      payload: {
        sessionId: session.id,
        playerRef,
        amount,
        token,
        chain,
        recipientAddress,
        status: 'pending',
        createdAt: session.createdAt,
        expiresAt: session.expiresAt
      }
    }).catch(err => console.warn('Failed to deliver withdrawal.initiated webhook:', err));

    return c.json({ session: { ...session, referrerAddress: merchant.referrerAddress, platformFee: platformFee.toString() } }, 201);
  } catch (error) {
    console.error('Failed to initiate withdrawal:', error);
    return c.json({ error: 'Failed to initiate withdrawal' }, 500);
  }
});

// POST /api/gateway/withdrawals/:sessionId/confirm - Confirm withdrawal
gatewayWithdrawalRoutes.post('/api/gateway/withdrawals/:sessionId/confirm', async (c) => {
  try {
    const merchantId = c.get('merchantId') as string;
    const sessionId = c.req.param('sessionId');
    const body = await c.req.json();
    const { txHash } = body;

    if (!txHash || typeof txHash !== 'string') {
      return c.json({ error: 'Valid transaction hash is required' }, 400);
    }

    // Validate session exists and belongs to merchant
    const sessionResult = await db.select().from(gatewaySessions).where(
      and(
        eq(gatewaySessions.id, sessionId),
        eq(gatewaySessions.merchantId, merchantId),
        eq(gatewaySessions.sessionType, 'withdrawal'),
        eq(gatewaySessions.status, 'pending')
      )
    ).limit(1);

    if (sessionResult.length === 0) {
      return c.json({ error: 'Session not found or not eligible for confirmation' }, 404);
    }

    const session = sessionResult[0];
    const amount = parseFloat(session.amount);

    // Update session status
    const updatedSessionResult = await db.update(gatewaySessions)
      .set({
        status: 'confirmed',
        txHash,
        updatedAt: new Date()
      })
      .where(eq(gatewaySessions.id, sessionId))
      .returning();

    // Finalize balance: decrease pendingBalance, increase totalWithdrawn
    const balance = await db.select().from(gatewayBalances).where(
      and(
        eq(gatewayBalances.merchantId, merchantId),
        eq(gatewayBalances.playerRef, session.playerRef),
        eq(gatewayBalances.currency, session.token)
      )
    ).limit(1);

    if (balance.length > 0) {
      const currentBalance = balance[0];
      const newPendingBalance = (parseFloat(currentBalance.pendingBalance) - amount).toFixed(6);
      const newTotalWithdrawn = (parseFloat(currentBalance.totalWithdrawn) + amount).toFixed(6);

      await db.update(gatewayBalances)
        .set({
          pendingBalance: newPendingBalance,
          totalWithdrawn: newTotalWithdrawn,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(gatewayBalances.merchantId, merchantId),
            eq(gatewayBalances.playerRef, session.playerRef),
            eq(gatewayBalances.currency, session.token)
          )
        );

      // Insert ledger entry for withdrawal confirmation
      await db.insert(gatewayLedger).values({
        merchantId,
        playerRef: session.playerRef,
        type: 'withdrawal_confirmed',
        amount: amount.toString(),
        currency: session.token,
        sessionId: session.id,
        balanceBefore: currentBalance.pendingBalance,
        balanceAfter: newPendingBalance,
        description: `Withdrawal confirmed with txHash: ${txHash}`
      });

      // Insert platform fee ledger entry if there's a platform fee
      if (session.platformFee && parseFloat(session.platformFee) > 0) {
        const platformFeeAmount = parseFloat(session.platformFee);
        await db.insert(gatewayLedger).values({
          merchantId,
          playerRef: session.playerRef,
          type: 'platform_fee',
          amount: platformFeeAmount.toString(),
          currency: session.token,
          sessionId: session.id,
          balanceBefore: currentBalance.pendingBalance,
          balanceAfter: newPendingBalance,
          description: `Platform fee for withdrawal session ${session.id}`
        });

        // Process commissions (fire-and-forget)
        processCommissions({
          merchantId,
          sessionId: session.id,
          platformFee: platformFeeAmount,
          currency: session.token
        }).catch(err => console.error('Failed to process commissions:', err));
      }
    }

    // Fire webhook (fire-and-forget)
    deliverWebhook({
      merchantId,
      sessionId: session.id,
      event: 'withdrawal.confirmed',
      payload: {
        sessionId: session.id,
        playerRef: session.playerRef,
        amount,
        token: session.token,
        chain: session.chain,
        recipientAddress: session.recipientAddress,
        txHash,
        status: 'confirmed',
        confirmedAt: updatedSessionResult[0].updatedAt
      }
    }).catch(err => console.warn('Failed to deliver withdrawal.confirmed webhook:', err));

    return c.json({ session: updatedSessionResult[0] });
  } catch (error) {
    console.error('Failed to confirm withdrawal:', error);
    return c.json({ error: 'Failed to confirm withdrawal' }, 500);
  }
});

// POST /api/gateway/withdrawals/:sessionId/cancel - Cancel withdrawal
gatewayWithdrawalRoutes.post('/api/gateway/withdrawals/:sessionId/cancel', async (c) => {
  try {
    const merchantId = c.get('merchantId') as string;
    const sessionId = c.req.param('sessionId');
    const body = await c.req.json();
    const { reason } = body;

    // Validate session exists and belongs to merchant
    const sessionResult = await db.select().from(gatewaySessions).where(
      and(
        eq(gatewaySessions.id, sessionId),
        eq(gatewaySessions.merchantId, merchantId),
        eq(gatewaySessions.sessionType, 'withdrawal'),
        eq(gatewaySessions.status, 'pending')
      )
    ).limit(1);

    if (sessionResult.length === 0) {
      return c.json({ error: 'Session not found or not eligible for cancellation' }, 404);
    }

    const session = sessionResult[0];
    const amount = parseFloat(session.amount);

    // Update session status
    const updatedSessionResult = await db.update(gatewaySessions)
      .set({
        status: 'cancelled',
        metadata: reason ? { ...(session.metadata as Record<string, unknown> || {}), cancellationReason: reason } : session.metadata,
        updatedAt: new Date()
      })
      .where(eq(gatewaySessions.id, sessionId))
      .returning();

    // Release hold: increase availableBalance, decrease pendingBalance
    const balance = await db.select().from(gatewayBalances).where(
      and(
        eq(gatewayBalances.merchantId, merchantId),
        eq(gatewayBalances.playerRef, session.playerRef),
        eq(gatewayBalances.currency, session.token)
      )
    ).limit(1);

    if (balance.length > 0) {
      const currentBalance = balance[0];
      const newAvailableBalance = (parseFloat(currentBalance.availableBalance) + amount).toFixed(6);
      const newPendingBalance = (parseFloat(currentBalance.pendingBalance) - amount).toFixed(6);

      await db.update(gatewayBalances)
        .set({
          availableBalance: newAvailableBalance,
          pendingBalance: newPendingBalance,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(gatewayBalances.merchantId, merchantId),
            eq(gatewayBalances.playerRef, session.playerRef),
            eq(gatewayBalances.currency, session.token)
          )
        );

      // Insert ledger entry for withdrawal cancellation (reversal)
      await db.insert(gatewayLedger).values({
        merchantId,
        playerRef: session.playerRef,
        type: 'withdrawal_cancelled',
        amount: amount.toString(),
        currency: session.token,
        sessionId: session.id,
        balanceBefore: currentBalance.availableBalance,
        balanceAfter: newAvailableBalance,
        description: `Withdrawal cancelled${reason ? `: ${reason}` : ''}`
      });
    }

    // Fire webhook (fire-and-forget)
    deliverWebhook({
      merchantId,
      sessionId: session.id,
      event: 'withdrawal.cancelled',
      payload: {
        sessionId: session.id,
        playerRef: session.playerRef,
        amount,
        token: session.token,
        chain: session.chain,
        recipientAddress: session.recipientAddress,
        reason,
        status: 'cancelled',
        cancelledAt: updatedSessionResult[0].updatedAt
      }
    }).catch(err => console.warn('Failed to deliver withdrawal.cancelled webhook:', err));

    return c.json({ session: updatedSessionResult[0] });
  } catch (error) {
    console.error('Failed to cancel withdrawal:', error);
    return c.json({ error: 'Failed to cancel withdrawal' }, 500);
  }
});

// GET /api/gateway/withdrawals - List withdrawals
gatewayWithdrawalRoutes.get('/api/gateway/withdrawals', async (c) => {
  try {
    const merchantId = c.get('merchantId') as string;
    const playerRef = c.req.query('playerRef');
    const status = c.req.query('status');
    const limitParam = c.req.query('limit');
    const offsetParam = c.req.query('offset');

    const limit = Math.min(parseInt(limitParam || '50'), 100);
    const offset = parseInt(offsetParam || '0');

    // Build where conditions
    const conditions = [
      eq(gatewaySessions.merchantId, merchantId),
      eq(gatewaySessions.sessionType, 'withdrawal')
    ];

    if (playerRef) {
      conditions.push(eq(gatewaySessions.playerRef, playerRef));
    }

    if (status) {
      conditions.push(eq(gatewaySessions.status, status));
    }

    // Get withdrawals with pagination
    const withdrawals = await db.select()
      .from(gatewaySessions)
      .where(and(...conditions))
      .orderBy(desc(gatewaySessions.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalResult = await db.select({ count: sql<number>`count(*)` })
      .from(gatewaySessions)
      .where(and(...conditions));

    const total = totalResult[0]?.count || 0;

    return c.json({ withdrawals, total });
  } catch (error) {
    console.error('Failed to list withdrawals:', error);
    return c.json({ error: 'Failed to list withdrawals' }, 500);
  }
});

// GET /api/gateway/withdrawals/:sessionId - Get withdrawal details
gatewayWithdrawalRoutes.get('/api/gateway/withdrawals/:sessionId', async (c) => {
  try {
    const merchantId = c.get('merchantId') as string;
    const sessionId = c.req.param('sessionId');

    const withdrawalResult = await db.select().from(gatewaySessions).where(
      and(
        eq(gatewaySessions.id, sessionId),
        eq(gatewaySessions.merchantId, merchantId),
        eq(gatewaySessions.sessionType, 'withdrawal')
      )
    ).limit(1);

    if (withdrawalResult.length === 0) {
      return c.json({ error: 'Withdrawal not found' }, 404);
    }

    return c.json({ withdrawal: withdrawalResult[0] });
  } catch (error) {
    console.error('Failed to get withdrawal details:', error);
    return c.json({ error: 'Failed to get withdrawal details' }, 500);
  }
});

export default gatewayWithdrawalRoutes;