'use client';

import { useEffect, useState } from 'react';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { adminFetch } from '@/lib/admin-api';
import { useAdminAuth } from '@/components/admin/AdminAuthGate';

interface Merchant {
  id: string;
  name: string;
  walletAddress: string;
  feePercent: string;
  status: 'active' | 'inactive';
  distributorId: string | null;
  webhookUrl: string | null;
  createdAt: string;
}

export default function MerchantsPage() {
  const { isMaster } = useAdminAuth();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ name: '', walletAddress: '', webhookUrl: '', feePercent: '1.00' });
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
      key: 'feePercent',
      label: 'Fee %',
      render: (merchant: Merchant) => `${merchant.feePercent}%`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (merchant: Merchant) => getStatusBadge(merchant.status),
    },
    {
      key: 'webhookUrl',
      label: 'Webhook',
      render: (merchant: Merchant) => merchant.webhookUrl ? '✓' : '-',
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

  const handleCreateMerchant = async () => {
    if (!formData.name || !formData.walletAddress) return;
    setCreating(true);
    try {
      await adminFetch('/api/admin/merchants', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          walletAddress: formData.walletAddress,
          webhookUrl: formData.webhookUrl || undefined,
          feePercent: parseFloat(formData.feePercent) || 1,
        }),
      });
      setFormData({ name: '', walletAddress: '', webhookUrl: '', feePercent: '1.00' });
      setShowCreate(false);
      fetchMerchants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create merchant');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Merchant Management</h1>
          <p className="text-[var(--color-muted)]">View and manage all merchants (Master only)</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] font-medium transition-colors text-sm rounded"
        >
          {showCreate ? 'Cancel' : '+ Add Merchant'}
        </button>
      </div>

      {/* Create Merchant Form */}
      {showCreate && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6">
          <h3 className="text-lg font-bold text-[var(--color-text)] mb-4" style={{ fontFamily: 'var(--font-mono)' }}>NEW MERCHANT</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-[var(--color-muted)] mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Lucky Casino"
                className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-muted)] mb-1">Wallet Address *</label>
              <input
                type="text"
                value={formData.walletAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, walletAddress: e.target.value }))}
                placeholder="0x..."
                className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] rounded text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-muted)] mb-1">Webhook URL</label>
              <input
                type="text"
                value={formData.webhookUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, webhookUrl: e.target.value }))}
                placeholder="https://casino.com/webhook"
                className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-muted)] mb-1">Fee %</label>
              <input
                type="number"
                step="0.01"
                value={formData.feePercent}
                onChange={(e) => setFormData(prev => ({ ...prev, feePercent: e.target.value }))}
                className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] rounded text-sm"
              />
            </div>
          </div>
          <button
            onClick={handleCreateMerchant}
            disabled={creating || !formData.name || !formData.walletAddress}
            className="px-6 py-2 bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] font-medium transition-colors disabled:opacity-40 text-sm rounded"
          >
            {creating ? 'Creating...' : 'Create Merchant'}
          </button>
        </div>
      )}

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