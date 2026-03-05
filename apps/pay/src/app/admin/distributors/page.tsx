'use client';

import { useEffect, useState } from 'react';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { adminFetch } from '@/lib/admin-api';
import { useAdminAuth } from '@/components/admin/AdminAuthGate';
import { toast } from 'sonner';

interface Distributor {
  id: string;
  name: string;
  walletAddress: string;
  tier: 'master' | 'sub' | 'agent';
  commissionPercent: number;
  status: 'active' | 'inactive';
  trackingCode: string | null;
  merchantCount: number;
  createdAt: string;
  updatedAt: string;
}

interface DistributorVolume {
  totalSourceVolume: number;
  totalCommissions: number;
  transactionCount: number;
  currency: string;
}

interface DistributorPayout {
  id: string;
  distributorId: string;
  amount: number;
  currency: string;
  txHash: string | null;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  processedAt: string | null;
}

export default function DistributorsPage() {
  const { isMaster } = useAdminAuth();
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [expandedDistributor, setExpandedDistributor] = useState<string | null>(null);
  const [distributorVolume, setDistributorVolume] = useState<Record<string, DistributorVolume>>({});
  const [distributorPayouts, setDistributorPayouts] = useState<Record<string, DistributorPayout[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingVolume, setLoadingVolume] = useState<Record<string, boolean>>({});
  const [loadingPayouts, setLoadingPayouts] = useState<Record<string, boolean>>({});
  const [recordingPayout, setRecordingPayout] = useState<Record<string, boolean>>({});
  const [updatingDistributor, setUpdatingDistributor] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    walletAddress: '', 
    tier: 'sub' as 'master' | 'sub' | 'agent',
    commissionPercent: '2.50',
    trackingCode: ''
  });
  const [editFormData, setEditFormData] = useState<Record<string, { 
    name: string; 
    commissionPercent: string; 
    status: 'active' | 'inactive'; 
    trackingCode: string;
  }>>({});
  const [payoutFormData, setPayoutFormData] = useState<Record<string, {
    amount: string;
    currency: string;
    txHash: string;
  }>>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isMaster) return;
    fetchDistributors();
  }, [isMaster, pagination.page, pagination.limit, filters.search, filters.status]);

  // Auto-dismiss success and error messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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

  const fetchDistributors = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: filters.search,
        status: filters.status,
      });
      
      const response = await adminFetch(`/api/admin/distributors?${params}`);
      setDistributors(response.distributors || []);
      setPagination(prev => ({ ...prev, total: response.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch distributors:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      toast.error('Failed to fetch distributors');
    } finally {
      setLoading(false);
    }
  };

  const fetchDistributorVolume = async (distributorId: string) => {
    if (loadingVolume[distributorId]) return;
    setLoadingVolume(prev => ({ ...prev, [distributorId]: true }));
    try {
      const response = await adminFetch(`/api/admin/distributors/${distributorId}/volume`);
      setDistributorVolume(prev => ({ ...prev, [distributorId]: response }));
    } catch (error) {
      console.error('Failed to fetch distributor volume:', error);
      toast.error('Failed to load volume data');
    } finally {
      setLoadingVolume(prev => ({ ...prev, [distributorId]: false }));
    }
  };

  const fetchDistributorPayouts = async (distributorId: string) => {
    if (loadingPayouts[distributorId]) return;
    setLoadingPayouts(prev => ({ ...prev, [distributorId]: true }));
    try {
      const response = await adminFetch(`/api/admin/distributors/${distributorId}/payouts?limit=20&offset=0`);
      setDistributorPayouts(prev => ({ ...prev, [distributorId]: response.payouts || [] }));
    } catch (error) {
      console.error('Failed to fetch distributor payouts:', error);
      toast.error('Failed to load payout data');
    } finally {
      setLoadingPayouts(prev => ({ ...prev, [distributorId]: false }));
    }
  };

  const updateDistributor = async (distributorId: string) => {
    const editData = editFormData[distributorId];
    if (!editData || updatingDistributor[distributorId]) return;
    
    setUpdatingDistributor(prev => ({ ...prev, [distributorId]: true }));
    try {
      const response = await adminFetch(`/api/admin/distributors/${distributorId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editData.name,
          commissionPercent: parseFloat(editData.commissionPercent),
          status: editData.status,
          trackingCode: editData.trackingCode || null,
        }),
      });
      
      // Update the distributor in the local state
      setDistributors(prev => prev.map(dist => 
        dist.id === distributorId 
          ? { ...dist, ...response.distributor }
          : dist
      ));
      
      toast.success('Distributor updated successfully');
      setSuccessMessage('Distributor updated successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update distributor';
      setError(message);
      toast.error(message);
    } finally {
      setUpdatingDistributor(prev => ({ ...prev, [distributorId]: false }));
    }
  };

  const recordPayout = async (distributorId: string) => {
    const payoutData = payoutFormData[distributorId];
    if (!payoutData || !payoutData.amount || recordingPayout[distributorId]) return;
    
    setRecordingPayout(prev => ({ ...prev, [distributorId]: true }));
    try {
      await adminFetch(`/api/admin/distributors/${distributorId}/payouts`, {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(payoutData.amount),
          currency: payoutData.currency,
          txHash: payoutData.txHash || null,
        }),
      });
      
      // Reset form and refresh payouts
      setPayoutFormData(prev => ({
        ...prev,
        [distributorId]: { amount: '', currency: 'USDC', txHash: '' }
      }));
      await fetchDistributorPayouts(distributorId);
      
      toast.success('Payout recorded successfully');
      setSuccessMessage('Payout recorded successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to record payout';
      setError(message);
      toast.error(message);
    } finally {
      setRecordingPayout(prev => ({ ...prev, [distributorId]: false }));
    }
  };

  const handleCreateDistributor = async () => {
    if (!formData.name || !formData.walletAddress) return;
    setCreating(true);
    try {
      await adminFetch('/api/admin/distributors', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          walletAddress: formData.walletAddress,
          tier: formData.tier,
          commissionPercent: parseFloat(formData.commissionPercent),
          trackingCode: formData.trackingCode || null,
        }),
      });
      setFormData({ name: '', walletAddress: '', tier: 'sub', commissionPercent: '2.50', trackingCode: '' });
      setShowCreate(false);
      await fetchDistributors();
      toast.success('Distributor created successfully');
      setSuccessMessage('Distributor created successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create distributor';
      setError(message);
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };


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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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

  const getTierBadge = (tier: string) => {
    const styles = {
      master: 'bg-[var(--color-text)] text-[var(--color-bg)]',
      sub: 'bg-[var(--color-button)] text-[var(--color-button-text)]',
      agent: 'bg-[var(--color-hover)] text-[var(--color-muted)]',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-none ${styles[tier as keyof typeof styles] || styles.agent}`}>
        {tier.toUpperCase()}
      </span>
    );
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (distributor: Distributor) => distributor.name,
    },
    {
      key: 'walletAddress',
      label: 'Wallet Address',
      render: (distributor: Distributor) => (
        <span className="font-mono text-sm">
          {truncateAddress(distributor.walletAddress)}
        </span>
      ),
    },
    {
      key: 'tier',
      label: 'Tier',
      render: (distributor: Distributor) => getTierBadge(distributor.tier),
    },
    {
      key: 'commissionPercent',
      label: 'Commission %',
      render: (distributor: Distributor) => `${distributor.commissionPercent}%`,
    },
    {
      key: 'trackingCode',
      label: 'Tracking Code',
      render: (distributor: Distributor) => (
        <span className="font-mono text-sm">
          {distributor.trackingCode || '-'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (distributor: Distributor) => getStatusBadge(distributor.status),
    },
    {
      key: 'merchantCount',
      label: 'Merchants',
      render: (distributor: Distributor) => <span className="text-sm">{distributor.merchantCount}</span>,
    },
    {
      key: 'createdAt',
      label: 'Created At',
      render: (distributor: Distributor) => formatDate(distributor.createdAt),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (distributor: Distributor) => (
        <button
          onClick={() => {
            if (expandedDistributor === distributor.id) {
              setExpandedDistributor(null);
            } else {
              setExpandedDistributor(distributor.id);
              // Initialize edit form data
              setEditFormData(prev => ({
                ...prev,
                [distributor.id]: {
                  name: distributor.name,
                  commissionPercent: distributor.commissionPercent.toString(),
                  status: distributor.status,
                  trackingCode: distributor.trackingCode || '',
                }
              }));
              // Initialize payout form data
              setPayoutFormData(prev => ({
                ...prev,
                [distributor.id]: { amount: '', currency: 'USDC', txHash: '' }
              }));
              fetchDistributorVolume(distributor.id);
              fetchDistributorPayouts(distributor.id);
            }
          }}
          className="px-3 py-1 bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] text-xs rounded transition-colors"
        >
          {expandedDistributor === distributor.id ? 'Close' : 'Manage'}
        </button>
      ),
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
                onClick={() => { setError(null); setLoading(true); fetchDistributors(); }}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Distributor Management</h1>
          <p className="text-[var(--color-muted)]">Manage distributors, commissions, and payouts (Master only)</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] font-medium transition-colors text-sm rounded"
        >
          {showCreate ? 'Cancel' : '+ Add Distributor'}
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-[var(--color-surface)] border-1.5 border-[var(--color-text)] p-4 md:p-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[var(--color-text)] mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-[var(--color-text)]">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-[var(--color-surface)] border-1.5 border-red-500 p-4 md:p-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-red-500">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Create Distributor Form */}
      {showCreate && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6">
          <h3 className="text-lg font-bold text-[var(--color-text)] mb-4" style={{ fontFamily: 'var(--font-mono)' }}>NEW DISTRIBUTOR</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-[var(--color-muted)] mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Regional Partner"
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
              <label className="block text-xs font-bold text-[var(--color-muted)] mb-1">Tier *</label>
              <select
                value={formData.tier}
                onChange={(e) => setFormData(prev => ({ ...prev, tier: e.target.value as 'master' | 'sub' | 'agent' }))}
                className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] rounded text-sm"
              >
                <option value="sub">Sub Distributor</option>
                <option value="agent">Agent</option>
                <option value="master">Master</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-muted)] mb-1">Commission %</label>
              <input
                type="number"
                step="0.01"
                value={formData.commissionPercent}
                onChange={(e) => setFormData(prev => ({ ...prev, commissionPercent: e.target.value }))}
                className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] rounded text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[var(--color-muted)] mb-1">Tracking Code</label>
              <input
                type="text"
                value={formData.trackingCode}
                onChange={(e) => setFormData(prev => ({ ...prev, trackingCode: e.target.value }))}
                placeholder="PARTNER2024"
                className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] rounded text-sm font-mono"
              />
            </div>
          </div>
          <button
            onClick={handleCreateDistributor}
            disabled={creating || !formData.name || !formData.walletAddress}
            className="px-6 py-2 bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] font-medium transition-colors disabled:opacity-40 text-sm rounded"
          >
            {creating ? 'Creating...' : 'Create Distributor'}
          </button>
        </div>
      )}

      <AdminDataTable
        data={distributors}
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

      {/* Expanded Distributor Details */}
      {expandedDistributor && (() => {
        const distributor = distributors.find(d => d.id === expandedDistributor);
        if (!distributor) return null;
        const volume = distributorVolume[distributor.id];
        const payouts = distributorPayouts[distributor.id] || [];
        const editData = editFormData[distributor.id];
        const payoutData = payoutFormData[distributor.id];

        return (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-mono)' }}>
                MANAGE: {distributor.name.toUpperCase()}
              </h3>
              <button
                onClick={() => setExpandedDistributor(null)}
                className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Edit Section */}
              <div>
                <h4 className="text-sm font-bold text-[var(--color-text)] uppercase tracking-wide mb-4">Edit Distributor</h4>
                
                {editData && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-[var(--color-muted)] mb-1">Name</label>
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditFormData(prev => ({
                          ...prev,
                          [distributor.id]: { ...editData, name: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--color-muted)] mb-1">Commission %</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editData.commissionPercent}
                        onChange={(e) => setEditFormData(prev => ({
                          ...prev,
                          [distributor.id]: { ...editData, commissionPercent: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--color-muted)] mb-1">Status</label>
                      <select
                        value={editData.status}
                        onChange={(e) => setEditFormData(prev => ({
                          ...prev,
                          [distributor.id]: { ...editData, status: e.target.value as 'active' | 'inactive' }
                        }))}
                        className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] rounded text-sm"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--color-muted)] mb-1">Tracking Code</label>
                      <input
                        type="text"
                        value={editData.trackingCode}
                        onChange={(e) => setEditFormData(prev => ({
                          ...prev,
                          [distributor.id]: { ...editData, trackingCode: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] rounded text-sm font-mono"
                      />
                    </div>
                    <button
                      onClick={() => updateDistributor(distributor.id)}
                      disabled={updatingDistributor[distributor.id]}
                      className="w-full px-3 py-2 bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] text-sm rounded transition-colors disabled:opacity-50"
                    >
                      {updatingDistributor[distributor.id] ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>

              {/* Volume Section */}
              <div>
                <h4 className="text-sm font-bold text-[var(--color-text)] uppercase tracking-wide mb-4">Volume & Commissions</h4>
                
                {loadingVolume[distributor.id] ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-16 bg-[var(--color-hover)] rounded"></div>
                    <div className="h-16 bg-[var(--color-hover)] rounded"></div>
                    <div className="h-16 bg-[var(--color-hover)] rounded"></div>
                  </div>
                ) : volume ? (
                  <div className="space-y-3">
                    <div className="border border-[var(--color-border)] rounded p-3">
                      <div className="text-xs font-bold text-[var(--color-muted)] uppercase mb-1">Total Source Volume</div>
                      <div className="text-lg font-bold text-[var(--color-text)]">${volume.totalSourceVolume.toLocaleString()}</div>
                      <div className="text-xs text-[var(--color-muted)]">{volume.currency}</div>
                    </div>
                    <div className="border border-[var(--color-border)] rounded p-3">
                      <div className="text-xs font-bold text-[var(--color-muted)] uppercase mb-1">Total Commissions</div>
                      <div className="text-lg font-bold text-[var(--color-text)]">${volume.totalCommissions.toLocaleString()}</div>
                      <div className="text-xs text-[var(--color-muted)]">{volume.currency}</div>
                    </div>
                    <div className="border border-[var(--color-border)] rounded p-3">
                      <div className="text-xs font-bold text-[var(--color-muted)] uppercase mb-1">Transaction Count</div>
                      <div className="text-lg font-bold text-[var(--color-text)]">{volume.transactionCount.toLocaleString()}</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--color-muted)] italic">No volume data available.</p>
                )}
              </div>

              {/* Payout Section */}
              <div>
                <h4 className="text-sm font-bold text-[var(--color-text)] uppercase tracking-wide mb-4">Payouts</h4>
                
                {/* Record New Payout */}
                {payoutData && (
                  <div className="mb-4 p-3 border border-[var(--color-border)] rounded">
                    <h5 className="text-xs font-bold text-[var(--color-muted)] uppercase mb-2">Record Payout</h5>
                    <div className="space-y-2">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Amount"
                        value={payoutData.amount}
                        onChange={(e) => setPayoutFormData(prev => ({
                          ...prev,
                          [distributor.id]: { ...payoutData, amount: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] rounded text-sm"
                      />
                      <select
                        value={payoutData.currency}
                        onChange={(e) => setPayoutFormData(prev => ({
                          ...prev,
                          [distributor.id]: { ...payoutData, currency: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] rounded text-sm"
                      >
                        <option value="USDC">USDC</option>
                        <option value="SOL">SOL</option>
                        <option value="USDT">USDT</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Transaction Hash (optional)"
                        value={payoutData.txHash}
                        onChange={(e) => setPayoutFormData(prev => ({
                          ...prev,
                          [distributor.id]: { ...payoutData, txHash: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] rounded text-sm font-mono"
                      />
                      <button
                        onClick={() => recordPayout(distributor.id)}
                        disabled={!payoutData.amount || recordingPayout[distributor.id]}
                        className="w-full px-3 py-2 bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] text-sm rounded transition-colors disabled:opacity-50"
                      >
                        {recordingPayout[distributor.id] ? 'Recording...' : 'Record Payout'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Payout History */}
                <div>
                  <h5 className="text-xs font-bold text-[var(--color-muted)] uppercase mb-2">Payout History</h5>
                  {loadingPayouts[distributor.id] ? (
                    <div className="animate-pulse h-32 bg-[var(--color-hover)] rounded"></div>
                  ) : payouts.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {payouts.map((payout) => (
                        <div key={payout.id} className="border border-[var(--color-border)] rounded p-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold text-[var(--color-text)]">${payout.amount} {payout.currency}</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-none ${
                              payout.status === 'completed' ? 'bg-[var(--color-text)] text-[var(--color-bg)]' :
                              payout.status === 'pending' ? 'bg-[var(--color-button)] text-[var(--color-button-text)]' :
                              'bg-red-500 text-white'
                            }`}>
                              {payout.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-xs text-[var(--color-muted)]">
                            {formatDateTime(payout.createdAt)}
                          </div>
                          {payout.txHash && (
                            <div className="text-xs font-mono text-[var(--color-muted)] mt-1">
                              Tx: {truncateAddress(payout.txHash)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--color-muted)] italic">No payouts recorded yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}