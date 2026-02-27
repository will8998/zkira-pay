import { Hono } from 'hono';
import { timingSafeEqual } from 'node:crypto';
import { db } from '../db/index.js';
import { pointsConfig, referralCodes } from '../db/schema.js';
import { eq, sql, count } from 'drizzle-orm';
import { loadConfig } from '../config.js';
import {
  getOrCreateReferralCode,
  applyReferralCode,
  getReferralStats,
  getReferralByReferee,
  getReferralNetworkStats,
} from '../services/referrals.js';

const referralRoutes = new Hono();

// Admin auth middleware
const adminAuth = async (c: any, next: any) => {
  const adminPassword = c.req.header('X-Admin-Password');
  const config = loadConfig();

  if (!adminPassword) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

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
// PUBLIC REFERRAL ENDPOINTS
// ═══════════════════════════════════════════════════════════

// GET /api/referral/:wallet - Get user's referral code + stats (creates code if doesn't exist)
referralRoutes.get('/api/referral/:wallet', async (c) => {
  const walletAddress = c.req.param('wallet');

  if (!walletAddress) {
    return c.json({ error: 'Wallet address parameter is required' }, 400);
  }

  try {
    // Get or create referral code
    const code = await getOrCreateReferralCode(walletAddress);
    
    // Get referral stats
    const stats = await getReferralStats(walletAddress);

    return c.json({
      code,
      stats,
    });
  } catch (error) {
    console.error('Failed to get referral data:', error);
    return c.json({ error: 'Failed to get referral data' }, 500);
  }
});

// POST /api/referral/apply - Apply referral code
referralRoutes.post('/api/referral/apply', async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress, code } = body;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return c.json({ error: 'Valid wallet address is required' }, 400);
    }

    if (!code || typeof code !== 'string') {
      return c.json({ error: 'Valid referral code is required' }, 400);
    }

    // Apply the referral code
    const result = await applyReferralCode(walletAddress, code);

    if (!result) {
      return c.json({ 
        error: 'Failed to apply referral code. Code may not exist, you may already have a referrer, or you cannot refer yourself.' 
      }, 400);
    }

    return c.json({
      success: true,
      referrerWallet: result.referrerWallet,
      message: 'Referral code applied successfully',
    });
  } catch (error) {
    console.error('Failed to apply referral code:', error);
    return c.json({ error: 'Failed to apply referral code' }, 500);
  }
});

// GET /api/referral/:wallet/referees - List referees with pagination
referralRoutes.get('/api/referral/:wallet/referees', async (c) => {
  const walletAddress = c.req.param('wallet');
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100); // Max 100 per page

  if (!walletAddress) {
    return c.json({ error: 'Wallet address parameter is required' }, 400);
  }

  if (page < 1 || limit < 1) {
    return c.json({ error: 'Page and limit must be positive integers' }, 400);
  }

  try {
    // Get full stats (includes referees list)
    const stats = await getReferralStats(walletAddress);
    
    // Apply pagination to referees
    const offset = (page - 1) * limit;
    const paginatedReferees = stats.referees.slice(offset, offset + limit);
    
    return c.json({
      referees: paginatedReferees,
      pagination: {
        page,
        limit,
        total: stats.referees.length,
        totalPages: Math.ceil(stats.referees.length / limit),
      },
    });
  } catch (error) {
    console.error('Failed to get referees:', error);
    return c.json({ error: 'Failed to get referees' }, 500);
  }
});

// GET /api/referral/:wallet/status - Check if user was referred
referralRoutes.get('/api/referral/:wallet/status', async (c) => {
  const walletAddress = c.req.param('wallet');

  if (!walletAddress) {
    return c.json({ error: 'Wallet address parameter is required' }, 400);
  }

  try {
    const referral = await getReferralByReferee(walletAddress);
    
    return c.json({
      isReferred: referral !== null,
      referral,
    });
  } catch (error) {
    console.error('Failed to get referral status:', error);
    return c.json({ error: 'Failed to get referral status' }, 500);
  }
});

// ═══════════════════════════════════════════════════════════
// ADMIN REFERRAL ENDPOINTS
// ═══════════════════════════════════════════════════════════

// Apply admin auth to all admin routes
referralRoutes.use('/api/admin/referrals/*', adminAuth);

// GET /api/admin/referrals/stats - Network overview stats
referralRoutes.get('/api/admin/referrals/stats', async (c) => {
  try {
    const stats = await getReferralNetworkStats();
    return c.json(stats);
  } catch (error) {
    console.error('Failed to get referral network stats:', error);
    return c.json({ error: 'Failed to get referral network stats' }, 500);
  }
});

// GET /api/admin/referrals/config - Get referral config
referralRoutes.get('/api/admin/referrals/config', async (c) => {
  try {
    const configKeys = [
      'referral_signup_bonus',
      'referral_welcome_bonus', 
      'referral_commission_rate',
    ];

    const configResults = await Promise.all(
      configKeys.map(async (key) => {
        const result = await db
          .select()
          .from(pointsConfig)
          .where(eq(pointsConfig.key, key))
          .limit(1);
        
        return {
          key,
          value: result.length > 0 ? result[0].value : null,
          description: result.length > 0 ? result[0].description : null,
        };
      })
    );

    const config: Record<string, any> = {};
    configResults.forEach(({ key, value, description }) => {
      config[key] = { value, description };
    });

    return c.json({ config });
  } catch (error) {
    console.error('Failed to get referral config:', error);
    return c.json({ error: 'Failed to get referral config' }, 500);
  }
});

// PUT /api/admin/referrals/config - Update referral config
referralRoutes.put('/api/admin/referrals/config', async (c) => {
  try {
    const body = await c.req.json();
    const { key, value } = body;

    if (!key || typeof key !== 'string') {
      return c.json({ error: 'Valid config key is required' }, 400);
    }

    if (value === undefined || value === null) {
      return c.json({ error: 'Config value is required' }, 400);
    }

    // Validate referral config keys
    const validKeys = [
      'referral_signup_bonus',
      'referral_welcome_bonus',
      'referral_commission_rate',
    ];

    if (!validKeys.includes(key)) {
      return c.json({ 
        error: `Invalid config key. Valid keys: ${validKeys.join(', ')}` 
      }, 400);
    }

    // Validate values based on key
    const stringValue = String(value);
    
    if (key === 'referral_commission_rate') {
      const rate = parseFloat(stringValue);
      if (isNaN(rate) || rate < 0 || rate > 1) {
        return c.json({ 
          error: 'Commission rate must be a number between 0 and 1' 
        }, 400);
      }
    } else if (key.includes('bonus')) {
      const bonus = parseFloat(stringValue);
      if (isNaN(bonus) || bonus < 0) {
        return c.json({ 
          error: 'Bonus amount must be a non-negative number' 
        }, 400);
      }
    }

    // Upsert the config value
    await db
      .insert(pointsConfig)
      .values({
        key,
        value: stringValue,
        updatedBy: 'admin', // Could be enhanced to track specific admin
      })
      .onConflictDoUpdate({
        target: pointsConfig.key,
        set: {
          value: stringValue,
          updatedAt: new Date(),
          updatedBy: 'admin',
        },
      });

    return c.json({
      success: true,
      message: `Config ${key} updated successfully`,
      key,
      value: stringValue,
    });
  } catch (error) {
    console.error('Failed to update referral config:', error);
    return c.json({ error: 'Failed to update referral config' }, 500);
  }
});

// GET /api/admin/referrals/codes - List all referral codes with pagination
referralRoutes.get('/api/admin/referrals/codes', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 200); // Max 200 per page

  if (page < 1 || limit < 1) {
    return c.json({ error: 'Page and limit must be positive integers' }, 400);
  }

  try {
    const offset = (page - 1) * limit;

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(referralCodes);

    // Get paginated codes
    const codesResult = await db
      .select({
        code: referralCodes.code,
        walletAddress: referralCodes.walletAddress,
        isCustom: referralCodes.isCustom,
        createdAt: referralCodes.createdAt,
      })
      .from(referralCodes)
      .limit(limit)
      .offset(offset);

    return c.json({
      codes: codesResult,
      pagination: {
        page,
        limit,
        total: totalResult[0]?.count || 0,
        totalPages: Math.ceil((totalResult[0]?.count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Failed to get referral codes:', error);
    return c.json({ error: 'Failed to get referral codes' }, 500);
  }
});

export default referralRoutes;