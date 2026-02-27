import type { Context, Next } from 'hono';
import { sha256 } from '@noble/hashes/sha256';
import { db } from '../db/index.js';
import { apiKeys } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
/**
 * API Key authentication middleware
 * Validates X-API-Key header against API keys stored in database
 */
export async function apiKeyAuth(c: Context, next: Next) {
  // Get API key from header
  const apiKey = c.req.header('X-API-Key');
  
  if (!apiKey) {
    return c.json({ error: 'API key is required' }, 401);
  }

  try {
    // Hash the provided API key
    const keyHash = Array.from(sha256(apiKey), byte => byte.toString(16).padStart(2, '0')).join('');
    
    // Look up the API key in the database
    const result = await db.select().from(apiKeys).where(
      and(
        eq(apiKeys.keyHash, keyHash),
        eq(apiKeys.isActive, true)
      )
    ).limit(1);
    
    if (result.length === 0) {
      return c.json({ error: 'Invalid API key' }, 401);
    }
    
    // Update last used timestamp
    await db.update(apiKeys)
      .set({ lastUsed: new Date() })
      .where(eq(apiKeys.id, result[0].id))
      .catch(console.warn); // Don't fail auth if timestamp update fails
    
    // API key is valid, continue to next middleware/handler
    await next();
  } catch (error) {
    console.error('API key validation error:', error);
    return c.json({ error: 'Authentication failed' }, 500);
  }
}

/**
 * Create middleware that only applies to specific path patterns
 */
export function createPathBasedAuth(pathPattern: string) {
  return async (c: Context, next: Next) => {
    const path = c.req.path;
    
    // Check if current path matches the pattern
    if (path.startsWith(pathPattern)) {
      await apiKeyAuth(c, next);
    } else {
      await next();
    }
  };
}