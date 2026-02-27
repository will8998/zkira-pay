import { Hono } from 'hono';
import { db } from '../db/index.js';
import { pointLedger, pointBalances } from '../db/schema.js';
import { eq, desc, count } from 'drizzle-orm';
import { getUserPosition, getLeaderboard } from '../services/points.js';

const pointsRoutes = new Hono();

// GET /api/points/:wallet - Get user's points summary
pointsRoutes.get('/api/points/:wallet', async (c) => {
  try {
    const walletAddress = c.req.param('wallet');
    
    if (!walletAddress) {
      return c.json({ error: 'Wallet address parameter is required' }, 400);
    }
    
    // Validate wallet address format (basic check)
    if (typeof walletAddress !== 'string' || walletAddress.length < 32 || walletAddress.length > 44) {
      return c.json({ error: 'Invalid wallet address format' }, 400);
    }
    
    const position = await getUserPosition(walletAddress);
    
    if (!position) {
      return c.json({
        totalPoints: '0',
        weeklyPoints: '0',
        rank: null,
        tier: 'operative',
        streakWeeks: 0,
        percentile: 0,
      });
    }
    
    return c.json(position);
  } catch (error) {
    console.error('Failed to get user points:', error);
    return c.json({ error: 'Failed to get user points' }, 500);
  }
});

// GET /api/points/:wallet/history - Get user's points history with pagination
pointsRoutes.get('/api/points/:wallet/history', async (c) => {
  try {
    const walletAddress = c.req.param('wallet');
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 100); // Max 100 per page
    const offset = (page - 1) * limit;
    
    if (!walletAddress) {
      return c.json({ error: 'Wallet address parameter is required' }, 400);
    }
    
    // Validate wallet address format
    if (typeof walletAddress !== 'string' || walletAddress.length < 32 || walletAddress.length > 44) {
      return c.json({ error: 'Invalid wallet address format' }, 400);
    }
    
    // Get paginated history
    const events = await db.select({
      id: pointLedger.id,
      eventType: pointLedger.eventType,
      points: pointLedger.points,
      metadata: pointLedger.metadata,
      createdAt: pointLedger.createdAt,
    })
      .from(pointLedger)
      .where(eq(pointLedger.walletAddress, walletAddress))
      .orderBy(desc(pointLedger.createdAt))
      .limit(limit)
      .offset(offset);
    
    // Get total count for pagination
    const totalResult = await db.select({ count: count() })
      .from(pointLedger)
      .where(eq(pointLedger.walletAddress, walletAddress));
    
    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);
    
    return c.json({
      events,
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
    console.error('Failed to get user points history:', error);
    return c.json({ error: 'Failed to get user points history' }, 500);
  }
});

// GET /api/leaderboard - Get leaderboard with filters
pointsRoutes.get('/api/leaderboard', async (c) => {
  try {
    const period = c.req.query('period') as 'all_time' | 'weekly' || 'all_time';
    const sortBy = c.req.query('sort') as 'points' | 'volume' || 'points';
    const limit = Math.min(parseInt(c.req.query('limit') || '100', 10), 500); // Max 500
    const offset = parseInt(c.req.query('offset') || '0', 10);
    
    // Validate period parameter
    if (period !== 'all_time' && period !== 'weekly') {
      return c.json({ error: 'Period must be "all_time" or "weekly"' }, 400);
    }
    
    // Validate sortBy parameter
    if (sortBy !== 'points' && sortBy !== 'volume') {
      return c.json({ error: 'Sort must be "points" or "volume"' }, 400);
    }
    
    const leaderboard = await getLeaderboard({
      limit,
      offset,
      period,
      sortBy,
    });
    
    // Get total count for pagination
    const totalResult = await db.select({ count: count() })
      .from(pointBalances);
    
    const total = totalResult[0]?.count || 0;
    
    // Transform to match frontend expected shape:
    // Frontend expects: { rank, wallet, points, tier, volume? }
    // Service returns: { walletAddress, totalPoints, weeklyPoints, rank, tier, streakWeeks }
    const transformedLeaderboard = leaderboard.map((entry, index) => ({
      rank: entry.rank ?? (offset + index + 1),
      wallet: entry.walletAddress,
      points: period === 'weekly'
        ? Math.round(parseFloat(entry.weeklyPoints || '0'))
        : Math.round(parseFloat(entry.totalPoints || '0')),
      tier: entry.tier,
      volume: 0,
    }));

    return c.json({
      leaderboard: transformedLeaderboard,
      pagination: {
        limit,
        offset,
        total,
        hasNext: offset + limit < total,
        hasPrev: offset > 0,
      },
      filters: {
        period,
        sortBy,
      },
    });
  } catch (error) {
    console.error('Failed to get leaderboard:', error);
    return c.json({ error: 'Failed to get leaderboard' }, 500);
  }
});

// GET /api/leaderboard/position/:wallet - Get user's position in leaderboard
pointsRoutes.get('/api/leaderboard/position/:wallet', async (c) => {
  try {
    const walletAddress = c.req.param('wallet');
    
    if (!walletAddress) {
      return c.json({ error: 'Wallet address parameter is required' }, 400);
    }
    
    // Validate wallet address format
    if (typeof walletAddress !== 'string' || walletAddress.length < 32 || walletAddress.length > 44) {
      return c.json({ error: 'Invalid wallet address format' }, 400);
    }
    
    const position = await getUserPosition(walletAddress);
    
    if (!position) {
      return c.json({ error: 'User not found in leaderboard' }, 404);
    }
    
    return c.json({
      rank: position.rank,
      points: Math.round(parseFloat(position.totalPoints || '0')),
      percentile: position.percentile,
      tier: position.tier,
    });
  } catch (error) {
    console.error('Failed to get user leaderboard position:', error);
    return c.json({ error: 'Failed to get user leaderboard position' }, 500);
  }
});

export default pointsRoutes;