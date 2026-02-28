'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { MoreSheet } from './MoreSheet';

export function BottomTabBar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  // Don't show on admin routes
  if (pathname?.startsWith('/admin')) return null;

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    if (path === '/create') {
      return pathname === '/create';
    }
    return pathname.startsWith(path);
  };

  const isMoreActive = () => {
    return pathname?.startsWith('/batch') || 
           pathname?.startsWith('/multisig') || 
           pathname?.startsWith('/history') ||
           pathname?.startsWith('/contacts') || 
           pathname?.startsWith('/developers') ||
           pathname?.startsWith('/points') ||
           pathname?.startsWith('/leaderboard') ||
           pathname?.startsWith('/referral');
  };

  const tabs = [
    {
      name: 'Home',
      href: '/',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      ),
    },
    {
      name: 'Send',
      href: '/create',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
        </svg>
      ),
    },
    {
      name: 'Request',
      href: '/request',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
        </svg>
      ),
    },
    {
      name: 'Escrow',
      href: '/escrow',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-[#0A0A0A] border-t border-[#282828] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className="flex flex-col items-center justify-center gap-0.5 min-w-[64px] min-h-[48px] transition-colors"
              >
                <div className={active ? 'text-[#FF2828] font-semibold' : 'text-[rgba(255,255,255,0.35)]'}>
                  {tab.icon}
                </div>
                <span className={`text-[10px] font-medium ${active ? 'text-[#FF2828] font-semibold' : 'text-[rgba(255,255,255,0.35)]'}`}>
                  {tab.name}
                </span>
              </Link>
            );
          })}
          
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 min-w-[64px] min-h-[48px] transition-colors"
          >
            <div className={isMoreActive() ? 'text-[#FF2828] font-semibold' : 'text-[rgba(255,255,255,0.35)]'}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
            </div>
            <span className={`text-[10px] font-medium ${isMoreActive() ? 'text-[#FF2828] font-semibold' : 'text-[rgba(255,255,255,0.35)]'}`}>
              More
            </span>
          </button>
        </div>
      </nav>

      <MoreSheet isOpen={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}