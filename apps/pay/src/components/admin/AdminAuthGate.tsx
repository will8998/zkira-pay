'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAdminAuthenticated, adminLogout } from '@/lib/admin-api';

interface AdminAuthGateProps {
  children: React.ReactNode;
}

interface AdminAuthContextType {
  logout: () => void;
}

export const AdminAuthContext = React.createContext<AdminAuthContextType>({
  logout: () => {},
});

export function AdminAuthGate({ children }: AdminAuthGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Login page should always render without auth check
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setIsAuthenticated(false);
      return;
    }

    const checkAuth = () => {
      const authenticated = isAdminAuthenticated();
      setIsAuthenticated(authenticated);

      if (!authenticated) {
        router.push('/admin/login');
      }
    };

    checkAuth();
  }, [router, isLoginPage]);

  const logout = () => {
    adminLogout();
  };

  // Login page bypasses auth gate entirely
  if (isLoginPage) {
    return (
      <AdminAuthContext.Provider value={{ logout }}>
        {children}
      </AdminAuthContext.Provider>
    );
  }

  if (isAuthenticated === null) {
    return (
      <div className="fixed inset-0 z-50 bg-[var(--color-hover)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-button)]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-[var(--color-hover)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-button)] mx-auto mb-4"></div>
          <p className="text-sm text-[var(--color-muted)]">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminAuthContext.Provider value={{ logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = React.useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthGate');
  }
  return context;
}
