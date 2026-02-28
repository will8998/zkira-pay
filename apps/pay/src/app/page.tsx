'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import Link from 'next/link';
import { EmptyState } from '@/components/EmptyState';
import { useWallet, useUnifiedWalletContext } from '@/components/WalletProvider';

interface Transaction {
  id?: string;
  type: 'sent' | 'received';
  amount: string | number;
  recipientAddress?: string;
  senderAddress?: string;
  status: 'completed' | 'pending' | 'failed' | 'claimed';
  timestamp: string;
  description?: string;
  txSignature?: string;
  escrowAddress?: string;
}

interface Invoice {
  invoiceId?: string;
  id?: string;
  amount: string | number;
  description?: string;
  status: 'active' | 'claimed' | 'expired' | 'pending';
  createdAt: string;
  claimedAt?: string;
  claimSecretHex?: string;
  metaAddress?: string;
  tokenMint?: string;
  expiry?: string;
}

export default function Dashboard() {
  const { connected, publicKey } = useWallet();
  const { setShowModal } = useUnifiedWalletContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [userPoints, setUserPoints] = useState<string>('0');
  
  // Fetch points balance
  useEffect(() => {
    if (!connected || !publicKey) return;
    const wallet = publicKey.toBase58();
    const API_URL = '';
    fetch(`${API_URL}/api/points/${wallet}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.totalPoints) setUserPoints(data.totalPoints);
      })
      .catch(() => {});
  }, [connected, publicKey]);
  // Helper function to convert amount string to number
  const convertAmount = (amount: string | number): number => {
    if (typeof amount === 'number') return amount;
    try {
      // Try to parse as BigInt (raw u64 format)
      return Number(BigInt(amount)) / 1_000_000;
    } catch {
      // Fallback to regular number parsing
      return parseFloat(amount) || 0;
    }
  };

  // ─── Pull to refresh ───
  const handleRefresh = useCallback(() => {
    // Reload data from localStorage
    const storedTransactions = localStorage.getItem('zkira_transactions');
    const storedInvoices = localStorage.getItem('zkira_invoices');

    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions));
    } else {
      setTransactions([]);
    }

    if (storedInvoices) {
      setInvoices(JSON.parse(storedInvoices));
    } else {
      setInvoices([]);
    }
  }, []);
  
  const { containerRef: pullRefreshRef } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  useEffect(() => {
    // Load data from localStorage
    const storedTransactions = localStorage.getItem('zkira_transactions');
    const storedInvoices = localStorage.getItem('zkira_invoices');

    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions));
    }

    if (storedInvoices) {
      setInvoices(JSON.parse(storedInvoices));
    }
  }, []);

  // Calculate metrics
  const totalSent = transactions
    .filter(tx => tx.type === 'sent' && tx.status === 'completed')
    .reduce((sum, tx) => sum + convertAmount(tx.amount), 0);

  const totalReceived = transactions
    .filter(tx => tx.type === 'received' && tx.status === 'completed')
    .reduce((sum, tx) => sum + convertAmount(tx.amount), 0) +
    invoices
      .filter(invoice => invoice.status === 'claimed')
      .reduce((sum, invoice) => sum + convertAmount(invoice.amount), 0);

  const activeEscrows = invoices.filter(invoice => invoice.status !== 'claimed').length;

  const sentCount = transactions.filter(tx => tx.type === 'sent' && tx.status === 'completed').length;
  const receivedCount = transactions.filter(tx => tx.type === 'received' && tx.status === 'completed').length +
    invoices.filter(invoice => invoice.status === 'claimed').length;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Recent activity (combine transactions and invoices, sort by date)
  const recentActivity = [
    ...transactions.map(tx => ({
      id: tx.id || `tx-${tx.timestamp}`,
      type: tx.type === 'sent' ? 'Payment Sent' : 'Payment Received',
      amount: convertAmount(tx.amount),
      status: tx.status,
      date: new Date(tx.timestamp)
    })),
    ...invoices.map(invoice => ({
      id: invoice.id || invoice.invoiceId || `inv-${invoice.createdAt}`,
      type: 'Invoice',
      amount: convertAmount(invoice.amount),
      status: invoice.status === 'claimed' ? 'completed' : invoice.status === 'expired' ? 'expired' : 'pending',
      date: new Date(invoice.createdAt)
    }))
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  if (!connected) {
    return (
      <div className="h-[calc(100dvh-3.5rem-4rem)] md:h-[calc(100dvh-3.5rem)] bg-[#000000] relative overflow-hidden">
        {/* Video Background — fills viewport */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          style={{ filter: 'brightness(0.8) contrast(1.1)' }}
        >
          <source src="/hero-animation.mp4" type="video/mp4" />
        </video>

        {/* Dark gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />

        {/* Content — centered on top of video */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-6">
          {/* Hero Text */}
          <div className="text-center mb-10 max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-light text-white mb-6 font-[family-name:var(--font-sans)] tracking-[-0.02em] leading-[1.05]">
              Stealth Payments
              <br />
              <span className="bg-gradient-to-r from-[#FF2828] to-[#FF6B6B] bg-clip-text text-transparent">on Solana</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-[rgba(255,255,255,0.6)] max-w-lg mx-auto leading-relaxed">
              Send confidential payments with stealth addresses.
              <br className="hidden sm:block" />
              Zero traceability. Instant settlement.
            </p>
          </div>

          {/* CTA Button — frosted glass */}
          <button
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto bg-[#FF2828] text-white px-8 py-3 text-[15px] font-medium rounded-full hover:bg-[#E02020] transition-all duration-200 font-[family-name:var(--font-sans)] mb-12"
          >
            Connect Wallet
          </button>

          {/* Feature Labels — minimal and clean */}
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 text-[rgba(255,255,255,0.7)]">
            <span className="text-[13px] font-light tracking-wide">Stealth</span>
            <span className="text-[rgba(255,255,255,0.3)]">•</span>
            <span className="text-[13px] font-light tracking-wide">Invoices</span>
            <span className="text-[rgba(255,255,255,0.3)]">•</span>
            <span className="text-[13px] font-light tracking-wide">Escrow</span>
            <span className="text-[rgba(255,255,255,0.3)]">•</span>
            <span className="text-[13px] font-light tracking-wide">Multi-sig</span>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={pullRefreshRef} className="px-4 md:px-6 py-4 md:py-6 max-w-6xl mx-auto">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="animate-entrance bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4" style={{ animationDelay: '0ms' }}>
          <div className="text-[13px] font-medium text-[var(--color-muted)] mb-0.5">Total Sent</div>
          <div className="text-lg font-semibold text-[var(--color-text)] font-[family-name:var(--font-mono)] tabular-nums">
            {totalSent > 0 ? formatCurrency(totalSent) : '$0.00'}
          </div>
          <div className="text-xs text-[var(--color-muted)] mt-0.5">
            {sentCount > 0 ? `${sentCount} payment${sentCount === 1 ? '' : 's'}` : 'No activity yet'}
          </div>
        </div>

        <div className="animate-entrance bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4" style={{ animationDelay: '60ms' }}>
          <div className="text-[13px] font-medium text-[var(--color-muted)] mb-0.5">Total Received</div>
          <div className="text-lg font-semibold text-[var(--color-text)] font-[family-name:var(--font-mono)] tabular-nums">
            {totalReceived > 0 ? formatCurrency(totalReceived) : '$0.00'}
          </div>
          <div className="text-xs text-[var(--color-muted)] mt-0.5">
            {receivedCount > 0 ? `${receivedCount} payment${receivedCount === 1 ? '' : 's'}` : 'No activity yet'}
          </div>
        </div>

        <div className="animate-entrance bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4" style={{ animationDelay: '120ms' }}>
          <div className="text-[13px] font-medium text-[var(--color-muted)] mb-0.5">Active Escrows</div>
          <div className="text-lg font-semibold text-[var(--color-text)] font-[family-name:var(--font-mono)] tabular-nums">
            {activeEscrows}
          </div>
          <div className="text-xs text-[var(--color-muted)] mt-0.5">
            {activeEscrows > 0 ? `${activeEscrows} pending escrow${activeEscrows === 1 ? '' : 's'}` : 'No activity yet'}
          </div>
        </div>

        <Link href="/points" className="animate-entrance bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4 hover:border-[var(--border-subtle-hover)] transition-colors" style={{ animationDelay: '180ms' }}>
          <div className="text-[13px] font-medium text-[var(--color-muted)] mb-0.5">Points</div>
          <div className="text-lg font-semibold text-[var(--color-text)] font-[family-name:var(--font-mono)] tabular-nums">
            {parseFloat(userPoints).toLocaleString()}
          </div>
          <div className="text-xs text-[#FF2828] mt-0.5">
            View rewards →
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Link href="/create" className="animate-entrance bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none hover:border-[var(--border-subtle-hover)] transition-all duration-200 p-4 group flex items-center gap-4 min-h-[60px]" style={{ animationDelay: '180ms' }}>
          <div className="w-8 h-8 bg-[var(--color-hover)] flex items-center justify-center">
            <svg className="w-4 h-4 text-[var(--color-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--color-text)]">Send Payment</div>
            <div className="text-xs text-[var(--color-muted)]">Send confidential payment via stealth address</div>
          </div>
        </Link>

        <Link href="/request" className="animate-entrance bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none hover:border-[var(--border-subtle-hover)] transition-all duration-200 p-4 group flex items-center gap-4 min-h-[60px]" style={{ animationDelay: '240ms' }}>
          <div className="w-8 h-8 bg-[var(--color-hover)] flex items-center justify-center">
            <svg className="w-4 h-4 text-[var(--color-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--color-text)]">Request Payment</div>
            <div className="text-xs text-[var(--color-muted)]">Generate invoice link for incoming payment</div>
          </div>
        </Link>

        <Link href="/escrow/create" className="animate-entrance bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none hover:border-[var(--border-subtle-hover)] transition-all duration-200 p-4 group flex items-center gap-4 min-h-[60px]" style={{ animationDelay: '300ms' }}>
          <div className="w-8 h-8 bg-[var(--color-hover)] flex items-center justify-center">
            <svg className="w-4 h-4 text-[var(--color-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--color-text)]">Create Escrow</div>
            <div className="text-xs text-[var(--color-muted)]">Set up milestone-based escrow payment</div>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="animate-entrance bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none overflow-hidden" style={{ animationDelay: '360ms' }}>
        <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-[var(--color-text)]">Recent Activity</h2>
          <Link href="/history" className="text-xs font-medium text-[#FF2828] hover:text-[#E02020]">View all</Link>
        </div>

        {recentActivity.length > 0 ? (
          <>
          <div className="hidden md:block">
            <table className="w-full">
              <thead className="bg-[var(--color-hover)]">
                <tr>
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)]">Type</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)]">Amount</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)]">Status</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)]">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((item, index) => (
                  <tr key={item.id} className={`border-b border-[var(--color-border)] hover:bg-[var(--color-hover)] ${index === recentActivity.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-4 py-2.5 text-[13px] text-[var(--color-text)]">{item.type}</td>
                    <td className="px-4 py-2.5 text-[13px] font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)]">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${
                        item.status === 'completed' 
                          ? 'bg-[rgba(156,220,106,0.15)] text-[#9CDC6A]'
                          : item.status === 'pending' || item.status === 'active'
                          ? 'bg-[rgba(255,209,70,0.15)] text-[#FFD146]'
                          : 'bg-[rgba(255,40,40,0.15)] text-[#FF2828]'
                      }`}>
                        {item.status === 'completed' ? 'Completed' : 
                         item.status === 'pending' ? 'Pending' :
                         item.status === 'active' ? 'Active' : 
                         item.status === 'expired' ? 'Expired' : 'Failed'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[13px] text-[var(--color-muted)]">
                      {item.date.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: item.date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-[var(--color-border)]">
            {recentActivity.map((item) => (
              <div key={item.id} className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-[var(--color-text)] font-medium">{item.type}</span>
                  <span className="text-[13px] font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)]">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${
                    item.status === 'completed' 
                      ? 'bg-[rgba(156,220,106,0.15)] text-[#9CDC6A]'
                      : item.status === 'pending' || item.status === 'active'
                      ? 'bg-[rgba(255,209,70,0.15)] text-[#FFD146]'
                      : 'bg-[rgba(255,40,40,0.15)] text-[#FF2828]'
                  }`}>
                    {item.status === 'completed' ? 'Completed' : 
                     item.status === 'pending' ? 'Pending' :
                     item.status === 'active' ? 'Active' : 
                     item.status === 'expired' ? 'Expired' : 'Failed'}
                  </span>
                  <span className="text-[13px] text-[var(--color-muted)]">
                    {item.date.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: item.date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
          </>
        ) : (
          <div className="p-4">
            <EmptyState
              title="No transactions yet"
              description="Start by creating a payment or requesting one"
              actionLabel="Create Payment"
              actionHref="/create"
              compact
            />
          </div>
        )}
      </div>
    </div>
  );
}