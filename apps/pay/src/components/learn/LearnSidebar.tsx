'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

export function LearnSidebar() {
  const pathname = usePathname();

  const learnNav: NavSection[] = [
    {
      label: 'OVERVIEW',
      items: [
        {
          name: 'Learn Hub',
          href: '/learn',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
            </svg>
          ),
        },
      ],
    },
    {
      label: 'RESOURCES',
      items: [
        {
          name: 'How It Works',
          href: '/learn/docs',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          ),
        },
        {
          name: 'Use Cases',
          href: '/learn/use-cases',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          ),
        },
        {
          name: 'API Reference',
          href: '/learn/api',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
          ),
        },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === '/learn') return pathname === '/learn';
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden lg:block w-56 shrink-0 sticky top-0 h-[calc(100dvh-3.5rem)] overflow-y-auto border-r border-[var(--border-subtle)] bg-[var(--bg-panel)]">
      <nav className="py-4">
        {learnNav.map((section) => (
          <div key={section.label} className="mb-4">
            <div
              className="text-[9px] font-bold tracking-[0.15em] text-[var(--color-section-label)] uppercase px-4 mb-1.5"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {section.label}
            </div>
            {section.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center gap-2.5 px-4 py-1.5 text-[13px] font-medium transition-all duration-150 ${
                    active
                      ? 'bg-[var(--color-nav-active-bg)] text-[var(--color-nav-active-text)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--border-subtle)] hover:text-[var(--color-text)]'
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
    </aside>
  );
}
