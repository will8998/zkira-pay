'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { distributorFetch, distributorLogin, distributorLogout, isDistributorAuthenticated } from '@/lib/distributor-api';

export const dynamic = 'force-dynamic';

// Distributor Auth Gate Component
function DistributorAuthGate({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isDistributorAuthenticated();
      setIsAuthenticated(authenticated);
    };
    checkAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoginLoading(true);
    setLoginError(null);

    const result = await distributorLogin(password.trim());
    
    if (result.success) {
      setIsAuthenticated(true);
    } else {
      setLoginError(result.error || 'Login failed');
    }
    
    setLoginLoading(false);
  };

  if (isAuthenticated === null) {
    return (
      <div className="fixed inset-0 z-50 bg-[var(--color-hover)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-button)]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-[var(--color-hover)] flex items-center justify-center p-4">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 md:p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <Image src="/logo-new.png" alt="OMNIPAY" width={101} height={40} className="h-[32px] w-auto mx-auto mb-4" priority />
            <h1 className="text-xl font-bold text-[var(--color-text)]">Distributor Panel</h1>
            <p className="text-[var(--color-muted)] text-sm mt-2">Enter admin password to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Admin Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                placeholder="Enter admin password"
                required
                disabled={loginLoading}
              />
            </div>

            {loginError && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] p-3 text-sm text-[#991B1B]">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading || !password.trim()}
              className="w-full bg-[var(--color-button)] text-[var(--color-button-text)] px-4 py-2 font-medium hover:bg-[var(--color-button-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loginLoading ? 'Verifying...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Distributor Sidebar Component
function DistributorSidebar({ mobileOpen = false, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/distributor', 
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      )
    },
    { 
      name: 'Distributors', 
      href: '/distributor/list', 
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      )
    },
    { 
      name: 'Commissions', 
      href: '/distributor/commissions', 
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
        </svg>
      )
    },
    { 
      name: 'Volume', 
      href: '/distributor/volume', 
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      )
    },
    { 
      name: 'Merchants', 
      href: '/distributor/merchants', 
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.001 3.001 0 01-3.75-.615A3.001 3.001 0 010 9.999v10.651C0 20.298 1.327 21 2.36 21h.639m15.01 0v-10.65c0-.621-.504-1.125-1.125-1.125h-.375c-.621 0-1.125.504-1.125 1.125v5.25c0 .621.504 1.125 1.125 1.125h2.25z" />
        </svg>
      )
    },
  ];

  const SidebarContent = () => (
    <>
      {/* Header */}
      <Link href="/distributor" className="p-4 lg:p-6 border-b border-[var(--color-bg)]/10 hover:opacity-80 transition-opacity">
        <div className="flex items-center gap-3">
          <Image src="/logo-new.png" alt="OMNIPAY" width={101} height={40} className="h-[28px] w-auto brightness-0 invert" priority />
          <span className="px-2 py-1 bg-[var(--color-surface)]/10 text-[var(--color-bg)] text-xs rounded font-medium">
            Distributor
          </span>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-3 lg:px-4 py-4 lg:py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/distributor' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[var(--color-surface)]/10 text-[var(--color-bg)]'
                  : 'text-[var(--color-bg)]/70 hover:bg-[var(--color-surface)]/5 hover:text-[var(--color-bg)]'
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 lg:p-4 border-t border-[var(--color-bg)]/10">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-[var(--color-bg)]/70 hover:bg-[var(--color-surface)]/5 hover:text-[var(--color-bg)] transition-colors"
        >
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to App
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col md:w-48 lg:w-60 bg-[var(--color-button)] h-full shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[var(--color-button)] flex flex-col transform transition-transform duration-300 ease-out md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[var(--color-bg)]/60 hover:text-[var(--color-bg)] z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <SidebarContent />
      </div>
    </>
  );
}

// Distributor Top Bar Component
function DistributorTopBar({ onMenuToggle }: { onMenuToggle?: () => void }) {
  return (
    <div className="h-16 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-3 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="md:hidden flex items-center justify-center w-10 h-10 text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <Link href="/distributor" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image src="/logo-new.png" alt="OMNIPAY" width={101} height={40} className="h-[24px] w-auto" priority />
          <span className="text-sm font-semibold text-[var(--color-text)]">Distributor Panel</span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={distributorLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
}

// Distributor Dashboard Shell Component
function DistributorDashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-hover)]">
      <div className="flex flex-col md:flex-row h-dvh">
        <DistributorSidebar mobileOpen={sidebarOpen} onClose={closeSidebar} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DistributorTopBar onMenuToggle={toggleSidebar} />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

// Main Layout Component
export default function DistributorLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <DistributorAuthGate>
      <DistributorDashboardShell>{children}</DistributorDashboardShell>
    </DistributorAuthGate>
  );
}