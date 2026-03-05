'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { merchantFetch } from '@/lib/merchant-api';

interface Transaction {
  id: string;
  merchantId: string;
  playerRef: string;
  type: string;
  amount: string;
  currency: string;
  sessionId: string | null;
  disputeId: string | null;
  balanceBefore: string;
  balanceAfter: string;
  description: string | null;
  createdAt: string;
}

export default function MerchantTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerRefFilter, setPlayerRefFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
  });

  const fetchTransactions = useCallback(async () => {
    try {
      // API uses offset-based pagination
      const offset = (pagination.page - 1) * pagination.limit;
      const queryParams = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: offset.toString(),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(playerRefFilter && { playerRef: playerRefFilter }),
        ...(dateFromFilter && { from: dateFromFilter }),
        ...(dateToFilter && { to: dateToFilter }),
      });
      
      const response = await merchantFetch(`/api/gateway/reports/transactions?${queryParams}`);
      setTransactions(response.transactions || []);
      setPagination(prev => ({ ...prev, total: response.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, typeFilter, playerRefFilter, dateFromFilter, dateToFilter]);

  const handleExportCSV = () => {
    const apiKey = localStorage.getItem('omnipay_merchant_api_key');
    if (!apiKey) return;

    const queryParams = new URLSearchParams({
      ...(typeFilter !== 'all' && { type: typeFilter }),
      ...(playerRefFilter && { playerRef: playerRefFilter }),
      ...(dateFromFilter && { from: dateFromFilter }),
      ...(dateToFilter && { to: dateToFilter }),
    });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const url = `${apiUrl}/api/gateway/reports/export/csv?${queryParams}`;
    
    // Use fetch with auth header, then trigger download from blob
    fetch(url, {
      headers: {
        'X-API-Key': apiKey,
      },
    })
      .then(res => {
        if (!res.ok) throw new Error('Export failed');
        return res.blob();
      })
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      })
      .catch(err => console.error('CSV export failed:', err));
  };

  useEffect(() => {
    setLoading(true);
    fetchTransactions();
  }, [fetchTransactions]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  };

  const truncatePlayerRef = (playerRef: string) => {
    return playerRef.length > 16 ? `${playerRef.slice(0, 8)}...${playerRef.slice(-8)}` : playerRef;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num);
  };

  /** Map ledger type to user-friendly label */
  const formatLedgerType = (type: string): string => {
    const typeMap: Record<string, string> = {
      deposit: 'Deposit',
      withdrawal_hold: 'Withdrawal Hold',
      withdrawal_confirmed: 'Withdrawal',
      withdrawal_cancelled: 'Reversal',
      platform_fee: 'Platform Fee',
      dispute_hold: 'Dispute Hold',
      dispute_release: 'Dispute Release',
      dispute_refund: 'Dispute Refund',
    };
    return typeMap[type] || type;
  };

  const getTypeBadge = (type: string) => {
    const isPositive = type === 'deposit' || type === 'withdrawal_cancelled' || type === 'dispute_release';
    const style = isPositive
      ? 'bg-[#E8F5E0] text-[#4D9A2A]'
      : 'bg-[#FEF2F2] text-[#EF4444]';

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${style}`}>
        {formatLedgerType(type)}
      </span>
    );
  };

  const isPositiveType = (type: string) => {
    return type === 'deposit' || type === 'withdrawal_cancelled' || type === 'dispute_release';
  };

  const columns = [
    {
      key: 'playerRef',
      label: 'Player',
      render: (transaction: Transaction) => (
        <span className="font-mono text-sm text-[var(--color-text)]">
          {truncatePlayerRef(transaction.playerRef)}
        </span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (transaction: Transaction) => getTypeBadge(transaction.type),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (transaction: Transaction) => (
        <span className={`font-semibold ${
          isPositiveType(transaction.type) ? 'text-[#4D9A2A]' : 'text-[#EF4444]'
        }`}>
          {isPositiveType(transaction.type) ? '+' : '-'}{formatCurrency(transaction.amount)}
        </span>
      ),
    },
    {
      key: 'currency',
      label: 'Currency',
      render: (transaction: Transaction) => (
        <span className="text-sm text-[var(--color-text)] uppercase">
          {transaction.currency}
        </span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (transaction: Transaction) => (
        <span className="text-sm text-[var(--color-muted)] truncate max-w-[200px] block">
          {transaction.description || '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (transaction: Transaction) => (
        <span className="text-sm text-[var(--color-muted)]">
          {formatDate(transaction.createdAt)}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-[var(--color-skeleton)] rounded w-48 mb-4"></div>
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
              <h3 className="text-sm font-semibold text-[#991B1B]">Failed to load transactions</h3>
              <p className="text-sm text-[#991B1B] mt-1">{error}</p>
              <button
                onClick={() => { setError(null); setLoading(true); fetchTransactions(); }}
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

  const filtersComponent = (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        placeholder="Player Ref"
        value={playerRefFilter}
        onChange={(e) => { setPlayerRefFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
        className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm min-h-[44px] w-40"
      />
      
      <select
        value={typeFilter}
        onChange={(e) => { setTypeFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
        className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm min-h-[44px]"
      >
        <option value="all">All Types</option>
        <option value="deposit">Deposits</option>
        <option value="withdrawal_hold">Withdrawal Holds</option>
        <option value="withdrawal_confirmed">Withdrawals</option>
        <option value="withdrawal_cancelled">Reversals</option>
        <option value="platform_fee">Platform Fees</option>
      </select>

      <input
        type="date"
        placeholder="From Date"
        value={dateFromFilter}
        onChange={(e) => { setDateFromFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
        className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm min-h-[44px]"
      />

      <input
        type="date"
        placeholder="To Date"
        value={dateToFilter}
        onChange={(e) => { setDateToFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
        className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm min-h-[44px]"
      />

      <button
        onClick={handleExportCSV}
        className="bg-[var(--color-button)] text-[var(--color-button-text)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-button-hover)] transition-colors flex items-center gap-2 min-h-[44px]"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        Export CSV
      </button>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Transactions</h1>
          <p className="text-[var(--color-muted)]">View and manage transaction history</p>
        </div>
      </div>

      <AdminDataTable
        data={transactions}
        columns={columns}
        searchPlaceholder="Search by player reference..."
        searchKey="playerRef"
        pagination={{
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          onPageChange: handlePageChange,
          onLimitChange: handleLimitChange,
        }}
        filters={filtersComponent}
      />
    </div>
  );
}
