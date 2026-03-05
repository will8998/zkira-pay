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
  allowedOrigins: string[];
  createdAt: string;
}

interface ApiKey {
  id: string;
  walletAddress: string;
  keyPrefix: string;
  name: string | null;
  createdAt: string;
  lastUsed: string | null;
  isActive: boolean;
}

export default function MerchantsPage() {
  const { isMaster } = useAdminAuth();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [apiKeys, setApiKeys] = useState<Record<string, ApiKey[]>>({});
  const [expandedMerchant, setExpandedMerchant] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingKeys, setLoadingKeys] = useState<Record<string, boolean>>({});
  const [generatingKey, setGeneratingKey] = useState<Record<string, boolean>>({});
  const [updatingOrigins, setUpdatingOrigins] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generatedKey, setGeneratedKey] = useState<{ key: string; merchantId: string } | null>(null);
  const [formData, setFormData] = useState({ name: '', walletAddress: '', webhookUrl: '', feePercent: '1.00' });
  const [newOriginInput, setNewOriginInput] = useState<Record<string, string>>({});
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

  const fetchApiKeys = async () => {
    try {
      const response = await adminFetch('/api/admin/api-keys');
      const keysByWallet: Record<string, ApiKey[]> = {};
      response.apiKeys.forEach((key: ApiKey) => {
        if (!keysByWallet[key.walletAddress]) {
          keysByWallet[key.walletAddress] = [];
        }
        keysByWallet[key.walletAddress].push(key);
      });
      setApiKeys(keysByWallet);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    }
  };

  const fetchMerchantKeys = async (walletAddress: string) => {
    if (loadingKeys[walletAddress]) return;
    setLoadingKeys(prev => ({ ...prev, [walletAddress]: true }));
    try {
      const response = await adminFetch('/api/admin/api-keys');
      const merchantKeys = response.apiKeys.filter((key: ApiKey) => key.walletAddress === walletAddress);
      setApiKeys(prev => ({ ...prev, [walletAddress]: merchantKeys }));
    } catch (error) {
      console.error('Failed to fetch merchant API keys:', error);
    } finally {
      setLoadingKeys(prev => ({ ...prev, [walletAddress]: false }));
    }
  };

  const generateApiKey = async (walletAddress: string, merchantName: string) => {
    if (generatingKey[walletAddress]) return;
    setGeneratingKey(prev => ({ ...prev, [walletAddress]: true }));
    try {
      const response = await adminFetch('/api/admin/api-keys/generate', {
        method: 'POST',
        body: JSON.stringify({
          walletAddress,
          name: `${merchantName} API Key`,
        }),
      });
      setGeneratedKey({ key: response.apiKey, merchantId: walletAddress });
      setSuccessMessage('API key generated successfully! Copy it now - it will only be shown once.');
      // Refresh the API keys for this merchant
      await fetchMerchantKeys(walletAddress);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate API key');
    } finally {
      setGeneratingKey(prev => ({ ...prev, [walletAddress]: false }));
    }
  };

  const revokeApiKey = async (keyId: string, walletAddress: string) => {
    try {
      await adminFetch(`/api/admin/api-keys/${keyId}`, { method: 'DELETE' });
      await fetchMerchantKeys(walletAddress);
      setSuccessMessage('API key revoked successfully.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to revoke API key');
    }
  };

  const updateAllowedOrigins = async (merchantId: string, origins: string[]) => {
    if (updatingOrigins[merchantId]) return;
    setUpdatingOrigins(prev => ({ ...prev, [merchantId]: true }));
    try {
      const response = await adminFetch(`/api/admin/merchants/${merchantId}`, {
        method: 'PATCH',
        body: JSON.stringify({ allowedOrigins: origins }),
      });
      // Update the merchant in the local state
      setMerchants(prev => prev.map(merchant => 
        merchant.id === merchantId 
          ? { ...merchant, allowedOrigins: response.merchant.allowedOrigins }
          : merchant
      ));
      setSuccessMessage('Allowed origins updated successfully.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update allowed origins');
    } finally {
      setUpdatingOrigins(prev => ({ ...prev, [merchantId]: false }));
    }
  };

  const addOrigin = (merchantId: string, origin: string) => {
    const merchant = merchants.find(m => m.id === merchantId);
    if (!merchant) return;
    const newOrigins = [...(merchant.allowedOrigins || []), origin];
    updateAllowedOrigins(merchantId, newOrigins);
    setNewOriginInput(prev => ({ ...prev, [merchantId]: '' }));
  };

  const removeOrigin = (merchantId: string, index: number) => {
    const merchant = merchants.find(m => m.id === merchantId);
    if (!merchant) return;
    const newOrigins = merchant.allowedOrigins.filter((_, i) => i !== index);
    updateAllowedOrigins(merchantId, newOrigins);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccessMessage('Copied to clipboard!');
    } catch (error) {
      setError('Failed to copy to clipboard');
    }
  };

  useEffect(() => {
    fetchMerchants();
    fetchApiKeys();
  }, [pagination.page, pagination.limit, filters.search, filters.status]);

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
      key: 'apiKeys',
      label: 'API Keys',
      render: (merchant: Merchant) => {
        const merchantKeys = apiKeys[merchant.walletAddress] || [];
        return <span className="text-sm">{merchantKeys.length}</span>;
      },
    },
    {
      key: 'allowedOrigins',
      label: 'Origins',
      render: (merchant: Merchant) => {
        const origins = merchant.allowedOrigins || [];
        return <span className="text-sm">{origins.length}</span>;
      },
    },
    {
      key: 'createdAt',
      label: 'Created At',
      render: (merchant: Merchant) => formatDate(merchant.createdAt),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (merchant: Merchant) => (
        <button
          onClick={() => {
            if (expandedMerchant === merchant.id) {
              setExpandedMerchant(null);
            } else {
              setExpandedMerchant(merchant.id);
              fetchMerchantKeys(merchant.walletAddress);
            }
          }}
          className="px-3 py-1 bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] text-xs rounded transition-colors"
        >
          {expandedMerchant === merchant.id ? 'Close' : 'Manage'}
        </button>
      ),
    },

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
      fetchApiKeys();
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

      {/* Success Message */}
      {successMessage && (
        <div className="bg-[var(--color-surface)] border-1.5 border-[var(--color-text)] p-4 md:p-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[var(--color-text)] mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-[var(--color-text)]">{successMessage}</p>
              {generatedKey && generatedKey.merchantId && (
                <div className="mt-3 p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded">
                  <p className="text-xs font-bold text-[var(--color-muted)] mb-2">API KEY (COPY NOW - SHOWN ONCE ONLY):</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono bg-[var(--color-surface)] px-2 py-1 rounded border flex-1">
                      {generatedKey.key}
                    </code>
                    <button
                      onClick={() => copyToClipboard(generatedKey.key)}
                      className="px-3 py-1 bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] text-xs rounded transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setSuccessMessage(null);
                setGeneratedKey(null);
              }}
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

      {/* Expanded Merchant Details */}
      {expandedMerchant && (() => {
        const merchant = merchants.find(m => m.id === expandedMerchant);
        if (!merchant) return null;
        const merchantKeys = apiKeys[merchant.walletAddress] || [];

        return (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-mono)' }}>
                MANAGE: {merchant.name.toUpperCase()}
              </h3>
              <button
                onClick={() => setExpandedMerchant(null)}
                className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* API Keys Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-[var(--color-text)] uppercase tracking-wide">API Keys ({merchantKeys.length})</h4>
                  <button
                    onClick={() => generateApiKey(merchant.walletAddress, merchant.name)}
                    disabled={generatingKey[merchant.walletAddress]}
                    className="px-3 py-1 bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] text-xs rounded transition-colors disabled:opacity-50"
                  >
                    {generatingKey[merchant.walletAddress] ? 'Generating...' : 'Generate New'}
                  </button>
                </div>

                <div className="space-y-3">
                  {loadingKeys[merchant.walletAddress] ? (
                    <div className="animate-pulse h-16 bg-[var(--color-hover)] rounded"></div>
                  ) : merchantKeys.length > 0 ? (
                    merchantKeys.map((key) => (
                      <div key={key.id} className="border border-[var(--color-border)] rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <code className="text-sm font-mono bg-[var(--color-bg)] px-2 py-1 rounded">
                              {key.keyPrefix}***
                            </code>
                            {key.name && (
                              <span className="ml-2 text-xs text-[var(--color-muted)]">({key.name})</span>
                            )}
                          </div>
                          <button
                            onClick={() => revokeApiKey(key.id, merchant.walletAddress)}
                            className="text-xs text-red-500 hover:text-red-700 px-2 py-1 border border-red-500 rounded transition-colors"
                          >
                            Revoke
                          </button>
                        </div>
                        <div className="text-xs text-[var(--color-muted)]">
                          Created: {formatDate(key.createdAt)}
                          {key.lastUsed && ` • Last used: ${formatDate(key.lastUsed)}`}
                          • Status: {key.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[var(--color-muted)] italic">No API keys generated yet.</p>
                  )}
                </div>
              </div>

              {/* Allowed Origins Section */}
              <div>
                <h4 className="text-sm font-bold text-[var(--color-text)] uppercase tracking-wide mb-4">
                  Allowed Origins ({(merchant.allowedOrigins || []).length})
                </h4>

                <div className="space-y-3">
                  {/* Add new origin */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://casino.com"
                      value={newOriginInput[merchant.id] || ''}
                      onChange={(e) => setNewOriginInput(prev => ({ ...prev, [merchant.id]: e.target.value }))}
                      className="flex-1 px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] rounded text-sm"
                    />
                    <button
                      onClick={() => {
                        const origin = newOriginInput[merchant.id]?.trim();
                        if (origin) addOrigin(merchant.id, origin);
                      }}
                      disabled={!newOriginInput[merchant.id]?.trim() || updatingOrigins[merchant.id]}
                      className="px-3 py-2 bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] text-sm rounded transition-colors disabled:opacity-50"
                    >
                      {updatingOrigins[merchant.id] ? 'Adding...' : 'Add'}
                    </button>
                  </div>

                  {/* Existing origins */}
                  {(merchant.allowedOrigins || []).length > 0 ? (
                    <div className="space-y-2">
                      {(merchant.allowedOrigins || []).map((origin, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border border-[var(--color-border)] rounded">
                          <code className="text-sm font-mono text-[var(--color-text)]">{origin}</code>
                          <button
                            onClick={() => removeOrigin(merchant.id, index)}
                            disabled={updatingOrigins[merchant.id]}
                            className="text-xs text-red-500 hover:text-red-700 px-2 py-1 border border-red-500 rounded transition-colors disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--color-muted)] italic">No allowed origins configured.</p>
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