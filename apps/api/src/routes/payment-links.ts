import { Hono } from 'hono';
import { db } from '../db/index.js';
import { encryptedPaymentLinks } from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';

const paymentLinkRoutes = new Hono();

// POST /api/payment-links - Store one encrypted payment link
paymentLinkRoutes.post('/api/payment-links', async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress, escrowAddress, encryptedData, iv, version } = body;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return c.json({ error: 'Valid wallet address is required' }, 400);
    }

    if (!escrowAddress || typeof escrowAddress !== 'string') {
      return c.json({ error: 'Valid escrow address is required' }, 400);
    }

    if (!encryptedData || typeof encryptedData !== 'string') {
      return c.json({ error: 'Valid encrypted data is required' }, 400);
    }

    if (!iv || typeof iv !== 'string') {
      return c.json({ error: 'Valid IV is required' }, 400);
    }

    // Check if record exists
    const existing = await db
      .select()
      .from(encryptedPaymentLinks)
      .where(
        and(
          eq(encryptedPaymentLinks.walletAddress, walletAddress),
          eq(encryptedPaymentLinks.escrowAddress, escrowAddress)
        )
      );

    let result;
    if (existing.length > 0) {
      // Update existing record
      result = await db
        .update(encryptedPaymentLinks)
        .set({
          encryptedData,
          iv,
          version: version || 1,
        })
        .where(
          and(
            eq(encryptedPaymentLinks.walletAddress, walletAddress),
            eq(encryptedPaymentLinks.escrowAddress, escrowAddress)
          )
        )
        .returning();
    } else {
      // Insert new record
      result = await db
        .insert(encryptedPaymentLinks)
        .values({
          walletAddress,
          escrowAddress,
          encryptedData,
          iv,
          version: version || 1,
        })
        .returning();
    }

    return c.json({ paymentLink: result[0] });
  } catch (error) {
    console.error('Failed to store payment link:', error);
    return c.json({ error: 'Failed to store payment link' }, 500);
  }
});

// GET /api/payment-links/:walletAddress - List all encrypted blobs for a wallet
paymentLinkRoutes.get('/api/payment-links/:walletAddress', async (c) => {
  const walletAddress = c.req.param('walletAddress');

  if (!walletAddress) {
    return c.json({ error: 'Wallet address parameter is required' }, 400);
  }

  try {
    const paymentLinks = await db
      .select()
      .from(encryptedPaymentLinks)
      .where(eq(encryptedPaymentLinks.walletAddress, walletAddress))
      .orderBy(desc(encryptedPaymentLinks.createdAt));
    return c.json({ paymentLinks });
  } catch (error) {
    console.error('Failed to get payment links:', error);
    return c.json({ error: 'Failed to get payment links' }, 500);
  }
});

// DELETE /api/payment-links/:id - Delete one encrypted link
paymentLinkRoutes.delete('/api/payment-links/:id', async (c) => {
  const id = c.req.param('id');

  if (!id) {
    return c.json({ error: 'Payment link ID parameter is required' }, 400);
  }

  try {
    const result = await db
      .delete(encryptedPaymentLinks)
      .where(eq(encryptedPaymentLinks.id, id))
      .returning();

    if (result.length === 0) {
      return c.json({ error: 'Payment link not found' }, 404);
    }

    return c.json({ message: 'Payment link deleted successfully' });
  } catch (error) {
    console.error('Failed to delete payment link:', error);
    return c.json({ error: 'Failed to delete payment link' }, 500);
  }
});

// POST /api/payment-links/batch - Bulk store for migration
paymentLinkRoutes.post('/api/payment-links/batch', async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress, links } = body;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return c.json({ error: 'Valid wallet address is required' }, 400);
    }

    if (!Array.isArray(links)) {
      return c.json({ error: 'Links must be an array' }, 400);
    }

    let insertedCount = 0;

    for (const link of links) {
      const { escrowAddress, encryptedData, iv, version } = link;

      if (!escrowAddress || typeof escrowAddress !== 'string') {
        continue;
      }

      if (!encryptedData || typeof encryptedData !== 'string') {
        continue;
      }

      if (!iv || typeof iv !== 'string') {
        continue;
      }

      try {
        const result = await db
          .insert(encryptedPaymentLinks)
          .values({
            walletAddress,
            escrowAddress,
            encryptedData,
            iv,
            version: version || 1,
          })
          .onConflictDoNothing()
          .returning();

        if (result.length > 0) {
          insertedCount++;
        }
      } catch (error) {
        console.error('Failed to insert payment link in batch:', error);
        // Continue with next link
      }
    }

    return c.json({ count: insertedCount });
  } catch (error) {
    console.error('Failed to batch store payment links:', error);
    return c.json({ error: 'Failed to batch store payment links' }, 500);
  }
});

export default paymentLinkRoutes;
