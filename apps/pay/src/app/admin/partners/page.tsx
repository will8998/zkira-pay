'use client';

import { useEffect, useState } from 'react';
import { StatsCard } from '@/components/admin/StatsCard';
import { adminFetch } from '@/lib/admin-api';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface PartnerData {
  distributorId: string;
  name: string;
  tier: string;
  commissionPercent: number;
  withdrawalCount: number;
  volume: number;
  estimatedCommission: number;
}

interface VolumeData {
  summary: {
    totalWithdrawals: number;
    totalVolume: number;
  };
  partners: PartnerData[];
  timeSeries: Array<{ period: string; withdrawalCount: number; volume: number }>;
}

export default function AdminPartnersPage() {
  const [data, setData] = useState<VolumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setError(null);
    try {
      const response = await adminFetch('/api/admin/volume?groupBy=day');
      setData(response);
    } catch (error) {
      console.error('Failed to fetch partner volume data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalEstimatedCommissions = data?.partners.reduce((sum, partner) => sum + partner.estimatedCommission, 0) || 0;

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-[var(--color-skeleton)]"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8">
            <div className="h-80 bg-[var(--color-skeleton)]"></div>
            <div className="h-80 bg-[var(--color-skeleton)]"></div>
          </div>
          <div className="h-96 bg-[var(--color-skeleton)]"></div>
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
      {/* Page Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Partners</h1>
        <p className="text-[var(--color-muted)]">Partner volume tracking and commission overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <StatsCard
          title="Total Partner Withdrawals"
          value={data?.summary.totalWithdrawals.toLocaleString() || 0}
          icon={(
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
            </svg>
          )}
          accentColor="var(--color-green)"
        />
        <StatsCard
          title="Total Partner Volume"
          value={`$${(data?.summary.totalVolume || 0).toLocaleString()}`}
          icon={(
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          accentColor="#8B5CF6"
        />
        <StatsCard
          title="Total Estimated Commissions"
          value={`$${totalEstimatedCommissions.toLocaleString()}`}
          icon={(
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H3.75m6 0v.75a.75.75 0 01-.75.75h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H9.75m6 0v.75a.75.75 0 01-.75.75h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H15.75m6 0v.75a.75.75 0 01-.75.75h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25m3 0c.414 0 .75.336.75.75s-.336.75-.75.75h-.75v.375c0 .621-.504 1.125-1.125 1.125H21.75m0 0h-.75v.75c0 .414-.336.75-.75.75s-.75-.336-.75-.75v-.75h.75zm-15 0v-.375c0-.621.504-1.125 1.125-1.125h12.75c.621 0 1.125.504 1.125 1.125v.375M3.75 21.75c0 .414.336.75.75.75s.75-.336.75-.75c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5c0 .414.336.75.75.75s.75-.336.75-.75c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5c0 .414.336.75.75.75s.75-.336.75-.75v-2.25a3 3 0 00-3-3h-2.25" />
            </svg>
          )}
          accentColor="#F59E0B"
        />
      </div>

      {/* Volume Chart */}
      <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">
          Partner Volume Over Time
        </h3>
        <div className="h-48 md:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.timeSeries || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="volume" 
                stroke="var(--color-green)" 
                fill="var(--color-green)" 
                fillOpacity={0.1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Partners Table */}
      <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">
          All Partners
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--color-text)]">Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--color-text)]">Tier</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--color-text)]">Commission %</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--color-text)]">Withdrawal Count</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--color-text)]">Volume ($)</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--color-text)]">Est. Commission ($)</th>
              </tr>
            </thead>
            <tbody>
              {data?.partners.map((partner) => (
                <tr key={partner.distributorId} className="border-b border-[var(--border-subtle)] hover:bg-[var(--color-hover)] transition-colors">
                  <td className="py-3 px-4">
                    <a 
                      href={`/admin/partners/dashboard?partnerId=${partner.distributorId}`}
                      className="text-[var(--color-text)] hover:text-[var(--color-button)] transition-colors"
                    >
                      {partner.name}
                    </a>
                  </td>
                  <td className="py-3 px-4">
                    <span className="bg-[var(--color-muted)] text-[var(--color-bg)] px-2 py-1 text-xs font-medium rounded-none">
                      {partner.tier}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[var(--color-text)]">{partner.commissionPercent}%</td>
                  <td className="py-3 px-4 text-[var(--color-text)]">{partner.withdrawalCount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-[var(--color-text)]">${partner.volume.toLocaleString()}</td>
                  <td className="py-3 px-4 text-[var(--color-text)]">${partner.estimatedCommission.toLocaleString()}</td>
                </tr>
              ))}
              {(!data?.partners || data.partners.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-8 px-4 text-center text-[var(--color-muted)]">
                    No partners found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}