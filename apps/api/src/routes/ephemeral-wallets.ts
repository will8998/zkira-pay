import { Hono } from 'hono';
import { timingSafeEqual } from 'node:crypto';
import { JsonRpcProvider, Wallet, Contract, formatUnits } from 'ethers';
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

// POST /api/ephemeral-wallets — Save an ephemeral wallet (requires relayer secret or admin auth)
ephemeralWalletRoutes.post('/api/ephemeral-wallets', adminAuth, async (c) => {
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

// --- Shared constants for on-chain interactions ---

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
];

const TOKEN_ADDRESSES: Record<string, Record<string, string>> = {
  '42161': {
    'USDC': '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    'USDT': '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    'DAI': '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
  },
  '421614': {
    'USDC': '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    'USDT': '0x3870546cfd600ba87e4726f43a3f53e4f245e23b',
    'DAI': '0xc5Fa5669E326DA8B2C35540257cD48811F40a36B',
  },
};

const TOKEN_DECIMALS: Record<string, number> = {
  'USDC': 6,
  'USDT': 6,
  'DAI': 18,
};

function getChainId(chain: string | null): string {
  if (!chain) return '421614';
  switch (chain.toLowerCase()) {
    case 'arbitrum':
    case 'arbitrum-sepolia':
    case 'arbitrum-testnet':
      // DB stores 'arbitrum' for Sepolia testnet; RPC always points to Sepolia
      return '421614';
    case 'arbitrum-mainnet':
      return '42161';
    default:
      return '421614';
  }
}

function getTokenAddress(chain: string | null, token: string | null): string | null {
  if (!token) return null;
  const chainId = getChainId(chain);
  const chainTokens = TOKEN_ADDRESSES[chainId];
  if (!chainTokens) return null;
  return chainTokens[token.toUpperCase()] || null;
}

function getProvider(): JsonRpcProvider {
  const rpcUrl = process.env.ARB_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';
  return new JsonRpcProvider(rpcUrl);
}

// GET /api/admin/ephemeral-wallets/:id/balance — Check on-chain balance (admin only)
ephemeralWalletRoutes.get('/api/admin/ephemeral-wallets/:id/balance', adminAuth, async (c) => {
  try {
    const id = c.req.param('id');

    const [wallet] = await db.select().from(ephemeralWallets).where(eq(ephemeralWallets.id, id)).limit(1);
    if (!wallet) {
      return c.json({ error: 'Wallet not found' }, 404);
    }

    // Tron not supported yet
    if (wallet.chain?.toLowerCase() === 'tron') {
      return c.json({ address: wallet.address, balance: null, error: 'Tron balance check not yet supported' });
    }

    const tokenAddress = getTokenAddress(wallet.chain, wallet.token);
    if (!tokenAddress) {
      return c.json({ address: wallet.address, balance: null, error: `Unknown token ${wallet.token} on chain ${wallet.chain}` });
    }

    const provider = getProvider();
    const erc20 = new Contract(tokenAddress, ERC20_ABI, provider);
    const rawBalance: bigint = await erc20.balanceOf(wallet.address);
    const decimals = TOKEN_DECIMALS[wallet.token?.toUpperCase() || ''] || 18;
    const balance = formatUnits(rawBalance, decimals);

    return c.json({
      address: wallet.address,
      chain: wallet.chain,
      token: wallet.token,
      balance,
      rawBalance: rawBalance.toString(),
      decimals,
    });
  } catch (error) {
    console.error('Failed to check wallet balance:', error);
    return c.json({ error: 'Failed to check balance' }, 500);
  }
});

// POST /api/admin/ephemeral-wallets/:id/sweep — Manual sweep to treasury (admin only)
ephemeralWalletRoutes.post('/api/admin/ephemeral-wallets/:id/sweep', adminAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const treasuryAddress = process.env.TREASURY_ADDRESS;
    if (!treasuryAddress) {
      return c.json({ error: 'Treasury address not configured' }, 500);
    }

    const [wallet] = await db.select().from(ephemeralWallets).where(eq(ephemeralWallets.id, id)).limit(1);
    if (!wallet) {
      return c.json({ error: 'Wallet not found' }, 404);
    }

    if (wallet.status === 'swept') {
      return c.json({ error: 'Wallet has already been swept' }, 400);
    }

    // Tron not supported yet
    if (wallet.chain?.toLowerCase() === 'tron') {
      return c.json({ error: 'Tron sweep not yet supported' }, 400);
    }

    const tokenAddress = getTokenAddress(wallet.chain, wallet.token);
    if (!tokenAddress) {
      return c.json({ error: `Unknown token ${wallet.token} on chain ${wallet.chain}` }, 400);
    }

    // Decrypt private key and create signer
    const privateKey = decryptPrivateKey(wallet.encryptedKey, wallet.iv, wallet.authTag, wallet.salt);
    const provider = getProvider();
    const signer = new Wallet(privateKey, provider);
    const erc20 = new Contract(tokenAddress, ERC20_ABI, signer);

    // Check balance
    const balance: bigint = await erc20.balanceOf(wallet.address);
    if (balance === 0n) {
      await db.update(ephemeralWallets)
        .set({ status: 'empty', updatedAt: new Date() })
        .where(eq(ephemeralWallets.id, id));
      return c.json({ error: 'Wallet has zero balance', status: 'empty' }, 400);
    }

    // Transfer all tokens to treasury
    const tx = await erc20.transfer(treasuryAddress, balance);
    const receipt = await tx.wait(1);

    if (receipt) {
      await db.update(ephemeralWallets)
        .set({ status: 'swept', txHash: receipt.hash, updatedAt: new Date() })
        .where(eq(ephemeralWallets.id, id));

      const decimals = TOKEN_DECIMALS[wallet.token?.toUpperCase() || ''] || 18;
      return c.json({
        success: true,
        txHash: receipt.hash,
        amount: formatUnits(balance, decimals),
        token: wallet.token,
      });
    }

    return c.json({ error: 'Transaction failed — no receipt' }, 500);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('insufficient funds') || message.includes('gas')) {
      return c.json({ error: 'Wallet needs ETH for gas to sweep. Fund the wallet with ETH first.' }, 400);
    }
    console.error('Failed to sweep wallet:', error);
    return c.json({ error: 'Failed to sweep wallet' }, 500);
  }
});

export default ephemeralWalletRoutes;
