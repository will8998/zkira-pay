'use client';

import { useEffect, useState } from 'react';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { adminFetch } from '@/lib/admin-api';
import { useAdminAuth } from '@/components/admin/AdminAuthGate';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  keyPrefix: string;
  wallet: string;
  name: string;
  created: string;
  lastUsed: string | null;
  active: boolean;
}

export default function ApiKeysPage() {
  const { isMaster } = useAdminAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
  });

  const fetchApiKeys = async () => {
    try {
      const response = await adminFetch(`/api/admin/api-keys?page=${pagination.page}&limit=${pagination.limit}`);
      setApiKeys(response.apiKeys || []);
      setPagination(prev => ({ ...prev, total: response.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, [pagination.page, pagination.limit]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  };

  const handleRevokeApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key?')) {
      return;
    }

    try {
      await adminFetch(`/api/admin/api-keys/${id}`, {
        method: 'DELETE',
      });
      toast.success('API key revoked successfully');
      fetchApiKeys(); // Refresh the list
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      toast.error('Failed to revoke API key');
    }
  };

  const truncateWallet = (wallet: string) => {
    return `${wallet.slice(0, 6)}...${wallet.slice(-6)}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const getActiveBadge = (active: boolean) => {
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-none ${
        active 
          ? 'bg-[var(--color-text)] text-[var(--color-bg)]' 
          : 'bg-[var(--color-hover)] text-[var(--color-muted)]'
      }`}>
        {active ? 'Active' : 'Revoked'}
      </span>
    );
  };

  const columns = [
    {
      key: 'keyPrefix',
      label: 'Key Prefix',
      render: (apiKey: ApiKey) => (
        <span className="font-mono text-sm">
          {apiKey.keyPrefix}...
        </span>
      ),
    },
    ...(isMaster ? [{
      key: 'wallet',
      label: 'Wallet',
      render: (apiKey: ApiKey) => (
        <span className="font-mono text-sm">
          {truncateWallet(apiKey.wallet)}
        </span>
      ),
    }] : []),
    {
      key: 'name',
      label: 'Name',
      render: (apiKey: ApiKey) => apiKey.name || '-',
    },
    {
      key: 'created',
      label: 'Created',
      render: (apiKey: ApiKey) => formatDate(apiKey.created),
    },
    {
      key: 'lastUsed',
      label: 'Last Used',
      render: (apiKey: ApiKey) => formatDate(apiKey.lastUsed),
    },
    {
      key: 'active',
      label: 'Status',
      render: (apiKey: ApiKey) => getActiveBadge(apiKey.active),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (apiKey: ApiKey) => (
        apiKey.active ? (
          <button
            onClick={() => handleRevokeApiKey(apiKey.id)}
            className="text-[var(--color-text)] hover:text-[var(--color-muted)] text-sm font-medium"
          >
            Revoke
          </button>
        ) : null
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
                onClick={() => { setError(null); setLoading(true); fetchApiKeys(); }}
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
        <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">API Keys</h1>
        <p className="text-[var(--color-muted)]">Manage and view all API keys</p>
      </div>

      <AdminDataTable
        data={apiKeys}
        columns={columns}
        searchPlaceholder="Search by key prefix or wallet..."
        searchKey="keyPrefix"
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