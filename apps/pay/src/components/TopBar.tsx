'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LanguageSwitcher } from './LanguageSwitcher';

export function TopBar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    if (path === '/create') return pathname === '/create';
    return pathname.startsWith(path);
  };

  const centerNavigation = [
    { name: 'Send', href: '/create' },
    { name: 'Request', href: '/request' },
    { name: 'Claim', href: '/claim' },
    { name: 'Pool', href: '/pool' },
    { name: 'Learn', href: '/learn' },
  ];

  return (
    <div className="relative z-20 h-14 bg-[rgba(10,10,10,0.7)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.06)] px-3 md:px-4 flex items-center shrink-0">
      {/* Left — Logo */}
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

      {/* Right — Language */}
      <div className="flex items-center gap-2 ml-auto md:ml-0">
        <LanguageSwitcher />
      </div>
    </div>
  );
}
