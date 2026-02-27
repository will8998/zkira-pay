'use client';

import { useState } from 'react';
import { adminFetch } from '@/lib/admin-api';
import { useAdminNetwork, getExplorerUrl } from '@/lib/admin-network';
import { toast } from 'sonner';

interface EscrowOnChainData {
  exists: boolean;
  owner?: string;
  lamports?: number;
  dataLength?: number;
}

interface EscrowCachedData {
  creator?: string;
  amount?: number;
  tokenMint?: string;
  claimed?: boolean;
  expiry?: number;
  createdAt?: number;
}

interface EscrowLookupResult {
  onChain: EscrowOnChainData;
  cached: EscrowCachedData | null;
}

interface EscrowSearchResult {
  address: string;
  amount: number;
  tokenMint: string;
  claimed: boolean;
  expiry: number;
  createdAt: number;
}

interface StuckEscrow {
  address: string;
  creator: string;
  amount: number;
  expiry: number;
  createdAt: number;
}

const TABS = [
  { id: 'lookup', label: 'Lookup' },
  { id: 'creator', label: 'By Creator' },
  { id: 'stuck', label: 'Stuck Escrows' }
];

export default function EscrowInspectorPage() {
  const { network } = useAdminNetwork();
  const [activeTab, setActiveTab] = useState<'lookup' | 'creator' | 'stuck'>('lookup');

  // Lookup tab state
  const [escrowAddress, setEscrowAddress] = useState('');
  const [lookupResult, setLookupResult] = useState<EscrowLookupResult | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Creator tab state
  const [creatorAddress, setCreatorAddress] = useState('');
  const [creatorResults, setCreatorResults] = useState<EscrowSearchResult[]>([]);
  const [creatorLoading, setCreatorLoading] = useState(false);

  // Stuck escrows state
  const [stuckEscrows, setStuckEscrows] = useState<StuckEscrow[]>([]);
  const [stuckLoading, setStuckLoading] = useState(false);
  const [stuckLoaded, setStuckLoaded] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const truncateAddress = (address: string) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = Math.abs(now - timestamp);
    const hours = Math.floor(diff / 3600);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} days ago`;
    }
    return `${hours} hours ago`;
  };

  const formatTimeUntil = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = timestamp - now;
    
    if (diff < 0) {
      const hours = Math.floor(Math.abs(diff) / 3600);
      const days = Math.floor(hours / 24);
      if (days > 0) {
        return `Expired ${days} days ago`;
      }
      return `Expired ${hours} hours ago`;
    }
    
    const hours = Math.floor(diff / 3600);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `Expires in ${days} days`;
    }
    return `Expires in ${hours} hours`;
  };

  const handleEscrowLookup = async () => {
    if (!escrowAddress.trim()) {
      toast.error('Please enter an escrow address');
      return;
    }

    setLookupLoading(true);
    try {
      const result = await adminFetch(`/api/admin/ops/escrow?address=${encodeURIComponent(escrowAddress.trim())}&network=${network}`);
      setLookupResult(result);
    } catch (error) {
      console.error('Failed to lookup escrow:', error);
      toast.error('Failed to lookup escrow');
      setLookupResult(null);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleCreatorSearch = async () => {
    if (!creatorAddress.trim()) {
      toast.error('Please enter a creator address');
      return;
    }

    setCreatorLoading(true);
    try {
      const result = await adminFetch(`/api/admin/ops/escrows/search?creator=${encodeURIComponent(creatorAddress.trim())}&network=${network}`);
      setCreatorResults(result.escrows || []);
    } catch (error) {
      console.error('Failed to search escrows by creator:', error);
      toast.error('Failed to search escrows');
      setCreatorResults([]);
    } finally {
      setCreatorLoading(false);
    }
  };

  const loadStuckEscrows = async () => {
    setStuckLoading(true);
    try {
      const result = await adminFetch(`/api/admin/ops/escrows/stuck?network=${network}`);
      setStuckEscrows(result.escrows || []);
      setStuckLoaded(true);
    } catch (error) {
      console.error('Failed to load stuck escrows:', error);
      toast.error('Failed to load stuck escrows');
      setStuckEscrows([]);
    } finally {
      setStuckLoading(false);
    }
  };

  // Load stuck escrows when tab is activated
  if (activeTab === 'stuck' && !stuckLoaded && !stuckLoading) {
    loadStuckEscrows().catch(console.error);
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Escrow Inspector</h1>
        <p className="text-[var(--color-muted)]">Inspect and debug escrow accounts</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-4 md:gap-6 border-b border-[var(--color-border)]">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors min-h-[44px] ${
              activeTab === tab.id
                ? 'border-[var(--color-text)] text-[var(--color-text)]'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lookup Tab */}
      {activeTab === 'lookup' && (
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Lookup by Address</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={escrowAddress}
                onChange={(e) => setEscrowAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEscrowLookup()}
                placeholder="Enter escrow account address"
                className="flex-1 px-4 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-text)]/20 focus:border-[var(--color-text)] font-mono text-sm min-h-[44px] text-[16px]"
              />
              <button
                onClick={handleEscrowLookup}
                disabled={lookupLoading}
                className="bg-[var(--color-button)] text-[var(--color-button-text)] px-6 py-2 hover:bg-[var(--color-button-hover)] transition-colors disabled:opacity-50 whitespace-nowrap min-h-[44px] w-full sm:w-auto"
              >
                {lookupLoading ? 'Inspecting...' : 'Inspect'}
              </button>
            </div>
          </div>

          {lookupResult && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* On-Chain State */}
              <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
                <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">On-Chain State</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-muted)]">Exists</span>
                    <span className={`font-medium ${lookupResult.onChain.exists ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
                      {lookupResult.onChain.exists ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {lookupResult.onChain.exists && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-[var(--color-muted)]">Owner</span>
                        <code className="font-mono text-sm text-[var(--color-text)]">
                          {truncateAddress(lookupResult.onChain.owner || '')}
                        </code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--color-muted)]">Lamports</span>
                        <span className="font-mono text-sm text-[var(--color-text)]">
                          {lookupResult.onChain.lamports?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--color-muted)]">Data Length</span>
                        <span className="font-mono text-sm text-[var(--color-text)]">
                          {lookupResult.onChain.dataLength?.toLocaleString() || '0'} bytes
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Cached Data */}
              <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
                <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Cached Data</h3>
                {lookupResult.cached ? (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-[var(--color-muted)]">Creator</span>
                      <code className="font-mono text-sm text-[var(--color-text)]">
                        {truncateAddress(lookupResult.cached.creator || '')}
                      </code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-muted)]">Amount</span>
                      <span className="font-mono text-sm text-[var(--color-text)]">
                        {lookupResult.cached.amount?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-muted)]">Token Mint</span>
                      <code className="font-mono text-sm text-[var(--color-text)]">
                        {truncateAddress(lookupResult.cached.tokenMint || '')}
                      </code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-muted)]">Claimed</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        lookupResult.cached.claimed
                          ? 'bg-[var(--color-green)]/10 text-[var(--color-green)]'
                          : 'bg-[#F59E0B]/10 text-[#F59E0B]'
                      }`}>
                        {lookupResult.cached.claimed ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {lookupResult.cached.expiry && (
                      <div className="flex justify-between">
                        <span className="text-[var(--color-muted)]">Expiry</span>
                        <span className={`text-sm ${
                          (lookupResult.cached.expiry * 1000) < Date.now() ? 'text-[var(--color-red)]' : 'text-[var(--color-text)]'
                        }`}>
                          {formatTimeUntil(lookupResult.cached.expiry)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[var(--color-muted)]">Created</span>
                      <span className="text-sm text-[var(--color-text)]">
                        {lookupResult.cached.createdAt ? formatDate(lookupResult.cached.createdAt) : 'N/A'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[var(--color-muted)]">No cached data available</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Creator Tab */}
      {activeTab === 'creator' && (
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Search by Creator</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={creatorAddress}
                onChange={(e) => setCreatorAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreatorSearch()}
                placeholder="Enter creator wallet address"
                className="flex-1 px-4 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-text)]/20 focus:border-[var(--color-text)] font-mono text-sm min-h-[44px] text-[16px]"
              />
              <button
                onClick={handleCreatorSearch}
                disabled={creatorLoading}
                className="bg-[var(--color-button)] text-[var(--color-button-text)] px-6 py-2 hover:bg-[var(--color-button-hover)] transition-colors disabled:opacity-50 whitespace-nowrap min-h-[44px] w-full sm:w-auto"
              >
                {creatorLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {creatorResults.length > 0 && (
            <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--color-border)]">
                <h3 className="text-lg font-semibold text-[var(--color-text)]">Escrows ({creatorResults.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[var(--color-hover)]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Address</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Token Mint</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Claimed</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Expiry</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {creatorResults.map((escrow) => (
                      <tr key={escrow.address} className="hover:bg-[var(--color-hover)]">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <code className="font-mono text-sm text-[var(--color-text)]">
                              {truncateAddress(escrow.address)}
                            </code>
                            <button
                              onClick={() => copyToClipboard(escrow.address)}
                              className="p-1 hover:bg-[var(--color-border)] rounded transition-colors"
                            >
                              <svg className="w-3 h-3 text-[var(--color-muted)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-mono text-sm text-[var(--color-text)]">
                            {escrow.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <code className="font-mono text-sm text-[var(--color-text)]">
                            {truncateAddress(escrow.tokenMint)}
                          </code>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            escrow.claimed
                              ? 'bg-[var(--color-green)]/10 text-[var(--color-green)]'
                              : 'bg-[#F59E0B]/10 text-[#F59E0B]'
                          }`}>
                            {escrow.claimed ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm ${
                            (escrow.expiry * 1000) < Date.now() ? 'text-[var(--color-red)]' : 'text-[var(--color-text)]'
                          }`}>
                            {formatTimeUntil(escrow.expiry)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-[var(--color-text)]">
                            {formatDate(escrow.createdAt)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stuck Escrows Tab */}
      {activeTab === 'stuck' && (
        <div className="space-y-6">
          {stuckLoading ? (
            <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-[var(--color-skeleton)] rounded w-32 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-[var(--color-skeleton)] rounded w-full"></div>
                  <div className="h-4 bg-[var(--color-skeleton)] rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ) : stuckEscrows.length > 0 ? (
            <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--color-border)]">
                <h3 className="text-lg font-semibold text-[var(--color-text)]">Stuck Escrows ({stuckEscrows.length})</h3>
                <p className="text-sm text-[var(--color-muted)]">Escrows that have expired but not been claimed</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[var(--color-hover)]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Address</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Creator</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Expired</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {stuckEscrows.map((escrow) => (
                      <tr key={escrow.address} className="hover:bg-[#FEF2F2] bg-[#FEF2F2]/30">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <code className="font-mono text-sm text-[var(--color-text)]">
                              {truncateAddress(escrow.address)}
                            </code>
                            <button
                              onClick={() => copyToClipboard(escrow.address)}
                              className="p-1 hover:bg-[var(--color-border)] rounded transition-colors"
                            >
                              <svg className="w-3 h-3 text-[var(--color-muted)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <code className="font-mono text-sm text-[var(--color-text)]">
                            {truncateAddress(escrow.creator)}
                          </code>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-mono text-sm text-[var(--color-text)]">
                            {escrow.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-[var(--color-red)]">
                            {formatTimeAgo(escrow.expiry)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-[var(--color-text)]">
                            {formatDate(escrow.createdAt)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : stuckLoaded ? (
            <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-8 md:p-12 text-center">
              <svg className="w-12 h-12 text-[var(--color-green)] mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-[var(--color-text)] mb-2">No Stuck Escrows</h3>
              <p className="text-[var(--color-muted)]">All escrows are healthy - no expired unclaimed escrows found.</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}