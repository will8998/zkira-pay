import { Hono } from 'hono';
import { db } from '../db/index.js';
import { gatewayPoolAssignments, gatewayBalances, gatewaySessions } from '../db/schema.js';
import { eq, and, sql, count } from 'drizzle-orm';

const gatewayPoolRoutes = new Hono<{ Variables: { merchantId: string } }>();

// POST /api/gateway/pools - Assign pool to merchant
gatewayPoolRoutes.post('/api/gateway/pools', async (c) => {
  try {
    const merchantId = c.get('merchantId') as string;
    const body = await c.req.json();
    const { chain, token, poolAddresses } = body;

    // Validate required fields
    if (!chain || typeof chain !== 'string') {
      return c.json({ error: 'Valid chain is required' }, 400);
    }

    if (!token || typeof token !== 'string') {
      return c.json({ error: 'Valid token is required' }, 400);
    }

    if (!poolAddresses || !Array.isArray(poolAddresses) || poolAddresses.length === 0) {
      return c.json({ error: 'Valid poolAddresses array is required' }, 400);
    }

    // Validate all pool addresses are strings
    if (!poolAddresses.every(addr => typeof addr === 'string')) {
      return c.json({ error: 'All pool addresses must be strings' }, 400);
    }

    // Check for existing assignment (unique constraint on merchantId, chain, token)
    const existing = await db.select().from(gatewayPoolAssignments).where(
      and(
        eq(gatewayPoolAssignments.merchantId, merchantId),
        eq(gatewayPoolAssignments.chain, chain),
        eq(gatewayPoolAssignments.token, token)
      )
    );

    if (existing.length > 0) {
      return c.json({ error: 'Pool assignment already exists for this chain/token' }, 409);
    }

    // Insert new assignment
    const result = await db.insert(gatewayPoolAssignments).values({
      merchantId,
      chain,
      token,
      poolAddresses,
    }).returning();

    return c.json({ assignment: result[0] }, 201);
  } catch (error) {
    console.error('Failed to create pool assignment:', error);
    return c.json({ error: 'Failed to create pool assignment' }, 500);
  }
});

// GET /api/gateway/pools - List pool assignments
gatewayPoolRoutes.get('/api/gateway/pools', async (c) => {
  try {
    const merchantId = c.get('merchantId') as string;
    const chain = c.req.query('chain');

    // Build conditions
    const conditions = [eq(gatewayPoolAssignments.merchantId, merchantId)];
    if (chain) {
      conditions.push(eq(gatewayPoolAssignments.chain, chain));
    }

    const assignments = await db.select().from(gatewayPoolAssignments).where(
      and(...conditions)
    );

    return c.json({ assignments });
  } catch (error) {
    console.error('Failed to get pool assignments:', error);
    return c.json({ error: 'Failed to get pool assignments' }, 500);
  }
});

// GET /api/gateway/pools/:assignmentId - Get pool assignment
gatewayPoolRoutes.get('/api/gateway/pools/:assignmentId', async (c) => {
  const assignmentId = c.req.param('assignmentId');

  if (!assignmentId) {
    return c.json({ error: 'Assignment ID parameter is required' }, 400);
  }

  try {
    const merchantId = c.get('merchantId') as string;

    const result = await db.select().from(gatewayPoolAssignments).where(
      and(
        eq(gatewayPoolAssignments.id, assignmentId),
        eq(gatewayPoolAssignments.merchantId, merchantId)
      )
    );

    if (result.length === 0) {
      return c.json({ error: 'Pool assignment not found' }, 404);
    }

    return c.json({ assignment: result[0] });
  } catch (error) {
    console.error('Failed to get pool assignment:', error);
    return c.json({ error: 'Failed to get pool assignment' }, 500);
  }
});

// PUT /api/gateway/pools/:assignmentId - Update pool assignment
gatewayPoolRoutes.put('/api/gateway/pools/:assignmentId', async (c) => {
  const assignmentId = c.req.param('assignmentId');

  if (!assignmentId) {
    return c.json({ error: 'Assignment ID parameter is required' }, 400);
  }

  try {
    const merchantId = c.get('merchantId') as string;
    const body = await c.req.json();
    const { poolAddresses, isPrimary } = body;

    // Validate required fields
    if (!poolAddresses || !Array.isArray(poolAddresses) || poolAddresses.length === 0) {
      return c.json({ error: 'Valid poolAddresses array is required' }, 400);
    }

    // Validate all pool addresses are strings
    if (!poolAddresses.every(addr => typeof addr === 'string')) {
      return c.json({ error: 'All pool addresses must be strings' }, 400);
    }

    // Check if assignment exists and belongs to merchant
    const existing = await db.select().from(gatewayPoolAssignments).where(
      and(
        eq(gatewayPoolAssignments.id, assignmentId),
        eq(gatewayPoolAssignments.merchantId, merchantId)
      )
    );

    if (existing.length === 0) {
      return c.json({ error: 'Pool assignment not found' }, 404);
    }

    // Prepare update data
    const updateData: any = {
      poolAddresses,
      updatedAt: new Date(),
    };

    if (typeof isPrimary === 'boolean') {
      updateData.isPrimary = isPrimary;
    }

    // Update assignment
    const result = await db.update(gatewayPoolAssignments)
      .set(updateData)
      .where(
        and(
          eq(gatewayPoolAssignments.id, assignmentId),
          eq(gatewayPoolAssignments.merchantId, merchantId)
        )
      )
      .returning();

    return c.json({ assignment: result[0] });
  } catch (error) {
    console.error('Failed to update pool assignment:', error);
    return c.json({ error: 'Failed to update pool assignment' }, 500);
  }
});

// DELETE /api/gateway/pools/:assignmentId - Remove pool assignment
gatewayPoolRoutes.delete('/api/gateway/pools/:assignmentId', async (c) => {
  const assignmentId = c.req.param('assignmentId');

  if (!assignmentId) {
    return c.json({ error: 'Assignment ID parameter is required' }, 400);
  }

  try {
    const merchantId = c.get('merchantId') as string;

    // Check if assignment exists and belongs to merchant
    const assignment = await db.select().from(gatewayPoolAssignments).where(
      and(
        eq(gatewayPoolAssignments.id, assignmentId),
        eq(gatewayPoolAssignments.merchantId, merchantId)
      )
    );

    if (assignment.length === 0) {
      return c.json({ error: 'Pool assignment not found' }, 404);
    }

    // Check if any active (pending) sessions reference pool addresses from this assignment
    const activeSessions = await db.select({ count: count() }).from(gatewaySessions).where(
      and(
        eq(gatewaySessions.merchantId, merchantId),
        eq(gatewaySessions.chain, assignment[0].chain),
        eq(gatewaySessions.token, assignment[0].token),
        eq(gatewaySessions.status, 'pending')
      )
    );

    if (activeSessions[0].count > 0) {
      return c.json({ error: 'Cannot remove pool with active sessions' }, 400);
    }

    // Delete the assignment
    await db.delete(gatewayPoolAssignments).where(
      and(
        eq(gatewayPoolAssignments.id, assignmentId),
        eq(gatewayPoolAssignments.merchantId, merchantId)
      )
    );

    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to delete pool assignment:', error);
    return c.json({ error: 'Failed to delete pool assignment' }, 500);
  }
});

// GET /api/gateway/pools/:assignmentId/reconcile - Reconciliation report
gatewayPoolRoutes.get('/api/gateway/pools/:assignmentId/reconcile', async (c) => {
  const assignmentId = c.req.param('assignmentId');

  if (!assignmentId) {
    return c.json({ error: 'Assignment ID parameter is required' }, 400);
  }

  try {
    const merchantId = c.get('merchantId') as string;

    // Look up the pool assignment
    const assignment = await db.select().from(gatewayPoolAssignments).where(
      and(
        eq(gatewayPoolAssignments.id, assignmentId),
        eq(gatewayPoolAssignments.merchantId, merchantId)
      )
    );

    if (assignment.length === 0) {
      return c.json({ error: 'Pool assignment not found' }, 404);
    }

    const poolAssignment = assignment[0];

    // Query confirmed sessions for this merchant where chain and token match
    const confirmedSessions = await db.select({
      totalAmount: sql<string>`COALESCE(SUM(${gatewaySessions.amount}), 0)`,
    }).from(gatewaySessions).where(
      and(
        eq(gatewaySessions.merchantId, merchantId),
        eq(gatewaySessions.chain, poolAssignment.chain),
        eq(gatewaySessions.token, poolAssignment.token),
        eq(gatewaySessions.status, 'confirmed')
      )
    );

    const onChainDeposits = confirmedSessions[0]?.totalAmount || '0';

    // Query gateway balances for this merchant+token to get current balance totals
    const balances = await db.select({
      totalAvailable: sql<string>`COALESCE(SUM(${gatewayBalances.availableBalance}), 0)`,
      totalPending: sql<string>`COALESCE(SUM(${gatewayBalances.pendingBalance}), 0)`,
      totalDeposited: sql<string>`COALESCE(SUM(${gatewayBalances.totalDeposited}), 0)`,
      totalWithdrawn: sql<string>`COALESCE(SUM(${gatewayBalances.totalWithdrawn}), 0)`,
    }).from(gatewayBalances).where(
      and(
        eq(gatewayBalances.merchantId, merchantId),
        eq(gatewayBalances.currency, poolAssignment.token)
      )
    );

    const currentBalances = balances[0] || {
      totalAvailable: '0',
      totalPending: '0',
      totalDeposited: '0',
      totalWithdrawn: '0',
    };

    // Calculate discrepancy
    const onChainDepositsNum = parseFloat(onChainDeposits);
    const totalAvailableNum = parseFloat(currentBalances.totalAvailable);
    const totalPendingNum = parseFloat(currentBalances.totalPending);
    const totalWithdrawnNum = parseFloat(currentBalances.totalWithdrawn);
    
    const discrepancy = onChainDepositsNum - (totalAvailableNum + totalPendingNum + totalWithdrawnNum);

    return c.json({
      reconciliation: {
        poolAssignment,
        onChainDeposits,
        currentBalances,
        discrepancy: discrepancy.toString(),
      },
    });
  } catch (error) {
    console.error('Failed to get reconciliation report:', error);
    return c.json({ error: 'Failed to get reconciliation report' }, 500);
  }
});

export default gatewayPoolRoutes;