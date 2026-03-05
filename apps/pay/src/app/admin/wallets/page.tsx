'use client';

import { useEffect, useState } from 'react';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { adminFetch } from '@/lib/admin-api';

interface EphemeralWallet {
  address: string;
  chain: string;
  token: string;
  amount: number;
  flow: 'send' | 'invoice' | 'deposit';
  status: 'active' | 'swept' | 'expired' | 'empty';
  createdAt: string;
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<EphemeralWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
    chain: '',
  });

  const fetchWallets = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: filters.status,
        chain: filters.chain,
      });
      
      const response = await adminFetch(`/api/admin/wallets?${params}`);
      setWallets(response.wallets || []);
      setPagination(prev => ({ ...prev, total: response.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, [pagination.page, pagination.limit, filters.status, filters.chain]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({ ...prev, status }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleChainFilter = (chain: string) => {
    setFilters(prev => ({ ...prev, chain }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const formatAmount = (amount: number, token: string) => {
    return `${amount.toLocaleString()} ${token}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-[var(--color-text)] text-[var(--color-bg)]',
      swept: 'bg-[var(--color-hover)] text-[var(--color-muted)]',
      expired: 'bg-[var(--color-hover)] text-[var(--color-muted)]',
      empty: 'border border-[var(--color-border)] text-[var(--color-muted)] bg-transparent',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-none ${styles[status as keyof typeof styles] || styles.empty}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getFlowBadge = (flow: string) => {
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-none border border-[var(--color-border)] text-[var(--color-text)] bg-transparent">
        {flow.charAt(0).toUpperCase() + flow.slice(1)}
      </span>
    );
  };

  const columns = [
    {
      key: 'address',
      label: 'Address',
      render: (wallet: EphemeralWallet) => (
        <span className="font-mono text-sm">
          {truncateAddress(wallet.address)}
        </span>
      ),
    },
    {
      key: 'chain',
      label: 'Chain',
      render: (wallet: EphemeralWallet) => wallet.chain.charAt(0).toUpperCase() + wallet.chain.slice(1),
    },
    {
      key: 'token',
      label: 'Token',
      render: (wallet: EphemeralWallet) => wallet.token.toUpperCase(),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (wallet: EphemeralWallet) => formatAmount(wallet.amount, wallet.token),
    },
    {
      key: 'flow',
      label: 'Flow',
      render: (wallet: EphemeralWallet) => getFlowBadge(wallet.flow),
    },
    {
      key: 'status',
      label: 'Status',
      render: (wallet: EphemeralWallet) => getStatusBadge(wallet.status),
    },
    {
      key: 'createdAt',
      label: 'Created At',
      render: (wallet: EphemeralWallet) => formatDate(wallet.createdAt),
    },
  ];

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-[var(--color-skeleton)] rounded w-48 mb-4"></div>
          <div className="h-64 bg-[var(--color-skeleton)] rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-[var(--color-surface)] border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[var(--color-text)] mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text)]">Failed to load data</h3>
              <p className="text-sm text-[var(--color-muted)] mt-1">{error}</p>
              <button
                onClick={() => { setError(null); setLoading(true); fetchWallets(); }}
                className="mt-3 bg-[var(--color-button)] text-[var(--color-bg)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-button-hover)] transition-colors"
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
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Ephemeral Wallets</h1>
        <p className="text-[var(--color-muted)]">View and manage all ephemeral wallets</p>
      </div>

      <AdminDataTable
        data={wallets}
        columns={columns}
        searchPlaceholder="Search by address..."
        searchKey="address"
        pagination={{
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          onPageChange: handlePageChange,
          onLimitChange: handleLimitChange,
        }}
        filters={
          <div className="flex gap-2">
            <select
              value={filters.status}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="border border-[var(--color-border)] rounded px-3 py-2 text-sm min-h-[44px] bg-[var(--color-surface)]"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="swept">Swept</option>
              <option value="expired">Expired</option>
              <option value="empty">Empty</option>
            </select>
            <select
              value={filters.chain}
              onChange={(e) => handleChainFilter(e.target.value)}
              className="border border-[var(--color-border)] rounded px-3 py-2 text-sm min-h-[44px] bg-[var(--color-surface)]"
            >
              <option value="">All Chains</option>
              <option value="arbitrum">Arbitrum</option>
              <option value="tron">Tron</option>
            </select>
          </div>
        }
      />
    </div>
  );
}