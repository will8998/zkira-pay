import { Hono } from 'hono';
import { generateMetaAddress, encodeMetaAddress, generateClaimSecret, hashClaimSecret, bytesToHex } from '@zkira/crypto';
import { AccountIndexer } from '../services/indexer.js';
import { db } from '../db/index.js';
import { payments as paymentsTable } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { awardPoints, calculatePoints } from '../services/points.js';

const payments = new Hono();

// Inject indexer instance - will be set in main app
let indexer: AccountIndexer;

export function setIndexer(indexerInstance: AccountIndexer) {
  indexer = indexerInstance;
}

// Helper to generate unique payment ID
function generatePaymentId(): string {
  return `pay_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// POST /api/payments/create - Creates a payment (generates stealth address, returns payment data)
payments.post('/api/payments/create', async (c) => {
  try {
    const body = await c.req.json();
    const { amount, tokenMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', expiryDays = 7 } = body; // Default to USDC

    // Validate tokenMint format (base58 public key)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (typeof tokenMint !== 'string' || !base58Regex.test(tokenMint)) {
      return c.json({ error: 'Invalid token mint address' }, 400);
    }

    // Validate required fields
    if (typeof amount !== 'number' || amount <= 0 || amount > 1_000_000_000) {
      return c.json({ error: 'Amount must be between 0 and 1,000,000,000' }, 400);
    }

    if (typeof expiryDays !== 'number' || expiryDays < 1 || expiryDays > 30) {
      return c.json({ error: 'Expiry must be between 1 and 30 days' }, 400);
    }

    // Generate payment ID
    const paymentId = generatePaymentId();

    // Generate crypto primitives
    const claimSecret = generateClaimSecret();
    const claimHash = hashClaimSecret(claimSecret);
    const claimHashHex = bytesToHex(claimHash);
    
    // Generate meta address (stealth address)
    const metaAddressKeypair = generateMetaAddress();
    const metaAddress = encodeMetaAddress(metaAddressKeypair.spendPubkey, metaAddressKeypair.viewPubkey);

    // Calculate expiry
    const expiresAt = new Date(Date.now() + (expiryDays * 24 * 60 * 60 * 1000));

    // Store payment data in database
    await db.insert(paymentsTable).values({
      paymentId,
      amount: amount.toString(),
      tokenMint,
      claimHash: claimHashHex,
      metaAddress,
      expiresAt,
    });

    // Award PAYMENT_SENT points (fire-and-forget, don't block payment creation)
    const creatorWallet = body.creatorWallet;
    if (creatorWallet && typeof creatorWallet === 'string' && amount >= 1) {
      const basePoints = amount * parseFloat('10'); // send_rate default
      awardPoints({
        walletAddress: creatorWallet,
        eventType: 'PAYMENT_SENT',
        basePoints,
        metadata: { paymentId, amount, tokenMint },
        referenceId: `payment_sent_${paymentId}`,
      }).catch(err => console.warn('Failed to award PAYMENT_SENT points:', err));
    }

    // Generate URLs
    const basePayUrl = process.env.NODE_ENV === 'production' ? 'https://app.zkira.xyz' : 'http://localhost:3001';
    const baseClaimUrl = process.env.NODE_ENV === 'production' ? 'https://app.zkira.xyz' : 'http://localhost:3001';
    
    const payUrl = `${basePayUrl}?amount=${amount}&token=${tokenMint}&meta=${metaAddress}`;
    const claimUrl = `${baseClaimUrl}/claim#secret=${bytesToHex(claimSecret)}`;

    // Return payment data
    return c.json({
      paymentId,
      claimUrl,
      payUrl,
      amount,
      tokenMint,
      claimHash: claimHashHex,
      metaAddress,
      expiresAt: expiresAt.toISOString(),
    });

  } catch (error) {
    console.error('Failed to create payment:', error);
    return c.json({ error: 'Failed to create payment' }, 500);
  }
});

// GET /api/payments/:id - Get payment by ID
payments.get('/api/payments/:id', async (c) => {
  const paymentId = c.req.param('id');
  
  if (!paymentId) {
    return c.json({ error: 'Payment ID parameter is required' }, 400);
  }

  try {
    const payment = await db.select().from(paymentsTable).where(eq(paymentsTable.paymentId, paymentId)).limit(1);
    
    if (payment.length === 0) {
      return c.json({ error: 'Payment not found' }, 404);
    }

    return c.json({ payment: payment[0] });
  } catch (error) {
    console.error('Failed to get payment:', error);
    return c.json({ error: 'Failed to get payment' }, 500);
  }
});

// POST /api/payments/status - Check escrow status
payments.post('/api/payments/status', async (c) => {
  if (!indexer) {
    return c.json({ error: 'Indexer not initialized' }, 500);
  }

  try {
    const body = await c.req.json();
    const { escrowAddress } = body;

    if (!escrowAddress || typeof escrowAddress !== 'string') {
      return c.json({ error: 'Valid escrow address is required' }, 400);
    }

    const escrow = indexer.getEscrow(escrowAddress);
    
    if (!escrow) {
      return c.json({ error: 'Escrow not found' }, 404);
    }

    return c.json({ escrow });

  } catch (error) {
    console.error('Failed to check escrow status:', error);
    return c.json({ error: 'Failed to check escrow status' }, 500);
  }
});

export default payments;