'use client';

import { useEffect, useState } from 'react';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { adminFetch } from '@/lib/admin-api';

interface Escrow {
  address: string;
  creator: string;
  amount: number;
  token: string;
  expiry: string;
  claimed: boolean;
  refunded: boolean;
}

export default function EscrowsPage() {
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
  });

  const fetchEscrows = async () => {
    setError(null);
    try {
      const response = await adminFetch(`/api/admin/escrows?page=${pagination.page}&limit=${pagination.limit}`);
      setEscrows(response.escrows || []);
      setPagination(prev => ({ ...prev, total: response.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch escrows:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscrows();
  }, [pagination.page, pagination.limit]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const truncateWallet = (wallet: string) => {
    return `${wallet.slice(0, 6)}...${wallet.slice(-6)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getBooleanBadge = (value: boolean, trueText: string, falseText: string) => {
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
        value 
          ? 'bg-[#E8F5E0] text-[#4D9A2A]' 
          : 'bg-[var(--color-hover)] text-[var(--color-text)]'
      }`}>
        {value ? trueText : falseText}
      </span>
    );
  };

  const columns = [
    {
      key: 'address',
      label: 'Address',
      render: (escrow: Escrow) => (
        <span className="font-mono text-sm">
          {truncateAddress(escrow.address)}
        </span>
      ),
    },
    {
      key: 'creator',
      label: 'Creator',
      render: (escrow: Escrow) => (
        <span className="font-mono text-sm">
          {truncateWallet(escrow.creator)}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (escrow: Escrow) => `${escrow.amount} ${escrow.token}`,
    },
    {
      key: 'expiry',
      label: 'Expiry',
      render: (escrow: Escrow) => formatDate(escrow.expiry),
    },
    {
      key: 'claimed',
      label: 'Claimed',
      render: (escrow: Escrow) => getBooleanBadge(escrow.claimed, 'Yes', 'No'),
    },
    {
      key: 'refunded',
      label: 'Refunded',
      render: (escrow: Escrow) => getBooleanBadge(escrow.refunded, 'Yes', 'No'),
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
        <div className="bg-[#FEF2F2] border border-[#FECACA] p-4 md:p-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[var(--color-red)] mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-[#991B1B]">Failed to load data</h3>
              <p className="text-sm text-[var(--color-red)] mt-1">{error}</p>
              <button
                onClick={() => { setError(null); setLoading(true); fetchEscrows(); }}
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
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Escrows</h1>
        <p className="text-[var(--color-muted)]">Manage and view all escrow contracts</p>
      </div>

      <AdminDataTable
        data={escrows}
        columns={columns}
        searchPlaceholder="Search by escrow address..."
        searchKey="address"
        pagination={{
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          onPageChange: handlePageChange,
          onLimitChange: handleLimitChange,
        }}
      />
    </div>
  );
}