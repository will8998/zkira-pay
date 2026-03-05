import { Hono } from 'hono';
import { timingSafeEqual } from 'node:crypto';
import { sha256 } from 'hono/utils/crypto';
import { db } from '../db/index.js';
import { distributors, distributorCommissions, distributorPayouts, merchants, apiKeys } from '../db/schema.js';
import { eq, and, desc, sql, count, sum, gte, lte } from 'drizzle-orm';
import { loadConfig } from '../config.js';
import { verifyAdminToken } from '../middleware/jwt-auth.js';

const adminDistributorRoutes = new Hono<{
  Variables: {
    adminRole: 'master' | 'merchant';
    merchantId: string | null;
    merchantName?: string;
  }
}>();

// Dual admin authentication middleware (JWT → password → API key)
const dualAdminAuth = async (c: any, next: any) => {
  const config = loadConfig();

  // 1. Try JWT Bearer token first
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = await verifyAdminToken(token, config.jwtSecret);
    if (payload) {
      c.set('adminRole', payload.role);
      c.set('merchantId', payload.merchantId);
      if (payload.merchantName) c.set('merchantName', payload.merchantName);
      await next();
      return;
    }
  }

  // 2. Try admin password header (legacy — backward compat)
  const adminPassword = c.req.header('X-Admin-Password');
  if (adminPassword) {
    try {
      const provided = Buffer.from(adminPassword);
      const expected = Buffer.from(config.adminPassword);
      if (provided.length === expected.length && timingSafeEqual(provided, expected)) {
        c.set('adminRole', 'master');
        c.set('merchantId', null);
        await next();
        return;
      }
    } catch {
      // Continue to API key check
    }
  }

  // 3. Try API key header (merchant role)
  const apiKey = c.req.header('X-API-Key');
  if (apiKey) {
    try {
      const keyHash = Array.from(sha256(apiKey), byte => byte.toString(16).padStart(2, '0')).join('');
      const apiKeyResult = await db.select().from(apiKeys).where(
        and(
          eq(apiKeys.keyHash, keyHash),
          eq(apiKeys.isActive, true)
        )
      ).limit(1);

      if (apiKeyResult.length > 0) {
        const apiKeyRow = apiKeyResult[0];
        const merchantResult = await db.select().from(merchants).where(
          and(
            eq(merchants.walletAddress, apiKeyRow.walletAddress),
            eq(merchants.status, 'active')
          )
        ).limit(1);

        if (merchantResult.length > 0) {
          const merchantRow = merchantResult[0];
          c.set('adminRole', 'merchant');
          c.set('merchantId', merchantRow.id);
          c.set('merchantName', merchantRow.name);
          await next();
          return;
        }
      }
    } catch (error) {
      console.error('API key validation error:', error);
    }
  }

  return c.json({ error: 'Unauthorized' }, 401);
};

// Apply dual admin auth to all admin distributor routes
adminDistributorRoutes.use('/api/admin/distributors/*', dualAdminAuth);

// GET /api/admin/distributors - List all distributors (with tracking code, merchant count, volume stats)
adminDistributorRoutes.get('/api/admin/distributors', async (c) => {
  const adminRole = c.get('adminRole');
  if (adminRole !== 'master') {
    return c.json({ error: 'Access denied' }, 403);
  }

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

    // Get distributors with merchant count and volume stats
    const distributorsList = await db
      .select({
        id: distributors.id,
        name: distributors.name,
        walletAddress: distributors.walletAddress,
        parentId: distributors.parentId,
        tier: distributors.tier,
        commissionPercent: distributors.commissionPercent,
        status: distributors.status,
        trackingCode: distributors.trackingCode,
        createdAt: distributors.createdAt,
        updatedAt: distributors.updatedAt,
        merchantCount: sql<number>`(SELECT COUNT(*) FROM ${merchants} WHERE ${merchants.distributorId} = ${distributors.id})`,
        totalVolume: sql<string>`COALESCE((SELECT SUM(${distributorCommissions.sourceAmount}) FROM ${distributorCommissions} WHERE ${distributorCommissions.distributorId} = ${distributors.id}), 0)`,
        totalCommissions: sql<string>`COALESCE((SELECT SUM(${distributorCommissions.amount}) FROM ${distributorCommissions} WHERE ${distributorCommissions.distributorId} = ${distributors.id}), 0)`,
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
      distributors: distributorsList.map(d => ({
        ...d,
        totalVolume: parseFloat(d.totalVolume),
        totalCommissions: parseFloat(d.totalCommissions),
      })),
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Failed to get distributors:', error);
    return c.json({ error: 'Failed to get distributors' }, 500);
  }
});

// POST /api/admin/distributors - Create new distributor
adminDistributorRoutes.post('/api/admin/distributors', async (c) => {
  const adminRole = c.get('adminRole');
  if (adminRole !== 'master') {
    return c.json({ error: 'Access denied' }, 403);
  }

  try {
    const body = await c.req.json();
    const { name, walletAddress, tier, commissionPercent, trackingCode } = body;

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

    if (trackingCode && typeof trackingCode !== 'string') {
      return c.json({ error: 'Tracking code must be a string' }, 400);
    }

    // Check for existing distributor with same wallet address
    const existing = await db.select().from(distributors).where(
      eq(distributors.walletAddress, walletAddress)
    );

    if (existing.length > 0) {
      return c.json({ error: 'Distributor with this wallet address already exists' }, 409);
    }

    // Check for existing tracking code if provided
    if (trackingCode) {
      const existingTrackingCode = await db.select().from(distributors).where(
        eq(distributors.trackingCode, trackingCode)
      );

      if (existingTrackingCode.length > 0) {
        return c.json({ error: 'Distributor with this tracking code already exists' }, 409);
      }
    }

    // Insert new distributor
    const result = await db.insert(distributors).values({
      name,
      walletAddress,
      tier,
      commissionPercent: commissionPercent?.toString() || '0',
      trackingCode: trackingCode || null,
    }).returning();

    return c.json({ distributor: result[0] }, 201);
  } catch (error) {
    console.error('Failed to create distributor:', error);
    return c.json({ error: 'Failed to create distributor' }, 500);
  }
});

// PUT /api/admin/distributors/:id - Update distributor
adminDistributorRoutes.put('/api/admin/distributors/:id', async (c) => {
  const adminRole = c.get('adminRole');
  if (adminRole !== 'master') {
    return c.json({ error: 'Access denied' }, 403);
  }

  const distributorId = c.req.param('id');

  if (!distributorId) {
    return c.json({ error: 'Distributor ID parameter is required' }, 400);
  }

  try {
    const body = await c.req.json();
    const { name, commissionPercent, status, trackingCode } = body;

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

    if (trackingCode !== undefined) {
      if (trackingCode && typeof trackingCode !== 'string') {
        return c.json({ error: 'Tracking code must be a string' }, 400);
      }

      // Check for existing tracking code if provided and different from current
      if (trackingCode && trackingCode !== existing[0].trackingCode) {
        const existingTrackingCode = await db.select().from(distributors).where(
          eq(distributors.trackingCode, trackingCode)
        );

        if (existingTrackingCode.length > 0) {
          return c.json({ error: 'Distributor with this tracking code already exists' }, 409);
        }
      }

      updateData.trackingCode = trackingCode || null;
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

// DELETE /api/admin/distributors/:id - Soft delete (set inactive)
adminDistributorRoutes.delete('/api/admin/distributors/:id', async (c) => {
  const adminRole = c.get('adminRole');
  if (adminRole !== 'master') {
    return c.json({ error: 'Access denied' }, 403);
  }

  const distributorId = c.req.param('id');

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

// GET /api/admin/distributors/:id/volume - Volume analytics (from distributorCommissions)
adminDistributorRoutes.get('/api/admin/distributors/:id/volume', async (c) => {
  const adminRole = c.get('adminRole');
  if (adminRole !== 'master') {
    return c.json({ error: 'Access denied' }, 403);
  }

  const distributorId = c.req.param('id');

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

// GET /api/admin/distributors/:id/commissions - Commission history
adminDistributorRoutes.get('/api/admin/distributors/:id/commissions', async (c) => {
  const adminRole = c.get('adminRole');
  if (adminRole !== 'master') {
    return c.json({ error: 'Access denied' }, 403);
  }

  const distributorId = c.req.param('id');

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

// GET /api/admin/distributors/:id/payouts - Payout history + unpaid total
adminDistributorRoutes.get('/api/admin/distributors/:id/payouts', async (c) => {
  const adminRole = c.get('adminRole');
  if (adminRole !== 'master') {
    return c.json({ error: 'Access denied' }, 403);
  }

  const distributorId = c.req.param('id');
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

// POST /api/admin/distributors/:id/payouts - Record manual settlement/payout
adminDistributorRoutes.post('/api/admin/distributors/:id/payouts', async (c) => {
  const adminRole = c.get('adminRole');
  if (adminRole !== 'master') {
    return c.json({ error: 'Access denied' }, 403);
  }

  const distributorId = c.req.param('id');
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

export default adminDistributorRoutes;