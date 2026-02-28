import { Hono } from 'hono';
import { db } from '../db/index.js';
import { users, payments, invoices, transactions, escrowsCache, referrals, pointBalances } from '../db/schema.js';
import { count, sum, sql, gte, eq, desc } from 'drizzle-orm';

const analyticsRoutes = new Hono();

// GET /api/analytics — Public platform analytics (no auth required)
analyticsRoutes.get('/api/analytics', async (c) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // ── Aggregate stats ──
    const [
      totalUsersResult,
      totalPaymentsResult,
      totalVolumeResult,
      activeEscrowsResult,
      totalTransactionsResult,
      totalInvoicesResult,
      totalReferralsResult,
      recentPaymentsResult,
      recentUsersResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(payments),
      db.select({ total: sum(payments.amount) }).from(payments),
      db.select({ count: count() }).from(escrowsCache).where(eq(escrowsCache.claimed, false)),
      db.select({ count: count() }).from(transactions),
      db.select({ count: count() }).from(invoices),
      db.select({ count: count() }).from(referrals),
      // Last 7-day payment count for "recent" indicator
      db.select({ count: count() }).from(payments).where(gte(payments.createdAt, sevenDaysAgo)),
      // Last 7-day new users for "recent" indicator
      db.select({ count: count() }).from(users).where(gte(users.firstSeen, sevenDaysAgo)),
    ]);

    // ── Time-series (last 30 days) ──
    const [paymentsByDay, volumeByDay, usersByDay] = await Promise.all([
      db.select({
        date: sql<string>`DATE(${payments.createdAt})`,
        count: count(),
      })
        .from(payments)
        .where(gte(payments.createdAt, thirtyDaysAgo))
        .groupBy(sql`DATE(${payments.createdAt})`)
        .orderBy(sql`DATE(${payments.createdAt})`),

      db.select({
        date: sql<string>`DATE(${payments.createdAt})`,
        volume: sum(payments.amount),
      })
        .from(payments)
        .where(gte(payments.createdAt, thirtyDaysAgo))
        .groupBy(sql`DATE(${payments.createdAt})`)
        .orderBy(sql`DATE(${payments.createdAt})`),

      db.select({
        date: sql<string>`DATE(${users.firstSeen})`,
        count: count(),
      })
        .from(users)
        .where(gte(users.firstSeen, thirtyDaysAgo))
        .groupBy(sql`DATE(${users.firstSeen})`)
        .orderBy(sql`DATE(${users.firstSeen})`),
    ]);

    // ── Breakdowns ──
    const [paymentStatusBreakdown, topTiers] = await Promise.all([
      db.select({
        status: payments.status,
        count: count(),
      })
        .from(payments)
        .groupBy(payments.status),

      db.select({
        tier: pointBalances.tier,
        count: count(),
      })
        .from(pointBalances)
        .groupBy(pointBalances.tier)
        .orderBy(desc(count())),
    ]);

    // ── Recent activity (anonymized — no wallet addresses) ──
    const recentTransactions = await db.select({
      type: transactions.type,
      amount: transactions.amount,
      tokenMint: transactions.tokenMint,
      status: transactions.status,
      createdAt: transactions.createdAt,
    })
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(20);

    return c.json({
      stats: {
        totalUsers: totalUsersResult[0]?.count || 0,
        totalPayments: totalPaymentsResult[0]?.count || 0,
        totalVolume: totalVolumeResult[0]?.total || '0',
        activeEscrows: activeEscrowsResult[0]?.count || 0,
        totalTransactions: totalTransactionsResult[0]?.count || 0,
        totalInvoices: totalInvoicesResult[0]?.count || 0,
        totalReferrals: totalReferralsResult[0]?.count || 0,
        recentPayments7d: recentPaymentsResult[0]?.count || 0,
        recentUsers7d: recentUsersResult[0]?.count || 0,
      },
      charts: {
        paymentsByDay,
        volumeByDay,
        usersByDay,
      },
      breakdown: {
        paymentStatus: paymentStatusBreakdown,
        userTiers: topTiers,
      },
      recentActivity: recentTransactions.map((tx) => ({
        type: tx.type,
        amount: tx.amount,
        tokenMint: tx.tokenMint,
        status: tx.status,
        createdAt: tx.createdAt,
      })),
    });
  } catch (error) {
    console.error('Failed to get public analytics:', error);
    return c.json({ error: 'Failed to get analytics' }, 500);
  }
});

export default analyticsRoutes;
