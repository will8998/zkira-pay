'use client';

import { useEffect, useState } from 'react';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { adminFetch } from '@/lib/admin-api';

interface User {
  wallet: string;
  firstSeen: string;
  lastSeen: string;
  totalPayments: number;
  totalVolume: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
  });

  const fetchUsers = async () => {
    setError(null);
    try {
      const response = await adminFetch(`/api/admin/users?page=${pagination.page}&limit=${pagination.limit}`);
      setUsers(response.users || []);
      setPagination(prev => ({ ...prev, total: response.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, pagination.limit]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  };

  const truncateWallet = (wallet: string) => {
    return `${wallet.slice(0, 8)}...${wallet.slice(-8)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const columns = [
    {
      key: 'wallet',
      label: 'Wallet',
      render: (user: User) => (
        <span className="font-mono text-sm">
          {truncateWallet(user.wallet)}
        </span>
      ),
    },
    {
      key: 'firstSeen',
      label: 'First Seen',
      render: (user: User) => formatDate(user.firstSeen),
    },
    {
      key: 'lastSeen',
      label: 'Last Seen',
      render: (user: User) => formatDate(user.lastSeen),
    },
    {
      key: 'totalPayments',
      label: 'Total Payments',
      render: (user: User) => user.totalPayments.toLocaleString(),
    },
    {
      key: 'totalVolume',
      label: 'Total Volume',
      render: (user: User) => `$${user.totalVolume.toLocaleString()}`,
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
                onClick={() => { setError(null); setLoading(true); fetchUsers(); }}
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
        <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Users</h1>
        <p className="text-[var(--color-muted)]">Manage and view all platform users</p>
      </div>

      <AdminDataTable
        data={users}
        columns={columns}
        searchPlaceholder="Search by wallet address..."
        searchKey="wallet"
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