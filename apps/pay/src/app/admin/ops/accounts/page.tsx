'use client';

import { useState } from 'react';
import { adminFetch } from '@/lib/admin-api';
import { useAdminNetwork, getExplorerUrl } from '@/lib/admin-network';
import { toast } from 'sonner';

interface AccountLookupResult {
  exists: boolean;
  address: string;
  owner?: string;
  lamports?: number;
  dataLength?: number;
  type: 'system' | 'token' | 'program' | 'unknown';
  tokenData?: {
    mint: string;
    owner: string;
    amount: string;
    decimals: number;
  };
  programData?: {
    executable: boolean;
    upgradeAuthority?: string | null;
    programDataAddress?: string;
  };
}

export default function AccountLookupPage() {
  const { network } = useAdminNetwork();
  const [address, setAddress] = useState('');
  const [result, setResult] = useState<AccountLookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleLookup = async () => {
    if (!address.trim()) {
      toast.error('Please enter a Solana address');
      return;
    }

    if (address.length < 32 || address.length > 44) {
      toast.error('Invalid Solana address format');
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const lookupResult = await adminFetch(`/api/admin/ops/account?address=${encodeURIComponent(address.trim())}&network=${network}`);
      setResult(lookupResult);
    } catch (error) {
      console.error('Failed to lookup account:', error);
      toast.error('Failed to lookup account');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const truncateAddress = (address: string) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 12)}...${address.slice(-12)}`;
  };

  const formatSOL = (lamports: number) => {
    return (lamports / 1_000_000_000).toFixed(6);
  };

  const formatTokenAmount = (amount: string, decimals: number) => {
    const numAmount = parseFloat(amount);
    const divisor = Math.pow(10, decimals);
    return (numAmount / divisor).toFixed(decimals);
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      system: 'bg-[var(--color-muted)]/10 text-[var(--color-muted)]',
      token: 'bg-[#3B82F6]/10 text-[#3B82F6]',
      program: 'bg-[var(--color-green)]/10 text-[var(--color-green)]',
      unknown: 'bg-[#F59E0B]/10 text-[#F59E0B]'
    };

    const labels = {
      system: 'System',
      token: 'Token',
      program: 'Program', 
      unknown: 'Unknown'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${variants[type as keyof typeof variants]}`}>
        {labels[type as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Account Lookup</h1>
        <p className="text-[var(--color-muted)]">Inspect any Solana account address</p>
      </div>

      {/* Search Section */}
      <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Enter any Solana address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              placeholder="Enter wallet, program, or token account address"
              className="w-full px-4 py-3 border border-[var(--color-border)] rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-text)]/20 focus:border-[var(--color-text)] min-h-[44px] text-[16px]"
            />
          </div>
          <button
            onClick={handleLookup}
            disabled={loading}
            className="bg-[var(--color-button)] text-[var(--color-button-text)] px-8 py-3 hover:bg-[var(--color-button-hover)] transition-colors disabled:opacity-50 min-h-[44px] w-full sm:w-auto"
          >
            {loading ? 'Looking up...' : 'Lookup'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-[var(--color-skeleton)] rounded w-32 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-[var(--color-skeleton)] rounded w-full"></div>
              <div className="h-4 bg-[var(--color-skeleton)] rounded w-3/4"></div>
              <div className="h-4 bg-[var(--color-skeleton)] rounded w-1/2"></div>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {!loading && hasSearched && (
        <div className="space-y-6">
          {result ? (
            result.exists ? (
              <>
                {/* Base Account Info */}
                <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-[var(--color-text)]">Account Information</h3>
                    {getTypeBadge(result.type)}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-muted)] mb-2">Address</p>
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm text-[var(--color-text)] bg-[var(--color-hover)] px-2 py-1 rounded flex-1 break-all">
                          {result.address}
                        </code>
                        <button
                          onClick={() => copyToClipboard(result.address)}
                          className="p-1 hover:bg-[var(--color-border)] rounded transition-colors shrink-0"
                          title="Copy Address"
                        >
                          <svg className="w-4 h-4 text-[var(--color-muted)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-[var(--color-muted)] mb-1">Owner</p>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm text-[var(--color-text)] bg-[var(--color-hover)] px-2 py-1 rounded">
                            {truncateAddress(result.owner || '')}
                          </code>
                          {result.owner && (
                            <button
                              onClick={() => copyToClipboard(result.owner!)}
                              className="p-1 hover:bg-[var(--color-border)] rounded transition-colors"
                              title="Copy Owner"
                            >
                              <svg className="w-3 h-3 text-[var(--color-muted)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-[var(--color-muted)] mb-1">SOL Balance</p>
                        <p className="font-mono text-sm text-[var(--color-text)]">
                          {formatSOL(result.lamports || 0)} SOL
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-[var(--color-muted)] mb-1">Data Length</p>
                      <p className="font-mono text-sm text-[var(--color-text)]">
                        {(result.dataLength || 0).toLocaleString()} bytes
                      </p>
                    </div>

                    <div className="pt-2">
                      <a
                        href={getExplorerUrl('address', result.address, network)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-[var(--color-green)] hover:text-[var(--color-green-hover)] font-medium transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View on Solana Explorer
                      </a>
                    </div>
                  </div>
                </div>

                {/* Token Account Details */}
                {result.type === 'token' && result.tokenData && (
                  <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
                    <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Token Account Details</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-[var(--color-muted)] mb-2">Mint Address</p>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm text-[var(--color-text)] bg-[var(--color-hover)] px-2 py-1 rounded flex-1">
                            {result.tokenData.mint}
                          </code>
                          <button
                            onClick={() => copyToClipboard(result.tokenData!.mint)}
                            className="p-1 hover:bg-[var(--color-border)] rounded transition-colors"
                            title="Copy Mint"
                          >
                            <svg className="w-3 h-3 text-[var(--color-muted)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-[var(--color-muted)] mb-2">Token Owner</p>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm text-[var(--color-text)] bg-[var(--color-hover)] px-2 py-1 rounded flex-1">
                            {result.tokenData.owner}
                          </code>
                          <button
                            onClick={() => copyToClipboard(result.tokenData!.owner)}
                            className="p-1 hover:bg-[var(--color-border)] rounded transition-colors"
                            title="Copy Token Owner"
                          >
                            <svg className="w-3 h-3 text-[var(--color-muted)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-[var(--color-muted)] mb-1">Raw Amount</p>
                          <p className="font-mono text-sm text-[var(--color-text)]">
                            {result.tokenData.amount}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--color-muted)] mb-1">Formatted Amount</p>
                          <p className="font-mono text-sm text-[var(--color-text)]">
                            {formatTokenAmount(result.tokenData.amount, result.tokenData.decimals)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Program Details */}
                {result.type === 'program' && result.programData && (
                  <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
                    <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Program Details</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-[var(--color-muted)] mb-1">Executable</p>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          result.programData.executable
                            ? 'bg-[var(--color-green)]/10 text-[var(--color-green)]'
                            : 'bg-[var(--color-red)]/10 text-[var(--color-red)]'
                        }`}>
                          {result.programData.executable ? 'Yes' : 'No'}
                        </span>
                      </div>

                      {result.programData.upgradeAuthority !== undefined && (
                        <div>
                          <p className="text-sm font-medium text-[var(--color-muted)] mb-1">Upgrade Authority</p>
                          {result.programData.upgradeAuthority === null ? (
                            <span className="px-2 py-1 text-xs font-medium bg-[#3B82F6]/10 text-[#3B82F6] rounded">
                              Immutable
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <code className="font-mono text-sm text-[var(--color-text)] bg-[var(--color-hover)] px-2 py-1 rounded">
                                {truncateAddress(result.programData.upgradeAuthority)}
                              </code>
                              <button
                                onClick={() => copyToClipboard(result.programData!.upgradeAuthority!)}
                                className="p-1 hover:bg-[var(--color-border)] rounded transition-colors"
                                title="Copy Upgrade Authority"
                              >
                                <svg className="w-3 h-3 text-[var(--color-muted)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {result.programData.programDataAddress && (
                        <div>
                          <p className="text-sm font-medium text-[var(--color-muted)] mb-2">Program Data Address</p>
                          <div className="flex items-center gap-2">
                            <code className="font-mono text-sm text-[var(--color-text)] bg-[var(--color-hover)] px-2 py-1 rounded flex-1">
                              {result.programData.programDataAddress}
                            </code>
                            <button
                              onClick={() => copyToClipboard(result.programData!.programDataAddress!)}
                              className="p-1 hover:bg-[var(--color-border)] rounded transition-colors"
                              title="Copy Program Data Address"
                            >
                              <svg className="w-3 h-3 text-[var(--color-muted)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-8 md:p-12 text-center">
                <svg className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-[var(--color-text)] mb-2">Account Not Found</h3>
                <p className="text-[var(--color-muted)]">This account does not exist on {network}.</p>
              </div>
            )
          ) : (
            <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-8 md:p-12 text-center">
              <svg className="w-12 h-12 text-[var(--color-red)] mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-[var(--color-text)] mb-2">Lookup Failed</h3>
              <p className="text-[var(--color-muted)]">Unable to lookup the provided address. Please verify the address is correct.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}