'use client';

import { useEffect, useState } from 'react';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { adminFetch } from '@/lib/admin-api';

interface Transaction {
  wallet: string;
  type: 'sent' | 'received' | 'escrow_created';
  amount: number;
  token: string;
  txSignature: string;
  status: string;
  created: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
  });

  const fetchTransactions = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(typeFilter !== 'all' && { type: typeFilter }),
      });
      
      const response = await adminFetch(`/api/admin/transactions?${queryParams}`);
      setTransactions(response.transactions || []);
      setPagination(prev => ({ ...prev, total: response.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [pagination.page, pagination.limit, typeFilter]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  };

  const truncateWallet = (wallet: string) => {
    return `${wallet.slice(0, 6)}...${wallet.slice(-6)}`;
  };

  const truncateSignature = (signature: string) => {
    return `${signature.slice(0, 8)}...${signature.slice(-8)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTypeBadge = (type: Transaction['type']) => {
    const styles = {
      sent: 'bg-[var(--color-hover)] text-[var(--color-text)]',
      received: 'bg-[#E8F5E0] text-[#4D9A2A]',
      escrow_created: 'bg-purple-100 text-purple-800',
    };

    const labels = {
      sent: 'Sent',
      received: 'Received',
      escrow_created: 'Escrow Created',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[type]}`}>
        {labels[type]}
      </span>
    );
  };

  const getSolanaExplorerUrl = (signature: string) => {
    return `https://explorer.solana.com/tx/${signature}`;
  };

  const columns = [
    {
      key: 'wallet',
      label: 'Wallet',
      render: (transaction: Transaction) => (
        <span className="font-mono text-sm">
          {truncateWallet(transaction.wallet)}
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
      render: (transaction: Transaction) => `${transaction.amount} ${transaction.token}`,
    },
    {
      key: 'txSignature',
      label: 'Transaction',
      render: (transaction: Transaction) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm">
            {truncateSignature(transaction.txSignature)}
          </span>
          <a
            href={getSolanaExplorerUrl(transaction.txSignature)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-text)] hover:text-[var(--color-text-secondary)]"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (transaction: Transaction) => transaction.status,
    },
    {
      key: 'created',
      label: 'Created',
      render: (transaction: Transaction) => formatDate(transaction.created),
    },
  ];

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-[var(--color-skeleton)] rounded w-48 mb-4"></div>
          <div className="h-64 bg-[var(--color-skeleton)]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-[#FEF2F2] border border-[#FECACA] p-4 md:p-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[var(--color-red)] mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-[#991B1B]">Failed to load data</h3>
              <p className="text-sm text-[var(--color-red)] mt-1">{error}</p>
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

  const filterComponent = (
    <select
      value={typeFilter}
      onChange={(e) => setTypeFilter(e.target.value)}
      className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm min-h-[44px]"
    >
      <option value="all">All Types</option>
      <option value="sent">Sent</option>
      <option value="received">Received</option>
      <option value="escrow_created">Escrow Created</option>
    </select>
  );

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Transactions</h1>
        <p className="text-[var(--color-muted)]">Manage and view all transactions</p>
      </div>

      <AdminDataTable
        data={transactions}
        columns={columns}
        searchPlaceholder="Search by wallet or transaction signature..."
        searchKey="wallet"
        pagination={{
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          onPageChange: handlePageChange,
          onLimitChange: handleLimitChange,
        }}
        filters={filterComponent}
      />
    </div>
  );
}