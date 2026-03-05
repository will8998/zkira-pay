import { Hono } from 'hono';
import { db } from '../db/index.js';
import { gatewayDisputes, gatewaySessions, gatewayBalances, gatewayLedger } from '../db/schema.js';
import { eq, and, desc, sql, count } from 'drizzle-orm';
import { deliverWebhook } from '../services/webhook.js';

const gatewayDisputeRoutes = new Hono<{ Variables: { merchantId: string } }>();

// State transition validation map
const VALID_TRANSITIONS: Record<string, string[]> = {
  'open': ['under_review', 'resolved_refund', 'resolved_rejected'],
  'under_review': ['resolved_refund', 'resolved_rejected'],
};

// POST /api/gateway/disputes - Open a dispute
gatewayDisputeRoutes.post('/api/gateway/disputes', async (c) => {
  try {
    const body = await c.req.json();
    const { sessionId, playerRef, reason, evidence, holdAmount, holdCurrency } = body;
    const merchantId = c.get('merchantId') as string;

    // Validation
    if (!sessionId || typeof sessionId !== 'string') {
      return c.json({ error: 'Valid sessionId is required' }, 400);
    }

    if (!playerRef || typeof playerRef !== 'string') {
      return c.json({ error: 'Valid playerRef is required' }, 400);
    }

    if (!reason || typeof reason !== 'string' || reason.length < 10) {
      return c.json({ error: 'Valid reason is required (minimum 10 characters)' }, 400);
    }

    // Verify session exists and belongs to merchant
    const sessionResult = await db
      .select()
      .from(gatewaySessions)
      .where(
        and(
          eq(gatewaySessions.id, sessionId),
          eq(gatewaySessions.merchantId, merchantId),
          eq(gatewaySessions.playerRef, playerRef)
        )
      )
      .limit(1);

    if (sessionResult.length === 0) {
      return c.json({ error: 'Session not found or does not belong to merchant' }, 404);
    }

    const session = sessionResult[0];

    // Handle hold amount if provided
    let balanceBefore = '0';
    let balanceAfter = '0';
    
    if (holdAmount && typeof holdAmount === 'number' && holdAmount > 0) {
      const currency = holdCurrency || session.token;
      
      // Get current balance
      const balanceResult = await db
        .select()
        .from(gatewayBalances)
        .where(
          and(
            eq(gatewayBalances.merchantId, merchantId),
            eq(gatewayBalances.playerRef, playerRef),
            eq(gatewayBalances.currency, currency)
          )
        )
        .limit(1);

      if (balanceResult.length === 0) {
        return c.json({ error: 'Player balance not found for hold amount' }, 400);
      }

      const balance = balanceResult[0];
      const availableBalance = parseFloat(balance.availableBalance);
      
      if (availableBalance < holdAmount) {
        return c.json({ error: 'Insufficient available balance for hold amount' }, 400);
      }

      balanceBefore = balance.availableBalance;
      balanceAfter = (availableBalance - holdAmount).toFixed(6);
      const newPendingBalance = (parseFloat(balance.pendingBalance) + holdAmount).toFixed(6);

      // Update balance - deduct from available, add to pending
      await db
        .update(gatewayBalances)
        .set({
          availableBalance: balanceAfter,
          pendingBalance: newPendingBalance,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(gatewayBalances.merchantId, merchantId),
            eq(gatewayBalances.playerRef, playerRef),
            eq(gatewayBalances.currency, currency)
          )
        );

      // Create ledger entry for dispute hold
      await db.insert(gatewayLedger).values({
        merchantId,
        playerRef,
        type: 'dispute_hold',
        amount: (-holdAmount).toString(),
        currency,
        sessionId,
        balanceBefore,
        balanceAfter,
        description: `Dispute hold: ${reason.substring(0, 100)}`,
      });
    }

    // Insert dispute
    const result = await db.insert(gatewayDisputes).values({
      merchantId,
      sessionId,
      playerRef,
      reason,
      evidence: evidence ? JSON.stringify(evidence) : '[]',
      status: 'open',
      holdAmount: holdAmount ? holdAmount.toString() : null,
      holdCurrency: holdAmount ? (holdCurrency || session.token) : null,
    }).returning();

    const dispute = result[0];

    // Fire webhook (fire-and-forget)
    deliverWebhook({
      merchantId,
      sessionId,
      event: 'dispute.opened',
      payload: { dispute },
    }).catch(console.warn);

    return c.json({ dispute }, 201);
  } catch (error) {
    console.error('Failed to create dispute:', error);
    return c.json({ error: 'Failed to create dispute' }, 500);
  }
});

// POST /api/gateway/disputes/:disputeId/evidence - Add evidence
gatewayDisputeRoutes.post('/api/gateway/disputes/:disputeId/evidence', async (c) => {
  const disputeId = c.req.param('disputeId');
  const merchantId = c.get('merchantId') as string;

  if (!disputeId) {
    return c.json({ error: 'Dispute ID parameter is required' }, 400);
  }

  try {
    const body = await c.req.json();
    const { description, type, url, data } = body;

    if (!description || typeof description !== 'string') {
      return c.json({ error: 'Valid description is required' }, 400);
    }

    if (!type || typeof type !== 'string') {
      return c.json({ error: 'Valid type is required' }, 400);
    }

    // Get dispute and validate
    const disputeResult = await db
      .select()
      .from(gatewayDisputes)
      .where(
        and(
          eq(gatewayDisputes.id, disputeId),
          eq(gatewayDisputes.merchantId, merchantId)
        )
      )
      .limit(1);

    if (disputeResult.length === 0) {
      return c.json({ error: 'Dispute not found' }, 404);
    }

    const dispute = disputeResult[0];

    // Check if dispute is still open for evidence
    if (dispute.status.startsWith('resolved_')) {
      return c.json({ error: 'Cannot add evidence to resolved dispute' }, 400);
    }

    // Append to evidence array
    const currentEvidence = (dispute.evidence as Array<Record<string, unknown>>) || [];
    const newEvidence = [...currentEvidence, {
      description,
      type,
      url,
      data,
      addedAt: new Date().toISOString(),
    }];

    // Update dispute
    const updatedDispute = await db
      .update(gatewayDisputes)
      .set({
        evidence: JSON.stringify(newEvidence),
        updatedAt: new Date(),
      })
      .where(eq(gatewayDisputes.id, disputeId))
      .returning();

    return c.json({ dispute: updatedDispute[0] });
  } catch (error) {
    console.error('Failed to add evidence:', error);
    return c.json({ error: 'Failed to add evidence' }, 500);
  }
});

// PATCH /api/gateway/disputes/:disputeId/status - Update dispute status
gatewayDisputeRoutes.patch('/api/gateway/disputes/:disputeId/status', async (c) => {
  const disputeId = c.req.param('disputeId');
  const merchantId = c.get('merchantId') as string;

  if (!disputeId) {
    return c.json({ error: 'Dispute ID parameter is required' }, 400);
  }

  try {
    const body = await c.req.json();
    const { status, resolution, resolvedBy } = body;

    if (!status || typeof status !== 'string') {
      return c.json({ error: 'Valid status is required' }, 400);
    }

    const validStatuses = ['under_review', 'resolved_refund', 'resolved_rejected'];
    if (!validStatuses.includes(status)) {
      return c.json({ error: 'Invalid status value' }, 400);
    }

    if (status.startsWith('resolved_') && (!resolution || typeof resolution !== 'string')) {
      return c.json({ error: 'Resolution is required when resolving dispute' }, 400);
    }

    // Get dispute and validate
    const disputeResult = await db
      .select()
      .from(gatewayDisputes)
      .where(
        and(
          eq(gatewayDisputes.id, disputeId),
          eq(gatewayDisputes.merchantId, merchantId)
        )
      )
      .limit(1);

    if (disputeResult.length === 0) {
      return c.json({ error: 'Dispute not found' }, 404);
    }

    const dispute = disputeResult[0];

    // Validate state transition
    const allowedNextStates = VALID_TRANSITIONS[dispute.status];
    if (!allowedNextStates || !allowedNextStates.includes(status)) {
      return c.json({ error: `Cannot transition from '${dispute.status}' to '${status}'` }, 400);
    }

    // Handle resolution logic
    if (status === 'resolved_refund' || status === 'resolved_rejected') {
      // Release held amount if exists
      if (dispute.holdAmount && dispute.holdCurrency) {
        const holdAmount = parseFloat(dispute.holdAmount);
        
        // Get current balance
        const balanceResult = await db
          .select()
          .from(gatewayBalances)
          .where(
            and(
              eq(gatewayBalances.merchantId, merchantId),
              eq(gatewayBalances.playerRef, dispute.playerRef),
              eq(gatewayBalances.currency, dispute.holdCurrency)
            )
          )
          .limit(1);

        if (balanceResult.length > 0) {
          const balance = balanceResult[0];
          const balanceBefore = balance.availableBalance;
          const balanceAfter = (parseFloat(balanceBefore) + holdAmount).toFixed(6);
          const newPendingBalance = (parseFloat(balance.pendingBalance) - holdAmount).toFixed(6);

          // Release hold - add back to available, subtract from pending
          await db
            .update(gatewayBalances)
            .set({
              availableBalance: balanceAfter,
              pendingBalance: newPendingBalance,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(gatewayBalances.merchantId, merchantId),
                eq(gatewayBalances.playerRef, dispute.playerRef),
                eq(gatewayBalances.currency, dispute.holdCurrency)
              )
            );

          // Create ledger entry
          const ledgerType = status === 'resolved_refund' ? 'dispute_refund' : 'dispute_rejected';
          await db.insert(gatewayLedger).values({
            merchantId,
            playerRef: dispute.playerRef,
            type: ledgerType,
            amount: holdAmount.toString(),
            currency: dispute.holdCurrency,
            sessionId: dispute.sessionId,
            disputeId,
            balanceBefore,
            balanceAfter,
            description: `Dispute ${status}: ${resolution.substring(0, 100)}`,
          });
        }
      }
    }

    // Update dispute
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status.startsWith('resolved_')) {
      updateData.resolvedAt = new Date();
      updateData.resolution = resolution;
      if (resolvedBy) {
        updateData.resolvedBy = resolvedBy;
      }
    }

    const updatedDispute = await db
      .update(gatewayDisputes)
      .set(updateData)
      .where(eq(gatewayDisputes.id, disputeId))
      .returning();

    // Fire webhook (fire-and-forget)
    deliverWebhook({
      merchantId,
      sessionId: dispute.sessionId,
      event: `dispute.${status}`,
      payload: { dispute: updatedDispute[0] },
    }).catch(console.warn);

    return c.json({ dispute: updatedDispute[0] });
  } catch (error) {
    console.error('Failed to update dispute status:', error);
    return c.json({ error: 'Failed to update dispute status' }, 500);
  }
});

// GET /api/gateway/disputes - List disputes
gatewayDisputeRoutes.get('/api/gateway/disputes', async (c) => {
  const merchantId = c.get('merchantId') as string;
  const playerRef = c.req.query('playerRef');
  const status = c.req.query('status');
  const limitParam = c.req.query('limit');
  const offsetParam = c.req.query('offset');

  const limit = limitParam ? Math.min(parseInt(limitParam), 100) : 50;
  const offset = offsetParam ? parseInt(offsetParam) : 0;

  try {
    // Build where conditions
    const conditions = [eq(gatewayDisputes.merchantId, merchantId)];
    
    if (playerRef) {
      conditions.push(eq(gatewayDisputes.playerRef, playerRef));
    }
    
    if (status) {
      conditions.push(eq(gatewayDisputes.status, status));
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    // Get disputes
    const disputes = await db
      .select()
      .from(gatewayDisputes)
      .where(whereClause)
      .orderBy(desc(gatewayDisputes.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(gatewayDisputes)
      .where(whereClause);

    const total = totalResult[0].count;

    return c.json({ disputes, total });
  } catch (error) {
    console.error('Failed to list disputes:', error);
    return c.json({ error: 'Failed to list disputes' }, 500);
  }
});

// GET /api/gateway/disputes/:disputeId - Get dispute details
gatewayDisputeRoutes.get('/api/gateway/disputes/:disputeId', async (c) => {
  const disputeId = c.req.param('disputeId');
  const merchantId = c.get('merchantId') as string;

  if (!disputeId) {
    return c.json({ error: 'Dispute ID parameter is required' }, 400);
  }

  try {
    const dispute = await db
      .select()
      .from(gatewayDisputes)
      .where(
        and(
          eq(gatewayDisputes.id, disputeId),
          eq(gatewayDisputes.merchantId, merchantId)
        )
      )
      .limit(1);

    if (dispute.length === 0) {
      return c.json({ error: 'Dispute not found' }, 404);
    }

    return c.json({ dispute: dispute[0] });
  } catch (error) {
    console.error('Failed to get dispute:', error);
    return c.json({ error: 'Failed to get dispute' }, 500);
  }
});

export default gatewayDisputeRoutes;