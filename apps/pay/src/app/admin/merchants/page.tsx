'use client';

import { useEffect, useState } from 'react';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { adminFetch } from '@/lib/admin-api';
import { useAdminAuth } from '@/components/admin/AdminAuthGate';

interface Merchant {
  id: string;
  name: string;
  walletAddress: string;
  feePercentage: number;
  status: 'active' | 'inactive';
  distributor: string;
  createdAt: string;
}

export default function MerchantsPage() {
  const { isMaster } = useAdminAuth();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
  });

  // Access denied for non-master users
  if (!isMaster) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-[var(--color-surface)] border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[var(--color-text)] mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text)]">Access Denied</h3>
              <p className="text-sm text-[var(--color-muted)] mt-1">
                This page is only accessible to master administrators.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const fetchMerchants = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: filters.search,
        status: filters.status,
      });
      
      const response = await adminFetch(`/api/admin/merchants?${params}`);
      setMerchants(response.merchants || []);
      setPagination(prev => ({ ...prev, total: response.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch merchants:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, [pagination.page, pagination.limit, filters.search, filters.status]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  };

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({ ...prev, status }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-[var(--color-text)] text-[var(--color-bg)]',
      inactive: 'bg-[var(--color-hover)] text-[var(--color-muted)]',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-none ${styles[status as keyof typeof styles] || styles.inactive}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (merchant: Merchant) => merchant.name,
    },
    {
      key: 'walletAddress',
      label: 'Wallet Address',
      render: (merchant: Merchant) => (
        <span className="font-mono text-sm">
          {truncateAddress(merchant.walletAddress)}
        </span>
      ),
    },
    {
      key: 'feePercentage',
      label: 'Fee %',
      render: (merchant: Merchant) => `${merchant.feePercentage}%`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (merchant: Merchant) => getStatusBadge(merchant.status),
    },
    {
      key: 'distributor',
      label: 'Distributor',
      render: (merchant: Merchant) => merchant.distributor || '-',
    },
    {
      key: 'createdAt',
      label: 'Created At',
      render: (merchant: Merchant) => formatDate(merchant.createdAt),
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
                onClick={() => { setError(null); setLoading(true); fetchMerchants(); }}
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
        <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Merchant Management</h1>
        <p className="text-[var(--color-muted)]">View and manage all merchants (Master only)</p>
      </div>

      <AdminDataTable
        data={merchants}
        columns={columns}
        searchPlaceholder="Search by name or wallet address..."
        onSearch={handleSearch}
        pagination={{
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          onPageChange: handlePageChange,
          onLimitChange: handleLimitChange,
        }}
        filters={
          <select
            value={filters.status}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="border border-[var(--color-border)] rounded px-3 py-2 text-sm min-h-[44px] bg-[var(--color-surface)]"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        }
      />
    </div>
  );
}