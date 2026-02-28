'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import Link from 'next/link';
import { EmptyState } from '@/components/EmptyState';
import { useWallet } from '@/components/WalletProvider';

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
  const { connected, publicKey, connect } = useWallet();
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
      <div ref={pullRefreshRef} className="min-h-screen bg-[#000000] relative overflow-x-hidden">
        {/* Hero Section */}
        <div className="min-h-screen flex flex-col items-center justify-center px-6 relative">
          {/* Hero Content */}
          <div className="text-center mb-12 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 font-[family-name:var(--font-sans)] tracking-tight leading-none">
              Stealth Payments
              <br />
              <span className="bg-gradient-to-r from-[#FF2828] to-[#FF6B6B] bg-clip-text text-transparent">on Solana</span>
            </h1>
            <p className="text-lg md:text-xl text-[var(--color-muted)] max-w-3xl mx-auto mb-16 leading-relaxed">
              Send confidential payments with stealth addresses. Zero traceability. Instant settlement.
            </p>
          </div>

          {/* Hero Video */}
          <div className="w-full max-w-4xl mx-auto mb-16 relative">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-auto rounded-none shadow-[0_0_60px_rgba(255,40,40,0.15),0_0_120px_rgba(255,40,40,0.1)] border border-[rgba(255,40,40,0.2)]"
              style={{
                filter: 'brightness(1.1) contrast(1.05)',
              }}
            >
              <source src="/hero-animation.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Connect Wallet CTA */}
          <div className="text-center">
            <button
              onClick={connect}
              className="bg-[#FF2828] text-white px-12 py-4 text-lg font-semibold hover:bg-[#E02020] transition-all duration-300 neon-glow transform hover:scale-105 font-[family-name:var(--font-sans)] tracking-wide"
            >
              Connect Wallet to Get Started
            </button>
          </div>
        </div>

        {/* Feature Boxes Section */}
        <div className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Stealth Transfers */}
              <div className="animate-entrance bg-[#111111] border border-[rgba(255,255,255,0.06)] p-8 hover:border-[rgba(255,40,40,0.3)] transition-all duration-500 group" style={{ animationDelay: '0ms' }}>
                <div className="flex items-start gap-6">
                  <div className="w-8 h-8 text-[#FF2828] flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3 font-[family-name:var(--font-sans)]">Stealth Transfers</h3>
                    <p className="text-[var(--color-muted)] leading-relaxed">Send USDC via stealth addresses. Only the claim link recipient can access funds.</p>
                  </div>
                </div>
              </div>

              {/* Invoice Links */}
              <div className="animate-entrance bg-[#111111] border border-[rgba(255,255,255,0.06)] p-8 hover:border-[rgba(255,40,40,0.3)] transition-all duration-500 group" style={{ animationDelay: '100ms' }}>
                <div className="flex items-start gap-6">
                  <div className="w-8 h-8 text-[#FF2828] flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3 font-[family-name:var(--font-sans)]">Invoice Links</h3>
                    <p className="text-[var(--color-muted)] leading-relaxed">Generate invoice links for incoming payments with built-in expiry.</p>
                  </div>
                </div>
              </div>

              {/* Milestone Escrow */}
              <div className="animate-entrance bg-[#111111] border border-[rgba(255,255,255,0.06)] p-8 hover:border-[rgba(255,40,40,0.3)] transition-all duration-500 group" style={{ animationDelay: '200ms' }}>
                <div className="flex items-start gap-6">
                  <div className="w-8 h-8 text-[#FF2828] flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3 font-[family-name:var(--font-sans)]">Milestone Escrow</h3>
                    <p className="text-[var(--color-muted)] leading-relaxed">Release funds milestone-by-milestone with on-chain enforcement.</p>
                  </div>
                </div>
              </div>

              {/* Multi-sig Approval */}
              <div className="animate-entrance bg-[#111111] border border-[rgba(255,255,255,0.06)] p-8 hover:border-[rgba(255,40,40,0.3)] transition-all duration-500 group" style={{ animationDelay: '300ms' }}>
                <div className="flex items-start gap-6">
                  <div className="w-8 h-8 text-[#FF2828] flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3 font-[family-name:var(--font-sans)]">Multi-sig Approval</h3>
                    <p className="text-[var(--color-muted)] leading-relaxed">Require multiple approvers before funds are released.</p>
                  </div>
                </div>
              </div>
            </div>
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