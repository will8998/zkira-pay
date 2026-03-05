'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin-api';

interface PointsStats {
  totalPointsIssued: number;
  activeEarners: number;
  pointsIssuedToday: number;
  topEarner: {
    wallet: string;
    points: number;
  };
}

interface TopEarner {
  rank: number;
  wallet: string;
  totalPoints: number;
  weeklyPoints: number;
  tier: string;
  flagged: boolean;
}

export default function PointsPage() {
  const [stats, setStats] = useState<PointsStats | null>(null);
  const [topEarners, setTopEarners] = useState<TopEarner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const response = await adminFetch('/api/admin/points/stats');
      setStats(response.stats);
      setTopEarners(response.topEarners || []);
    } catch (error) {
      console.error('Failed to fetch points stats:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const truncateWallet = (wallet: string) => {
    return `${wallet.slice(0, 8)}...${wallet.slice(-8)}`;
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-[var(--color-skeleton)] rounded-none w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-[var(--color-skeleton)] rounded-none"></div>
            ))}
          </div>
          <div className="h-64 bg-[var(--color-skeleton)] rounded-none"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-[#FEF2F2] border border-[#FECACA] p-4 md:p-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[var(--color-red)] mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-[#991B1B]">Failed to load data</h3>
              <p className="text-sm text-[var(--color-red)] mt-1">{error}</p>
              <button
                onClick={() => { setError(null); setLoading(true); fetchData(); }}
                className="mt-3 bg-[var(--color-button)] text-[var(--color-bg)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-button-hover)] transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Points Overview</h1>
        <p className="text-[var(--color-muted)]">Monitor points distribution and top earners</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
          <div className="flex flex-col">
            <span className="text-[var(--color-muted)] text-[11px] font-medium uppercase tracking-wider">Total Points Issued</span>
            <span className="text-2xl font-bold text-[var(--color-text)] font-[family-name:var(--font-mono)] tabular-nums">
              {stats?.totalPointsIssued?.toLocaleString() || '0'}
            </span>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
          <div className="flex flex-col">
            <span className="text-[var(--color-muted)] text-[11px] font-medium uppercase tracking-wider">Active Earners</span>
            <span className="text-2xl font-bold text-[var(--color-text)] font-[family-name:var(--font-mono)] tabular-nums">
              {stats?.activeEarners?.toLocaleString() || '0'}
            </span>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
          <div className="flex flex-col">
            <span className="text-[var(--color-muted)] text-[11px] font-medium uppercase tracking-wider">Points Issued Today</span>
            <span className="text-2xl font-bold text-[var(--color-text)] font-[family-name:var(--font-mono)] tabular-nums">
              {stats?.pointsIssuedToday?.toLocaleString() || '0'}
            </span>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
          <div className="flex flex-col">
            <span className="text-[var(--color-muted)] text-[11px] font-medium uppercase tracking-wider">Top Earner</span>
            <span className="text-sm text-[var(--color-text)] font-mono">
              {stats?.topEarner ? truncateWallet(stats.topEarner.wallet) : 'N/A'}
            </span>
            <span className="text-lg font-bold text-[var(--color-text)] font-[family-name:var(--font-mono)] tabular-nums">
              {stats?.topEarner?.points?.toLocaleString() || '0'} pts
            </span>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <a 
            href="/admin/points/adjust"
            className="bg-[var(--color-button)] text-[var(--color-bg)] px-4 py-2 text-[13px] font-medium hover:bg-[var(--color-button-hover)] rounded-none"
          >
            Adjust Points
          </a>
          <a 
            href="/admin/points/config"
            className="border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 text-[13px] font-medium hover:bg-[var(--color-hover)] rounded-none"
          >
            Points Config
          </a>
          <a 
            href="/admin/points/drops"
            className="border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 text-[13px] font-medium hover:bg-[var(--color-hover)] rounded-none"
          >
            Weekly Drops
          </a>
        </div>
      </div>

      {/* Top Earners Table */}
      <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Top 10 Earners</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--color-hover)]">
              <tr>
                <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-left p-3">
                  Rank
                </th>
                <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-left p-3">
                  Wallet
                </th>
                <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-right p-3">
                  Total Points
                </th>
                <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-right p-3">
                  Weekly Points
                </th>
                <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-center p-3">
                  Tier
                </th>
                <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-center p-3">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {topEarners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-[var(--color-muted)]">
                    No earners found
                  </td>
                </tr>
              ) : (
                topEarners.map((earner, index) => (
                  <tr key={earner.wallet} className="border-t border-[var(--color-border)]">
                    <td className="p-3">
                      <span className="font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)]">
                        #{earner.rank}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-sm text-[var(--color-text)]">
                        {truncateWallet(earner.wallet)}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)]">
                        {earner.totalPoints.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)]">
                        {earner.weeklyPoints.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-[13px] text-[var(--color-muted)]">
                        {earner.tier}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {earner.flagged ? (
                        <span className="bg-[rgba(255,40,40,0.15)] text-[#FFFFFF] px-2 py-1 rounded-none text-[11px] font-medium">
                          FLAGGED
                        </span>
                      ) : (
                        <span className="bg-[rgba(156,220,106,0.15)] text-[#9CDC6A] px-2 py-1 rounded-none text-[11px] font-medium">
                          ACTIVE
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}