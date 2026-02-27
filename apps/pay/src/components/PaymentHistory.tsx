'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';
import InfoTooltip from '@/components/InfoTooltip';
import { useWallet } from './WalletProvider';
import { EmptyState } from './EmptyState';
import { SkeletonTable, SkeletonMetric } from './Skeleton';
import { type SolanaNetwork, useNetwork, getUsdcMint } from '@/lib/network-config';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { fetchAndDecrypt, migrateLocalStorageToServer } from '@/lib/payment-link-crypto';

// ─── Types ─── 
interface EscrowData {
  address: string;
  creator: string;
  tokenMint: string;
  amount: string; // BigInt as string
  claimHash: string;
  expiry: string; // Unix seconds as string
  claimed: boolean;
  refunded: boolean;
  nonce: number;
  feeBps: number;
}

interface EscrowResponse {
  escrows: EscrowData[];
  count: number;
}

interface Invoice {
  invoiceId: string;
  claimSecretHex: string;
  metaAddress: string;
  amount: string;
  tokenMint: string;
  expiry: string;
  createdAt: string;
  status: 'pending' | 'claimed' | 'expired';
}

interface ClaimedTransaction {
  txSignature: string;
  amount: string;
  tokenMint: string;
  claimHash?: string;
  timestamp: string;
}

type TabType = 'all' | 'sent' | 'received';
type StatusFilterType = 'all' | 'pending' | 'completed' | 'expired';

interface PaymentRow {
  id: string;
  type: 'sent' | 'received';
  amount: number;
  tokenSymbol: string;
  status: 'pending' | 'claimed' | 'expired' | 'refunded' | 'completed';
  date: Date;
  txSignature?: string;
  address?: string;
  description: string;
}

// ─── Utils ───
function convertUsdcAmount(amountString: string): number {
  try {
    // Try BigInt first (for u64 format)
    return Number(BigInt(amountString)) / 1_000_000;
  } catch {
    // Fallback for legacy invoices that stored human-readable amounts
    return parseFloat(amountString) || 0;
  }
}

function getTokenSymbol(mint: string, network: SolanaNetwork): string {
  if (mint === getUsdcMint(network)) return 'USDC';
  return 'TOKEN';
}

function getStatusBadgeStyles(status: PaymentRow['status']) {
  switch (status) {
    case 'pending':
      return 'bg-[var(--color-warning-bg)] border-[var(--color-warning-border)] text-[var(--color-warning-text)]';
    case 'claimed':
    case 'completed':
      return 'bg-[var(--color-success-bg)] border-[var(--color-success-border)] text-[var(--color-success-text)]';
    case 'expired':
      return 'bg-[var(--color-error-bg)] border-[var(--color-error-border)] text-[var(--color-error-text)]';
    case 'refunded':
      return 'bg-[var(--color-muted-bg)] border-[var(--color-muted-border)] text-[var(--color-muted-text)]';
    default:
      return 'bg-[var(--color-muted-bg)] border-[var(--color-muted-border)] text-[var(--color-muted-text)]';
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
}

function truncateAddress(address: string, chars = 8): string {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-4)}`;
}

function downloadCSV(data: PaymentRow[]) {
  const headers = ['Type', 'Description', 'Amount (USDC)', 'Status', 'Date', 'Transaction'];
  const csvContent = [
    headers.join(','),
    ...data.map(row => [
      row.type,
      `"${row.description}"`,
      row.amount.toFixed(2),
      row.status,
      row.date.toISOString(),
      row.txSignature || ''
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// ─── Components ───
function MetricCard({ 
  label, 
  value, 
  subtitle, 
  animationDelay = 0 
}: { 
  label: string; 
  value: string; 
  subtitle: string; 
  animationDelay?: number;
}) {
  return (
    <div 
      className="animate-entrance bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="text-[13px] font-medium text-[var(--color-muted)] mb-0.5">{label}</div>
      <div className="text-lg font-semibold text-[var(--color-text)] font-[family-name:var(--font-mono)] tabular-nums">
        {value}
      </div>
      <div className="text-xs text-[var(--color-muted)] mt-0.5">
        {subtitle}
      </div>
    </div>
  );
}


function DataTable({
  data,
  currentPage,
  itemsPerPage,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onExportCSV,
  hasData,
  paymentLinks
}: {
  data: PaymentRow[];
  currentPage: number;
  itemsPerPage: number;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: StatusFilterType;
  onStatusFilterChange: (filter: StatusFilterType) => void;
  onExportCSV: () => void;
  hasData: boolean;
  paymentLinks: Map<string, string>;
}) {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none overflow-hidden">
      {/* Search + Export */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 px-4 py-3">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by amount, address, or description..."
            className="block w-full pl-10 pr-3 py-1.5 border border-[var(--color-border)] text-[13px] placeholder-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-text)] focus:border-transparent min-h-[44px]"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <button
          onClick={onExportCSV}
          disabled={!hasData}
          className="text-[13px] font-medium text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors disabled:opacity-40 min-h-[44px] shrink-0"
        >
          Export CSV
        </button>
      </div>

      {/* Divider */}
      <div className="border-b border-[var(--color-border)]" />

      {/* Status Filter Pills */}
      <div className="flex flex-wrap gap-2 px-4 py-2">
        {(['all', 'pending', 'completed', 'expired'] as StatusFilterType[]).map((filter) => (
          <button
            key={filter}
            onClick={() => onStatusFilterChange(filter)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors capitalize min-h-[44px] ${
              statusFilter === filter
                ? 'bg-[var(--color-border)] text-[var(--color-text)] font-semibold'
                : 'bg-[var(--color-hover)] text-[var(--color-muted)] hover:bg-[var(--color-border)]'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="border-b border-[var(--color-border)]" />

      {/* Type Tabs - Underline Style */}
      <div className="flex gap-6 px-4 border-b border-[var(--color-border)]">
        {(['all', 'sent', 'received'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`pb-2.5 text-[13px] font-medium transition-colors capitalize border-b-2 -mb-px min-h-[44px] ${
              activeTab === tab
                ? 'border-[var(--color-text)] text-[var(--color-text)]'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--color-hover)]">
            <tr>
              <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)]">Type</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)]">Description</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)]">Amount</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)]">Status</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)]">Date</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((payment, index) => (
              <tr 
                key={payment.id} 
                className="border-b border-[var(--color-border)] hover:bg-[var(--color-hover)] transition-colors"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center">
                    {payment.type === 'sent' ? (
                      <svg className="w-4 h-4 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4m0 0l4 4m-4-4v18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-[var(--color-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 17l-4 4m0 0l-4-4m4 4V3" />
                      </svg>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-[var(--color-text)] font-medium">{payment.description}</span>
                    {payment.address && (
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(payment.address!);
                            toast.success('Address copied');
                          } catch (err) {
                            console.error('Failed to copy:', err);
                          }
                        }}
                        className="ml-1 text-[var(--color-section-label)] hover:text-[var(--color-text)] transition-colors inline-flex shrink-0"
                        title="Copy address"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <div className={`text-[13px] font-[family-name:var(--font-mono)] tabular-nums font-semibold ${
                    payment.type === 'received' ? 'text-[var(--color-green)]' : 'text-[var(--color-text)]'
                  }`}>
                    {payment.type === 'sent' ? '–' : ''}${payment.amount.toFixed(2)} {payment.tokenSymbol}
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`px-2.5 py-0.5 border text-[11px] uppercase tracking-wider font-medium rounded-full ${getStatusBadgeStyles(payment.status)}`}>
                    {payment.status}
                    {payment.status === 'pending' && <InfoTooltip text="Payment is on-chain waiting to be claimed by the recipient." />}
                    {payment.status === 'claimed' && <InfoTooltip text="Recipient has successfully claimed this payment." />}
                    {payment.status === 'expired' && <InfoTooltip text="Payment was not claimed before the expiry time and can be refunded." />}
                    {payment.status === 'refunded' && <InfoTooltip text="Funds were returned to the sender after expiry." />}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="text-[13px] text-[var(--color-muted)]">{formatDate(payment.date)}</div>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    {payment.type === 'sent' && payment.status === 'pending' && payment.address && paymentLinks.get(payment.address) && (
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(paymentLinks.get(payment.address!)!);
                            toast.success('Payment link copied');
                          } catch (err) {
                            console.error('Failed to copy:', err);
                          }
                        }}
                        className="text-[var(--color-green)] hover:text-[var(--color-green-hover)] text-[13px] font-medium transition-colors"
                      >
                        Copy Link
                      </button>
                    )}
                    {payment.txSignature && (
                      <a
                        href={`https://explorer.solana.com/tx/${payment.txSignature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--color-green)] hover:text-[var(--color-green-hover)] text-[13px] font-medium transition-colors"
                      >
                        View
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  <div className="text-[13px] text-[var(--color-muted)]">No matching transactions</div>
                  <div className="text-[12px] text-[var(--color-muted)] mt-1">Try adjusting your search or filters</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>


      {/* Mobile card view */}
      <div className="md:hidden">
        {paginatedData.length > 0 ? (
          paginatedData.map((payment, index) => (
            <div key={payment.id} className="border-b border-[var(--color-border)] p-4 space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {payment.type === 'sent' ? (
                    <svg className="w-4 h-4 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4m0 0l4 4m-4-4v18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-[var(--color-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 17l-4 4m0 0l-4-4m4 4V3" />
                    </svg>
                  )}
                  <span className="text-[13px] text-[var(--color-text)] font-medium">{payment.description}</span>
                </div>
                <span className={`text-[13px] font-[family-name:var(--font-mono)] tabular-nums font-semibold ${
                  payment.type === 'received' ? 'text-[var(--color-green)]' : 'text-[var(--color-text)]'
                }`}>
                  {payment.type === 'sent' ? '–' : ''}${payment.amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`px-2.5 py-0.5 border text-[11px] uppercase tracking-wider font-medium rounded-full ${getStatusBadgeStyles(payment.status)}`}>
                  {payment.status}
                </span>
                <span className="text-[13px] text-[var(--color-muted)]">{formatDate(payment.date)}</span>
              </div>
              {payment.type === 'sent' && payment.status === 'pending' && payment.address && paymentLinks.get(payment.address) && (
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(paymentLinks.get(payment.address!)!);
                      toast.success('Payment link copied');
                    } catch (err) {
                      console.error('Failed to copy:', err);
                    }
                  }}
                  className="text-[var(--color-green)] hover:text-[var(--color-green-hover)] text-xs font-medium"
                >
                  Copy payment link →
                </button>
              )}
              {payment.txSignature && (
                <a href={`https://explorer.solana.com/tx/${payment.txSignature}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="text-[var(--color-green)] hover:text-[var(--color-green-hover)] text-xs font-medium">
                  View transaction →
                </a>
              )}
            </div>
          ))
        ) : (
          <div className="px-4 py-8 text-center">
            <div className="text-[13px] text-[var(--color-muted)]">No matching transactions</div>
            <div className="text-[12px] text-[var(--color-muted)] mt-1">Try adjusting your search or filters</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange
}: {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 px-4 py-2.5 bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none">
      <div className="text-[13px] text-[var(--color-muted)]">
        Showing {startIndex}-{endIndex} of {totalItems}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2.5 py-1 text-[13px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-text)] hover:text-[var(--color-text)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px]"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2.5 py-1 text-[13px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-text)] hover:text-[var(--color-text)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px]"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function PaymentHistory() {
  const { connected, publicKey, signMessage } = useWallet();
  const { network } = useNetwork();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [escrows, setEscrows] = useState<EscrowData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [serverPaymentLinks, setServerPaymentLinks] = useState<Map<string, string>>(new Map());

  const itemsPerPage = 25;

  // ─── Pull to refresh ───
  const handleRefresh = useCallback(async () => {
    if (!connected || !publicKey) return;
    
    // Trigger refresh of both API data and localStorage data
    setRefreshKey(k => k + 1);
    
    // Refetch API data
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = '';
      const response = await fetch(`${apiUrl}/api/escrows/creator/${publicKey.toBase58()}`);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data: EscrowResponse = await response.json();
      setEscrows(data.escrows);
    } catch (err) {
      console.error('Failed to refresh payments:', err);
      setError(getErrorMessage(err));
      setEscrows([]);
    } finally {
      setLoading(false);
    }
  }, [connected, publicKey]);
  
  const { containerRef: pullRefreshRef } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  // ─── Helper: Get contact name from localStorage ───
  const getContactName = (address: string): string | null => {
    try {
      const contacts = JSON.parse(localStorage.getItem('zkira_contacts') || '[]');
      const match = contacts.find((c: { address: string }) => c.address === address);
      return match?.name || null;
    } catch {
      return null;
    }
  };

  // Add refresh mechanism - Bug 4 fix
  useEffect(() => {
    const handleFocus = () => setRefreshKey(k => k + 1);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Refresh on navigation
  useEffect(() => {
    setRefreshKey(k => k + 1);
  }, [activeTab]);

  // ─── Fetch sent payments from API ───
  useEffect(() => {
    if (!connected || !publicKey) {
      setEscrows([]);
      return;
    }

    const fetchSentPayments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use relative URL in production (nginx proxies /api/ to port 3012)
        // In local dev, fall back to localhost:3012
        const apiUrl = '';
        const response = await fetch(`${apiUrl}/api/escrows/creator/${publicKey.toBase58()}`);

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        
        const data: EscrowResponse = await response.json();
        setEscrows(data.escrows);
      } catch (err) {
        console.error('Failed to fetch sent payments:', err);
        setError(getErrorMessage(err));
        setEscrows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSentPayments();
  }, [connected, publicKey]);

  // ─── Fetch + decrypt server-side encrypted payment links ───
  useEffect(() => {
    if (!connected || !publicKey || !signMessage) return;

    // Fetch + decrypt server links
    fetchAndDecrypt({ walletAddress: publicKey.toBase58(), signMessage })
      .then(setServerPaymentLinks)
      .catch((err) => console.warn('Failed to fetch server payment links:', err));

    // Auto-migrate localStorage links to server (one-time, idempotent)
    migrateLocalStorageToServer({ walletAddress: publicKey.toBase58(), signMessage })
      .catch((err) => console.warn('Failed to migrate localStorage links:', err));
  }, [connected, publicKey, signMessage, refreshKey]);

  // ─── Read localStorage data - Bug 4 fix: Include refreshKey in dependencies ───
  const receivedInvoices = useMemo(() => {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem('zkira_invoices');
      return stored ? JSON.parse(stored) as Invoice[] : [];
    } catch (err) {
      console.error('Error reading invoices from localStorage:', err);
      return [];
    }
  }, [refreshKey]);

  const claimedTransactions = useMemo(() => {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem('zkira_transactions');
      return stored ? JSON.parse(stored) as ClaimedTransaction[] : [];
    } catch (err) {
      console.error('Error reading transactions from localStorage:', err);
      return [];
    }
  }, [refreshKey]);

  // ─── Merge server + localStorage payment links for copy/resend ───
  const paymentLinks = useMemo(() => {
    const merged = new Map<string, string>();
    // Server links first (canonical source)
    serverPaymentLinks.forEach((url, escrow) => merged.set(escrow, url));
    // localStorage as fallback (doesn't overwrite server)
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('zkira_payment_links');
        const links = stored ? JSON.parse(stored) as { escrowAddress: string; paymentUrl: string; createdAt: string }[] : [];
        links.forEach((l) => {
          if (!merged.has(l.escrowAddress)) merged.set(l.escrowAddress, l.paymentUrl);
        });
      } catch {}
    }
    return merged;
  }, [serverPaymentLinks, refreshKey]);

  // ─── Process payments for display ───
  const allPayments = useMemo(() => {
    const payments: PaymentRow[] = [];

    // Add sent payments (escrows)
    escrows.forEach(escrow => {
      let status: PaymentRow['status'] = 'pending';
      if (escrow.claimed) status = 'claimed';
      else if (escrow.refunded) status = 'refunded';
      else if (new Date(Number(escrow.expiry) * 1000) < new Date()) status = 'expired'; // Bug 3 fix

      payments.push({
        id: `sent-${escrow.address}`,
        type: 'sent',
        amount: convertUsdcAmount(escrow.amount), // Bug 1 fix already applied in function
        tokenSymbol: getTokenSymbol(escrow.tokenMint, network),
        status,
        date: new Date(Number(escrow.expiry) * 1000), // Bug 3 fix: convert Unix seconds to milliseconds
        address: escrow.address,
        description: `Payment to ${getContactName(escrow.address) || truncateAddress(escrow.address)}`
      });
    });

    // Add received invoices
    receivedInvoices.forEach(invoice => {
      payments.push({
        id: `received-${invoice.invoiceId}`,
        type: 'received',
        amount: convertUsdcAmount(invoice.amount), // Bug 1 fix already applied in function
        tokenSymbol: getTokenSymbol(invoice.tokenMint, network),
        status: invoice.status,
        date: new Date(invoice.createdAt),
        description: `Invoice #${invoice.invoiceId.slice(-8)}`
      });
    });

    // Add claimed transactions (also received)
    claimedTransactions.forEach(tx => {
      payments.push({
        id: `claimed-${tx.txSignature}`,
        type: 'received',
        amount: convertUsdcAmount(tx.amount), // Bug 1 fix already applied in function
        tokenSymbol: getTokenSymbol(tx.tokenMint, network),
        status: 'claimed',
        date: new Date(tx.timestamp),
        txSignature: tx.txSignature,
        description: 'Claimed payment'
      });
    });

    // Sort by date descending (newest first)
    return payments.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [escrows, receivedInvoices, claimedTransactions]);

  // ─── Apply filters ───
  const filteredPayments = useMemo(() => {
    let filtered = allPayments;

    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(p => p.type === activeTab);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      const statusMap: Record<StatusFilterType, PaymentRow['status'][]> = {
        all: [],
        pending: ['pending'],
        completed: ['claimed', 'completed'],
        expired: ['expired', 'refunded']
      };
      if (statusMap[statusFilter]) {
        filtered = filtered.filter(p => statusMap[statusFilter].includes(p.status));
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.description.toLowerCase().includes(query) ||
        p.amount.toString().includes(query) ||
        (p.address && p.address.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [allPayments, activeTab, statusFilter, searchQuery]);

  // Calculate metrics
  const totalSent = allPayments
    .filter(p => p.type === 'sent' && (p.status === 'claimed' || p.status === 'completed'))
    .reduce((sum, p) => sum + p.amount, 0);

  const totalReceived = allPayments
    .filter(p => p.type === 'received' && (p.status === 'claimed' || p.status === 'completed'))
    .reduce((sum, p) => sum + p.amount, 0);

  const totalTransactions = allPayments.length;

  const handleExportCSV = useCallback(() => {
    downloadCSV(filteredPayments);
  }, [filteredPayments]);

  const hasAnyHistory = allPayments.length > 0;
  const hasFilteredData = filteredPayments.length > 0;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, statusFilter, searchQuery]);

  // ─── Render ───
  if (!connected) {
    return (
      <div className="space-y-4 animate-fade-in">
        <EmptyState
          title="Connect your wallet"
          description="Connect your wallet to view payment history"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 6v3" />
            </svg>
          }
          compact
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        {/* Skeleton Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SkeletonMetric />
          <SkeletonMetric />
          <SkeletonMetric />
        </div>
        
        {/* Skeleton Search Bar */}
        <div className="bg-[var(--color-surface)] border-1.5 border-[var(--border-subtle-hover)] rounded-none p-4">
          <div className="h-10 bg-[var(--color-hover)] rounded mb-4 skeleton-shimmer" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-6 w-16 bg-[var(--color-hover)] rounded-full skeleton-shimmer" />
            ))}
          </div>
        </div>
        
        {/* Skeleton Table */}
        <SkeletonTable rows={10} />
      </div>
    );
  }

  if (!hasAnyHistory) {
    return (
      <div ref={pullRefreshRef} className="space-y-4 animate-fade-in">
        <EmptyState
          title="No payments yet"
          description="Start by creating a payment or requesting one"
          actionLabel="Create Payment"
          actionHref="/create"
        />
      </div>
    );
  }

  return (
    <div ref={pullRefreshRef} className="space-y-4 animate-fade-in">
      {/* Error Message */}
      {error && (
        <div className="border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-4 text-[var(--color-error-text)] text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Total Sent"
          value={formatCurrency(totalSent)}
          subtitle={totalSent > 0 ? `${allPayments.filter(p => p.type === 'sent').length} payment${allPayments.filter(p => p.type === 'sent').length === 1 ? '' : 's'}` : 'No activity yet'}
          animationDelay={0}
        />
        <MetricCard
          label="Total Received"
          value={formatCurrency(totalReceived)}
          subtitle={totalReceived > 0 ? `${allPayments.filter(p => p.type === 'received').length} payment${allPayments.filter(p => p.type === 'received').length === 1 ? '' : 's'}` : 'No activity yet'}
          animationDelay={60}
        />
        <MetricCard
          label="Total Transactions"
          value={totalTransactions.toString()}
          subtitle={totalTransactions > 0 ? `${totalTransactions} transaction${totalTransactions === 1 ? '' : 's'}` : 'No activity yet'}
          animationDelay={120}
        />
      </div>


      {/* Data Table */}
      <DataTable
        data={filteredPayments}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onExportCSV={handleExportCSV}
        hasData={hasAnyHistory}
        paymentLinks={paymentLinks}
      />
      {/* Pagination */}
      {hasFilteredData && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredPayments.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}