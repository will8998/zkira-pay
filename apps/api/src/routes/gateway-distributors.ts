import { Hono } from 'hono';
import { timingSafeEqual } from 'node:crypto';
import { db } from '../db/index.js';
import { distributors, merchants, distributorCommissions, distributorPayouts } from '../db/schema.js';
import { eq, and, desc, sql, isNull, count, sum, gte, lte } from 'drizzle-orm';
import { loadConfig } from '../config.js';
import { verifyAdminToken } from '../middleware/jwt-auth.js';

const gatewayDistributorRoutes = new Hono();

// Admin auth middleware — JWT Bearer + legacy password
const adminAuth = async (c: any, next: any) => {
  const config = loadConfig();
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const payload = await verifyAdminToken(authHeader.slice(7), config.jwtSecret);
    if (payload) { await next(); return; }
  }
  const adminPassword = c.req.header('X-Admin-Password');
  if (!adminPassword) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const provided = Buffer.from(adminPassword);
    const expected = Buffer.from(config.adminPassword);
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
  } catch {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
};

// Apply admin auth to all distributor routes
gatewayDistributorRoutes.use('/api/gateway/distributors/*', adminAuth);

// POST /api/gateway/distributors - Register new distributor
gatewayDistributorRoutes.post('/api/gateway/distributors', async (c) => {
  try {
    const body = await c.req.json();
    const { name, walletAddress, parentId, tier, commissionPercent } = body;

    // Validate required fields
    if (!name || typeof name !== 'string') {
      return c.json({ error: 'Valid name is required' }, 400);
    }

    if (!walletAddress || typeof walletAddress !== 'string') {
      return c.json({ error: 'Valid walletAddress is required' }, 400);
    }

    if (!tier || !['master', 'sub', 'agent'].includes(tier)) {
      return c.json({ error: 'Valid tier is required (master, sub, agent)' }, 400);
    }

    if (commissionPercent !== undefined && (typeof commissionPercent !== 'number' || commissionPercent < 0 || commissionPercent > 100)) {
      return c.json({ error: 'Commission percent must be between 0 and 100' }, 400);
    }

    // Check for existing distributor with same wallet address
    const existing = await db.select().from(distributors).where(
      eq(distributors.walletAddress, walletAddress)
    );

    if (existing.length > 0) {
      return c.json({ error: 'Distributor with this wallet address already exists' }, 409);
    }

    // If parentId provided, validate it exists
    if (parentId) {
      const parent = await db.select().from(distributors).where(
        eq(distributors.id, parentId)
      );

      if (parent.length === 0) {
        return c.json({ error: 'Parent distributor not found' }, 404);
      }
    }

    // Insert new distributor
    const result = await db.insert(distributors).values({
      name,
      walletAddress,
      parentId: parentId || null,
      tier,
      commissionPercent: commissionPercent?.toString() || '0',
    }).returning();

    return c.json({ distributor: result[0] }, 201);
  } catch (error) {
    console.error('Failed to create distributor:', error);
    return c.json({ error: 'Failed to create distributor' }, 500);
  }
});

// PUT /api/gateway/distributors/:distributorId - Update distributor
gatewayDistributorRoutes.put('/api/gateway/distributors/:distributorId', async (c) => {
  const distributorId = c.req.param('distributorId');

  if (!distributorId) {
    return c.json({ error: 'Distributor ID parameter is required' }, 400);
  }

  try {
    const body = await c.req.json();
    const { name, commissionPercent, status } = body;

    // Check if distributor exists
    const existing = await db.select().from(distributors).where(
      eq(distributors.id, distributorId)
    );

    if (existing.length === 0) {
      return c.json({ error: 'Distributor not found' }, 404);
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name && typeof name === 'string') {
      updateData.name = name;
    }

    if (commissionPercent !== undefined) {
      if (typeof commissionPercent !== 'number' || commissionPercent < 0 || commissionPercent > 100) {
        return c.json({ error: 'Commission percent must be between 0 and 100' }, 400);
      }
      updateData.commissionPercent = commissionPercent.toString();
    }

    if (status && ['active', 'inactive'].includes(status)) {
      updateData.status = status;
    }

    // Update distributor
    const result = await db.update(distributors)
      .set(updateData)
      .where(eq(distributors.id, distributorId))
      .returning();

    return c.json({ distributor: result[0] });
  } catch (error) {
    console.error('Failed to update distributor:', error);
    return c.json({ error: 'Failed to update distributor' }, 500);
  }
});

// GET /api/gateway/distributors - List all distributors
gatewayDistributorRoutes.get('/api/gateway/distributors', async (c) => {
  try {
    const limitParam = c.req.query('limit');
    const offsetParam = c.req.query('offset');
    const status = c.req.query('status');

    const limit = Math.min(parseInt(limitParam || '50'), 100);
    const offset = parseInt(offsetParam || '0');

    // Build conditions
    const conditions = [];
    if (status) {
      conditions.push(eq(distributors.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get distributors with merchant count
    const distributorsList = await db
      .select({
        id: distributors.id,
        name: distributors.name,
        walletAddress: distributors.walletAddress,
        parentId: distributors.parentId,
        tier: distributors.tier,
        commissionPercent: distributors.commissionPercent,
        status: distributors.status,
        createdAt: distributors.createdAt,
        updatedAt: distributors.updatedAt,
        merchantCount: sql<number>`(SELECT COUNT(*) FROM ${merchants} WHERE ${merchants.distributorId} = ${distributors.id})`,
      })
      .from(distributors)
      .where(whereClause)
      .orderBy(desc(distributors.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(distributors)
      .where(whereClause);

    const total = totalResult[0].count;

    return c.json({
      distributors: distributorsList,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Failed to get distributors:', error);
    return c.json({ error: 'Failed to get distributors' }, 500);
  }
});

// GET /api/gateway/distributors/:distributorId - Get distributor details
gatewayDistributorRoutes.get('/api/gateway/distributors/:distributorId', async (c) => {
  const distributorId = c.req.param('distributorId');

  if (!distributorId) {
    return c.json({ error: 'Distributor ID parameter is required' }, 400);
  }

  try {
    // Get distributor with parent info and merchant count
    const result = await db
      .select({
        id: distributors.id,
        name: distributors.name,
        walletAddress: distributors.walletAddress,
        parentId: distributors.parentId,
        tier: distributors.tier,
        commissionPercent: distributors.commissionPercent,
        status: distributors.status,
        createdAt: distributors.createdAt,
        updatedAt: distributors.updatedAt,
        merchantCount: sql<number>`(SELECT COUNT(*) FROM ${merchants} WHERE ${merchants.distributorId} = ${distributors.id})`,
      })
      .from(distributors)
      .where(eq(distributors.id, distributorId));

    if (result.length === 0) {
      return c.json({ error: 'Distributor not found' }, 404);
    }

    const distributor = result[0];

    // Get parent info if exists
    let parent = null;
    if (distributor.parentId) {
      const parentResult = await db
        .select({
          id: distributors.id,
          name: distributors.name,
          walletAddress: distributors.walletAddress,
          tier: distributors.tier,
        })
        .from(distributors)
        .where(eq(distributors.id, distributor.parentId));

      if (parentResult.length > 0) {
        parent = parentResult[0];
      }
    }

    return c.json({
      distributor: {
        ...distributor,
        parent
      }
    });
  } catch (error) {
    console.error('Failed to get distributor:', error);
    return c.json({ error: 'Failed to get distributor' }, 500);
  }
});

// DELETE /api/gateway/distributors/:distributorId - Deactivate distributor
gatewayDistributorRoutes.delete('/api/gateway/distributors/:distributorId', async (c) => {
  const distributorId = c.req.param('distributorId');

  if (!distributorId) {
    return c.json({ error: 'Distributor ID parameter is required' }, 400);
  }

  try {
    // Check if distributor exists
    const existing = await db.select().from(distributors).where(
      eq(distributors.id, distributorId)
    );

    if (existing.length === 0) {
      return c.json({ error: 'Distributor not found' }, 404);
    }

    // Soft delete by setting status to inactive
    const result = await db.update(distributors)
      .set({ 
        status: 'inactive',
        updatedAt: new Date()
      })
      .where(eq(distributors.id, distributorId))
      .returning();

    return c.json({ success: true, distributor: result[0] });
  } catch (error) {
    console.error('Failed to deactivate distributor:', error);
    return c.json({ error: 'Failed to deactivate distributor' }, 500);
  }
});

// POST /api/gateway/distributors/:distributorId/merchants - Assign merchant to distributor
gatewayDistributorRoutes.post('/api/gateway/distributors/:distributorId/merchants', async (c) => {
  const distributorId = c.req.param('distributorId');

  if (!distributorId) {
    return c.json({ error: 'Distributor ID parameter is required' }, 400);
  }

  try {
    const body = await c.req.json();
    const { merchantId } = body;

    if (!merchantId || typeof merchantId !== 'string') {
      return c.json({ error: 'Valid merchantId is required' }, 400);
    }

    // Check if distributor exists
    const distributorExists = await db.select().from(distributors).where(
      eq(distributors.id, distributorId)
    );

    if (distributorExists.length === 0) {
      return c.json({ error: 'Distributor not found' }, 404);
    }

    // Check if merchant exists
    const merchantExists = await db.select().from(merchants).where(
      eq(merchants.id, merchantId)
    );

    if (merchantExists.length === 0) {
      return c.json({ error: 'Merchant not found' }, 404);
    }

    // Update merchant to assign distributor
    const result = await db.update(merchants)
      .set({ 
        distributorId,
        updatedAt: new Date()
      })
      .where(eq(merchants.id, merchantId))
      .returning();

    return c.json({ success: true, merchant: result[0] });
  } catch (error) {
    console.error('Failed to assign merchant to distributor:', error);
    return c.json({ error: 'Failed to assign merchant to distributor' }, 500);
  }
});

// DELETE /api/gateway/distributors/:distributorId/merchants/:merchantId - Unassign merchant
gatewayDistributorRoutes.delete('/api/gateway/distributors/:distributorId/merchants/:merchantId', async (c) => {
  const distributorId = c.req.param('distributorId');
  const merchantId = c.req.param('merchantId');

  if (!distributorId) {
    return c.json({ error: 'Distributor ID parameter is required' }, 400);
  }

  if (!merchantId) {
    return c.json({ error: 'Merchant ID parameter is required' }, 400);
  }

  try {
    // Check if merchant is assigned to this distributor
    const merchant = await db.select().from(merchants).where(
      and(
        eq(merchants.id, merchantId),
        eq(merchants.distributorId, distributorId)
      )
    );

    if (merchant.length === 0) {
      return c.json({ error: 'Merchant not found or not assigned to this distributor' }, 404);
    }

    // Unassign merchant from distributor
    const result = await db.update(merchants)
      .set({ 
        distributorId: null,
        updatedAt: new Date()
      })
      .where(eq(merchants.id, merchantId))
      .returning();

    return c.json({ success: true, merchant: result[0] });
  } catch (error) {
    console.error('Failed to unassign merchant from distributor:', error);
    return c.json({ error: 'Failed to unassign merchant from distributor' }, 500);
  }
});

// GET /api/gateway/distributors/:distributorId/downline - Get full downline tree
gatewayDistributorRoutes.get('/api/gateway/distributors/:distributorId/downline', async (c) => {
  const distributorId = c.req.param('distributorId');

  if (!distributorId) {
    return c.json({ error: 'Distributor ID parameter is required' }, 400);
  }

  try {
    // Get the root distributor
    const rootResult = await db.select().from(distributors).where(
      eq(distributors.id, distributorId)
    );

    if (rootResult.length === 0) {
      return c.json({ error: 'Distributor not found' }, 404);
    }

    const rootDistributor = rootResult[0];

    // Recursive function to build downline tree (max 3 levels)
    const buildDownlineTree = async (distId: string, level: number = 0): Promise<Record<string, unknown> | null> => {
      if (level >= 3) return null; // Max 3 levels

      // Fetch this distributor's data
      const distResult = await db.select().from(distributors).where(
        eq(distributors.id, distId)
      ).limit(1);

      if (distResult.length === 0) return null;
      const dist = distResult[0];

      // Get direct children distributors
      const children = await db.select().from(distributors).where(
        and(
          eq(distributors.parentId, distId),
          eq(distributors.status, 'active')
        )
      );

      // Get merchants assigned to this distributor
      const merchantsList = await db.select().from(merchants).where(
        and(
          eq(merchants.distributorId, distId),
          eq(merchants.status, 'active')
        )
      );

      // Build children tree recursively
      const childrenTree = [];
      for (const child of children) {
        const childTree = await buildDownlineTree(child.id, level + 1);
        if (childTree) {
          childrenTree.push(childTree);
        }
      }

      return {
        distributor: {
          id: dist.id,
          name: dist.name,
          walletAddress: dist.walletAddress,
          tier: dist.tier,
          commissionPercent: dist.commissionPercent,
          status: dist.status,
        },
        merchants: merchantsList,
        children: childrenTree
      };
    };

    const downlineTree = await buildDownlineTree(distributorId);

    return c.json({ downline: downlineTree });
  } catch (error) {
    console.error('Failed to get distributor downline:', error);
    return c.json({ error: 'Failed to get distributor downline' }, 500);
  }
});

// GET /api/gateway/distributors/:distributorId/commissions - List commission history
gatewayDistributorRoutes.get('/api/gateway/distributors/:distributorId/commissions', async (c) => {
  const distributorId = c.req.param('distributorId');

  if (!distributorId) {
    return c.json({ error: 'Distributor ID parameter is required' }, 400);
  }

  try {
    const limitParam = c.req.query('limit');
    const offsetParam = c.req.query('offset');
    const from = c.req.query('from');
    const to = c.req.query('to');

    const limit = Math.min(parseInt(limitParam || '50'), 100);
    const offset = parseInt(offsetParam || '0');

    // Build conditions
    const conditions = [eq(distributorCommissions.distributorId, distributorId)];

    if (from) {
      conditions.push(gte(distributorCommissions.createdAt, new Date(from)));
    }

    if (to) {
      conditions.push(lte(distributorCommissions.createdAt, new Date(to)));
    }

    const whereClause = and(...conditions);

    // Get commissions
    const commissionsList = await db
      .select()
      .from(distributorCommissions)
      .where(whereClause)
      .orderBy(desc(distributorCommissions.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(distributorCommissions)
      .where(whereClause);

    const total = totalResult[0].count;

    return c.json({
      commissions: commissionsList,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Failed to get distributor commissions:', error);
    return c.json({ error: 'Failed to get distributor commissions' }, 500);
  }
});

// GET /api/gateway/distributors/:distributorId/volume - Volume analytics
gatewayDistributorRoutes.get('/api/gateway/distributors/:distributorId/volume', async (c) => {
  const distributorId = c.req.param('distributorId');

  if (!distributorId) {
    return c.json({ error: 'Distributor ID parameter is required' }, 400);
  }

  try {
    const fromParam = c.req.query('from');
    const toParam = c.req.query('to');
    const groupBy = c.req.query('groupBy') || 'day';

    // Default to 30 days ago if no from date provided
    const from = fromParam ? new Date(fromParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = toParam ? new Date(toParam) : new Date();

    const conditions = [
      eq(distributorCommissions.distributorId, distributorId),
      gte(distributorCommissions.createdAt, from),
      lte(distributorCommissions.createdAt, to)
    ];

    const whereClause = and(...conditions);

    // Get summary totals
    const summaryResult = await db
      .select({
        totalCommissions: sql<string>`COALESCE(SUM(${distributorCommissions.amount}), 0)`,
        totalSourceVolume: sql<string>`COALESCE(SUM(${distributorCommissions.sourceAmount}), 0)`,
        commissionCount: count()
      })
      .from(distributorCommissions)
      .where(whereClause);

    const summary = summaryResult[0];
    const totalCommissions = parseFloat(summary.totalCommissions);
    const totalSourceVolume = parseFloat(summary.totalSourceVolume);

    // Get breakdown by time period
    const periodColumn = groupBy === 'month' 
      ? sql`date_trunc('month', ${distributorCommissions.createdAt})`
      : groupBy === 'week'
      ? sql`date_trunc('week', ${distributorCommissions.createdAt})`
      : sql`date_trunc('day', ${distributorCommissions.createdAt})`;

    const breakdownResult = await db
      .select({
        period: periodColumn,
        commissions: sql<string>`COALESCE(SUM(${distributorCommissions.amount}), 0)`,
        sourceVolume: sql<string>`COALESCE(SUM(${distributorCommissions.sourceAmount}), 0)`,
        commissionCount: count()
      })
      .from(distributorCommissions)
      .where(whereClause)
      .groupBy(periodColumn)
      .orderBy(periodColumn);

    const breakdown = breakdownResult.map(row => ({
      period: row.period,
      commissions: parseFloat(row.commissions),
      sourceVolume: parseFloat(row.sourceVolume),
      commissionCount: row.commissionCount
    }));

    return c.json({
      summary: {
        totalCommissions,
        totalSourceVolume,
        commissionCount: summary.commissionCount
      },
      breakdown
    });
  } catch (error) {
    console.error('Failed to get distributor volume analytics:', error);
    return c.json({ error: 'Failed to get distributor volume analytics' }, 500);
  }
});

// GET /api/gateway/distributors/:distributorId/payouts - List payouts
gatewayDistributorRoutes.get('/api/gateway/distributors/:distributorId/payouts', async (c) => {
  const distributorId = c.req.param('distributorId');
  if (!distributorId) {
    return c.json({ error: 'Distributor ID parameter is required' }, 400);
  }

  try {
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
    const offset = parseInt(c.req.query('offset') || '0');

    const payoutsList = await db
      .select()
      .from(distributorPayouts)
      .where(eq(distributorPayouts.distributorId, distributorId))
      .orderBy(desc(distributorPayouts.createdAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: count() })
      .from(distributorPayouts)
      .where(eq(distributorPayouts.distributorId, distributorId));

    // Get unpaid commission total
    const unpaidResult = await db
      .select({
        total: sql<string>`COALESCE(SUM(${distributorCommissions.amount}), 0)`,
        currency: distributorCommissions.currency,
      })
      .from(distributorCommissions)
      .where(
        and(
          eq(distributorCommissions.distributorId, distributorId),
          eq(distributorCommissions.status, 'pending')
        )
      )
      .groupBy(distributorCommissions.currency);

    return c.json({
      payouts: payoutsList,
      total: totalResult[0].count,
      limit,
      offset,
      unpaidCommissions: unpaidResult.map(r => ({ currency: r.currency, amount: r.total })),
    });
  } catch (error) {
    console.error('Failed to get distributor payouts:', error);
    return c.json({ error: 'Failed to get distributor payouts' }, 500);
  }
});

// POST /api/gateway/distributors/:distributorId/payouts - Record manual settlement
gatewayDistributorRoutes.post('/api/gateway/distributors/:distributorId/payouts', async (c) => {
  const distributorId = c.req.param('distributorId');
  if (!distributorId) {
    return c.json({ error: 'Distributor ID parameter is required' }, 400);
  }

  try {
    const body = await c.req.json();
    const { amount, currency, txHash } = body;

    if (typeof amount !== 'number' || amount <= 0) {
      return c.json({ error: 'Valid positive amount is required' }, 400);
    }
    if (!currency || typeof currency !== 'string') {
      return c.json({ error: 'Valid currency is required' }, 400);
    }

    // Verify distributor exists
    const distExists = await db.select().from(distributors).where(
      eq(distributors.id, distributorId)
    ).limit(1);
    if (distExists.length === 0) {
      return c.json({ error: 'Distributor not found' }, 404);
    }

    // Create payout record
    const result = await db.insert(distributorPayouts).values({
      distributorId,
      amount: amount.toString(),
      currency,
      txHash: txHash || null,
      status: txHash ? 'completed' : 'pending',
      processedAt: txHash ? new Date() : null,
    }).returning();

    // Mark matching pending commissions as paid
    if (txHash) {
      await db.update(distributorCommissions)
        .set({ status: 'paid' })
        .where(
          and(
            eq(distributorCommissions.distributorId, distributorId),
            eq(distributorCommissions.currency, currency),
            eq(distributorCommissions.status, 'pending')
          )
        );
    }

    return c.json({ payout: result[0] }, 201);
  } catch (error) {
    console.error('Failed to create payout:', error);
    return c.json({ error: 'Failed to create payout' }, 500);
  }
});

export default gatewayDistributorRoutes;