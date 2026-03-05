'use client';

import { useEffect, useState } from 'react';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { merchantFetch } from '@/lib/merchant-api';

interface PlayerBalance {
  merchantId: string;
  playerRef: string;
  availableBalance: string;
  pendingBalance: string;
  totalDeposited: string;
  totalWithdrawn: string;
  currency: string;
  updatedAt: string;
}

interface BalanceSummary {
  totalPlayers: number;
  totalAvailable: number;
  totalPending: number;
  totalDeposited: number;
  totalWithdrawn: number;
}

export default function MerchantBalancesPage() {
  const [balances, setBalances] = useState<PlayerBalance[]>([]);
  const [summary, setSummary] = useState<BalanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchBalances = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery) {
        queryParams.append('playerRef', searchQuery);
      }
      
      const response = await merchantFetch(`/api/gateway/reports/balances?${queryParams}`);
      const playerBalances: PlayerBalance[] = response.balances || [];
      setBalances(playerBalances);

      // Calculate summary from the balances array
      const totalPlayers = response.total || playerBalances.length;
      let totalAvailable = 0;
      let totalPending = 0;
      let totalDeposited = 0;
      let totalWithdrawn = 0;

      for (const b of playerBalances) {
        totalAvailable += parseFloat(b.availableBalance || '0');
        totalPending += parseFloat(b.pendingBalance || '0');
        totalDeposited += parseFloat(b.totalDeposited || '0');
        totalWithdrawn += parseFloat(b.totalWithdrawn || '0');
      }

      setSummary({ totalPlayers, totalAvailable, totalPending, totalDeposited, totalWithdrawn });
    } catch (error) {
      console.error('Failed to fetch balances:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchBalances();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const truncatePlayerRef = (playerRef: string) => {
    return playerRef.length > 20 ? `${playerRef.slice(0, 10)}...${playerRef.slice(-10)}` : playerRef;
  };

  const formatCurrency = (amount: string | number) => {
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

  const getActivityBadge = (updatedAt: string) => {
    const lastUpdate = new Date(updatedAt);
    const now = new Date();
    const daysSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceUpdate <= 7) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-[#E8F5E0] text-[#4D9A2A]">
          Active
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-[var(--color-hover)] text-[var(--color-muted)]">
        Inactive
      </span>
    );
  };

  const getNetBalance = (balance: PlayerBalance) => {
    return parseFloat(balance.totalDeposited || '0') - parseFloat(balance.totalWithdrawn || '0');
  };

  const columns = [
    {
      key: 'playerRef',
      label: 'Player Reference',
      render: (balance: PlayerBalance) => (
        <div>
          <span className="font-mono text-sm text-[var(--color-text)]">
            {truncatePlayerRef(balance.playerRef)}
          </span>
          <div className="mt-1">{getActivityBadge(balance.updatedAt)}</div>
        </div>
      ),
    },
    {
      key: 'availableBalance',
      label: 'Available Balance',
      render: (balance: PlayerBalance) => (
        <span className="font-semibold text-[var(--color-text)]">
          {formatCurrency(balance.availableBalance)}
        </span>
      ),
    },
    {
      key: 'pendingBalance',
      label: 'Pending',
      render: (balance: PlayerBalance) => (
        <span className="font-medium text-[var(--color-muted)]">
          {formatCurrency(balance.pendingBalance)}
        </span>
      ),
    },
    {
      key: 'totalDeposited',
      label: 'Total Deposited',
      render: (balance: PlayerBalance) => (
        <span className="text-sm text-[#4D9A2A]">
          {formatCurrency(balance.totalDeposited)}
        </span>
      ),
    },
    {
      key: 'totalWithdrawn',
      label: 'Total Withdrawn',
      render: (balance: PlayerBalance) => (
        <span className="text-sm text-[#EF4444]">
          {formatCurrency(balance.totalWithdrawn)}
        </span>
      ),
    },
    {
      key: 'netBalance',
      label: 'Net Balance',
      render: (balance: PlayerBalance) => {
        const net = getNetBalance(balance);
        return (
          <span className={`text-sm font-medium ${
            net >= 0 ? 'text-[#4D9A2A]' : 'text-[#EF4444]'
          }`}>
            {formatCurrency(net)}
          </span>
        );
      },
    },
    {
      key: 'updatedAt',
      label: 'Last Activity',
      render: (balance: PlayerBalance) => (
        <span className="text-xs text-[var(--color-muted)]">
          {formatDate(balance.updatedAt)}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-[var(--color-skeleton)] rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-[var(--color-skeleton)] rounded"></div>
            ))}
          </div>
          <div className="h-10 bg-[var(--color-skeleton)] rounded mb-4"></div>
          <div className="h-64 bg-[var(--color-skeleton)] rounded"></div>
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
              <h3 className="text-sm font-semibold text-[#991B1B]">Failed to load balances</h3>
              <p className="text-sm text-[#991B1B] mt-1">{error}</p>
              <button
                onClick={() => { setError(null); setLoading(true); fetchBalances(); }}
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

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Player Balances</h1>
        <p className="text-[var(--color-muted)]">Overview of all player balances and activity</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#EEF2FF] rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#6366F1]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-[var(--color-muted)]">Total Players</p>
                <p className="text-lg font-semibold text-[var(--color-text)]">
                  {summary.totalPlayers.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#E8F5E0] rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#4D9A2A]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-[var(--color-muted)]">Total Available</p>
                <p className="text-lg font-semibold text-[var(--color-text)]">
                  {formatCurrency(summary.totalAvailable)}
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
                <p className="text-sm text-[var(--color-muted)]">Total Pending</p>
                <p className="text-lg font-semibold text-[var(--color-text)]">
                  {formatCurrency(summary.totalPending)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#F3E8FF] rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#8B5CF6]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-[var(--color-muted)]">Net Volume</p>
                <p className="text-lg font-semibold text-[var(--color-text)]">
                  {formatCurrency(summary.totalDeposited - summary.totalWithdrawn)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Balances Table */}
      <AdminDataTable
        data={balances}
        columns={columns}
        searchPlaceholder="Search by player reference..."
        searchKey="playerRef"
        onSearch={setSearchQuery}
      />
    </div>
  );
}
