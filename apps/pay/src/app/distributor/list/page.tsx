'use client';

import { useEffect, useState, useCallback } from 'react';
import { distributorFetch } from '@/lib/distributor-api';

interface Distributor {
  id: string;
  name: string;
  walletAddress: string;
  parentId: string | null;
  tier: 'master' | 'sub' | 'agent';
  commissionPercent: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  merchantCount: number;
}

interface CreateDistributorForm {
  name: string;
  walletAddress: string;
  tier: 'master' | 'sub' | 'agent';
  parentId: string | null;
  commissionPercent: string;
}

export default function DistributorListPage() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [allDistributors, setAllDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nameFilter, setNameFilter] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
  });
  const [createForm, setCreateForm] = useState<CreateDistributorForm>({
    name: '',
    walletAddress: '',
    tier: 'agent',
    parentId: null,
    commissionPercent: '1.0',
  });

  const fetchDistributors = useCallback(async () => {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      const queryParams = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: offset.toString(),
      });
      
      const response = await distributorFetch(`/api/gateway/distributors?${queryParams}`);
      setDistributors(response.distributors || []);
      setPagination(prev => ({ ...prev, total: response.total || 0 }));
      
      // Also fetch all distributors for parent dropdown (without pagination)
      if (allDistributors.length === 0) {
        const allResponse = await distributorFetch('/api/gateway/distributors');
        setAllDistributors(allResponse.distributors || []);
      }
    } catch (error) {
      console.error('Failed to fetch distributors:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, allDistributors.length]);

  useEffect(() => {
    setLoading(true);
    fetchDistributors();
  }, [fetchDistributors]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleCreateDistributor = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      await distributorFetch('/api/gateway/distributors', {
        method: 'POST',
        body: JSON.stringify({
          name: createForm.name.trim(),
          walletAddress: createForm.walletAddress.trim(),
          tier: createForm.tier,
          parentId: createForm.parentId || null,
          commissionPercent: createForm.commissionPercent,
        }),
      });

      setShowCreateModal(false);
      setCreateForm({
        name: '',
        walletAddress: '',
        tier: 'agent',
        parentId: null,
        commissionPercent: '1.0',
      });
      
      // Refresh list
      setLoading(true);
      await fetchDistributors();
    } catch (error) {
      console.error('Failed to create distributor:', error);
      alert(error instanceof Error ? error.message : 'Failed to create distributor');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeactivate = async (distributorId: string) => {
    if (!confirm('Are you sure you want to deactivate this distributor?')) return;

    try {
      await distributorFetch(`/api/gateway/distributors/${distributorId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'inactive' }),
      });
      
      // Refresh list
      setLoading(true);
      await fetchDistributors();
    } catch (error) {
      console.error('Failed to deactivate distributor:', error);
      alert(error instanceof Error ? error.message : 'Failed to deactivate distributor');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTierBadge = (tier: string) => {
    const tierColors: Record<string, string> = {
      master: 'bg-[#EEF2FF] text-[#6366F1]',
      sub: 'bg-[#E8F5E0] text-[#4D9A2A]',
      agent: 'bg-[#FEF3C7] text-[#F59E0B]',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${tierColors[tier] || 'bg-gray-100 text-gray-800'}`}>
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const isActive = status === 'active';
    const style = isActive
      ? 'bg-[#E8F5E0] text-[#4D9A2A]'
      : 'bg-[#FEF2F2] text-[#EF4444]';

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${style}`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const truncateAddress = (address: string) => {
    return address.length > 16 ? `${address.slice(0, 8)}...${address.slice(-8)}` : address;
  };

  // Filter distributors
  const filteredDistributors = distributors.filter(distributor => {
    const matchesName = !nameFilter || distributor.name.toLowerCase().includes(nameFilter.toLowerCase());
    const matchesTier = tierFilter === 'all' || distributor.tier === tierFilter;
    const matchesStatus = statusFilter === 'all' || distributor.status === statusFilter;
    return matchesName && matchesTier && matchesStatus;
  });

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
              <h3 className="text-sm font-semibold text-[#991B1B]">Failed to load distributors</h3>
              <p className="text-sm text-[#991B1B] mt-1">{error}</p>
              <button
                onClick={() => { setError(null); setLoading(true); fetchDistributors(); }}
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

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Distributors</h1>
          <p className="text-[var(--color-muted)]">Manage distributor network and hierarchy</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[var(--color-button)] text-[var(--color-button-text)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-button-hover)] transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create New
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search by name..."
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="border border-[var(--color-border)] px-3 py-2 text-sm min-h-[40px] w-48 bg-[var(--color-surface)] text-[var(--color-text)]"
          />
          
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="border border-[var(--color-border)] px-3 py-2 text-sm min-h-[40px] bg-[var(--color-surface)] text-[var(--color-text)]"
          >
            <option value="all">All Tiers</option>
            <option value="master">Master</option>
            <option value="sub">Sub</option>
            <option value="agent">Agent</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-[var(--color-border)] px-3 py-2 text-sm min-h-[40px] bg-[var(--color-surface)] text-[var(--color-text)]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Distributors Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left py-3 px-4 text-[var(--color-muted)] font-medium">Name</th>
                <th className="text-left py-3 px-4 text-[var(--color-muted)] font-medium">Wallet Address</th>
                <th className="text-left py-3 px-4 text-[var(--color-muted)] font-medium">Tier</th>
                <th className="text-left py-3 px-4 text-[var(--color-muted)] font-medium">Commission</th>
                <th className="text-left py-3 px-4 text-[var(--color-muted)] font-medium">Merchants</th>
                <th className="text-left py-3 px-4 text-[var(--color-muted)] font-medium">Status</th>
                <th className="text-left py-3 px-4 text-[var(--color-muted)] font-medium">Created</th>
                <th className="text-left py-3 px-4 text-[var(--color-muted)] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDistributors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-[var(--color-muted)]">
                    No distributors found
                  </td>
                </tr>
              ) : (
                filteredDistributors.map((distributor) => (
                  <tr key={distributor.id} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-hover)] transition-colors">
                    <td className="py-3 px-4 text-[var(--color-text)] font-medium">
                      {distributor.name}
                    </td>
                    <td className="py-3 px-4 text-[var(--color-text)] font-mono text-xs">
                      {truncateAddress(distributor.walletAddress)}
                    </td>
                    <td className="py-3 px-4">
                      {getTierBadge(distributor.tier)}
                    </td>
                    <td className="py-3 px-4 text-[var(--color-text)] font-medium">
                      {parseFloat(distributor.commissionPercent).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-[var(--color-text)]">
                      {distributor.merchantCount}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(distributor.status)}
                    </td>
                    <td className="py-3 px-4 text-[var(--color-muted)] text-xs">
                      {formatDate(distributor.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeactivate(distributor.id)}
                          disabled={distributor.status === 'inactive'}
                          className="text-xs text-[#EF4444] hover:text-[#DC2626] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Deactivate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-[var(--color-border)]">
            <div className="text-sm text-[var(--color-muted)]">
              Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-[var(--color-text)]">
                {pagination.page} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === totalPages}
                className="px-3 py-1 text-sm border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Distributor Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">Create New Distributor</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateDistributor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
                  placeholder="Enter distributor name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Wallet Address</label>
                <input
                  type="text"
                  required
                  value={createForm.walletAddress}
                  onChange={(e) => setCreateForm({ ...createForm, walletAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] font-mono text-sm"
                  placeholder="Enter wallet address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Tier</label>
                <select
                  value={createForm.tier}
                  onChange={(e) => setCreateForm({ ...createForm, tier: e.target.value as 'master' | 'sub' | 'agent' })}
                  className="w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
                >
                  <option value="master">Master</option>
                  <option value="sub">Sub</option>
                  <option value="agent">Agent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Parent (Optional)</label>
                <select
                  value={createForm.parentId || ''}
                  onChange={(e) => setCreateForm({ ...createForm, parentId: e.target.value || null })}
                  className="w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
                >
                  <option value="">No Parent</option>
                  {allDistributors.map((dist) => (
                    <option key={dist.id} value={dist.id}>
                      {dist.name} ({dist.tier})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Commission %</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  value={createForm.commissionPercent}
                  onChange={(e) => setCreateForm({ ...createForm, commissionPercent: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
                  placeholder="e.g., 2.5"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 text-sm border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 px-4 py-2 text-sm bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {createLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}