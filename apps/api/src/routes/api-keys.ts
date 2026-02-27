import { Hono } from 'hono';
import { sha256 } from '@noble/hashes/sha256';
import { db } from '../db/index.js';
import { apiKeys } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const apiKeyRoutes = new Hono();

// Helper to generate random API key
function generateApiKey(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const key = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return `zkira_sk_${key}`;
}

// Helper to hash API key
function hashApiKey(key: string): string {
  return Array.from(sha256(key), byte => byte.toString(16).padStart(2, '0')).join('');
}

// Helper to create key prefix (first 10 + last 4 chars)
function createKeyPrefix(key: string): string {
  if (key.length < 14) return key;
  return `${key.substring(0, 10)}...${key.substring(key.length - 4)}`;
}

// GET /api/keys/:walletAddress - List API keys for wallet
apiKeyRoutes.get('/api/keys/:walletAddress', async (c) => {
  const walletAddress = c.req.param('walletAddress');

  if (!walletAddress) {
    return c.json({ error: 'Wallet address parameter is required' }, 400);
  }

  try {
    const keys = await db.select({
      id: apiKeys.id,
      keyPrefix: apiKeys.keyPrefix,
      name: apiKeys.name,
      createdAt: apiKeys.createdAt,
      lastUsed: apiKeys.lastUsed,
      isActive: apiKeys.isActive,
    }).from(apiKeys).where(eq(apiKeys.walletAddress, walletAddress));

    return c.json({ apiKeys: keys });
  } catch (error) {
    console.error('Failed to get API keys:', error);
    return c.json({ error: 'Failed to get API keys' }, 500);
  }
});

// POST /api/keys - Generate new API key
apiKeyRoutes.post('/api/keys', async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress, name } = body;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return c.json({ error: 'Valid wallet address is required' }, 400);
    }

    // Generate new API key
    const apiKey = generateApiKey();
    const keyHash = hashApiKey(apiKey);
    const keyPrefix = createKeyPrefix(apiKey);

    const result = await db.insert(apiKeys).values({
      walletAddress,
      keyHash,
      keyPrefix,
      name: name || 'Default',
    }).returning();

    // Return the full key only once (for the user to copy)
    return c.json({ 
      apiKey: apiKey, // Full key returned only on creation
      keyData: {
        id: result[0].id,
        keyPrefix: result[0].keyPrefix,
        name: result[0].name,
        createdAt: result[0].createdAt,
        isActive: result[0].isActive,
      }
    });
  } catch (error) {
    console.error('Failed to generate API key:', error);
    return c.json({ error: 'Failed to generate API key' }, 500);
  }
});

// DELETE /api/keys/:id - Deactivate API key
apiKeyRoutes.delete('/api/keys/:id', async (c) => {
  const keyId = c.req.param('id');

  if (!keyId) {
    return c.json({ error: 'API key ID parameter is required' }, 400);
  }

  try {
    const result = await db.update(apiKeys)
      .set({ isActive: false })
      .where(eq(apiKeys.id, keyId))
      .returning();

    if (result.length === 0) {
      return c.json({ error: 'API key not found' }, 404);
    }

    return c.json({ message: 'API key deactivated successfully' });
  } catch (error) {
    console.error('Failed to deactivate API key:', error);
    return c.json({ error: 'Failed to deactivate API key' }, 500);
  }
});

export default apiKeyRoutes;