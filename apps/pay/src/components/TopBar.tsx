'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useCommandPalette } from './CommandPalette';
import { useWallet } from './WalletProvider';
import { useBalance } from './useBalance';
import { HelpPopover } from './HelpPopover';
import { WalletPill } from './WalletPill';
import { useNetwork, NETWORK_CONFIG } from '@/lib/network-config';

export function TopBar() {
  const pathname = usePathname();
  const { setOpen } = useCommandPalette();
  const { connected } = useWallet();
  const { sol, usdc, loading } = useBalance();
  const { network } = useNetwork();

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    if (path === '/create') {
      return pathname === '/create';
    }
    return pathname.startsWith(path);
  };

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Send', href: '/create' },
    { name: 'Request', href: '/request' },
    { name: 'Batch', href: '/batch' },
    { separator: true },
    { name: 'Escrow', href: '/escrow' },
    { name: 'Multi-sig', href: '/multisig' },
    { separator: true },
    { name: 'History', href: '/history' },
    { name: 'Contacts', href: '/contacts' },
    { separator: true },
    { name: 'Points', href: '/points' },
    { name: 'Leaderboard', href: '/leaderboard' },
    { name: 'Referral', href: '/referral' },
    { separator: true },
    { name: 'API Keys', href: '/developers' },
    { name: 'Docs', href: '/developers/docs' },
  ];

  return (
    <div className="relative z-20 h-14 bg-[#0A0A0A] border-b border-[#282828] px-3 md:px-4 flex items-center shrink-0">
      {/* Left — ZKIRA Logo */}
      <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
        <img src="/zkira-logo.svg" alt="ZKIRA Pay" className="h-7 w-auto" />
      </Link>

      {/* Center — Navigation (hidden on mobile) */}
      <div className="hidden md:flex flex-1 justify-center">
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {navigation.map((item, index) => {
            if ('separator' in item && item.separator) {
              return (
                <div
                  key={`separator-${index}`}
                  className="h-4 w-px bg-[#3C3C3C] mx-3 shrink-0"
                />
              );
            }

            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative px-3 py-2 text-[13px] font-medium transition-colors shrink-0 ${
                  active
                    ? 'text-[#FF2828]'
                    : 'text-[rgba(255,255,255,0.5)] hover:text-white'
                }`}
              >
                {item.name}
                {active && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF2828]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right — Search + Stats + Help + Network + Wallet */}
      <div className="flex items-center gap-2 ml-auto md:ml-0">
        {/* Desktop Search Pill */}
        <button
          onClick={() => setOpen(true)}
          className="hidden sm:flex items-center gap-2 bg-[var(--color-hover)] border border-[var(--color-border)] px-3 py-1.5 hover:bg-[var(--color-skeleton)] hover:border-[var(--border-subtle)] transition-all cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 text-[var(--color-muted)]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <span className="text-[12px] text-[var(--color-muted)]">Search...</span>
          <span className="kbd">⌘K</span>
        </button>

        {/* Mobile Search Icon */}
        <button
          onClick={() => setOpen(true)}
          className="sm:hidden flex items-center justify-center w-8 h-8 min-h-[44px] min-w-[44px]"
        >
          <svg className="w-4 h-4 text-[var(--color-muted)]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </button>

        {/* Balance pills (only when connected) */}
        {connected && (
          <div className="hidden md:flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-[var(--color-hover)] px-2 py-1 rounded-md">
              <span className="text-[11px] text-[var(--color-muted)]">SOL</span>
              {loading ? (
                <div className="w-8 h-3 skeleton-shimmer rounded" />
              ) : (
                <span className="text-[12px] font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)] font-medium">
                  {sol !== null ? sol.toFixed(2) : '0.00'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 bg-[var(--color-hover)] px-2 py-1 rounded-md">
              <span className="text-[11px] text-[var(--color-muted)]">USDC</span>
              {loading ? (
                <div className="w-8 h-3 skeleton-shimmer rounded" />
              ) : (
                <span className="text-[12px] font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)] font-medium">
                  {usdc !== null ? usdc.toFixed(2) : '0.00'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Help */}
        <HelpPopover />

        {/* Network badge */}
        <div className={`px-2 py-0.5 text-[9px] font-semibold tracking-wide rounded-full hidden sm:block border ${NETWORK_CONFIG[network].badge.bgClass} ${NETWORK_CONFIG[network].badge.textClass} ${NETWORK_CONFIG[network].badge.borderClass}`}>
          {NETWORK_CONFIG[network].label}
        </div>

        {/* Wallet */}
        <WalletPill />
      </div>
    </div>
  );
}
