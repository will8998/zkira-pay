import type { Context, Next } from 'hono';
import { sha256 } from '@noble/hashes/sha256';
import { db } from '../db/index.js';
import { apiKeys, merchants } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

/**
 * Merchant API Key authentication middleware
 * Validates X-API-Key header and resolves the merchant from the database
 */
export async function merchantApiKeyAuth(c: Context, next: Next) {
  // Get API key from header
  const apiKey = c.req.header('X-API-Key');

  if (!apiKey) {
    return c.json({ error: 'API key is required' }, 401);
  }

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

    if (apiKeyResult.length === 0) {
      return c.json({ error: 'Invalid API key' }, 401);
    }

    const apiKeyRow = apiKeyResult[0];

    // Update last used timestamp (fire-and-forget)
    await db.update(apiKeys)
      .set({ lastUsed: new Date() })
      .where(eq(apiKeys.id, apiKeyRow.id))
      .catch(console.warn);

    // Look up the merchant by wallet address
    const merchantResult = await db.select().from(merchants).where(
      and(
        eq(merchants.walletAddress, apiKeyRow.walletAddress),
        eq(merchants.status, 'active')
      )
    ).limit(1);

    if (merchantResult.length === 0) {
      return c.json({ error: 'No active merchant found for this API key' }, 403);
    }

    const merchantRow = merchantResult[0];

    // Set merchant context for downstream handlers
    c.set('merchant', merchantRow);
    c.set('merchantId', merchantRow.id);

    // Continue to next middleware/handler
    await next();
  } catch (error) {
    console.error('Merchant API key validation error:', error);
    return c.json({ error: 'Authentication failed' }, 500);
  }
}

/**
 * Create middleware that only applies merchant auth to specific path patterns
 */
export function createMerchantPathAuth(pathPattern: string) {
  return async (c: Context, next: Next) => {
    const path = c.req.path;

    // Check if current path matches the pattern
    if (path.startsWith(pathPattern)) {
      await merchantApiKeyAuth(c, next);
    } else {
      await next();
    }
  };
}
