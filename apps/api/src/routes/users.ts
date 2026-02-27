import { Hono } from 'hono';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const userRoutes = new Hono();

// POST /api/users/connect - Upsert user on wallet connect
userRoutes.post('/api/users/connect', async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress } = body;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return c.json({ error: 'Valid wallet address is required' }, 400);
    }

    // Upsert user - create if not exists, update last_seen if exists
    const result = await db.insert(users).values({
      walletAddress,
    }).onConflictDoUpdate({
      target: users.walletAddress,
      set: {
        lastSeen: new Date(),
      },
    }).returning();

    return c.json({ user: result[0] });
  } catch (error) {
    console.error('Failed to connect user:', error);
    return c.json({ error: 'Failed to connect user' }, 500);
  }
});

// GET /api/users/:walletAddress - Get user profile
userRoutes.get('/api/users/:walletAddress', async (c) => {
  const walletAddress = c.req.param('walletAddress');

  if (!walletAddress) {
    return c.json({ error: 'Wallet address parameter is required' }, 400);
  }

  try {
    const user = await db.select().from(users).where(eq(users.walletAddress, walletAddress)).limit(1);

    if (user.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user: user[0] });
  } catch (error) {
    console.error('Failed to get user:', error);
    return c.json({ error: 'Failed to get user' }, 500);
  }
});

export default userRoutes;