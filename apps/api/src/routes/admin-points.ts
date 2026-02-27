import { Hono } from 'hono';
import { db } from '../db/index.js';
import { pointLedger, pointBalances, pointsConfig } from '../db/schema.js';
import { eq, desc, sql, count, sum, and, gte, ne } from 'drizzle-orm';
import { 
  awardPoints, 
  getConfigValue, 
  refreshAllBalances, 
  previewWeeklyDrop, 
  executeWeeklyDrop,
  getLeaderboard 
} from '../services/points.js';

const adminPointsRoutes = new Hono();

// GET /api/admin/points/stats - Overview stats for points system
adminPointsRoutes.get('/api/admin/points/stats', async (c) => {
  try {
    const [
      totalPointsResult,
      totalEarnersResult,
      pointsIssuedTodayResult,
      topUsersResult,
    ] = await Promise.all([
      // Total points issued
      db.select({ total: sum(pointLedger.points) }).from(pointLedger),
      
      // Total active earners (users with points)
      db.select({ count: count() }).from(pointBalances).where(sql`${pointBalances.totalPoints} > 0`),
      
      // Points issued today
      db.select({ total: sum(pointLedger.points) })
        .from(pointLedger)
        .where(gte(pointLedger.createdAt, new Date(new Date().setHours(0, 0, 0, 0)))),
      
      // Top 5 users
      db.select({
        walletAddress: pointBalances.walletAddress,
        totalPoints: pointBalances.totalPoints,
        tier: pointBalances.tier,
        rank: pointBalances.rank,
      })
        .from(pointBalances)
        .where(ne(pointBalances.flagged, true))
        .orderBy(desc(pointBalances.totalPoints))
        .limit(5),
    ]);
    
    return c.json({
      totalPointsIssued: totalPointsResult[0]?.total || '0',
      totalActiveEarners: totalEarnersResult[0]?.count || 0,
      pointsIssuedToday: pointsIssuedTodayResult[0]?.total || '0',
      topUsers: topUsersResult,
    });
  } catch (error) {
    console.error('Failed to get points stats:', error);
    return c.json({ error: 'Failed to get points stats' }, 500);
  }
});

// POST /api/admin/points/adjust - Manually adjust user points
adminPointsRoutes.post('/api/admin/points/adjust', async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress, points, reason } = body;
    
    // Validate input
    if (!walletAddress || typeof walletAddress !== 'string') {
      return c.json({ error: 'Valid wallet address is required' }, 400);
    }
    
    if (typeof points !== 'number' || isNaN(points)) {
      return c.json({ error: 'Valid points amount is required' }, 400);
    }
    
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return c.json({ error: 'Reason is required' }, 400);
    }
    
    // Award points (can be negative for deductions)
    const result = await awardPoints({
      walletAddress,
      eventType: 'ADMIN_ADJUSTMENT',
      basePoints: points,
      metadata: { reason: reason.trim(), admin: true },
      referenceId: `admin_adjust_${Date.now()}_${walletAddress}`,
    });
    
    if (!result) {
      return c.json({ error: 'Failed to adjust points (wallet may be flagged or other issue)' }, 400);
    }
    
    return c.json({
      message: 'Points adjusted successfully',
      pointsAwarded: result.points,
      newBalance: result.newBalance,
    });
  } catch (error) {
    console.error('Failed to adjust points:', error);
    return c.json({ error: 'Failed to adjust points' }, 500);
  }
});

// GET /api/admin/points/config - List all config key/value pairs
adminPointsRoutes.get('/api/admin/points/config', async (c) => {
  try {
    const configs = await db.select()
      .from(pointsConfig)
      .orderBy(pointsConfig.key);
    
    return c.json({ configs });
  } catch (error) {
    console.error('Failed to get points config:', error);
    return c.json({ error: 'Failed to get points config' }, 500);
  }
});

// PUT /api/admin/points/config - Update config value
adminPointsRoutes.put('/api/admin/points/config', async (c) => {
  try {
    const body = await c.req.json();
    const { key, value, description } = body;
    
    // Validate input
    if (!key || typeof key !== 'string' || key.trim().length === 0) {
      return c.json({ error: 'Valid config key is required' }, 400);
    }
    
    if (value === undefined || value === null) {
      return c.json({ error: 'Config value is required' }, 400);
    }
    
    const valueStr = String(value);
    
    // Upsert config
    await db.insert(pointsConfig)
      .values({
        key: key.trim(),
        value: valueStr,
        description: description || null,
        updatedAt: new Date(),
        updatedBy: 'admin', // TODO: Get from auth context
      })
      .onConflictDoUpdate({
        target: pointsConfig.key,
        set: {
          value: valueStr,
          description: description || null,
          updatedAt: new Date(),
          updatedBy: 'admin',
        },
      });
    
    return c.json({ message: 'Config updated successfully' });
  } catch (error) {
    console.error('Failed to update config:', error);
    return c.json({ error: 'Failed to update config' }, 500);
  }
});

// GET /api/admin/points/drops/preview - Preview weekly drop calculation
adminPointsRoutes.get('/api/admin/points/drops/preview', async (c) => {
  try {
    const sendRate = parseFloat(c.req.query('sendRate') || await getConfigValue('send_rate'));
    const receiveRate = parseFloat(c.req.query('receiveRate') || await getConfigValue('receive_rate'));
    const txBonus = parseFloat(c.req.query('txBonus') || '1');
    const refBonus = parseFloat(c.req.query('refBonus') || '0');
    
    // Validate rates
    if (isNaN(sendRate) || isNaN(receiveRate) || isNaN(txBonus) || isNaN(refBonus)) {
      return c.json({ error: 'Invalid rate parameters' }, 400);
    }
    
    const preview = await previewWeeklyDrop({
      sendRate,
      receiveRate,
      txBonus,
      refBonus,
    });
    
    const totalPoints = preview.reduce((sum, p) => sum + p.points, 0);
    const totalUsers = preview.length;
    
    return c.json({
      preview: preview.slice(0, 50), // Limit to top 50 for preview
      summary: {
        totalUsers,
        totalPoints,
        averagePoints: totalUsers > 0 ? Math.round(totalPoints / totalUsers) : 0,
      },
      config: {
        sendRate,
        receiveRate,
        txBonus,
        refBonus,
      },
    });
  } catch (error) {
    console.error('Failed to preview weekly drop:', error);
    return c.json({ error: 'Failed to preview weekly drop' }, 500);
  }
});

// POST /api/admin/points/drops/execute - Execute weekly drop
adminPointsRoutes.post('/api/admin/points/drops/execute', async (c) => {
  try {
    const body = await c.req.json();
    const { sendRate, receiveRate, txBonus, refBonus } = body;
    
    // Validate rates
    if (typeof sendRate !== 'number' || typeof receiveRate !== 'number' || 
        typeof txBonus !== 'number' || typeof refBonus !== 'number') {
      return c.json({ error: 'All rate parameters must be numbers' }, 400);
    }
    
    if (sendRate < 0 || receiveRate < 0 || txBonus < 0 || refBonus < 0) {
      return c.json({ error: 'Rate parameters cannot be negative' }, 400);
    }
    
    const result = await executeWeeklyDrop({
      sendRate,
      receiveRate,
      txBonus,
      refBonus,
    });
    
    return c.json({
      message: 'Weekly drop executed successfully',
      usersAwarded: result.usersAwarded,
      totalPoints: result.totalPoints,
    });
  } catch (error) {
    console.error('Failed to execute weekly drop:', error);
    return c.json({ error: 'Failed to execute weekly drop' }, 500);
  }
});

// GET /api/admin/points/drops/history - List past weekly drop events
adminPointsRoutes.get('/api/admin/points/drops/history', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = Math.min(parseInt(c.req.query('limit') || '20', 10), 100);
    const offset = (page - 1) * limit;
    
    // Get weekly drop events grouped by created date
    const dropHistory = await db.select({
      date: sql<string>`DATE(${pointLedger.createdAt})`,
      totalPoints: sum(pointLedger.points),
      userCount: count(),
      firstEvent: sql<Date>`MIN(${pointLedger.createdAt})`,
    })
      .from(pointLedger)
      .where(eq(pointLedger.eventType, 'WEEKLY_DROP'))
      .groupBy(sql`DATE(${pointLedger.createdAt})`)
      .orderBy(desc(sql`DATE(${pointLedger.createdAt})`))
      .limit(limit)
      .offset(offset);
    
    // Get total count for pagination
    const totalResult = await db.select({ 
      count: sql<number>`COUNT(DISTINCT DATE(${pointLedger.createdAt}))` 
    })
      .from(pointLedger)
      .where(eq(pointLedger.eventType, 'WEEKLY_DROP'));
    
    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);
    
    return c.json({
      history: dropHistory,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Failed to get drop history:', error);
    return c.json({ error: 'Failed to get drop history' }, 500);
  }
});

// GET /api/admin/leaderboard - Full leaderboard with admin data
adminPointsRoutes.get('/api/admin/leaderboard', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = Math.min(parseInt(c.req.query('limit') || '100', 10), 500);
    const offset = (page - 1) * limit;
    const includeFlagged = c.req.query('includeFlagged') === 'true';
    
    let whereCondition = undefined;
    if (!includeFlagged) {
      whereCondition = ne(pointBalances.flagged, true);
    }
    
    const leaderboard = await db.select({
      walletAddress: pointBalances.walletAddress,
      totalPoints: pointBalances.totalPoints,
      weeklyPoints: pointBalances.weeklyPoints,
      rank: pointBalances.rank,
      tier: pointBalances.tier,
      streakWeeks: pointBalances.streakWeeks,
      lastActiveWeek: pointBalances.lastActiveWeek,
      flagged: pointBalances.flagged,
      updatedAt: pointBalances.updatedAt,
    })
      .from(pointBalances)
      .where(whereCondition)
      .orderBy(desc(pointBalances.totalPoints))
      .limit(limit)
      .offset(offset);
    
    // Get total count
    const totalResult = await db.select({ count: count() })
      .from(pointBalances)
      .where(whereCondition);
    
    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);
    
    return c.json({
      leaderboard,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Failed to get admin leaderboard:', error);
    return c.json({ error: 'Failed to get admin leaderboard' }, 500);
  }
});

// POST /api/admin/leaderboard/flag/:wallet - Toggle flagged status
adminPointsRoutes.post('/api/admin/leaderboard/flag/:wallet', async (c) => {
  try {
    const walletAddress = c.req.param('wallet');
    
    if (!walletAddress) {
      return c.json({ error: 'Wallet address parameter is required' }, 400);
    }
    
    // Get current flagged status
    const currentRecord = await db.select({ flagged: pointBalances.flagged })
      .from(pointBalances)
      .where(eq(pointBalances.walletAddress, walletAddress))
      .limit(1);
    
    if (currentRecord.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    const newFlaggedStatus = !currentRecord[0].flagged;
    
    // Update flagged status
    await db.update(pointBalances)
      .set({ 
        flagged: newFlaggedStatus,
        updatedAt: new Date(),
      })
      .where(eq(pointBalances.walletAddress, walletAddress));
    
    // If unflagging, refresh ranks
    if (!newFlaggedStatus) {
      await refreshAllBalances();
    }
    
    return c.json({
      message: `User ${newFlaggedStatus ? 'flagged' : 'unflagged'} successfully`,
      walletAddress,
      flagged: newFlaggedStatus,
    });
  } catch (error) {
    console.error('Failed to toggle flag status:', error);
    return c.json({ error: 'Failed to toggle flag status' }, 500);
  }
});

export default adminPointsRoutes;