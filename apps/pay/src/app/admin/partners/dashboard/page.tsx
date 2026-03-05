'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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

interface PartnerInfo {
  id: string;
  name: string;
  tier: string;
  commissionPercent: number;
}

interface PartnerVolumeData {
  partner: PartnerInfo;
  summary: {
    totalWithdrawals: number;
    totalVolume: number;
    estimatedCommission: number;
  };
  breakdown: Array<{ period: string; withdrawalCount: number; volume: number }>;
}

export default function PartnerDashboardPage() {
  const searchParams = useSearchParams();
  const partnerId = searchParams?.get('partnerId');
  
  const [data, setData] = useState<PartnerVolumeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputPartnerId, setInputPartnerId] = useState('');
  const [groupBy, setGroupBy] = useState('day');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchData = async (id: string, group = 'day', from = '', to = '') => {
    setError(null);
    setLoading(true);
    try {
      let url = `/api/partner/${id}/volume?groupBy=${group}`;
      if (from) url += `&from=${from}`;
      if (to) url += `&to=${to}`;
      
      const response = await adminFetch(url);
      setData(response);
    } catch (error) {
      console.error('Failed to fetch partner volume data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (partnerId) {
      fetchData(partnerId, groupBy, fromDate, toDate);
    }
  }, [partnerId, groupBy, fromDate, toDate]);

  const handleSubmitPartnerId = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPartnerId.trim()) {
      window.location.href = `/admin/partners/dashboard?partnerId=${inputPartnerId.trim()}`;
    }
  };

  const handleFilterChange = () => {
    if (partnerId) {
      fetchData(partnerId, groupBy, fromDate, toDate);
    }
  };

  if (!partnerId) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Partner Dashboard</h1>
          <p className="text-[var(--color-muted)]">View individual partner volume and commission details</p>
        </div>

        {/* Partner ID Form */}
        <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6 max-w-md">
          <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">
            Enter Partner ID
          </h3>
          <form onSubmit={handleSubmitPartnerId} className="space-y-4">
            <div>
              <label htmlFor="partnerId" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Partner UUID
              </label>
              <input
                type="text"
                id="partnerId"
                value={inputPartnerId}
                onChange={(e) => setInputPartnerId(e.target.value)}
                placeholder="Enter partner UUID..."
                className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--border-subtle)] text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-button)]"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-[var(--color-button)] text-[var(--color-bg)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-button-hover)] transition-colors"
            >
              Load Partner Data
            </button>
          </form>
        </div>

        {/* Back Link */}
        <div>
          <a 
            href="/admin/partners"
            className="text-[var(--color-button)] hover:text-[var(--color-button-hover)] transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Partners
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-[var(--color-skeleton)]"></div>
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
            <svg className="w-5 h-5 text-[var(--color-red)] mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-[#991B1B]">Failed to load data</h3>
              <p className="text-sm text-[var(--color-red)] mt-1">{error}</p>
              <button
                onClick={() => fetchData(partnerId, groupBy, fromDate, toDate)}
                className="mt-3 bg-[var(--color-button)] text-[var(--color-bg)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-button-hover)] transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
        
        {/* Back Link */}
        <div className="mt-6">
          <a 
            href="/admin/partners"
            className="text-[var(--color-button)] hover:text-[var(--color-button-hover)] transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Partners
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">{data?.partner.name || 'Partner Dashboard'}</h1>
          <span className="bg-[var(--color-muted)] text-[var(--color-bg)] px-2 py-1 text-sm font-medium rounded-none">
            {data?.partner.tier}
          </span>
        </div>
        <p className="text-[var(--color-muted)]">Commission: {data?.partner.commissionPercent}%</p>
      </div>

      {/* Filters */}
      <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="groupBy" className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Group By
            </label>
            <select
              id="groupBy"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--border-subtle)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-button)]"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
          <div>
            <label htmlFor="fromDate" className="block text-sm font-medium text-[var(--color-text)] mb-2">
              From Date
            </label>
            <input
              type="date"
              id="fromDate"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--border-subtle)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-button)]"
            />
          </div>
          <div>
            <label htmlFor="toDate" className="block text-sm font-medium text-[var(--color-text)] mb-2">
              To Date
            </label>
            <input
              type="date"
              id="toDate"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--border-subtle)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-button)]"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <StatsCard
          title="Total Withdrawals"
          value={data?.summary.totalWithdrawals.toLocaleString() || 0}
          icon={(
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
            </svg>
          )}
          accentColor="var(--color-green)"
        />
        <StatsCard
          title="Total Volume"
          value={`$${(data?.summary.totalVolume || 0).toLocaleString()}`}
          icon={(
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          accentColor="#8B5CF6"
        />
        <StatsCard
          title="Estimated Commission"
          value={`$${(data?.summary.estimatedCommission || 0).toLocaleString()}`}
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
          Volume Over Time
        </h3>
        <div className="h-48 md:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.breakdown || []}>
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

      {/* Back Link */}
      <div>
        <a 
          href="/admin/partners"
          className="text-[var(--color-button)] hover:text-[var(--color-button-hover)] transition-colors inline-flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Partners
        </a>
      </div>
    </div>
  );
}