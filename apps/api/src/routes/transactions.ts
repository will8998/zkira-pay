import { Hono } from 'hono';
import { db } from '../db/index.js';
import { transactions } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

const transactionRoutes = new Hono();

// GET /api/transactions/:walletAddress - List transactions for wallet with optional type filter
transactionRoutes.get('/api/transactions/:walletAddress', async (c) => {
  const walletAddress = c.req.param('walletAddress');
  const type = c.req.query('type'); // Optional filter by transaction type

  if (!walletAddress) {
    return c.json({ error: 'Wallet address parameter is required' }, 400);
  }

  try {
    let userTransactions;
    
    // Apply type filter if provided
    if (type) {
      userTransactions = await db.select().from(transactions)
        .where(
          and(
            eq(transactions.walletAddress, walletAddress),
            eq(transactions.type, type)
          )
        );
    } else {
      userTransactions = await db.select().from(transactions)
        .where(eq(transactions.walletAddress, walletAddress));
    }
    return c.json({ transactions: userTransactions });
  } catch (error) {
    console.error('Failed to get transactions:', error);
    return c.json({ error: 'Failed to get transactions' }, 500);
  }
});

// POST /api/transactions - Record transaction
transactionRoutes.post('/api/transactions', async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress, type, amount, tokenMint, txSignature, escrowAddress, status, metadata } = body;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return c.json({ error: 'Valid wallet address is required' }, 400);
    }

    if (!type || typeof type !== 'string') {
      return c.json({ error: 'Valid transaction type is required' }, 400);
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return c.json({ error: 'Valid amount is required' }, 400);
    }

    if (!tokenMint || typeof tokenMint !== 'string') {
      return c.json({ error: 'Valid token mint is required' }, 400);
    }

    const result = await db.insert(transactions).values({
      walletAddress,
      type,
      amount: amount.toString(),
      tokenMint,
      txSignature,
      escrowAddress,
      status: status || 'completed',
      metadata: metadata || null,
    }).returning();

    return c.json({ transaction: result[0] });
  } catch (error) {
    console.error('Failed to record transaction:', error);
    return c.json({ error: 'Failed to record transaction' }, 500);
  }
});

export default transactionRoutes;