'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { AdminAuthGate, useAdminAuth } from '@/components/admin/AdminAuthGate';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export const dynamic = 'force-dynamic';

function AdminTopBar({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const { logout, isMaster, merchantName } = useAdminAuth();

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
        <Link href="/admin" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image src="/logo-new.png" alt="OMNIPAY" width={101} height={40} className="h-[24px] w-auto" priority />
          <span className="text-sm font-semibold text-[var(--color-text)]">Admin</span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* Role indicator */}
        <span className="text-xs text-[var(--color-muted)] hidden sm:block">
          {isMaster ? 'Master' : merchantName || 'Merchant'}
        </span>
        <button
          onClick={logout}
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

function AdminDashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-hover)]">
      <div className="flex flex-col md:flex-row h-dvh">
        <AdminSidebar mobileOpen={sidebarOpen} onClose={closeSidebar} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AdminTopBar onMenuToggle={toggleSidebar} />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  return (
    <AdminAuthGate>
      {isLoginPage ? (
        <>{children}</>
      ) : (
        <AdminDashboardShell>{children}</AdminDashboardShell>
      )}
    </AdminAuthGate>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <AdminLayoutContent>{children}</AdminLayoutContent>
  );
}
