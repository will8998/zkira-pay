'use client';

import { useEffect, useState } from 'react';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { adminFetch } from '@/lib/admin-api';
import { toast } from 'sonner';

interface EphemeralWallet {
  id: string;
  address: string;
  chain: string | null;
  token: string | null;
  amount: number | string | null;
  flow: 'send' | 'invoice' | 'deposit';
  status: 'active' | 'swept' | 'expired' | 'empty';
  txHash: string | null;
  createdAt: string;
  updatedAt: string | null;
  expiresAt: string | null;
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<EphemeralWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [expandedWallet, setExpandedWallet] = useState<string | null>(null);
  const [walletBalances, setWalletBalances] = useState<Record<string, string>>({});
  const [loadingBalance, setLoadingBalance] = useState<Record<string, boolean>>({});
  const [sweeping, setSweeping] = useState<Record<string, boolean>>({});
  const [recoveredKey, setRecoveredKey] = useState<{ walletId: string; key: string } | null>(null);
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

  // Auto-clear recovered key after 30 seconds
  useEffect(() => {
    if (recoveredKey) {
      const timer = setTimeout(() => setRecoveredKey(null), 30000);
      return () => clearTimeout(timer);
    }
  }, [recoveredKey]);

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

  const checkBalance = async (walletId: string) => {
    if (loadingBalance[walletId]) return;
    setLoadingBalance(prev => ({ ...prev, [walletId]: true }));
    try {
      const response = await adminFetch(`/api/admin/ephemeral-wallets/${walletId}/balance`);
      if (response.balance !== null) {
        const balanceValue = response.balance;
        setWalletBalances(prev => ({ ...prev, [walletId]: balanceValue }));
        toast.success('Balance fetched successfully');
      } else {
        setError(response.error || 'Unable to fetch balance');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch balance');
    } finally {
      setLoadingBalance(prev => ({ ...prev, [walletId]: false }));
    }
  };

  const sweepFunds = async (walletId: string) => {
    const confirmed = confirm('Are you sure you want to sweep all funds from this wallet to the treasury?');
    if (!confirmed) return;

    setSweeping(prev => ({ ...prev, [walletId]: true }));
    try {
      const response = await adminFetch(`/api/admin/ephemeral-wallets/${walletId}/sweep`, {
        method: 'POST',
      });
      if (response.success) {
        toast.success(`Successfully swept ${response.amount} ${response.token} - TX: ${response.txHash}`);
        fetchWallets(); // Refresh the list
      } else {
        setError(response.error || 'Failed to sweep funds');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to sweep funds');
    } finally {
      setSweeping(prev => ({ ...prev, [walletId]: false }));
    }
  };

  const recoverPrivateKey = async (walletId: string) => {
    const confirmed = confirm('WARNING: This will decrypt and display the private key. Are you sure?');
    if (!confirmed) return;

    try {
      const response = await adminFetch(`/api/admin/ephemeral-wallets/${walletId}/recover`, {
        method: 'POST',
      });
      setRecoveredKey({ walletId, key: response.privateKey });
      toast.success('Private key recovered and displayed');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to recover private key');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      setError('Failed to copy to clipboard');
    }
  };

  const getExplorerUrl = (address: string, chain: string | null) => {
    if (!chain) return null;
    switch (chain) {
      case 'arbitrum':
      case 'arbitrum-mainnet':
        return `https://arbiscan.io/address/${address}`;
      case 'arbitrum-sepolia':
      case 'arbitrum-testnet':
        return `https://sepolia.arbiscan.io/address/${address}`;
      case 'tron':
        return `https://tronscan.org/#/address/${address}`;
      default:
        return null;
    }
  };

  const truncateAddress = (address: string | null) => {
    if (!address) return '—';
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const formatAmount = (amount: number | string | null) => {
    if (amount == null) return '—';
    return Number(amount).toLocaleString();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
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
      render: (wallet: EphemeralWallet) => wallet.chain ? wallet.chain.charAt(0).toUpperCase() + wallet.chain.slice(1) : '—',
    },
    {
      key: 'token',
      label: 'Token',
      render: (wallet: EphemeralWallet) => wallet.token ? wallet.token.toUpperCase() : '—',
    },
    {
      key: 'amount',
      label: 'Expected',
      render: (wallet: EphemeralWallet) => formatAmount(wallet.amount),
    },
    {
      key: 'balance',
      label: 'Balance',
      render: (wallet: EphemeralWallet) => {
        const balance = walletBalances[wallet.id];
        return balance ? formatAmount(balance) : '—';
      },
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
      label: 'Created',
      render: (wallet: EphemeralWallet) => formatDate(wallet.createdAt),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (wallet: EphemeralWallet) => (
        <button
          onClick={() => {
            if (expandedWallet === wallet.id) {
              setExpandedWallet(null);
            } else {
              setExpandedWallet(wallet.id);
            }
          }}
          className="px-3 py-1 bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] text-xs rounded transition-colors"
        >
          {expandedWallet === wallet.id ? 'Close' : 'Manage'}
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

      {/* Expanded Wallet Details */}
      {expandedWallet && (() => {
        const wallet = wallets.find(w => w.id === expandedWallet);
        if (!wallet) return null;
        const balance = walletBalances[wallet.id];
        const explorerUrl = getExplorerUrl(wallet.address, wallet.chain);

        return (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-mono)' }}>
                WALLET: {truncateAddress(wallet.address).toUpperCase()}
              </h3>
              <button
                onClick={() => setExpandedWallet(null)}
                className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Wallet Info */}
              <div>
                <h4 className="text-sm font-bold text-[var(--color-text)] uppercase tracking-wide mb-4">Wallet Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-[var(--color-border)] rounded">
                    <span className="text-sm text-[var(--color-muted)]">Full Address:</span>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-[var(--color-text)]">{wallet.address}</code>
                      <button
                        onClick={() => copyToClipboard(wallet.address)}
                        className="px-2 py-1 bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] text-xs rounded transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-[var(--color-border)] rounded">
                    <span className="text-sm text-[var(--color-muted)]">Wallet ID:</span>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-[var(--color-text)]">{wallet.id}</code>
                      <button
                        onClick={() => copyToClipboard(wallet.id)}
                        className="px-2 py-1 bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] text-xs rounded transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-[var(--color-border)] rounded">
                    <span className="text-sm text-[var(--color-muted)]">Chain / Token:</span>
                    <span className="text-sm text-[var(--color-text)]">
                      {wallet.chain ? wallet.chain.charAt(0).toUpperCase() + wallet.chain.slice(1) : '—'} / {wallet.token ? wallet.token.toUpperCase() : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-[var(--color-border)] rounded">
                    <span className="text-sm text-[var(--color-muted)]">Expected Amount:</span>
                    <span className="text-sm text-[var(--color-text)]">{formatAmount(wallet.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-[var(--color-border)] rounded">
                    <span className="text-sm text-[var(--color-muted)]">Status:</span>
                    {getStatusBadge(wallet.status)}
                  </div>
                  {wallet.txHash && (
                    <div className="flex items-center justify-between p-3 border border-[var(--color-border)] rounded">
                      <span className="text-sm text-[var(--color-muted)]">TX Hash:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono text-[var(--color-text)]">{truncateAddress(wallet.txHash)}</code>
                        {explorerUrl && (
                          <a
                            href={`${explorerUrl.replace('/address/', '/tx/')}${wallet.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[var(--color-text)] hover:underline"
                          >
                            View
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-3 border border-[var(--color-border)] rounded">
                    <span className="text-sm text-[var(--color-muted)]">Created / Expires:</span>
                    <span className="text-sm text-[var(--color-text)]">{formatDate(wallet.createdAt)} / {formatDate(wallet.expiresAt)}</span>
                  </div>
                  {balance && (
                    <div className="flex items-center justify-between p-3 border border-[var(--color-border)] rounded bg-[var(--color-hover)]">
                      <span className="text-sm font-bold text-[var(--color-text)]">On-chain Balance:</span>
                      <span className="text-sm font-bold text-[var(--color-text)]">{formatAmount(balance)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Management Actions */}
              <div>
                <h4 className="text-sm font-bold text-[var(--color-text)] uppercase tracking-wide mb-4">Management Actions</h4>
                <div className="space-y-3">
                  <button
                    onClick={() => checkBalance(wallet.id)}
                    disabled={loadingBalance[wallet.id]}
                    className="w-full px-4 py-3 bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] transition-colors disabled:opacity-50 rounded"
                  >
                    {loadingBalance[wallet.id] ? 'Checking...' : 'Check Balance'}
                  </button>
                  <button
                    onClick={() => sweepFunds(wallet.id)}
                    disabled={sweeping[wallet.id]}
                    className="w-full px-4 py-3 text-xs text-red-500 hover:text-red-700 border border-red-500 rounded transition-colors disabled:opacity-50"
                  >
                    {sweeping[wallet.id] ? 'Sweeping...' : 'Sweep Funds'}
                  </button>
                  {explorerUrl ? (
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full px-4 py-3 bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] transition-colors rounded text-center"
                    >
                      View on Explorer
                    </a>
                  ) : (
                    <button
                      disabled
                      title="Chain unknown"
                      className="w-full px-4 py-3 bg-[var(--color-button)] text-[var(--color-button-text)] opacity-50 rounded cursor-not-allowed"
                    >
                      View on Explorer
                    </button>
                  )}
                  <button
                    onClick={() => copyToClipboard(wallet.address)}
                    className="w-full px-4 py-3 bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] transition-colors rounded"
                  >
                    Copy Address
                  </button>
                  <button
                    onClick={() => recoverPrivateKey(wallet.id)}
                    className="w-full px-4 py-3 text-xs text-red-500 hover:text-red-700 border border-red-500 rounded transition-colors"
                  >
                    Export Private Key
                  </button>
                </div>
                {recoveredKey && recoveredKey.walletId === wallet.id && (
                  <div className="mt-4 p-4 bg-[var(--color-bg)] border border-red-500 rounded">
                    <p className="text-xs font-bold text-red-500 mb-2 uppercase">Private Key (auto-clear in 30s):</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-[var(--color-surface)] px-2 py-1 rounded border flex-1 break-all">
                        {recoveredKey.key}
                      </code>
                      <button
                        onClick={() => copyToClipboard(recoveredKey.key)}
                        className="px-2 py-1 bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] text-xs rounded transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}