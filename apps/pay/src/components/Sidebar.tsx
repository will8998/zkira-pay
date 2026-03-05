'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from './ThemeProvider';

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    if (path === '/create') return pathname === '/create';
    return pathname.startsWith(path);
  };

  const navigation = [
    {
      section: null,
      items: [
        {
          name: 'Home',
          href: '/',
          icon: (
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          ),
        },
      ],
    },
    {
      section: 'PAYMENTS',
      items: [
        {
          name: 'Send',
          href: '/create',
          icon: (
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
            </svg>
          ),
        },
        {
          name: 'Request',
          href: '/request',
          icon: (
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
            </svg>
          ),
        },
        {
          name: 'Claim',
          href: '/claim',
          icon: (
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
      ],
    },
    {
      section: 'PRIVACY',
      items: [
        {
          name: 'Pool',
          href: '/pool',
          icon: (
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          ),
        },
      ],
    },
    {
      section: 'ACTIVITY',
      items: [
        {
          name: 'History',
          href: '/history',
          icon: (
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
      ],
    },
    {
      section: 'LEARN',
      items: [
        {
          name: 'Learn Hub',
          href: '/learn',
          icon: (
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
            </svg>
          ),
        },
      ],
    },
  ];

  return (
    <div className="hidden md:flex md:flex-col md:w-48 lg:w-56">
      <div className="w-full bg-[var(--bg-panel)] backdrop-blur-xl glass-panel border-r border-[var(--border-subtle)] h-screen flex flex-col sticky top-0 overflow-y-auto">
        {/* Logo */}
        <Link href="/" className="px-4 py-4 flex items-center gap-2.5 border-b border-[var(--border-subtle)] pb-3 mb-1 hover:opacity-80 transition-opacity">
          <Image src="/logo.webp" alt="ZKIRA" width={101} height={40} className="h-[28px] w-auto logo-image" priority />
        </Link>

        <nav className="flex-1">
          {navigation.map((group, groupIndex) => (
            <div key={groupIndex}>
              {group.section && (
                <div
                  className="text-[9px] font-bold tracking-[0.15em] text-[var(--color-section-label)] uppercase mt-5 mb-1.5 px-2.5"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {group.section}
                </div>
              )}
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center gap-2.5 px-2.5 py-1.5 mx-1.5 rounded-none text-[13px] font-medium transition-all duration-150 ${
                      active
                        ? 'bg-[var(--color-nav-active-bg)] text-[var(--color-nav-active-text)]'
                        : 'hover:bg-[var(--border-subtle)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    <span className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5">
                      {item.icon}
                    </span>
                    {item.name}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2.5 py-3 border-t border-[var(--border-subtle)]">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
