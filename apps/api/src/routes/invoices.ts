import { Hono } from 'hono';
import { db } from '../db/index.js';
import { invoices } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { awardPoints } from '../services/points.js';

const invoiceRoutes = new Hono();

// GET /api/invoices/:walletAddress - List invoices for wallet
invoiceRoutes.get('/api/invoices/:walletAddress', async (c) => {
  const walletAddress = c.req.param('walletAddress');

  if (!walletAddress) {
    return c.json({ error: 'Wallet address parameter is required' }, 400);
  }

  try {
    const userInvoices = await db.select().from(invoices).where(eq(invoices.creatorWallet, walletAddress));
    return c.json({ invoices: userInvoices });
  } catch (error) {
    console.error('Failed to get invoices:', error);
    return c.json({ error: 'Failed to get invoices' }, 500);
  }
});

// POST /api/invoices - Create invoice
invoiceRoutes.post('/api/invoices', async (c) => {
  try {
    const body = await c.req.json();
    const { creatorWallet, invoiceId, amount, tokenMint, metaAddress, expiresAt } = body;

    if (!creatorWallet || typeof creatorWallet !== 'string') {
      return c.json({ error: 'Valid creator wallet is required' }, 400);
    }

    if (!invoiceId || typeof invoiceId !== 'string') {
      return c.json({ error: 'Valid invoice ID is required' }, 400);
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return c.json({ error: 'Valid amount is required' }, 400);
    }

    if (!tokenMint || typeof tokenMint !== 'string') {
      return c.json({ error: 'Valid token mint is required' }, 400);
    }

    const result = await db.insert(invoices).values({
      invoiceId,
      creatorWallet,
      amount: amount.toString(),
      tokenMint,
      metaAddress,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    }).returning();

    // Award INVOICE_CREATED points (fire-and-forget)
    if (creatorWallet && amount >= 1) {
      awardPoints({
        walletAddress: creatorWallet,
        eventType: 'INVOICE_CREATED',
        basePoints: 2, // invoice_create_bonus default
        metadata: { invoiceId, amount },
        referenceId: `invoice_created_${invoiceId}`,
      }).catch(err => console.warn('Failed to award INVOICE_CREATED points:', err));
    }

    return c.json({ invoice: result[0] });
  } catch (error) {
    console.error('Failed to create invoice:', error);
    return c.json({ error: 'Failed to create invoice' }, 500);
  }
});

// PATCH /api/invoices/:invoiceId/status - Update invoice status
invoiceRoutes.patch('/api/invoices/:invoiceId/status', async (c) => {
  const invoiceId = c.req.param('invoiceId');

  if (!invoiceId) {
    return c.json({ error: 'Invoice ID parameter is required' }, 400);
  }

  try {
    const body = await c.req.json();
    const { status, txSignature } = body;

    if (!status || typeof status !== 'string') {
      return c.json({ error: 'Valid status is required' }, 400);
    }

    const updateData: any = { status };
    
    if (status === 'paid') {
      updateData.paidAt = new Date();
    }

    if (txSignature) {
      updateData.txSignature = txSignature;
    }

    const result = await db.update(invoices)
      .set(updateData)
      .where(eq(invoices.invoiceId, invoiceId))
      .returning();

    if (result.length === 0) {
      return c.json({ error: 'Invoice not found' }, 404);
    }

    return c.json({ invoice: result[0] });
  } catch (error) {
    console.error('Failed to update invoice status:', error);
    return c.json({ error: 'Failed to update invoice status' }, 500);
  }
});

export default invoiceRoutes;