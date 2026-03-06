'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { adminLogin, isAdminAuthenticated } from '@/lib/admin-api';
import { toast } from 'sonner';

export default function AdminLoginPage() {
  const [credential, setCredential] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isAdminAuthenticated()) {
      router.push('/admin');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credential.trim()) return;

    setIsLoading(true);

    try {
      const result = await adminLogin(credential);

      if (result.success && result.session) {
        const roleLabel = result.session.role === 'master'
          ? 'Master Admin'
          : result.session.merchantName || 'Merchant';
        toast.success(`Logged in as ${roleLabel}`);
        router.push('/admin');
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-hover)] flex items-center justify-center">
      <div className="w-full max-w-md px-4 md:px-0">
        <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-6 md:p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <span className="text-[24px] font-bold tracking-[0.08em] text-[var(--color-text)]" style={{ fontFamily: 'var(--font-mono)' }}>OMNIPAY</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)] mb-2">Admin Dashboard</h1>
            <p className="text-[var(--color-muted)] text-sm">Enter your admin password or merchant API key</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="credential"
                className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2"
              >
                Credential
              </label>
              <input
                id="credential"
                type="password"
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                className="w-full px-4 py-3 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-text)] focus:border-transparent min-h-[48px] text-[16px] bg-[var(--color-surface)] text-[var(--color-text)]"
                placeholder="Admin password or API key"
                required
              />
              <p className="mt-2 text-xs text-[var(--color-muted)]">
                Master admin: enter your admin password. Merchant: enter your API key (omnipay_sk_...).
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !credential.trim()}
              className="w-full bg-[var(--color-button)] text-[var(--color-bg)] py-3 px-4 font-medium hover:bg-[var(--color-button-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[48px]"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
