import { Hono } from 'hono';
import { timingSafeEqual } from 'node:crypto';
import { Connection, PublicKey } from '@solana/web3.js';
import { db } from '../db/index.js';
import { users, payments, invoices, apiKeys, escrowsCache, transactions } from '../db/schema.js';
import { eq, count, sum, desc, gte, sql, and } from 'drizzle-orm';
import { loadConfig } from '../config.js';
import { GHOST_REGISTRY_PROGRAM_ID, PAYMENT_ESCROW_PROGRAM_ID, CONDITIONAL_ESCROW_PROGRAM_ID, MULTISIG_ESCROW_PROGRAM_ID, SEEDS } from '@zkira/common';

const adminRoutes = new Hono();

// Admin auth middleware
const adminAuth = async (c: any, next: any) => {
  const adminPassword = c.req.header('X-Admin-Password');
  const config = loadConfig();

  if (!adminPassword) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

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

// Apply admin auth to all admin routes
adminRoutes.use('/api/admin/*', adminAuth);

// GET /api/admin/stats - Overview stats
adminRoutes.get('/api/admin/stats', async (c) => {
  try {
    const [
      totalUsersResult,
      totalPaymentsResult,
      totalVolumeResult,
      activeApiKeysResult,
      pendingEscrowsResult,
      totalInvoicesResult,
      totalTransactionsResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(payments),
      db.select({ total: sum(payments.amount) }).from(payments),
      db.select({ count: count() }).from(apiKeys).where(eq(apiKeys.isActive, true)),
      db.select({ count: count() }).from(escrowsCache).where(eq(escrowsCache.claimed, false)),
      db.select({ count: count() }).from(invoices),
      db.select({ count: count() }).from(transactions),
    ]);

    return c.json({
      totalUsers: totalUsersResult[0]?.count || 0,
      totalPayments: totalPaymentsResult[0]?.count || 0,
      totalVolume: totalVolumeResult[0]?.total || '0',
      activeApiKeys: activeApiKeysResult[0]?.count || 0,
      pendingEscrows: pendingEscrowsResult[0]?.count || 0,
      totalInvoices: totalInvoicesResult[0]?.count || 0,
      totalTransactions: totalTransactionsResult[0]?.count || 0,
    });
  } catch (error) {
    console.error('Failed to get admin stats:', error);
    return c.json({ error: 'Failed to get admin stats' }, 500);
  }
});

// GET /api/admin/users - List all users with pagination
adminRoutes.get('/api/admin/users', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = parseInt(c.req.query('limit') || '50', 10);
    const search = c.req.query('search');
    const offset = (page - 1) * limit;

    let usersList;
    
    if (search) {
      usersList = await db.select().from(users)
        .where(sql`${users.walletAddress} ILIKE ${`%${search}%`}`)
        .orderBy(desc(users.lastSeen))
        .limit(limit)
        .offset(offset);
    } else {
      usersList = await db.select().from(users)
        .orderBy(desc(users.lastSeen))
        .limit(limit)
        .offset(offset);
    }

    // Get total count
    const totalResult = await db.select({ count: count() }).from(users);
    const total = totalResult[0]?.count || 0;

    // Transform DB column names to match frontend expected shape
    const transformedUsers = usersList.map((u: any) => ({
      wallet: u.walletAddress,
      firstSeen: u.firstSeen,
      lastSeen: u.lastSeen,
      totalPayments: u.totalPayments,
      totalVolume: parseFloat(u.totalVolume || '0'),
    }));
    return c.json({ users: transformedUsers, page, limit, total });
  } catch (error) {
    console.error('Failed to get users:', error);
    return c.json({ error: 'Failed to get users' }, 500);
  }
});

// GET /api/admin/payments - List all payments with filters
adminRoutes.get('/api/admin/payments', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = parseInt(c.req.query('limit') || '50', 10);
    const status = c.req.query('status');
    const search = c.req.query('search');
    const offset = (page - 1) * limit;

    let paymentsList;
    
    if (status && search) {
      paymentsList = await db.select().from(payments)
        .where(
          and(
            eq(payments.status, status),
            sql`${payments.paymentId} ILIKE ${`%${search}%`} OR ${payments.creatorWallet} ILIKE ${`%${search}%`}`
          )
        )
        .orderBy(desc(payments.createdAt))
        .limit(limit)
        .offset(offset);
    } else if (status) {
      paymentsList = await db.select().from(payments)
        .where(eq(payments.status, status))
        .orderBy(desc(payments.createdAt))
        .limit(limit)
        .offset(offset);
    } else if (search) {
      paymentsList = await db.select().from(payments)
        .where(sql`${payments.paymentId} ILIKE ${`%${search}%`} OR ${payments.creatorWallet} ILIKE ${`%${search}%`}`)
        .orderBy(desc(payments.createdAt))
        .limit(limit)
        .offset(offset);
    } else {
      paymentsList = await db.select().from(payments)
        .orderBy(desc(payments.createdAt))
        .limit(limit)
        .offset(offset);
    }
    return c.json({ payments: paymentsList, page, limit });
  } catch (error) {
    console.error('Failed to get payments:', error);
    return c.json({ error: 'Failed to get payments' }, 500);
  }
});

// GET /api/admin/invoices - List all invoices with pagination
adminRoutes.get('/api/admin/invoices', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = parseInt(c.req.query('limit') || '50', 10);
    const offset = (page - 1) * limit;

    const invoicesList = await db.select().from(invoices).orderBy(desc(invoices.createdAt)).limit(limit).offset(offset);
    return c.json({ invoices: invoicesList, page, limit });
  } catch (error) {
    console.error('Failed to get invoices:', error);
    return c.json({ error: 'Failed to get invoices' }, 500);
  }
});

// GET /api/admin/api-keys - List all API keys with pagination
adminRoutes.get('/api/admin/api-keys', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = parseInt(c.req.query('limit') || '50', 10);
    const offset = (page - 1) * limit;

    const keysList = await db.select({
      id: apiKeys.id,
      walletAddress: apiKeys.walletAddress,
      keyPrefix: apiKeys.keyPrefix,
      name: apiKeys.name,
      createdAt: apiKeys.createdAt,
      lastUsed: apiKeys.lastUsed,
      isActive: apiKeys.isActive,
    }).from(apiKeys).orderBy(desc(apiKeys.createdAt)).limit(limit).offset(offset);

    return c.json({ apiKeys: keysList, page, limit });
  } catch (error) {
    console.error('Failed to get API keys:', error);
    return c.json({ error: 'Failed to get API keys' }, 500);
  }
});

// GET /api/admin/escrows - List all cached escrows with pagination
adminRoutes.get('/api/admin/escrows', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = parseInt(c.req.query('limit') || '50', 10);
    const offset = (page - 1) * limit;

    const escrowsList = await db.select().from(escrowsCache).orderBy(desc(escrowsCache.updatedAt)).limit(limit).offset(offset);
    return c.json({ escrows: escrowsList, page, limit });
  } catch (error) {
    console.error('Failed to get escrows:', error);
    return c.json({ error: 'Failed to get escrows' }, 500);
  }
});

// GET /api/admin/transactions - List all transactions with pagination
adminRoutes.get('/api/admin/transactions', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = parseInt(c.req.query('limit') || '50', 10);
    const offset = (page - 1) * limit;

    const transactionsList = await db.select().from(transactions).orderBy(desc(transactions.createdAt)).limit(limit).offset(offset);
    return c.json({ transactions: transactionsList, page, limit });
  } catch (error) {
    console.error('Failed to get transactions:', error);
    return c.json({ error: 'Failed to get transactions' }, 500);
  }
});

// GET /api/admin/analytics - Time-series data for charts
adminRoutes.get('/api/admin/analytics', async (c) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [paymentsByDay, volumeByDay, usersByDay] = await Promise.all([
      db.select({
        date: sql<string>`DATE(${payments.createdAt})`,
        count: count(),
      }).from(payments).where(gte(payments.createdAt, thirtyDaysAgo)).groupBy(sql`DATE(${payments.createdAt})`).orderBy(sql`DATE(${payments.createdAt})`),

      db.select({
        date: sql<string>`DATE(${payments.createdAt})`,
        volume: sum(payments.amount),
      }).from(payments).where(gte(payments.createdAt, thirtyDaysAgo)).groupBy(sql`DATE(${payments.createdAt})`).orderBy(sql`DATE(${payments.createdAt})`),

      db.select({
        date: sql<string>`DATE(${users.firstSeen})`,
        count: count(),
      }).from(users).where(gte(users.firstSeen, thirtyDaysAgo)).groupBy(sql`DATE(${users.firstSeen})`).orderBy(sql`DATE(${users.firstSeen})`),
    ]);

    return c.json({
      paymentsByDay,
      volumeByDay,
      usersByDay,
    });
  } catch (error) {
    console.error('Failed to get analytics:', error);
    return c.json({ error: 'Failed to get analytics' }, 500);
  }
});

// DELETE /api/admin/api-keys/:id - Revoke API key
adminRoutes.delete('/api/admin/api-keys/:id', async (c) => {
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

    return c.json({ message: 'API key revoked successfully' });
  } catch (error) {
    console.error('Failed to revoke API key:', error);
    return c.json({ error: 'Failed to revoke API key' }, 500);
  }
});

// DELETE /api/admin/users/:walletAddress - Delete user
adminRoutes.delete('/api/admin/users/:walletAddress', async (c) => {
  const walletAddress = c.req.param('walletAddress');

  if (!walletAddress) {
    return c.json({ error: 'Wallet address parameter is required' }, 400);
  }

  try {
    const result = await db.delete(users).where(eq(users.walletAddress, walletAddress)).returning();

    if (result.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return c.json({ error: 'Failed to delete user' }, 500);
  }
});


// RPC URLs for multi-network support
const RPC_URLS: Record<string, string> = {
  'devnet': 'https://api.devnet.solana.com',
  'testnet': 'https://api.testnet.solana.com',
  'mainnet-beta': 'https://api.mainnet-beta.solana.com',
};

// USDC mints per network
const USDC_MINTS: Record<string, string> = {
  'devnet': '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  'mainnet-beta': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
};

const BPF_UPGRADE_LOADER_ID = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');

function getConnection(network?: string): { connection: Connection; cluster: string } {
  const cluster = network && RPC_URLS[network] ? network : 'devnet';
  const rpcUrl = RPC_URLS[cluster] || loadConfig().solanaRpcUrl;
  return { connection: new Connection(rpcUrl, 'confirmed'), cluster };
}
// GET /api/admin/ops/network-health - RPC health, slot, block time, TPS estimate
adminRoutes.get('/api/admin/ops/network-health', async (c) => {
  try {
    const { connection, cluster } = getConnection(c.req.query('network'));
    
    const startTime = Date.now();
    const [slot, blockTime, blockHeight, epochInfo, performanceSamples, version] = await Promise.all([
      connection.getSlot(),
      connection.getBlockTime(await connection.getSlot()),
      connection.getBlockHeight(),
      connection.getEpochInfo(),
      connection.getRecentPerformanceSamples(1),
      connection.getVersion()
    ]);
    const latencyMs = Date.now() - startTime;
    
    const tps = performanceSamples.length > 0 ? performanceSamples[0].numTransactions / performanceSamples[0].samplePeriodSecs : 0;
    
    return c.json({
      rpcUrl: RPC_URLS[cluster] || loadConfig().solanaRpcUrl,
      cluster,
      slot,
      blockTime,
      blockHeight,
      epochInfo: {
        epoch: epochInfo.epoch,
        slotIndex: epochInfo.slotIndex,
        slotsInEpoch: epochInfo.slotsInEpoch,
        absoluteSlot: epochInfo.absoluteSlot
      },
      version: version['solana-core'],
      tps: Math.round(tps),
      healthy: true,
      latencyMs
    });
  } catch (error) {
    console.error('Failed to get network health:', error);
    return c.json({ healthy: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// GET /api/admin/ops/programs - Status of all 4 on-chain programs
adminRoutes.get('/api/admin/ops/programs', async (c) => {
  try {
    const { connection, cluster } = getConnection(c.req.query('network'));
    
    const programIds = [
      { name: 'Ghost Registry', programId: GHOST_REGISTRY_PROGRAM_ID },
      { name: 'Payment Escrow', programId: PAYMENT_ESCROW_PROGRAM_ID },
      { name: 'Conditional Escrow', programId: CONDITIONAL_ESCROW_PROGRAM_ID },
      { name: 'Multisig Escrow', programId: MULTISIG_ESCROW_PROGRAM_ID }
    ];
    
    const programs = await Promise.all(
      programIds.map(async ({ name, programId }) => {
        try {
          const accountInfo = await connection.getAccountInfo(programId);
          
          if (!accountInfo) {
            return {
              name,
              programId: programId.toString(),
              executable: false,
              error: 'Program not found'
            };
          }
          
          // Get upgrade authority
          let upgradeAuthority: string | null = null;
          let programDataAddress: string | null = null;
          
          try {
            const [programDataPda] = PublicKey.findProgramAddressSync(
              [programId.toBuffer()],
              BPF_UPGRADE_LOADER_ID
            );
            programDataAddress = programDataPda.toString();
            
            const programDataInfo = await connection.getParsedAccountInfo(programDataPda);
            if (programDataInfo.value?.data && 'parsed' in programDataInfo.value.data) {
              upgradeAuthority = programDataInfo.value.data.parsed.info.authority || null;
            }
          } catch (upgradeError) {
            // Program might not be upgradeable
          }
          
          return {
            name,
            programId: programId.toString(),
            executable: accountInfo.executable,
            owner: accountInfo.owner.toString(),
            dataLength: accountInfo.data.length,
            lamports: accountInfo.lamports,
            upgradeAuthority,
            programDataAddress
          };
        } catch (error) {
          return {
            name,
            programId: programId.toString(),
            executable: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );
    
    return c.json({ programs, cluster });
  } catch (error) {
    console.error('Failed to get programs status:', error);
    return c.json({ error: 'Failed to get programs status' }, 500);
  }
});
// GET /api/admin/ops/wallets - Balance info for configured wallets
adminRoutes.get('/api/admin/ops/wallets', async (c) => {
  try {
    const { connection, cluster } = getConnection(c.req.query('network'));
    
    const wallets = [];
    
    // Add config PDA wallet
    try {
      const [configPda] = PublicKey.findProgramAddressSync(
        [SEEDS.CONFIG, PAYMENT_ESCROW_PROGRAM_ID.toBuffer()],
        PAYMENT_ESCROW_PROGRAM_ID
      );
      
      const balance = await connection.getBalance(configPda);
      
      // Check USDC balance
      let usdcBalance = 0;
      const usdcMint = USDC_MINTS[cluster];
      if (usdcMint) {
        try {
          const tokenAccounts = await connection.getTokenAccountsByOwner(
            configPda,
            { mint: new PublicKey(usdcMint) }
          );
          if (tokenAccounts.value.length > 0) {
            const data = tokenAccounts.value[0].account.data;
            const amount = data.readBigUInt64LE(64); // offset 64 = after mint(32) + owner(32)
            usdcBalance = Number(amount) / 1_000_000; // USDC has 6 decimals
          }
        } catch (usdcError) {
          // USDC account might not exist
        }
      }
      
      wallets.push({
        label: 'Config PDA',
        address: configPda.toString(),
        solBalance: balance / 1e9,
        lamports: balance,
        usdcBalance
      });
    } catch (error) {
      wallets.push({
        label: 'Config PDA',
        address: 'Error deriving PDA',
        solBalance: 0,
        lamports: 0,
        usdcBalance: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    // Add addresses from query params
    const addressesParam = c.req.query('addresses');
    if (addressesParam) {
      const addresses = addressesParam.split(',').map(addr => addr.trim()).filter(Boolean);
      
      for (const address of addresses) {
        try {
          const pubkey = new PublicKey(address);
          const balance = await connection.getBalance(pubkey);
          
          // Check USDC balance
          let usdcBalance = 0;
          const usdcMint = USDC_MINTS[cluster];
          if (usdcMint) {
            try {
              const tokenAccounts = await connection.getTokenAccountsByOwner(
                pubkey,
                { mint: new PublicKey(usdcMint) }
              );
              if (tokenAccounts.value.length > 0) {
                const data = tokenAccounts.value[0].account.data;
                const amount = data.readBigUInt64LE(64); // offset 64 = after mint(32) + owner(32)
                usdcBalance = Number(amount) / 1_000_000; // USDC has 6 decimals
              }
            } catch (usdcError) {
              // USDC account might not exist
            }
          }
          
          wallets.push({
            label: `Wallet ${address.slice(0, 8)}...`,
            address,
            solBalance: balance / 1e9,
            lamports: balance,
            usdcBalance
          });
        } catch (error) {
          wallets.push({
            label: `Wallet ${address.slice(0, 8)}...`,
            address,
            solBalance: 0,
            lamports: 0,
            usdcBalance: 0,
            error: error instanceof Error ? error.message : 'Invalid address'
          });
        }
      }
    }
    
    return c.json({ wallets, cluster });
  } catch (error) {
    console.error('Failed to get wallet balances:', error);
    return c.json({ error: 'Failed to get wallet balances' }, 500);
  }
});
// GET /api/admin/ops/tx-lookup?sig=... - Decode a transaction by signature
adminRoutes.get('/api/admin/ops/tx-lookup', async (c) => {
  try {
    const sig = c.req.query('sig');
    
    if (!sig) {
      return c.json({ error: 'Transaction signature parameter is required' }, 400);
    }
    
    const { connection, cluster } = getConnection(c.req.query('network'));
    
    const transaction = await connection.getTransaction(sig, { maxSupportedTransactionVersion: 0 });
    
    if (!transaction) {
      return c.json({ error: 'Transaction not found' }, 404);
    }
    
    const status = transaction.meta?.err ? 'failed' : 'success';
    const fee = transaction.meta?.fee || 0;
    const logMessages = transaction.meta?.logMessages || [];
    
    // Extract account keys and instructions from the transaction
    let accounts: string[] = [];
    let instructions: { programId: string; data: string }[] = [];
    
    const message = transaction.transaction.message;
    const accountKeys = message.getAccountKeys();
    accounts = accountKeys.keySegments().flat().map(key => key.toString());
    instructions = message.compiledInstructions.map(ix => ({
      programId: accounts[ix.programIdIndex],
      data: Buffer.from(ix.data).toString('base64')
    }));
    
    return c.json({
      signature: sig,
      slot: transaction.slot,
      blockTime: transaction.blockTime,
      status,
      fee,
      err: transaction.meta?.err || null,
      logMessages,
      accounts,
      instructions,
      cluster
    });
  } catch (error) {
    console.error('Failed to lookup transaction:', error);
    return c.json({ error: 'Failed to lookup transaction' }, 500);
  }
});
// GET /api/admin/ops/escrow?address=...&network=... - Look up a single escrow account
adminRoutes.get('/api/admin/ops/escrow', async (c) => {
  try {
    const address = c.req.query('address');
    
    if (!address) {
      return c.json({ error: 'Address parameter is required' }, 400);
    }
    
    const { connection, cluster } = getConnection(c.req.query('network'));
    
    // Fetch on-chain data
    let onChain;
    try {
      const pubkey = new PublicKey(address);
      const accountInfo = await connection.getAccountInfo(pubkey);
      
      if (accountInfo) {
        onChain = {
          owner: accountInfo.owner.toString(),
          lamports: accountInfo.lamports,
          dataLength: accountInfo.data.length,
          exists: true
        };
      } else {
        onChain = {
          exists: false
        };
      }
    } catch (error) {
      onChain = {
        exists: false,
        error: error instanceof Error ? error.message : 'Invalid address'
      };
    }
    
    // Fetch cached data
    let cached = null;
    try {
      const cachedEscrow = await db.select().from(escrowsCache)
        .where(eq(escrowsCache.address, address))
        .limit(1);
      
      if (cachedEscrow.length > 0) {
        const escrow = cachedEscrow[0];
        cached = {
          creator: escrow.creator,
          amount: escrow.amount,
          tokenMint: escrow.tokenMint,
          claimed: escrow.claimed,
          expiry: escrow.expiry ? new Date(escrow.expiry * 1000).toISOString() : null,
          createdAt: escrow.createdAt ? new Date(escrow.createdAt * 1000).toISOString() : null
        };
      }
    } catch (error) {
      // DB error, but continue
    }
    
    return c.json({
      address,
      cluster,
      onChain,
      cached
    });
  } catch (error) {
    console.error('Failed to lookup escrow:', error);
    return c.json({ error: 'Failed to lookup escrow' }, 500);
  }
});

// GET /api/admin/ops/escrows/search?creator=... - Query escrows by creator wallet
adminRoutes.get('/api/admin/ops/escrows/search', async (c) => {
  try {
    const creator = c.req.query('creator');
    
    if (!creator) {
      return c.json({ error: 'Creator parameter is required' }, 400);
    }
    
    const escrows = await db.select().from(escrowsCache)
      .where(eq(escrowsCache.creator, creator))
      .orderBy(desc(escrowsCache.updatedAt))
      .limit(50);
    
    return c.json({ escrows, creator });
  } catch (error) {
    console.error('Failed to search escrows:', error);
    return c.json({ error: 'Failed to search escrows' }, 500);
  }
});

// GET /api/admin/ops/escrows/stuck - Find expired unclaimed escrows
adminRoutes.get('/api/admin/ops/escrows/stuck', async (c) => {
  try {
    const now = Math.floor(Date.now() / 1000); // Current timestamp in seconds
    
    const stuckEscrows = await db.select().from(escrowsCache)
      .where(
        and(
          eq(escrowsCache.claimed, false),
          sql`${escrowsCache.expiry} < ${now}`
        )
      )
      .orderBy(desc(escrowsCache.updatedAt))
      .limit(50);
    
    return c.json({ stuckEscrows, count: stuckEscrows.length });
  } catch (error) {
    console.error('Failed to get stuck escrows:', error);
    return c.json({ error: 'Failed to get stuck escrows' }, 500);
  }
});

// GET /api/admin/ops/account?address=...&network=... - Generic Solana account inspector
adminRoutes.get('/api/admin/ops/account', async (c) => {
  try {
    const address = c.req.query('address');
    
    if (!address) {
      return c.json({ error: 'Address parameter is required' }, 400);
    }
    
    const { connection, cluster } = getConnection(c.req.query('network'));
    
    let pubkey;
    try {
      pubkey = new PublicKey(address);
    } catch (error) {
      return c.json({ error: 'Invalid address format' }, 400);
    }
    
    const accountInfo = await connection.getAccountInfo(pubkey);
    
    if (!accountInfo) {
      return c.json({
        address,
        cluster,
        exists: false
      });
    }
    
    // Determine account type
    let type = 'unknown';
    let additionalInfo: any = {};
    
    if (accountInfo.executable) {
      type = 'program';
      
      // For programs, try to get upgrade authority
      try {
        const [programDataPda] = PublicKey.findProgramAddressSync(
          [pubkey.toBuffer()],
          BPF_UPGRADE_LOADER_ID
        );
        
        const programDataInfo = await connection.getParsedAccountInfo(programDataPda);
        if (programDataInfo.value?.data && 'parsed' in programDataInfo.value.data) {
          additionalInfo.upgradeAuthority = programDataInfo.value.data.parsed.info.authority || null;
          additionalInfo.programDataAddress = programDataPda.toString();
        }
      } catch (upgradeError) {
        // Program might not be upgradeable
      }
    } else if (accountInfo.owner.toString() === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
      type = 'token';
      
      // Parse token account data
      try {
        const data = accountInfo.data;
        if (data.length >= 72) {
          const mint = new PublicKey(data.slice(0, 32)).toString();
          const tokenOwner = new PublicKey(data.slice(32, 64)).toString();
          const amount = data.readBigUInt64LE(64);
          
          additionalInfo = {
            mint,
            tokenOwner,
            amount: amount.toString()
          };
        }
      } catch (parseError) {
        // Failed to parse token data
      }
    } else if (accountInfo.owner.toString() === '11111111111111111111111111111111') {
      type = 'system';
    }
    
    return c.json({
      address,
      cluster,
      exists: true,
      owner: accountInfo.owner.toString(),
      lamports: accountInfo.lamports,
      solBalance: accountInfo.lamports / 1e9,
      executable: accountInfo.executable,
      dataLength: accountInfo.data.length,
      rentEpoch: accountInfo.rentEpoch,
      type,
      ...additionalInfo
    });
  } catch (error) {
    console.error('Failed to lookup account:', error);
    return c.json({ error: 'Failed to lookup account' }, 500);
  }
});

export default adminRoutes;