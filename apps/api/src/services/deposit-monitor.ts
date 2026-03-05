import { db } from '../db/index.js';
import { gatewaySessions, gatewayBalances, gatewayLedger, gatewayPoolAssignments } from '../db/schema.js';
import { eq, and, lte, sql, count } from 'drizzle-orm';
import { deliverWebhook } from './webhook.js';
import { JsonRpcProvider } from 'ethers';
import { toBigInt6, fromBigInt6 } from '../utils/bigint-math.js';
import { logAudit } from './audit.js';
// Token decimals map
const TOKEN_DECIMALS: Record<string, number> = {
  'USDC': 6,
  'USDT': 6,
  'DAI': 18
};

// ERC-20 Transfer event topic
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3e3';

interface VerificationResult {
  verified: boolean;
  actualAmount?: string;
  error?: string;
}

/**
 * Verifies a deposit transaction on-chain
 * @param txHash Transaction hash to verify
 * @param ephemeralWallet Expected recipient wallet address
 * @param expectedAmount Expected transfer amount (string)
 * @param token Token symbol (USDC, USDT, DAI)
 * @param chain Chain identifier
 * @returns Verification result
 */
async function verifyDepositTransaction(
  txHash: string,
  ephemeralWallet: string,
  expectedAmount: string,
  token: string,
  chain: string
): Promise<VerificationResult> {
  try {
    // Create provider
    const rpcUrl = process.env.ARB_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';
    const provider = new JsonRpcProvider(rpcUrl);

    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
      return { verified: false, error: 'Transaction receipt not found' };
    }

    // Check if transaction was successful
    if (receipt.status !== 1) {
      return { verified: false, error: 'Transaction failed on-chain' };
    }

    // Get token decimals
    const decimals = TOKEN_DECIMALS[token.toUpperCase()];
    if (decimals === undefined) {
      return { verified: false, error: `Unsupported token: ${token}` };
    }

    // Parse expected amount to wei (string-based to avoid floating-point)
    const [whole, frac = ''] = expectedAmount.split('.');
    const paddedFrac = (frac + '0'.repeat(decimals)).slice(0, decimals);
    const expectedAmountWei = BigInt(whole + paddedFrac);

    // Normalize ephemeral wallet address (lowercase, padded to 32 bytes)
    const normalizedWallet = ephemeralWallet.toLowerCase();
    const paddedWallet = '0x' + normalizedWallet.slice(2).padStart(64, '0');

    // Find Transfer event logs
    let transferFound = false;
    let actualAmountWei = BigInt(0);

    for (const log of receipt.logs) {
      // Check if this is a Transfer event
      if (log.topics[0] !== TRANSFER_TOPIC) {
        continue;
      }

      // Check if the recipient (topics[2]) matches our ephemeral wallet
      if (log.topics[2] !== paddedWallet) {
        continue;
      }

      // Parse the transfer amount from log data
      try {
        actualAmountWei = BigInt(log.data);
        transferFound = true;
        break;
      } catch (error) {
        console.error('Failed to parse transfer amount from log data:', error);
        continue;
      }
    }

    if (!transferFound) {
      return { verified: false, error: 'No Transfer event found to ephemeral wallet' };
    }

    // Check if actual amount meets or exceeds expected amount
    if (actualAmountWei < expectedAmountWei) {
      const actualAmount = (Number(actualAmountWei) / Math.pow(10, decimals)).toFixed(decimals);
      return {
        verified: false,
        actualAmount,
        error: `Transfer amount ${actualAmount} is less than expected ${expectedAmount}`
      };
    }

    // Verification successful
    const actualAmount = (Number(actualAmountWei) / Math.pow(10, decimals)).toFixed(decimals);
    return {
      verified: true,
      actualAmount
    };

  } catch (error) {
    console.error('Error verifying deposit transaction:', error);
    return {
      verified: false,
      error: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export class DepositMonitor {
  private intervalId: NodeJS.Timeout | null = null;
  private pollIntervalMs: number;
  
  constructor(pollIntervalMs: number = 30_000) {
    this.pollIntervalMs = pollIntervalMs;
  }
  
  start(): void {
    console.log(`Deposit monitor started (polling every ${this.pollIntervalMs / 1000}s)`);
    
    // Start polling immediately
    this.tick().catch(error => {
      console.error('Initial deposit monitor tick failed:', error);
    });
    
    // Set up interval
    this.intervalId = setInterval(() => {
      this.tick().catch(error => {
        console.error('Deposit monitor tick failed:', error);
      });
    }, this.pollIntervalMs);
  }
  
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Deposit monitor stopped');
    }
  }
  
  private async tick(): Promise<void> {
    try {
      const [expiredCount, confirmedCount] = await Promise.all([
        this.processExpiredSessions(),
        this.processConfirmedDeposits(),
      ]);
      
      if (expiredCount > 0 || confirmedCount > 0) {
        console.log(`Deposit monitor: expired ${expiredCount}, confirmed ${confirmedCount}`);
      }
    } catch (error) {
      console.error('Deposit monitor tick error:', error);
    }
  }
  
  private async processExpiredSessions(): Promise<number> {
    // Query expired sessions
    const expiredSessions = await db.select({
      id: gatewaySessions.id,
      merchantId: gatewaySessions.merchantId,
      playerRef: gatewaySessions.playerRef,
      sessionType: gatewaySessions.sessionType,
      amount: gatewaySessions.amount,
      token: gatewaySessions.token,
    }).from(gatewaySessions).where(
      and(
        eq(gatewaySessions.status, 'pending'),
        lte(gatewaySessions.expiresAt, new Date())
      )
    ).limit(100); // Process up to 100 at a time
    
    if (expiredSessions.length === 0) {
      return 0;
    }
    
    // Update all expired sessions to 'expired' status
    const sessionIds = expiredSessions.map(s => s.id);
    await db.update(gatewaySessions)
      .set({
        status: 'expired',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(gatewaySessions.status, 'pending'),
          lte(gatewaySessions.expiresAt, new Date())
        )
      );
    
    // Fire webhooks for each expired session
    for (const session of expiredSessions) {
      try {
        await deliverWebhook({
          merchantId: session.merchantId,
          sessionId: session.id,
          event: 'session.expired',
          payload: {
            sessionId: session.id,
            playerRef: session.playerRef,
            sessionType: session.sessionType,
            amount: session.amount,
            token: session.token,
            status: 'expired',
          },
        });
      } catch (error) {
        console.error(`Failed to deliver webhook for expired session ${session.id}:`, error);
      }
    }
    
    return expiredSessions.length;
  }
  
  private async processConfirmedDeposits(): Promise<number> {
    // Query sessions that have txHash but are still pending
    const confirmedSessions = await db.select({
      id: gatewaySessions.id,
      merchantId: gatewaySessions.merchantId,
      playerRef: gatewaySessions.playerRef,
      amount: gatewaySessions.amount,
      token: gatewaySessions.token,
      txHash: gatewaySessions.txHash,
      chain: gatewaySessions.chain,
      ephemeralWallet: gatewaySessions.ephemeralWallet,
    }).from(gatewaySessions).where(
      and(
        eq(gatewaySessions.status, 'pending'),
        eq(gatewaySessions.sessionType, 'deposit'),
        sql`${gatewaySessions.txHash} IS NOT NULL`
      )
    ).limit(100); // Process up to 100 at a time
    
    if (confirmedSessions.length === 0) {
      return 0;
    }
    
    let processedCount = 0;
    
    for (const session of confirmedSessions) {
      try {
        // Skip verification for auto-detected transactions
        if (session.txHash === 'auto-detected') {
          console.log(`Skipping verification for auto-detected session ${session.id}`);
        } else {
          // Verify transaction on-chain
          const verification = await verifyDepositTransaction(
            session.txHash!,
            session.ephemeralWallet!,
            session.amount,
            session.token,
            session.chain
          );

          if (!verification.verified) {
            console.warn(`Deposit verification failed for session ${session.id}: ${verification.error}`);
            continue; // Skip this session, retry next tick
          }

          console.log(`Deposit verification successful for session ${session.id}, actual amount: ${verification.actualAmount}`);
        }

        const { balanceBefore, balanceAfter } = await db.transaction(async (tx) => {
          // Update session status to confirmed
          await tx.update(gatewaySessions)
            .set({
              status: 'confirmed',
              updatedAt: new Date(),
            })
            .where(eq(gatewaySessions.id, session.id));
          
          // Upsert balance
          const existingBalance = await tx.select().from(gatewayBalances).where(
            and(
              eq(gatewayBalances.merchantId, session.merchantId),
              eq(gatewayBalances.playerRef, session.playerRef),
              eq(gatewayBalances.currency, session.token)
            )
          ).limit(1);
          
          const amount = session.amount;
          const balanceBefore = existingBalance.length > 0 ? existingBalance[0].availableBalance : '0';
          const balanceAfter = fromBigInt6(toBigInt6(balanceBefore) + toBigInt6(amount));
          
          if (existingBalance.length === 0) {
            await tx.insert(gatewayBalances).values({
              merchantId: session.merchantId,
              playerRef: session.playerRef,
              currency: session.token,
              availableBalance: amount,
              pendingBalance: '0',
              totalDeposited: amount,
              totalWithdrawn: '0',
            });
          } else {
            await tx.update(gatewayBalances).set({
              availableBalance: balanceAfter,
              totalDeposited: sql`${gatewayBalances.totalDeposited}::numeric + ${amount}`,
              updatedAt: new Date(),
            }).where(
              and(
                eq(gatewayBalances.merchantId, session.merchantId),
                eq(gatewayBalances.playerRef, session.playerRef),
                eq(gatewayBalances.currency, session.token)
              )
            );
          }
          
          // Insert ledger entry
          await tx.insert(gatewayLedger).values({
            merchantId: session.merchantId,
            playerRef: session.playerRef,
            type: 'deposit',
            amount: amount,
            currency: session.token,
            sessionId: session.id,
            balanceBefore: balanceBefore,
            balanceAfter: balanceAfter,
            description: `Deposit confirmed - tx: ${session.txHash}`,
          });
          
          return { balanceBefore, balanceAfter };
        });
        
        // Fire webhook OUTSIDE transaction
        await deliverWebhook({
          merchantId: session.merchantId,
          sessionId: session.id,
          event: 'deposit.confirmed',
          payload: {
            sessionId: session.id,
            playerRef: session.playerRef,
            amount: session.amount,
            token: session.token,
            chain: session.chain,
            txHash: session.txHash,
            status: 'confirmed',
            balanceBefore: balanceBefore,
            balanceAfter: balanceAfter,
          },
        });

        // Log audit event (fire-and-forget)
        logAudit({
          actor: 'system',
          action: 'deposit.auto_confirmed',
          resourceType: 'session',
          resourceId: session.id,
          details: {
            txHash: session.txHash,
            amount: session.amount,
            token: session.token,
            chain: session.chain,
            playerRef: session.playerRef,
            balanceBefore,
            balanceAfter
          }
        }).catch(() => {});
        
        processedCount++;
      } catch (error) {
        console.error(`Failed to process confirmed deposit ${session.id}:`, error);
      }
    }
    
    return processedCount;
  }
}
