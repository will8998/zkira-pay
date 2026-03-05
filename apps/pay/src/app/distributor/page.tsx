'use client';

import { useEffect, useState } from 'react';
import { distributorFetch } from '@/lib/distributor-api';

interface DashboardStats {
  totalDistributors: number;
  activeDistributors: number;
  totalMerchants: number;
}

interface Distributor {
  id: string;
  name: string;
  walletAddress: string;
  parentId: string | null;
  tier: 'master' | 'sub' | 'agent';
  commissionPercent: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  merchantCount: number;
}

interface DashboardData {
  stats: DashboardStats;
  topDistributors: Distributor[];
}

export default function DistributorDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      // Fetch distributor list to get stats
      const distributorsResponse = await distributorFetch('/api/gateway/distributors');
      
      const distributors: Distributor[] = distributorsResponse.distributors || [];
      const total = distributorsResponse.total || 0;
      
      // Calculate stats
      const activeDistributors = distributors.filter(d => d.status === 'active').length;
      const totalMerchants = distributors.reduce((sum, d) => sum + d.merchantCount, 0);
      
      const stats: DashboardStats = {
        totalDistributors: total,
        activeDistributors,
        totalMerchants,
      };

      // Get top distributors (sorted by merchant count)
      const topDistributors = [...distributors]
        .sort((a, b) => b.merchantCount - a.merchantCount)
        .slice(0, 10);

      setData({
        stats,
        topDistributors,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-[var(--color-skeleton)] rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-[var(--color-skeleton)]"></div>
            ))}
          </div>
          <div className="h-80 bg-[var(--color-skeleton)]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-[#FEF2F2] border border-[#FECACA] p-4 md:p-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[#991B1B] mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-[#991B1B]">Failed to load dashboard</h3>
              <p className="text-sm text-[#991B1B] mt-1">{error}</p>
              <button
                onClick={() => { setError(null); setLoading(true); fetchDashboardData(); }}
                className="mt-3 bg-[var(--color-button)] text-[var(--color-button-text)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-button-hover)] transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTierBadge = (tier: string) => {
    const tierColors: Record<string, string> = {
      master: 'bg-[#EEF2FF] text-[#6366F1]',
      sub: 'bg-[#E8F5E0] text-[#4D9A2A]',
      agent: 'bg-[#FEF3C7] text-[#F59E0B]',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${tierColors[tier] || 'bg-gray-100 text-gray-800'}`}>
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const isActive = status === 'active';
    const style = isActive
      ? 'bg-[#E8F5E0] text-[#4D9A2A]'
      : 'bg-[#FEF2F2] text-[#EF4444]';

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${style}`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const truncateAddress = (address: string) => {
    return address.length > 12 ? `${address.slice(0, 8)}...${address.slice(-4)}` : address;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Dashboard</h1>
        <p className="text-[var(--color-muted)]">Overview of distributor network management</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#EEF2FF] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#6366F1]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--color-muted)]">Total Distributors</p>
              <p className="text-lg font-semibold text-[var(--color-text)]">
                {data?.stats.totalDistributors || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#E8F5E0] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#4D9A2A]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--color-muted)]">Active Distributors</p>
              <p className="text-lg font-semibold text-[var(--color-text)]">
                {data?.stats.activeDistributors || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#FEF3C7] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#F59E0B]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.001 3.001 0 01-3.75-.615A3.001 3.001 0 010 9.999v10.651C0 20.298 1.327 21 2.36 21h.639m15.01 0v-10.65c0-.621-.504-1.125-1.125-1.125h-.375c-.621 0-1.125.504-1.125 1.125v5.25c0 .621.504 1.125 1.125 1.125h2.25z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--color-muted)]">Total Merchants</p>
              <p className="text-lg font-semibold text-[var(--color-text)]">
                {data?.stats.totalMerchants || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Distributors Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-text)]">Top Distributors</h3>
          <a
            href="/distributor/list"
            className="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 transition-colors"
          >
            View All
          </a>
        </div>
        
        <div className="overflow-x-auto">
          {data?.topDistributors.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--color-muted)]">No distributors found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left py-2 px-3 text-[var(--color-muted)] font-medium">Name</th>
                  <th className="text-left py-2 px-3 text-[var(--color-muted)] font-medium">Address</th>
                  <th className="text-left py-2 px-3 text-[var(--color-muted)] font-medium">Tier</th>
                  <th className="text-left py-2 px-3 text-[var(--color-muted)] font-medium">Commission</th>
                  <th className="text-left py-2 px-3 text-[var(--color-muted)] font-medium">Merchants</th>
                  <th className="text-left py-2 px-3 text-[var(--color-muted)] font-medium">Status</th>
                  <th className="text-left py-2 px-3 text-[var(--color-muted)] font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {data?.topDistributors.map((distributor) => (
                  <tr key={distributor.id} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-hover)] transition-colors">
                    <td className="py-3 px-3 text-[var(--color-text)] font-medium">
                      {distributor.name}
                    </td>
                    <td className="py-3 px-3 text-[var(--color-text)] font-mono text-xs">
                      {truncateAddress(distributor.walletAddress)}
                    </td>
                    <td className="py-3 px-3">
                      {getTierBadge(distributor.tier)}
                    </td>
                    <td className="py-3 px-3 text-[var(--color-text)] font-medium">
                      {parseFloat(distributor.commissionPercent).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-[var(--color-text)]">
                      {distributor.merchantCount}
                    </td>
                    <td className="py-3 px-3">
                      {getStatusBadge(distributor.status)}
                    </td>
                    <td className="py-3 px-3 text-[var(--color-muted)] text-xs">
                      {formatDate(distributor.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}