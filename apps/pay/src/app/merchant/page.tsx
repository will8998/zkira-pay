'use client';

import { useEffect, useState } from 'react';
import { merchantFetch } from '@/lib/merchant-api';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface DashboardStats {
  totalDeposited: number;
  totalWithdrawn: number;
  activePlayers: number;
  pendingWithdrawals: number;
}

interface VolumeDataPoint {
  label: string;
  deposits: number;
  withdrawals: number;
}

interface RecentTransaction {
  id: string;
  playerRef: string;
  type: string;
  amount: string;
  currency: string;
  description: string | null;
  createdAt: string;
}

interface DashboardData {
  stats: DashboardStats;
  volumeChart: VolumeDataPoint[];
  recentTransactions: RecentTransaction[];
}

export default function MerchantDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      // Fetch all data in parallel
      const [volumeResponse, balancesResponse, transactionsResponse, pendingWithdrawalsResponse] = await Promise.all([
        merchantFetch('/api/gateway/reports/volume?groupBy=day'),
        merchantFetch('/api/gateway/reports/balances'),
        merchantFetch('/api/gateway/reports/transactions?limit=10'),
        merchantFetch('/api/gateway/withdrawals?status=pending&limit=1'),
      ]);

      // Stats from volume summary + balances total + pending withdrawals count
      const stats: DashboardStats = {
        totalDeposited: volumeResponse.summary?.totalDeposits || 0,
        totalWithdrawn: volumeResponse.summary?.totalWithdrawals || 0,
        activePlayers: balancesResponse.total || 0,
        pendingWithdrawals: pendingWithdrawalsResponse.total || 0,
      };

      // Volume breakdown: API returns { period, deposits, withdrawals, netVolume, transactionCount }
      const volumeChart: VolumeDataPoint[] = (volumeResponse.breakdown || []).map((item: { period: string; deposits: number; withdrawals: number }) => ({
        label: new Date(item.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        deposits: item.deposits,
        withdrawals: item.withdrawals,
      }));

      setData({
        stats,
        volumeChart,
        recentTransactions: transactionsResponse.transactions || [],
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-[var(--color-skeleton)] rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-[var(--color-skeleton)]"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="h-80 bg-[var(--color-skeleton)]"></div>
            <div className="h-80 bg-[var(--color-skeleton)]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-[#FEF2F2] border border-[#FECACA] p-4 md:p-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[#991B1B] mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-[#991B1B]">Failed to load dashboard</h3>
              <p className="text-sm text-[#991B1B] mt-1">{error}</p>
              <button
                onClick={() => { setError(null); setLoading(true); fetchDashboardData(); }}
                className="mt-3 bg-[var(--color-button)] text-[var(--color-button-text)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-button-hover)] transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    if (type === 'deposit') {
      return (
        <div className="w-8 h-8 bg-[#E8F5E0] rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-[#4D9A2A]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
      );
    }
    return (
      <div className="w-8 h-8 bg-[#FEF2F2] rounded-full flex items-center justify-center">
        <svg className="w-4 h-4 text-[#EF4444]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
        </svg>
      </div>
    );
  };

  const truncatePlayerRef = (playerRef: string) => {
    return playerRef.length > 12 ? `${playerRef.slice(0, 8)}...${playerRef.slice(-4)}` : playerRef;
  };

  /** Map ledger type to user-friendly label */
  const formatLedgerType = (type: string): string => {
    const typeMap: Record<string, string> = {
      deposit: 'Deposit',
      withdrawal_hold: 'Withdrawal Hold',
      withdrawal_confirmed: 'Withdrawal',
      withdrawal_cancelled: 'Withdrawal Reversed',
      platform_fee: 'Platform Fee',
      dispute_hold: 'Dispute Hold',
      dispute_release: 'Dispute Release',
      dispute_refund: 'Dispute Refund',
    };
    return typeMap[type] || type;
  };

  /** Determine if the type is a "positive" flow (deposit) or "negative" flow (withdrawal) */
  const isPositiveType = (type: string) => {
    return type === 'deposit' || type === 'withdrawal_cancelled' || type === 'dispute_release';
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Dashboard</h1>
        <p className="text-[var(--color-muted)]">Overview of your merchant activity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#E8F5E0] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#4D9A2A]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--color-muted)]">Total Deposited</p>
              <p className="text-lg font-semibold text-[var(--color-text)]">
                {formatCurrency(data?.stats.totalDeposited || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#FEF2F2] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#EF4444]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--color-muted)]">Total Withdrawn</p>
              <p className="text-lg font-semibold text-[var(--color-text)]">
                {formatCurrency(data?.stats.totalWithdrawn || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#EEF2FF] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#6366F1]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--color-muted)]">Active Players</p>
              <p className="text-lg font-semibold text-[var(--color-text)]">
                {data?.stats.activePlayers || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#FEF3C7] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#F59E0B]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--color-muted)]">Pending Withdrawals</p>
              <p className="text-lg font-semibold text-[var(--color-text)]">
                {data?.stats.pendingWithdrawals || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Volume Chart */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 md:p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">
            Volume (Last 30 Days)
          </h3>
          <div className="h-64">
            {(data?.volumeChart.length || 0) > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.volumeChart || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis 
                    dataKey="label" 
                    stroke="var(--color-muted)" 
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="var(--color-muted)" 
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '4px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="deposits" 
                    stackId="1"
                    stroke="#4D9A2A" 
                    fill="#4D9A2A" 
                    fillOpacity={0.6}
                    name="Deposits"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="withdrawals" 
                    stackId="2"
                    stroke="#EF4444" 
                    fill="#EF4444" 
                    fillOpacity={0.6}
                    name="Withdrawals"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--color-muted)]">
                No volume data for this period
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--color-text)]">Recent Transactions</h3>
            <a
              href="/merchant/transactions"
              className="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 transition-colors"
            >
              View All
            </a>
          </div>
          
          <div className="space-y-3">
            {data?.recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[var(--color-muted)]">No recent transactions</p>
              </div>
            ) : (
              data?.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text)]">
                        {truncatePlayerRef(transaction.playerRef)}
                      </p>
                      <p className="text-xs text-[var(--color-muted)]">
                        {formatDate(transaction.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      isPositiveType(transaction.type) ? 'text-[#4D9A2A]' : 'text-[#EF4444]'
                    }`}>
                      {isPositiveType(transaction.type) ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {formatLedgerType(transaction.type)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
