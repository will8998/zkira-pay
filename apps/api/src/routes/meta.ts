import { Hono } from 'hono';
import { db } from '../db/index.js';
import { metaAddressesCache } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const meta = new Hono();

// POST /api/meta - register meta-address
meta.post('/api/meta', async (c) => {
  try {
    const body = await c.req.json();
    const { owner, spendPubkey, viewPubkey, label } = body;

    if (!owner || !spendPubkey || !viewPubkey) {
      return c.json({ error: 'Missing required fields: owner, spendPubkey, viewPubkey' }, 400);
    }

    // Upsert meta-address into database
    await db.insert(metaAddressesCache).values({
      owner,
      spendPubkey,
      viewPubkey,
      label: label || null,
      bump: null, // off-chain registrations don't have PDA bump
      createdAt: Math.floor(Date.now() / 1000),
    }).onConflictDoUpdate({
      target: metaAddressesCache.owner,
      set: {
        spendPubkey,
        viewPubkey,
        label: label || null,
        updatedAt: new Date(),
      },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error registering meta-address:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/meta/:owner - get meta-address for owner wallet (base58)
meta.get('/api/meta/:owner', async (c) => {
  try {
    const owner = c.req.param('owner');
    if (!owner) {
      return c.json({ error: 'Owner parameter is required' }, 400);
    }

    const metaAddress = await db.select().from(metaAddressesCache).where(eq(metaAddressesCache.owner, owner)).limit(1);

    if (metaAddress.length === 0) {
      return c.json({ error: 'Meta-address not found' }, 404);
    }

    return c.json({ metaAddress: metaAddress[0] });
  } catch (error) {
    console.error('Error fetching meta-address:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default meta;