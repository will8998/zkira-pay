import { Hono } from 'hono';
import { timingSafeEqual } from 'node:crypto';
import { db } from '../db/index.js';
import { partnerWithdrawals, distributors } from '../db/schema.js';
import { eq, and, gte, lte, sql, count, desc } from 'drizzle-orm';
import { loadConfig } from '../config.js';
import { verifyAdminToken } from '../middleware/jwt-auth.js';

const partnerVolumeRoutes = new Hono();

// ─── Relayer auth middleware (shared secret) ───
const relayerAuth = async (c: any, next: any) => {
  const secret = c.req.header('X-Relayer-Secret');
  const config = loadConfig();

  if (!secret || !config.relayerSecret) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const provided = Buffer.from(secret);
    const expected = Buffer.from(config.relayerSecret);
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
  } catch {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  await next();
};

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

// ═══════════════════════════════════════════════════════════
// POST /api/relayer/withdrawal — Record a partner withdrawal (from relayer)
// ═══════════════════════════════════════════════════════════
partnerVolumeRoutes.post('/api/relayer/withdrawal', relayerAuth, async (c) => {
  try {
    const body = await c.req.json();
    const { partnerId, poolAddress, txHash, recipient, chain } = body;

    if (!partnerId || !poolAddress || !txHash || !recipient || !chain) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Verify distributor exists
    const dist = await db.select({ id: distributors.id })
      .from(distributors)
      .where(eq(distributors.id, partnerId))
      .limit(1);

    if (dist.length === 0) {
      return c.json({ error: 'Distributor not found' }, 404);
    }

    // Insert withdrawal record (idempotent on txHash unique constraint)
    await db.insert(partnerWithdrawals).values({
      distributorId: partnerId,
      poolAddress,
      txHash,
      recipient,
      chain,
    }).onConflictDoNothing();

    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to record partner withdrawal:', error);
    return c.json({ error: 'Failed to record withdrawal' }, 500);
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/partner/:partnerId/volume — Partner self-service volume
// Auth: admin password (partner gets it from admin)
// ═══════════════════════════════════════════════════════════
partnerVolumeRoutes.get('/api/partner/:partnerId/volume', adminAuth, async (c) => {
  const partnerId = c.req.param('partnerId');

  if (!partnerId) {
    return c.json({ error: 'Partner ID is required' }, 400);
  }

  try {
    const fromParam = c.req.query('from');
    const toParam = c.req.query('to');
    const groupBy = c.req.query('groupBy') || 'day';

    const from = fromParam ? new Date(fromParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = toParam ? new Date(toParam) : new Date();

    // Get distributor info
    const distResult = await db.select({
      id: distributors.id,
      name: distributors.name,
      commissionPercent: distributors.commissionPercent,
      tier: distributors.tier,
    }).from(distributors).where(eq(distributors.id, partnerId)).limit(1);

    if (distResult.length === 0) {
      return c.json({ error: 'Partner not found' }, 404);
    }

    const partner = distResult[0];

    const conditions = [
      eq(partnerWithdrawals.distributorId, partnerId),
      gte(partnerWithdrawals.createdAt, from),
      lte(partnerWithdrawals.createdAt, to),
    ];

    const whereClause = and(...conditions);

    // Summary
    const summaryResult = await db
      .select({
        totalWithdrawals: count(),
        totalDenomination: sql<string>`COALESCE(SUM(${partnerWithdrawals.denomination}), 0)`,
      })
      .from(partnerWithdrawals)
      .where(whereClause);

    const summary = summaryResult[0];

    // Time-series breakdown
    const periodColumn = groupBy === 'month'
      ? sql`date_trunc('month', ${partnerWithdrawals.createdAt})`
      : groupBy === 'week'
      ? sql`date_trunc('week', ${partnerWithdrawals.createdAt})`
      : sql`date_trunc('day', ${partnerWithdrawals.createdAt})`;

    const breakdownResult = await db
      .select({
        period: periodColumn,
        withdrawalCount: count(),
        volume: sql<string>`COALESCE(SUM(${partnerWithdrawals.denomination}), 0)`,
      })
      .from(partnerWithdrawals)
      .where(whereClause)
      .groupBy(periodColumn)
      .orderBy(periodColumn);

    const breakdown = breakdownResult.map(row => ({
      period: row.period,
      withdrawalCount: row.withdrawalCount,
      volume: parseFloat(row.volume),
    }));

    const totalVolume = parseFloat(summary.totalDenomination);
    const commissionPercent = parseFloat(partner.commissionPercent);
    const estimatedCommission = totalVolume * (commissionPercent / 100);

    return c.json({
      partner: {
        id: partner.id,
        name: partner.name,
        tier: partner.tier,
        commissionPercent,
      },
      summary: {
        totalWithdrawals: summary.totalWithdrawals,
        totalVolume,
        estimatedCommission,
      },
      breakdown,
    });
  } catch (error) {
    console.error('Failed to get partner volume:', error);
    return c.json({ error: 'Failed to get partner volume' }, 500);
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/admin/volume — Global volume across all partners (admin only)
// ═══════════════════════════════════════════════════════════
partnerVolumeRoutes.get('/api/admin/volume', adminAuth, async (c) => {
  try {
    const fromParam = c.req.query('from');
    const toParam = c.req.query('to');
    const groupBy = c.req.query('groupBy') || 'day';

    const from = fromParam ? new Date(fromParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = toParam ? new Date(toParam) : new Date();

    const dateConditions = [
      gte(partnerWithdrawals.createdAt, from),
      lte(partnerWithdrawals.createdAt, to),
    ];

    const whereClause = and(...dateConditions);

    // Global summary
    const globalSummary = await db
      .select({
        totalWithdrawals: count(),
        totalVolume: sql<string>`COALESCE(SUM(${partnerWithdrawals.denomination}), 0)`,
      })
      .from(partnerWithdrawals)
      .where(whereClause);

    // Per-partner breakdown
    const perPartner = await db
      .select({
        distributorId: partnerWithdrawals.distributorId,
        name: distributors.name,
        tier: distributors.tier,
        commissionPercent: distributors.commissionPercent,
        withdrawalCount: count(),
        volume: sql<string>`COALESCE(SUM(${partnerWithdrawals.denomination}), 0)`,
      })
      .from(partnerWithdrawals)
      .innerJoin(distributors, eq(partnerWithdrawals.distributorId, distributors.id))
      .where(whereClause)
      .groupBy(
        partnerWithdrawals.distributorId,
        distributors.name,
        distributors.tier,
        distributors.commissionPercent
      )
      .orderBy(desc(sql`COALESCE(SUM(${partnerWithdrawals.denomination}), 0)`));

    const partners = perPartner.map(row => {
      const volume = parseFloat(row.volume);
      const commission = parseFloat(row.commissionPercent);
      return {
        distributorId: row.distributorId,
        name: row.name,
        tier: row.tier,
        commissionPercent: commission,
        withdrawalCount: row.withdrawalCount,
        volume,
        estimatedCommission: volume * (commission / 100),
      };
    });

    // Time-series breakdown (all partners combined)
    const periodColumn = groupBy === 'month'
      ? sql`date_trunc('month', ${partnerWithdrawals.createdAt})`
      : groupBy === 'week'
      ? sql`date_trunc('week', ${partnerWithdrawals.createdAt})`
      : sql`date_trunc('day', ${partnerWithdrawals.createdAt})`;

    const timeSeriesResult = await db
      .select({
        period: periodColumn,
        withdrawalCount: count(),
        volume: sql<string>`COALESCE(SUM(${partnerWithdrawals.denomination}), 0)`,
      })
      .from(partnerWithdrawals)
      .where(whereClause)
      .groupBy(periodColumn)
      .orderBy(periodColumn);

    const timeSeries = timeSeriesResult.map(row => ({
      period: row.period,
      withdrawalCount: row.withdrawalCount,
      volume: parseFloat(row.volume),
    }));

    const summary = globalSummary[0];

    return c.json({
      summary: {
        totalWithdrawals: summary.totalWithdrawals,
        totalVolume: parseFloat(summary.totalVolume),
      },
      partners,
      timeSeries,
    });
  } catch (error) {
    console.error('Failed to get admin volume:', error);
    return c.json({ error: 'Failed to get admin volume' }, 500);
  }
});

export default partnerVolumeRoutes;
