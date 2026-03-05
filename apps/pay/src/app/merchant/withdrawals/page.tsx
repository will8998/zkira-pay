'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { merchantFetch } from '@/lib/merchant-api';

interface WithdrawalSession {
  id: string;
  merchantId: string;
  sessionType: string;
  playerRef: string;
  amount: string;
  token: string;
  chain: string;
  recipientAddress: string | null;
  referrerAddress: string | null;
  platformFee: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'failed';
  txHash: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export default function MerchantWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerRefFilter, setPlayerRefFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalSession | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
  });

  const fetchWithdrawals = useCallback(async () => {
    try {
      // API uses offset-based pagination
      const offset = (pagination.page - 1) * pagination.limit;
      const queryParams = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: offset.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(playerRefFilter && { playerRef: playerRefFilter }),
      });
      
      const response = await merchantFetch(`/api/gateway/withdrawals?${queryParams}`);
      setWithdrawals(response.withdrawals || []);
      setPagination(prev => ({ ...prev, total: response.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, playerRefFilter]);

  useEffect(() => {
    setLoading(true);
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  };

  const truncatePlayerRef = (playerRef: string) => {
    return playerRef.length > 16 ? `${playerRef.slice(0, 8)}...${playerRef.slice(-8)}` : playerRef;
  };

  const truncateAddress = (address?: string | null) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const truncateHash = (hash?: string | null) => {
    if (!hash) return 'N/A';
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
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

  const getStatusBadge = (status: WithdrawalSession['status']) => {
    const styles = {
      pending: 'bg-[#FEF3C7] text-[#F59E0B]',
      confirmed: 'bg-[#E8F5E0] text-[#4D9A2A]',
      cancelled: 'bg-[#FEF2F2] text-[#EF4444]',
      failed: 'bg-[#FEF2F2] text-[#EF4444]',
    };

    const labels = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      cancelled: 'Cancelled',
      failed: 'Failed',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getSolanaExplorerUrl = (hash?: string | null) => {
    if (!hash) return '#';
    return `https://explorer.solana.com/tx/${hash}`;
  };

  const getTimeRemaining = (expiresAt?: string) => {
    if (!expiresAt) return null;
    
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const columns = [
    {
      key: 'playerRef',
      label: 'Player',
      render: (withdrawal: WithdrawalSession) => (
        <span className="font-mono text-sm text-[var(--color-text)]">
          {truncatePlayerRef(withdrawal.playerRef)}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (withdrawal: WithdrawalSession) => (
        <span className="font-semibold text-[var(--color-text)]">
          {formatCurrency(withdrawal.amount)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (withdrawal: WithdrawalSession) => getStatusBadge(withdrawal.status),
    },
    {
      key: 'recipientAddress',
      label: 'Destination',
      render: (withdrawal: WithdrawalSession) => (
        <span className="font-mono text-xs text-[var(--color-muted)]">
          {truncateAddress(withdrawal.recipientAddress)}
        </span>
      ),
    },
    {
      key: 'txHash',
      label: 'Transaction',
      render: (withdrawal: WithdrawalSession) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[var(--color-muted)]">
            {truncateHash(withdrawal.txHash)}
          </span>
          {withdrawal.txHash && (
            <a
              href={getSolanaExplorerUrl(withdrawal.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-accent)] hover:text-[var(--color-accent)]/80"
              title="View on Solana Explorer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (withdrawal: WithdrawalSession) => (
        <span className="text-sm text-[var(--color-muted)]">
          {formatDate(withdrawal.createdAt)}
        </span>
      ),
    },
    {
      key: 'expiresAt',
      label: 'Time Left',
      render: (withdrawal: WithdrawalSession) => {
        if (withdrawal.status !== 'pending') return <span className="text-[var(--color-muted)]">-</span>;
        const timeLeft = getTimeRemaining(withdrawal.expiresAt);
        if (!timeLeft) return <span className="text-[var(--color-muted)]">-</span>;
        
        return (
          <span className={`text-xs font-medium ${
            timeLeft === 'Expired' ? 'text-[#EF4444]' : 'text-[var(--color-muted)]'
          }`}>
            {timeLeft}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (withdrawal: WithdrawalSession) => (
        <button
          onClick={() => setSelectedWithdrawal(withdrawal)}
          className="text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 text-sm font-medium"
        >
          View Details
        </button>
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
              <h3 className="text-sm font-semibold text-[#991B1B]">Failed to load withdrawals</h3>
              <p className="text-sm text-[#991B1B] mt-1">{error}</p>
              <button
                onClick={() => { setError(null); setLoading(true); fetchWithdrawals(); }}
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
        value={statusFilter}
        onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
        className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm min-h-[44px]"
      >
        <option value="all">All Status</option>
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="cancelled">Cancelled</option>
        <option value="failed">Failed</option>
      </select>
    </div>
  );

  return (
    <>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Withdrawals</h1>
            <p className="text-[var(--color-muted)]">Manage withdrawal sessions</p>
          </div>
        </div>

        <AdminDataTable
          data={withdrawals}
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

      {/* Withdrawal Details Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-[var(--color-text)]">Withdrawal Details</h2>
                <button
                  onClick={() => setSelectedWithdrawal(null)}
                  className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[var(--color-muted)] uppercase tracking-wider">Player Ref</label>
                    <p className="font-mono text-sm text-[var(--color-text)] mt-1">{selectedWithdrawal.playerRef}</p>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--color-muted)] uppercase tracking-wider">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedWithdrawal.status)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[var(--color-muted)] uppercase tracking-wider">Amount</label>
                    <p className="font-semibold text-[var(--color-text)] mt-1">{formatCurrency(selectedWithdrawal.amount)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--color-muted)] uppercase tracking-wider">Token</label>
                    <p className="text-sm text-[var(--color-text)] mt-1">{selectedWithdrawal.token}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[var(--color-muted)] uppercase tracking-wider">Chain</label>
                    <p className="text-sm text-[var(--color-text)] mt-1">{selectedWithdrawal.chain}</p>
                  </div>
                  {selectedWithdrawal.platformFee && parseFloat(selectedWithdrawal.platformFee) > 0 && (
                    <div>
                      <label className="text-xs text-[var(--color-muted)] uppercase tracking-wider">Platform Fee</label>
                      <p className="text-sm text-[var(--color-text)] mt-1">{formatCurrency(selectedWithdrawal.platformFee)}</p>
                    </div>
                  )}
                </div>

                {selectedWithdrawal.recipientAddress && (
                  <div>
                    <label className="text-xs text-[var(--color-muted)] uppercase tracking-wider">Recipient Address</label>
                    <p className="font-mono text-sm text-[var(--color-text)] mt-1 break-all">{selectedWithdrawal.recipientAddress}</p>
                  </div>
                )}

                {selectedWithdrawal.txHash && (
                  <div>
                    <label className="text-xs text-[var(--color-muted)] uppercase tracking-wider">Transaction Hash</label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-mono text-sm text-[var(--color-text)] break-all">{selectedWithdrawal.txHash}</p>
                      <a
                        href={getSolanaExplorerUrl(selectedWithdrawal.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                      </a>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[var(--color-muted)] uppercase tracking-wider">Created</label>
                    <p className="text-sm text-[var(--color-text)] mt-1">{formatDate(selectedWithdrawal.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--color-muted)] uppercase tracking-wider">Last Updated</label>
                    <p className="text-sm text-[var(--color-text)] mt-1">{formatDate(selectedWithdrawal.updatedAt)}</p>
                  </div>
                </div>

                {selectedWithdrawal.expiresAt && selectedWithdrawal.status === 'pending' && (
                  <div>
                    <label className="text-xs text-[var(--color-muted)] uppercase tracking-wider">Expires</label>
                    <p className="text-sm text-[var(--color-text)] mt-1">
                      {formatDate(selectedWithdrawal.expiresAt)} 
                      <span className="ml-2 text-[var(--color-muted)]">
                        ({getTimeRemaining(selectedWithdrawal.expiresAt)})
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
