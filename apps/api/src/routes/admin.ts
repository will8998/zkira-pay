import { Hono } from 'hono';
import { timingSafeEqual } from 'node:crypto';
import { sha256 } from '@noble/hashes/sha256';
import { db } from '../db/index.js';
import { merchants, gatewaySessions, ephemeralWallets, apiKeys } from '../db/schema.js';
import { eq, count, sum, desc, gte, lte, sql, and, like, or } from 'drizzle-orm';
import { loadConfig } from '../config.js';

const adminRoutes = new Hono<{
  Variables: {
    adminRole: 'master' | 'merchant';
    merchantId: string | null;
    merchantName?: string;
  }
}>();

// Dual admin authentication middleware
const dualAdminAuth = async (c: any, next: any) => {
  const adminPassword = c.req.header('X-Admin-Password');
  const apiKey = c.req.header('X-API-Key');
  const config = loadConfig();

  // First try admin password (master role)
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

  // Then try API key (merchant role)
  if (apiKey) {
    try {
      // Hash the provided API key
      const keyHash = Array.from(sha256(apiKey), byte => byte.toString(16).padStart(2, '0')).join('');

      // Look up the API key in the database
      const apiKeyResult = await db.select().from(apiKeys).where(
        and(
          eq(apiKeys.keyHash, keyHash),
          eq(apiKeys.isActive, true)
        )
      ).limit(1);

      if (apiKeyResult.length > 0) {
        const apiKeyRow = apiKeyResult[0];

        // Look up the merchant by wallet address
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

// Apply dual admin auth to all admin routes
adminRoutes.use('/api/admin/*', dualAdminAuth);

// POST /api/admin/login - Login endpoint for dual authentication
adminRoutes.post('/api/admin/login', async (c) => {
  try {
    const body = await c.req.json();
    const { credential } = body;

    if (!credential) {
      return c.json({ error: 'Credential is required' }, 400);
    }

    const config = loadConfig();

    // First try to match against admin password
    try {
      const provided = Buffer.from(credential);
      const expected = Buffer.from(config.adminPassword);
      if (provided.length === expected.length && timingSafeEqual(provided, expected)) {
        return c.json({
          role: 'master',
          merchantId: null,
          merchantName: null
        });
      }
    } catch {
      // Continue to API key check
    }

    // Then try as API key
    try {
      const keyHash = Array.from(sha256(credential), byte => byte.toString(16).padStart(2, '0')).join('');

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
          return c.json({
            role: 'merchant',
            merchantId: merchantRow.id,
            merchantName: merchantRow.name
          });
        }
      }
    } catch (error) {
      console.error('API key validation error:', error);
    }

    return c.json({ error: 'Invalid credentials' }, 401);
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// GET /api/admin/stats - Overview stats
adminRoutes.get('/api/admin/stats', async (c) => {
  try {
    const adminRole = c.get('adminRole');
    const merchantId = c.get('merchantId') as string | null;

    if (adminRole === 'master') {
      // Master role: global stats
      const [
        totalSessionsResult,
        totalVolumeResult,
        totalMerchantsResult,
        activeWalletsResult,
        pendingWithdrawalsResult
      ] = await Promise.all([
        db.select({ count: count() }).from(gatewaySessions),
        db.select({ total: sum(gatewaySessions.amount) }).from(gatewaySessions)
          .where(eq(gatewaySessions.status, 'completed')),
        db.select({ count: count() }).from(merchants).where(eq(merchants.status, 'active')),
        db.select({ count: count() }).from(ephemeralWallets).where(eq(ephemeralWallets.status, 'active')),
        db.select({ count: count() }).from(gatewaySessions)
          .where(and(
            eq(gatewaySessions.sessionType, 'withdraw'),
            eq(gatewaySessions.status, 'pending')
          ))
      ]);

      return c.json({
        totalSessions: totalSessionsResult[0]?.count || 0,
        totalVolume: totalVolumeResult[0]?.total || '0',
        totalMerchants: totalMerchantsResult[0]?.count || 0,
        activeWallets: activeWalletsResult[0]?.count || 0,
        pendingWithdrawals: pendingWithdrawalsResult[0]?.count || 0
      });
    } else if (merchantId) {
      // Merchant role: scoped stats
      // Merchant role: scoped stats
      const [
        totalSessionsResult,
        totalVolumeResult,
        activeWalletsResult,
        pendingWithdrawalsResult
      ] = await Promise.all([
        db.select({ count: count() }).from(gatewaySessions)
          .where(eq(gatewaySessions.merchantId, merchantId)),
        db.select({ total: sum(gatewaySessions.amount) }).from(gatewaySessions)
          .where(and(
            eq(gatewaySessions.merchantId, merchantId),
            eq(gatewaySessions.status, 'completed')
          )),
        db.select({ count: count() })
          .from(ephemeralWallets)
          .innerJoin(gatewaySessions, eq(ephemeralWallets.address, gatewaySessions.ephemeralWallet))
          .where(and(
            eq(gatewaySessions.merchantId, merchantId),
            eq(ephemeralWallets.status, 'active')
          )),
        db.select({ count: count() }).from(gatewaySessions)
          .where(and(
            eq(gatewaySessions.merchantId, merchantId),
            eq(gatewaySessions.sessionType, 'withdraw'),
            eq(gatewaySessions.status, 'pending')
          ))
      ]);

      return c.json({
        totalSessions: totalSessionsResult[0]?.count || 0,
        totalVolume: totalVolumeResult[0]?.total || '0',
        activeWallets: activeWalletsResult[0]?.count || 0,
        pendingWithdrawals: pendingWithdrawalsResult[0]?.count || 0
      });
    } else {
      return c.json({ error: 'Merchant ID not found' }, 400);
    }
  } catch (error) {
    console.error('Failed to get admin stats:', error);
    return c.json({ error: 'Failed to get admin stats' }, 500);
  }
});

// GET /api/admin/sessions - Gateway sessions list with pagination
adminRoutes.get('/api/admin/sessions', async (c) => {
  try {
    const adminRole = c.get('adminRole');
    const userMerchantId = c.get('merchantId') as string | null;
    
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = parseInt(c.req.query('limit') || '50', 10);
    const status = c.req.query('status');
    const search = c.req.query('search');
    const merchantIdParam = c.req.query('merchantId');
    const offset = (page - 1) * limit;

    // Build where conditions
    let whereConditions = [];

    // Role-based filtering
    if (adminRole === 'merchant' && userMerchantId) {
      // Merchant role: always filter by their merchantId
      whereConditions.push(eq(gatewaySessions.merchantId, userMerchantId));
    } else if (merchantIdParam) {
      // Master role: optionally filter by merchantId param
      whereConditions.push(eq(gatewaySessions.merchantId, merchantIdParam));
    }

    // Status filter
    if (status) {
      whereConditions.push(eq(gatewaySessions.status, status));
    }

    // Search filter
    if (search) {
      whereConditions.push(
        or(
          like(gatewaySessions.playerRef, `%${search}%`),
          like(gatewaySessions.ephemeralWallet, `%${search}%`),
          like(gatewaySessions.txHash, `%${search}%`)
        )
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get sessions with merchant info
    const sessionsQuery = db.select({
      id: gatewaySessions.id,
      merchantId: gatewaySessions.merchantId,
      merchantName: merchants.name,
      sessionType: gatewaySessions.sessionType,
      playerRef: gatewaySessions.playerRef,
      amount: gatewaySessions.amount,
      token: gatewaySessions.token,
      chain: gatewaySessions.chain,
      status: gatewaySessions.status,
      ephemeralWallet: gatewaySessions.ephemeralWallet,
      txHash: gatewaySessions.txHash,
      createdAt: gatewaySessions.createdAt,
      expiresAt: gatewaySessions.expiresAt
    })
    .from(gatewaySessions)
    .innerJoin(merchants, eq(gatewaySessions.merchantId, merchants.id))
    .orderBy(desc(gatewaySessions.createdAt))
    .limit(limit)
    .offset(offset);

    if (whereClause) {
      sessionsQuery.where(whereClause);
    }

    const sessions = await sessionsQuery;

    // Get total count
    const totalQuery = db.select({ count: count() }).from(gatewaySessions);
    if (whereClause) {
      totalQuery.where(whereClause);
    }
    const totalResult = await totalQuery;
    const total = totalResult[0]?.count || 0;

    return c.json({ sessions, page, limit, total });
  } catch (error) {
    console.error('Failed to get sessions:', error);
    return c.json({ error: 'Failed to get sessions' }, 500);
  }
});

// GET /api/admin/wallets - Ephemeral wallets list
adminRoutes.get('/api/admin/wallets', async (c) => {
  try {
    const adminRole = c.get('adminRole');
    const userMerchantId = c.get('merchantId') as string | null;
    
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = parseInt(c.req.query('limit') || '50', 10);
    const status = c.req.query('status');
    const chain = c.req.query('chain');
    const offset = (page - 1) * limit;

    // Build where conditions
    let whereConditions = [];

    // Status filter
    if (status) {
      whereConditions.push(eq(ephemeralWallets.status, status));
    }

    // Chain filter
    if (chain) {
      whereConditions.push(eq(ephemeralWallets.chain, chain));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    if (adminRole === 'merchant' && userMerchantId) {
      // Merchant role: join with gatewaySessions to filter by merchantId
      const walletsQuery = db.select({
        id: ephemeralWallets.id,
        address: ephemeralWallets.address,
        chain: ephemeralWallets.chain,
        token: ephemeralWallets.token,
        amount: ephemeralWallets.amount,
        flow: ephemeralWallets.flow,
        status: ephemeralWallets.status,
        txHash: ephemeralWallets.txHash,
        createdAt: ephemeralWallets.createdAt,
        expiresAt: ephemeralWallets.expiresAt
      })
      .from(ephemeralWallets)
      .innerJoin(gatewaySessions, eq(ephemeralWallets.address, gatewaySessions.ephemeralWallet))
      .where(and(
        eq(gatewaySessions.merchantId, userMerchantId),
        ...(whereClause ? [whereClause] : [])
      ))
      .orderBy(desc(ephemeralWallets.createdAt))
      .limit(limit)
      .offset(offset);

      const wallets = await walletsQuery;

      // Get total count for merchant
      const totalResult = await db.select({ count: count() })
        .from(ephemeralWallets)
        .innerJoin(gatewaySessions, eq(ephemeralWallets.address, gatewaySessions.ephemeralWallet))
        .where(and(
          eq(gatewaySessions.merchantId, userMerchantId),
          ...(whereClause ? [whereClause] : [])
        ));

      const total = totalResult[0]?.count || 0;
      return c.json({ wallets, page, limit, total });
    } else {
      // Master role: show all wallets
      const walletsQuery = db.select().from(ephemeralWallets)
        .orderBy(desc(ephemeralWallets.createdAt))
        .limit(limit)
        .offset(offset);

      if (whereClause) {
        walletsQuery.where(whereClause);
      }

      const wallets = await walletsQuery;

      // Get total count
      const totalQuery = db.select({ count: count() }).from(ephemeralWallets);
      if (whereClause) {
        totalQuery.where(whereClause);
      }
      const totalResult = await totalQuery;
      const total = totalResult[0]?.count || 0;

      return c.json({ wallets, page, limit, total });
    }
  } catch (error) {
    console.error('Failed to get wallets:', error);
    return c.json({ error: 'Failed to get wallets' }, 500);
  }
});

// GET /api/admin/volume - Volume analytics
adminRoutes.get('/api/admin/volume', async (c) => {
  try {
    const adminRole = c.get('adminRole');
    const userMerchantId = c.get('merchantId') as string | null;
    
    const from = c.req.query('from');
    const to = c.req.query('to');
    const groupBy = c.req.query('groupBy') || 'day';

    // Build date filters
    let dateConditions = [
      eq(gatewaySessions.status, 'completed'),
      eq(gatewaySessions.sessionType, 'deposit')
    ];

    if (from) {
      dateConditions.push(gte(gatewaySessions.createdAt, new Date(from)));
    }
    if (to) {
      dateConditions.push(lte(gatewaySessions.createdAt, new Date(to)));
    }

    // Role-based filtering
    if (adminRole === 'merchant' && userMerchantId) {
      dateConditions.push(eq(gatewaySessions.merchantId, userMerchantId));
    }

    const whereClause = and(...dateConditions);

    // Get summary stats
    const summaryResult = await db.select({
      totalVolume: sum(gatewaySessions.amount),
      totalSessions: count()
    }).from(gatewaySessions).where(whereClause);

    const summary = {
      totalVolume: summaryResult[0]?.totalVolume || '0',
      totalSessions: summaryResult[0]?.totalSessions || 0
    };

    // Get time series data
    let dateFormat;
    switch (groupBy) {
      case 'week':
        dateFormat = sql`DATE_TRUNC('week', ${gatewaySessions.createdAt})`;
        break;
      case 'month':
        dateFormat = sql`DATE_TRUNC('month', ${gatewaySessions.createdAt})`;
        break;
      default:
        dateFormat = sql`DATE_TRUNC('day', ${gatewaySessions.createdAt})`;
    }

    const timeSeriesResult = await db.select({
      date: dateFormat,
      volume: sum(gatewaySessions.amount),
      sessions: count()
    })
    .from(gatewaySessions)
    .where(whereClause)
    .groupBy(dateFormat)
    .orderBy(dateFormat);

    const timeSeries = timeSeriesResult.map(row => ({
      date: row.date,
      volume: row.volume || '0',
      sessions: row.sessions || 0
    }));

    let merchantsData: Array<{merchantId: string; merchantName: string; volume: string; sessions: number}> = [];
    if (adminRole === 'master') {
      // Get per-merchant breakdown for master role
      const merchantsResult = await db.select({
        merchantId: gatewaySessions.merchantId,
        merchantName: merchants.name,
        volume: sum(gatewaySessions.amount),
        sessions: count()
      })
      .from(gatewaySessions)
      .innerJoin(merchants, eq(gatewaySessions.merchantId, merchants.id))
      .where(whereClause)
      .groupBy(gatewaySessions.merchantId, merchants.name)
      .orderBy(desc(sum(gatewaySessions.amount)));

      merchantsData = merchantsResult.map(row => ({
        merchantId: row.merchantId,
        merchantName: row.merchantName,
        volume: row.volume || '0',
        sessions: row.sessions || 0
      }));
    }

    return c.json({
      summary,
      timeSeries,
      ...(adminRole === 'master' ? { merchants: merchantsData } : {})
    });
  } catch (error) {
    console.error('Failed to get volume analytics:', error);
    return c.json({ error: 'Failed to get volume analytics' }, 500);
  }
});

// GET /api/admin/merchants - List merchants (master only)
adminRoutes.get('/api/admin/merchants', async (c) => {
  try {
    const adminRole = c.get('adminRole');

    if (adminRole !== 'master') {
      return c.json({ error: 'Access denied' }, 403);
    }

    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = parseInt(c.req.query('limit') || '50', 10);
    const search = c.req.query('search');
    const status = c.req.query('status');
    const offset = (page - 1) * limit;

    // Build where conditions
    let whereConditions = [];

    if (status) {
      whereConditions.push(eq(merchants.status, status));
    }

    if (search) {
      whereConditions.push(
        or(
          like(merchants.name, `%${search}%`),
          like(merchants.walletAddress, `%${search}%`)
        )
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const merchantsQuery = db.select().from(merchants)
      .orderBy(desc(merchants.createdAt))
      .limit(limit)
      .offset(offset);

    if (whereClause) {
      merchantsQuery.where(whereClause);
    }

    const merchantsList = await merchantsQuery;

    // Get total count
    const totalQuery = db.select({ count: count() }).from(merchants);
    if (whereClause) {
      totalQuery.where(whereClause);
    }
    const totalResult = await totalQuery;
    const total = totalResult[0]?.count || 0;

    return c.json({ merchants: merchantsList, page, limit, total });
  } catch (error) {
    console.error('Failed to get merchants:', error);
    return c.json({ error: 'Failed to get merchants' }, 500);
  }
});

// GET /api/admin/api-keys - List API keys with scoping
adminRoutes.get('/api/admin/api-keys', async (c) => {
  try {
    const adminRole = c.get('adminRole');
    const userMerchantId = c.get('merchantId') as string | null;
    
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = parseInt(c.req.query('limit') || '50', 10);
    const offset = (page - 1) * limit;

    let whereConditions = [];

    if (adminRole === 'merchant' && userMerchantId) {
      // Merchant role: only show their API keys
      const merchantResult = await db.select({ walletAddress: merchants.walletAddress })
        .from(merchants)
        .where(eq(merchants.id, userMerchantId))
        .limit(1);

      if (merchantResult.length === 0) {
        return c.json({ error: 'Merchant not found' }, 404);
      }

      whereConditions.push(eq(apiKeys.walletAddress, merchantResult[0].walletAddress));
    }

    const keysQuery = db.select({
      id: apiKeys.id,
      walletAddress: apiKeys.walletAddress,
      keyPrefix: apiKeys.keyPrefix,
      name: apiKeys.name,
      createdAt: apiKeys.createdAt,
      lastUsed: apiKeys.lastUsed,
      isActive: apiKeys.isActive,
    }).from(apiKeys)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(desc(apiKeys.createdAt))
    .limit(limit)
    .offset(offset);


    const keysList = await keysQuery;

    return c.json({ apiKeys: keysList, page, limit });
  } catch (error) {
    console.error('Failed to get API keys:', error);
    return c.json({ error: 'Failed to get API keys' }, 500);
  }
});

// DELETE /api/admin/api-keys/:id - Revoke API key with role check
adminRoutes.delete('/api/admin/api-keys/:id', async (c) => {
  const keyId = c.req.param('id');
  const adminRole = c.get('adminRole');
  const userMerchantId = c.get('merchantId') as string | null;

  if (!keyId) {
    return c.json({ error: 'API key ID parameter is required' }, 400);
  }

  try {
    // Get the API key first to check ownership
    const apiKeyResult = await db.select().from(apiKeys).where(eq(apiKeys.id, keyId)).limit(1);

    if (apiKeyResult.length === 0) {
      return c.json({ error: 'API key not found' }, 404);
    }

    const apiKeyRow = apiKeyResult[0];

    // Role-based access control
    if (adminRole === 'merchant' && userMerchantId) {
      // Merchant can only revoke their own API keys
      const merchantResult = await db.select({ walletAddress: merchants.walletAddress })
        .from(merchants)
        .where(eq(merchants.id, userMerchantId))
        .limit(1);

      if (merchantResult.length === 0 || merchantResult[0].walletAddress !== apiKeyRow.walletAddress) {
        return c.json({ error: 'Access denied' }, 403);
      }
    }

    // Revoke the API key
    const result = await db.update(apiKeys)
      .set({ isActive: false })
      .where(eq(apiKeys.id, keyId))
      .returning();

    if (result.length === 0) {
      return c.json({ error: 'Failed to revoke API key' }, 500);
    }

    return c.json({ message: 'API key revoked successfully' });
  } catch (error) {
    console.error('Failed to revoke API key:', error);
    return c.json({ error: 'Failed to revoke API key' }, 500);
  }
});

export default adminRoutes;