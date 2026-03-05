import { db } from '../db/index.js';
import { gatewaySessions, gatewayBalances, gatewayLedger, gatewayPoolAssignments } from '../db/schema.js';
import { eq, and, lte, sql, count } from 'drizzle-orm';
import { deliverWebhook } from './webhook.js';

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
        // Update session status to confirmed
        await db.update(gatewaySessions)
          .set({
            status: 'confirmed',
            updatedAt: new Date(),
          })
          .where(eq(gatewaySessions.id, session.id));
        
        // Upsert balance
        const existingBalance = await db.select().from(gatewayBalances).where(
          and(
            eq(gatewayBalances.merchantId, session.merchantId),
            eq(gatewayBalances.playerRef, session.playerRef),
            eq(gatewayBalances.currency, session.token)
          )
        ).limit(1);
        
        const amount = session.amount;
        const balanceBefore = existingBalance.length > 0 ? existingBalance[0].availableBalance : '0';
        const balanceAfter = (parseFloat(balanceBefore) + parseFloat(amount)).toFixed(6);
        
        if (existingBalance.length === 0) {
          await db.insert(gatewayBalances).values({
            merchantId: session.merchantId,
            playerRef: session.playerRef,
            currency: session.token,
            availableBalance: amount,
            pendingBalance: '0',
            totalDeposited: amount,
            totalWithdrawn: '0',
          });
        } else {
          await db.update(gatewayBalances).set({
            availableBalance: balanceAfter,
            totalDeposited: sql`${gatewayBalances.totalDeposited}::numeric + ${parseFloat(amount)}`,
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
        await db.insert(gatewayLedger).values({
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
        
        // Fire webhook
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
        
        processedCount++;
      } catch (error) {
        console.error(`Failed to process confirmed deposit ${session.id}:`, error);
      }
    }
    
    return processedCount;
  }
}
