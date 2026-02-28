'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useWallet } from './WalletProvider';
import { useBalance } from './useBalance';

import { WalletPill } from './WalletPill';


export function TopBar() {
  const pathname = usePathname();
  const { connected } = useWallet();
  const { sol, usdc, loading } = useBalance();


  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    if (path === '/create') {
      return pathname === '/create';
    }
    return pathname.startsWith(path);
  };

  // Center navigation - only main actions
  const centerNavigation = [
    { name: 'Send', href: '/create' },
    { name: 'Request', href: '/request' },
    { name: 'Escrow', href: '/escrow' },
    { name: 'Learn', href: '/learn' },
  ];

  // Profile dropdown items
  const profileItems = [
    { 
      name: 'History', 
      href: '/history',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      name: 'Contacts', 
      href: '/contacts',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      )
    },
    { 
      name: 'Points', 
      href: '/points',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      )
    },
    { 
      name: 'Leaderboard', 
      href: '/leaderboard',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.228V2.721A48.703 48.703 0 0016.252 2.25c2.291 0 4.545.16 6.75.47v1.516M18.27 9.728a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
        </svg>
      )
    },
    { 
      name: 'Referral', 
      href: '/referral',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      )
    },
    { 
      name: 'API Keys', 
      href: '/developers',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159-.026-1.658.33L10.5 16.5l-1.902-1.902c-.356-.499-.427-1.095-.33-1.658A6 6 0 0121.75 8.25z" />
        </svg>
      )
    },
    { 
      name: 'Analytics', 
      href: '/analytics',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      )
    },
    {
      name: 'Tokenomics',
      href: '/tokenomics',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
  ];

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  return (
    <div className="relative z-20 h-14 bg-[rgba(10,10,10,0.7)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.06)] px-3 md:px-4 flex items-center shrink-0">
      {/* Left — ZKIRA Logo */}
      <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
        <img src="/logo.webp" alt="ZKIRA Pay" className="h-7 w-auto" />
      </Link>

      {/* Center — Navigation (hidden on mobile) */}
      <div className="hidden md:flex flex-1 justify-center">
        <nav className="flex items-center gap-6">
          {centerNavigation.map((item) => {
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
      {/* Right — Stats + Help + Network + Wallet */}
      <div className="flex items-center gap-2 ml-auto md:ml-0">
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

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="group flex items-center justify-center gap-2 px-3 h-10 bg-[var(--color-hover)] border border-[var(--color-border)] hover:bg-[var(--color-skeleton)] hover:border-[#FF2828] transition-all duration-200"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--color-muted)] group-hover:text-[#FF2828] transition-colors" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <span className="hidden md:inline text-sm font-medium text-[var(--color-text)] group-hover:text-[#FF2828] transition-colors">Menu</span>
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF2828] rounded-full animate-pulse opacity-80" />
          </button>

          {profileDropdownOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setProfileDropdownOpen(false)}
              />
              
              {/* Dropdown */}
              <div className="absolute right-0 top-10 z-50 w-56 bg-[#111111] border border-[#282828] rounded-lg shadow-2xl overflow-hidden">
                <div className="py-1">
                  {profileItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setProfileDropdownOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                          active
                            ? 'text-[#FF2828] bg-[var(--color-hover)]'
                            : 'text-[var(--color-text)] hover:bg-[var(--color-hover)]'
                        }`}
                      >
                        <div className={active ? 'text-[#FF2828]' : 'text-[var(--color-muted)]'}>
                          {item.icon}
                        </div>
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Wallet */}
        <WalletPill />
      </div>
    </div>
  );
}
