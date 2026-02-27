'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from './ThemeProvider';


export function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    // For routes like /create, ensure it doesn't match /escrow/create
    if (path === '/create') {
      return pathname === '/create';
    }
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
            <span className="shrink-0 transition-transform duration-200"><svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg></span>
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
            <span className="shrink-0 transition-transform duration-200"><svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
            </svg></span>
          ),
        },
        {
          name: 'Request',
          href: '/request',
          icon: (
            <span className="shrink-0 transition-transform duration-200"><svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
            </svg></span>
          ),
        },
        {
          name: 'Batch',
          href: '/batch',
          icon: (
            <span className="shrink-0 transition-transform duration-200"><svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 17.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg></span>
          ),
        },
      ],
    },
    {
      section: 'FINANCE',
      items: [
        {
          name: 'Escrow',
          href: '/escrow',
          icon: (
            <span className="shrink-0 transition-transform duration-200"><svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg></span>
          ),
        },
        {
          name: 'Multi-sig',
          href: '/multisig',
          icon: (
            <span className="shrink-0 transition-transform duration-200"><svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg></span>
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
            <span className="shrink-0 transition-transform duration-200"><svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg></span>
          ),
        },
        {
          name: 'Contacts',
          href: '/contacts',
          icon: (
            <span className="shrink-0 transition-transform duration-200"><svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg></span>
          ),
        },
      ],
    },
    {
      section: 'REWARDS',
      items: [
        {
          name: 'Points',
          href: '/points',
          icon: (
            <span className="shrink-0 transition-transform duration-200"><svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg></span>
          ),
        },
        {
          name: 'Leaderboard',
          href: '/leaderboard',
          icon: (
            <span className="shrink-0 transition-transform duration-200"><svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.77.896m5.25-6.388V2.72" />
            </svg></span>
          ),
        },
        {
          name: 'Referral',
          href: '/referral',
          icon: (
            <span className="shrink-0 transition-transform duration-200"><svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg></span>
          ),
        },
      ],
    },
    {
      section: 'DEVELOPERS',
      items: [
        {
          name: 'API Keys',
          href: '/developers',
          icon: (
            <span className="shrink-0 transition-transform duration-200"><svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg></span>
          ),
        },
        {
          name: 'Docs',
          href: '/developers/docs',
          icon: (
            <span className="shrink-0 transition-transform duration-200"><svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg></span>
          ),
        },
      ],
    },
  ];

  const SidebarContent = () => (
    <div className="w-full bg-[var(--bg-panel)] backdrop-blur-xl glass-panel border-r border-[var(--border-subtle)] h-screen flex flex-col sticky top-0 overflow-y-auto">
      {/* Top Section */}
      <Link href="/" className="px-4 py-4 flex items-center gap-2.5 border-b border-[var(--border-subtle)] pb-3 mb-1 hover:opacity-80 transition-opacity">
        <Image src="/zkira-logo.svg" alt="ZKIRA" width={101} height={40} className="h-[28px] w-auto logo-image" priority />
      </Link>


      <nav className="flex-1">
        {navigation.map((group, groupIndex) => (
          <div key={groupIndex}>
            {group.section && (
              <div className="text-[9px] font-bold tracking-[0.15em] text-[var(--color-section-label)] uppercase mt-5 mb-1.5 px-2.5" style={{ fontFamily: 'var(--font-mono)' }}>
                {group.section}
              </div>
            )}
            {group.items.map((item) => {
              const active = isActive(item.href);
              
              if ('external' in item && item.external) {
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener"
                    className="group flex items-center gap-2.5 px-2.5 py-1.5 mx-1.5 rounded-none text-[13px] font-medium transition-all duration-150 hover:bg-[var(--border-subtle)] hover:text-[var(--color-text)]"
                  >
                    <span className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5">{item.icon}</span>
                    {item.name}
                  </a>
                );
              }

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
                  <span className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      {/* Footer — Theme Toggle */}
      <div className="px-2.5 py-3 border-t border-[var(--border-subtle)]">
        <ThemeToggle />
      </div>
    </div>
  );

  return (
    <div className="hidden md:flex md:flex-col md:w-48 lg:w-56">
      <SidebarContent />
    </div>
  );
}