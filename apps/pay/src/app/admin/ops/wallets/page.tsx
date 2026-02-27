'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin-api';
import { useAdminNetwork, getExplorerUrl } from '@/lib/admin-network';
import { toast } from 'sonner';

interface WalletInfo {
  label: string;
  address: string;
  solBalance: number;
  lamports: number;
  usdcBalance?: number;
  error?: string;
}

interface WalletsData {
  wallets: WalletInfo[];
}

export default function WalletsPage() {
  const { network } = useAdminNetwork();
  const [data, setData] = useState<WalletsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [customAddress, setCustomAddress] = useState('');
  const [checking, setChecking] = useState(false);

  const fetchData = async () => {
    try {
      const result = await adminFetch(`/api/admin/ops/wallets?network=${network}`);
      setData(result);
    } catch (error) {
      console.error('Failed to fetch wallets data:', error);
      toast.error('Failed to fetch wallets data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [network]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const truncateAddress = (address: string) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 12)}...${address.slice(-12)}`;
  };

  const handleCheckCustomWallet = async () => {
    if (!customAddress.trim()) {
      toast.error('Please enter a wallet address');
      return;
    }

    if (customAddress.length < 32 || customAddress.length > 44) {
      toast.error('Invalid Solana address format');
      return;
    }

    setChecking(true);
    try {
      const result = await adminFetch(`/api/admin/ops/wallets?addresses=${encodeURIComponent(customAddress.trim())}&network=${network}`);

      if (result.wallets && result.wallets.length > 0) {
        setData(prev => {
          const existing = prev?.wallets || [];
          const newWallets = result.wallets.filter(
            (w: WalletInfo) => !existing.find(e => e.address === w.address)
          );
          return { wallets: [...existing, ...newWallets] };
        });
        toast.success('Wallet checked successfully');
      }
      setCustomAddress('');
    } catch (error) {
      console.error('Failed to check custom wallet:', error);
      toast.error('Failed to check wallet balance');
    } finally {
      setChecking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCheckCustomWallet();
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse">
          <div className="mb-6">
            <div className="h-8 bg-[var(--color-skeleton)] rounded w-64 mb-2"></div>
            <div className="h-5 bg-[var(--color-skeleton)] rounded w-96"></div>
          </div>
          <div className="mb-6">
            <div className="h-12 bg-[var(--color-skeleton)] rounded"></div>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-[var(--color-skeleton)]"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Wallet Monitor</h1>
          <p className="text-[var(--color-muted)]">Track wallet balances across the protocol</p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchData(); }}
          className="bg-[var(--color-button)] text-[var(--color-button-text)] px-4 py-2 hover:bg-[var(--color-button-hover)] transition-colors min-h-[44px]"
        >
          Refresh
        </button>
      </div>

      {/* Custom Wallet Check */}
      <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Check Custom Wallet</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={customAddress}
            onChange={(e) => setCustomAddress(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Enter wallet address (e.g., 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM)"
            className="flex-1 px-4 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-text)]/20 focus:border-[var(--color-text)] font-mono text-sm min-h-[44px] text-[16px]"
          />
          <button
            onClick={handleCheckCustomWallet}
            disabled={checking}
            className="bg-[var(--color-button)] text-[var(--color-button-text)] px-6 py-2 hover:bg-[var(--color-button-hover)] transition-colors disabled:opacity-50 whitespace-nowrap min-h-[44px] w-full sm:w-auto"
          >
            {checking ? 'Checking...' : 'Check'}
          </button>
        </div>
      </div>

      {/* Wallets List */}
      <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--color-border)]">
          <h3 className="text-lg font-semibold text-[var(--color-text)]">Wallet Balances</h3>
        </div>

        {data?.wallets && data.wallets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-hover)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                    Label
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                    SOL Balance
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                    USDC Balance
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {data.wallets.map((wallet) => (
                  <tr key={wallet.address} className="hover:bg-[var(--color-hover)]">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-[var(--color-text)]">
                        {wallet.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm text-[var(--color-text)] bg-[var(--color-hover)] px-2 py-1 rounded">
                          {truncateAddress(wallet.address)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(wallet.address)}
                          className="p-1 hover:bg-[var(--color-border)] rounded transition-colors"
                          title="Copy Address"
                        >
                          <svg className="w-4 h-4 text-[var(--color-muted)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-mono text-sm font-medium ${
                        wallet.solBalance < 0.1 ? 'text-[var(--color-red)]' : 'text-[var(--color-text)]'
                      }`}>
                        {wallet.solBalance.toFixed(6)} SOL
                      </span>
                      {wallet.solBalance < 0.1 && (
                        <p className="text-xs text-[var(--color-red)] mt-1">Low balance</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono text-sm text-[var(--color-text)]">
                        {wallet.usdcBalance?.toFixed(2) || '0.00'} USDC
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <a
                        href={getExplorerUrl('address', wallet.address, network)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-[var(--color-green)] hover:text-[var(--color-green-hover)] font-medium transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Explorer
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <h3 className="text-lg font-medium text-[var(--color-text)] mb-2">No Wallets Found</h3>
            <p className="text-[var(--color-muted)]">No wallet data is currently available. Use the form above to check a custom wallet.</p>
          </div>
        )}
      </div>
    </div>
  );
}