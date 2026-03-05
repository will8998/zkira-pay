import { Hono } from 'hono';
import { timingSafeEqual } from 'node:crypto';
import { db } from '../db/index.js';
import { ephemeralWallets } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { encryptPrivateKey, decryptPrivateKey } from '../services/crypto.js';
import { loadConfig } from '../config.js';
import { verifyAdminToken } from '../middleware/jwt-auth.js';

const ephemeralWalletRoutes = new Hono();

// Admin auth middleware — supports JWT Bearer + legacy password header
const adminAuth = async (c: any, next: any) => {
  const config = loadConfig();

  // Try JWT Bearer first
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const payload = await verifyAdminToken(authHeader.slice(7), config.jwtSecret);
    if (payload) {
      await next();
      return;
    }
  }

  // Fallback: legacy X-Admin-Password
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

// POST /api/ephemeral-wallets — Save an ephemeral wallet (public, called from frontend)
ephemeralWalletRoutes.post('/api/ephemeral-wallets', async (c) => {
  try {
    const body = await c.req.json();
    const { address, privateKey, chain, token, amount, flow } = body;

    if (!address || !privateKey) {
      return c.json({ error: 'address and privateKey are required' }, 400);
    }

    // Encrypt the private key before storing
    const { encrypted, iv, authTag, salt } = encryptPrivateKey(privateKey);

    const [wallet] = await db.insert(ephemeralWallets).values({
      address: address.toLowerCase(),
      encryptedKey: encrypted,
      iv,
      authTag,
      salt,
      chain: chain || null,
      token: token || null,
      amount: amount || null,
      flow: flow || null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 day TTL
    }).returning({ id: ephemeralWallets.id });

    return c.json({ success: true, id: wallet.id });
  } catch (error) {
    console.error('Failed to save ephemeral wallet:', error);
    return c.json({ error: 'Failed to save wallet' }, 500);
  }
});

// GET /api/admin/ephemeral-wallets — List all ephemeral wallets (admin only)
ephemeralWalletRoutes.get('/api/admin/ephemeral-wallets', adminAuth, async (c) => {
  try {
    const status = c.req.query('status');
    const limit = parseInt(c.req.query('limit') || '50', 10);

    let query = db.select({
      id: ephemeralWallets.id,
      address: ephemeralWallets.address,
      chain: ephemeralWallets.chain,
      token: ephemeralWallets.token,
      amount: ephemeralWallets.amount,
      flow: ephemeralWallets.flow,
      status: ephemeralWallets.status,
      txHash: ephemeralWallets.txHash,
      createdAt: ephemeralWallets.createdAt,
      expiresAt: ephemeralWallets.expiresAt,
    }).from(ephemeralWallets).orderBy(desc(ephemeralWallets.createdAt)).limit(limit);

    if (status) {
      query = query.where(eq(ephemeralWallets.status, status)) as typeof query;
    }

    const wallets = await query;
    return c.json({ wallets });
  } catch (error) {
    console.error('Failed to list ephemeral wallets:', error);
    return c.json({ error: 'Failed to list wallets' }, 500);
  }
});

// POST /api/admin/ephemeral-wallets/:id/recover — Decrypt and return private key (admin only)
ephemeralWalletRoutes.post('/api/admin/ephemeral-wallets/:id/recover', adminAuth, async (c) => {
  try {
    const id = c.req.param('id');

    const [wallet] = await db.select().from(ephemeralWallets).where(eq(ephemeralWallets.id, id)).limit(1);
    if (!wallet) {
      return c.json({ error: 'Wallet not found' }, 404);
    }

    const privateKey = decryptPrivateKey(wallet.encryptedKey, wallet.iv, wallet.authTag, wallet.salt);

    return c.json({
      address: wallet.address,
      privateKey,
      chain: wallet.chain,
      token: wallet.token,
      amount: wallet.amount,
      status: wallet.status,
      createdAt: wallet.createdAt,
    });
  } catch (error) {
    console.error('Failed to recover ephemeral wallet:', error);
    return c.json({ error: 'Failed to recover wallet' }, 500);
  }
});

// PATCH /api/admin/ephemeral-wallets/:id/status — Update status (admin only, e.g., mark as swept)
ephemeralWalletRoutes.patch('/api/admin/ephemeral-wallets/:id/status', adminAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { status, txHash } = body;

    if (!status || !['active', 'swept', 'expired', 'empty'].includes(status)) {
      return c.json({ error: 'Valid status is required (active|swept|expired|empty)' }, 400);
    }

    await db.update(ephemeralWallets)
      .set({ status, txHash: txHash || null, updatedAt: new Date() })
      .where(eq(ephemeralWallets.id, id));

    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to update ephemeral wallet status:', error);
    return c.json({ error: 'Failed to update status' }, 500);
  }
});

export default ephemeralWalletRoutes;
