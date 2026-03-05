import { Hono } from 'hono';
import { db } from '../db/index.js';
import { gatewaySessions, gatewayBalances, gatewayLedger } from '../db/schema.js';
import { eq, and, desc, gte, lte, sql, count } from 'drizzle-orm';

const gatewayReportRoutes = new Hono<{ Variables: { merchantId: string } }>();

// GET /api/gateway/reports/transactions - Transaction history
gatewayReportRoutes.get('/api/gateway/reports/transactions', async (c) => {
  const merchantId = c.get('merchantId') as string;
  
  if (!merchantId) {
    return c.json({ error: 'Merchant ID is required' }, 400);
  }

  try {
    const playerRef = c.req.query('playerRef');
    const type = c.req.query('type');
    const from = c.req.query('from');
    const to = c.req.query('to');
    const limitParam = c.req.query('limit');
    const offsetParam = c.req.query('offset');

    const limit = Math.min(parseInt(limitParam || '50'), 100);
    const offset = parseInt(offsetParam || '0');

    // Build where conditions
    const conditions = [eq(gatewayLedger.merchantId, merchantId)];
    
    if (playerRef) {
      conditions.push(eq(gatewayLedger.playerRef, playerRef));
    }
    
    if (type) {
      conditions.push(eq(gatewayLedger.type, type));
    }
    
    if (from) {
      conditions.push(gte(gatewayLedger.createdAt, new Date(from)));
    }
    
    if (to) {
      conditions.push(lte(gatewayLedger.createdAt, new Date(to)));
    }

    const whereClause = and(...conditions);

    // Get transactions
    const transactions = await db
      .select()
      .from(gatewayLedger)
      .where(whereClause)
      .orderBy(desc(gatewayLedger.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(gatewayLedger)
      .where(whereClause);
    
    const total = totalResult[0].count;

    return c.json({
      transactions,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Failed to get transaction history:', error);
    return c.json({ error: 'Failed to get transaction history' }, 500);
  }
});

// GET /api/gateway/reports/balances - Player balance summary
gatewayReportRoutes.get('/api/gateway/reports/balances', async (c) => {
  const merchantId = c.get('merchantId') as string;
  
  if (!merchantId) {
    return c.json({ error: 'Merchant ID is required' }, 400);
  }

  try {
    const playerRef = c.req.query('playerRef');
    const limitParam = c.req.query('limit');
    const offsetParam = c.req.query('offset');

    const limit = Math.min(parseInt(limitParam || '50'), 100);
    const offset = parseInt(offsetParam || '0');

    // Build where conditions
    const conditions = [eq(gatewayBalances.merchantId, merchantId)];
    
    if (playerRef) {
      conditions.push(eq(gatewayBalances.playerRef, playerRef));
      
      // If specific player, return single player without pagination
      const balances = await db
        .select()
        .from(gatewayBalances)
        .where(and(...conditions));

      return c.json({
        balances,
        total: balances.length
      });
    }

    const whereClause = and(...conditions);

    // Get balances
    const balances = await db
      .select()
      .from(gatewayBalances)
      .where(whereClause)
      .orderBy(desc(gatewayBalances.updatedAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(gatewayBalances)
      .where(whereClause);
    
    const total = totalResult[0].count;

    return c.json({
      balances,
      total
    });
  } catch (error) {
    console.error('Failed to get balance summary:', error);
    return c.json({ error: 'Failed to get balance summary' }, 500);
  }
});

// GET /api/gateway/reports/volume - Volume analytics
gatewayReportRoutes.get('/api/gateway/reports/volume', async (c) => {
  const merchantId = c.get('merchantId') as string;
  
  if (!merchantId) {
    return c.json({ error: 'Merchant ID is required' }, 400);
  }

  try {
    const fromParam = c.req.query('from');
    const toParam = c.req.query('to');
    const groupBy = c.req.query('groupBy') || 'day';

    // Default to 30 days ago if no from date provided
    const from = fromParam ? new Date(fromParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = toParam ? new Date(toParam) : new Date();

    const conditions = [
      eq(gatewayLedger.merchantId, merchantId),
      gte(gatewayLedger.createdAt, from),
      lte(gatewayLedger.createdAt, to)
    ];

    const whereClause = and(...conditions);

    // Get summary totals
    const summaryResult = await db
      .select({
        totalDeposits: sql<string>`COALESCE(SUM(CASE WHEN ${gatewayLedger.type} = 'deposit' THEN ${gatewayLedger.amount} ELSE 0 END), 0)`,
        totalWithdrawals: sql<string>`COALESCE(SUM(CASE WHEN ${gatewayLedger.type} = 'withdrawal_confirmed' THEN ${gatewayLedger.amount} ELSE 0 END), 0)`,
        transactionCount: count()
      })
      .from(gatewayLedger)
      .where(whereClause);

    const summary = summaryResult[0];
    const totalDeposits = parseFloat(summary.totalDeposits);
    const totalWithdrawals = parseFloat(summary.totalWithdrawals);
    const netVolume = totalDeposits - totalWithdrawals;

    // Get breakdown by time period
    const periodColumn = groupBy === 'month' 
      ? sql`date_trunc('month', ${gatewayLedger.createdAt})`
      : groupBy === 'week'
      ? sql`date_trunc('week', ${gatewayLedger.createdAt})`
      : sql`date_trunc('day', ${gatewayLedger.createdAt})`;

    const breakdownResult = await db
      .select({
        period: periodColumn,
        deposits: sql<string>`COALESCE(SUM(CASE WHEN ${gatewayLedger.type} = 'deposit' THEN ${gatewayLedger.amount} ELSE 0 END), 0)`,
        withdrawals: sql<string>`COALESCE(SUM(CASE WHEN ${gatewayLedger.type} = 'withdrawal_confirmed' THEN ${gatewayLedger.amount} ELSE 0 END), 0)`,
        transactionCount: count()
      })
      .from(gatewayLedger)
      .where(whereClause)
      .groupBy(periodColumn)
      .orderBy(periodColumn);

    const breakdown = breakdownResult.map(row => ({
      period: row.period,
      deposits: parseFloat(row.deposits),
      withdrawals: parseFloat(row.withdrawals),
      netVolume: parseFloat(row.deposits) - parseFloat(row.withdrawals),
      transactionCount: row.transactionCount
    }));

    return c.json({
      summary: {
        totalDeposits,
        totalWithdrawals,
        netVolume,
        transactionCount: summary.transactionCount
      },
      breakdown
    });
  } catch (error) {
    console.error('Failed to get volume analytics:', error);
    return c.json({ error: 'Failed to get volume analytics' }, 500);
  }
});

// GET /api/gateway/reports/sessions - Session summary report
gatewayReportRoutes.get('/api/gateway/reports/sessions', async (c) => {
  const merchantId = c.get('merchantId') as string;
  
  if (!merchantId) {
    return c.json({ error: 'Merchant ID is required' }, 400);
  }

  try {
    const from = c.req.query('from');
    const to = c.req.query('to');
    const status = c.req.query('status');

    // Build where conditions
    const conditions = [eq(gatewaySessions.merchantId, merchantId)];
    
    if (from) {
      conditions.push(gte(gatewaySessions.createdAt, new Date(from)));
    }
    
    if (to) {
      conditions.push(lte(gatewaySessions.createdAt, new Date(to)));
    }
    
    if (status) {
      conditions.push(eq(gatewaySessions.status, status));
    }

    const whereClause = and(...conditions);

    // Get session summary by status
    const summaryResult = await db
      .select({
        status: gatewaySessions.status,
        count: count(),
        totalAmount: sql<string>`COALESCE(SUM(${gatewaySessions.amount}), 0)`
      })
      .from(gatewaySessions)
      .where(whereClause)
      .groupBy(gatewaySessions.status);

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(gatewaySessions)
      .where(whereClause);

    const total = totalResult[0].count;

    // Transform to byStatus object
    const byStatus: Record<string, { count: number; amount: number }> = {};
    
    summaryResult.forEach(row => {
      byStatus[row.status] = {
        count: row.count,
        amount: parseFloat(row.totalAmount)
      };
    });

    return c.json({
      summary: {
        total,
        byStatus
      }
    });
  } catch (error) {
    console.error('Failed to get session summary:', error);
    return c.json({ error: 'Failed to get session summary' }, 500);
  }
});

// GET /api/gateway/reports/export/csv - Export transactions as CSV
gatewayReportRoutes.get('/api/gateway/reports/export/csv', async (c) => {
  const merchantId = c.get('merchantId') as string;
  
  if (!merchantId) {
    return c.json({ error: 'Merchant ID is required' }, 400);
  }

  try {
    const playerRef = c.req.query('playerRef');
    const type = c.req.query('type');
    const from = c.req.query('from');
    const to = c.req.query('to');

    // Build where conditions (same as transactions endpoint)
    const conditions = [eq(gatewayLedger.merchantId, merchantId)];
    
    if (playerRef) {
      conditions.push(eq(gatewayLedger.playerRef, playerRef));
    }
    
    if (type) {
      conditions.push(eq(gatewayLedger.type, type));
    }
    
    if (from) {
      conditions.push(gte(gatewayLedger.createdAt, new Date(from)));
    }
    
    if (to) {
      conditions.push(lte(gatewayLedger.createdAt, new Date(to)));
    }

    const whereClause = and(...conditions);

    // Get all matching transactions (no pagination for export)
    const transactions = await db
      .select()
      .from(gatewayLedger)
      .where(whereClause)
      .orderBy(desc(gatewayLedger.createdAt))
      .limit(10000); // Safety cap

    // Build CSV
    const headers = ['id', 'merchant_id', 'player_ref', 'type', 'amount', 'currency', 'session_id', 'dispute_id', 'balance_before', 'balance_after', 'description', 'created_at'];
    
    const csvRows = [headers.join(',')];
    
    for (const tx of transactions) {
      const row = [
        tx.id,
        tx.merchantId,
        tx.playerRef,
        tx.type,
        tx.amount,
        tx.currency,
        tx.sessionId || '',
        tx.disputeId || '',
        tx.balanceBefore,
        tx.balanceAfter,
        `"${(tx.description || '').replace(/"/g, '""')}"`,
        tx.createdAt.toISOString(),
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');

    // Return as CSV file download
    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="transactions_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Failed to export transactions as CSV:', error);
    return c.json({ error: 'Failed to export transactions' }, 500);
  }
});

export default gatewayReportRoutes;