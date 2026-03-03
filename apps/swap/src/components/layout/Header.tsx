'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    if (path === '/about') {
      return pathname === '/about';
    }
    if (path === '/track') {
      return pathname === '/track';
    }
    return pathname.startsWith(path);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[rgba(10,10,10,0.7)] backdrop-blur-xl border-b border-[var(--border-subtle)]">
      <div className="flex items-center justify-between h-full px-4 max-w-7xl mx-auto">
        {/* Left: Logo/brand */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="font-[family-name:var(--font-sans)] text-lg font-bold tracking-wider text-white">
            ZKIRA<span className="text-[var(--color-red)])">.</span>SWAP
          </span>
        </Link>
        
        {/* Center: Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={`relative px-3 py-2 text-[13px] font-medium transition-colors shrink-0 ${
              isActive('/')
                ? 'text-[var(--color-red)]'
                : 'text-[rgba(255,255,255,0.5)] hover:text-white'
            }`}
          >
            SWAP
            {isActive('/') && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-red)]" />
            )}
          </Link>
          <Link
            href="/about"
            className={`relative px-3 py-2 text-[13px] font-medium transition-colors shrink-0 ${
              isActive('/about')
                ? 'text-[var(--color-red)]'
                : 'text-[rgba(255,255,255,0.5)] hover:text-white'
            }`}
          >
            ABOUT
            {isActive('/about') && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-red)]" />
            )}
          </Link>
          <Link
            href="/track"
            className={`relative px-3 py-2 text-[13px] font-medium transition-colors shrink-0 ${
              isActive('/track')
                ? 'text-[var(--color-red)]'
                : 'text-[rgba(255,255,255,0.5)] hover:text-white'
            }`}
          >
            TRACK
            {isActive('/track') && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-red)]" />
            )}
          </Link>
        </nav>
        
        {/* Right: X/Twitter link */}
        <div className="flex items-center gap-3">
          <a 
            href="https://x.com/zkira_xyz" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-[var(--color-muted)] hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}