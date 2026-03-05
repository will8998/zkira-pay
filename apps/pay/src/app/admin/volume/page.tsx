'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin-api';
import { useAdminAuth } from '@/components/admin/AdminAuthGate';
import { 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface VolumeData {
  summary: {
    totalVolume: number;
    totalSessions: number;
  };
  timeSeries: Array<{
    period: string;
    volume: number;
    sessionCount: number;
  }>;
  merchants?: Array<{
    merchantId: string;
    merchantName: string;
    volume: number;
    sessionCount: number;
  }>;
}

export default function VolumePage() {
  const { isMaster } = useAdminAuth();
  const [data, setData] = useState<VolumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    groupBy: 'day' as 'day' | 'week' | 'month',
  });

  const fetchVolumeData = async () => {
    try {
      const params = new URLSearchParams({
        from: filters.from,
        to: filters.to,
        groupBy: filters.groupBy,
      });
      
      const response = await adminFetch(`/api/admin/volume?${params}`);
      setData(response);
    } catch (error) {
      console.error('Failed to fetch volume data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolumeData();
  }, [filters.from, filters.to, filters.groupBy]);

  const handleDateChange = (field: 'from' | 'to', value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleGroupByChange = (groupBy: 'day' | 'week' | 'month') => {
    setFilters(prev => ({ ...prev, groupBy }));
  };

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-[var(--color-skeleton)] rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
            <div className="h-80 bg-[var(--color-skeleton)] rounded"></div>
            <div className="h-80 bg-[var(--color-skeleton)] rounded"></div>
          </div>
          {isMaster && (
            <div className="h-64 bg-[var(--color-skeleton)] rounded"></div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-[var(--color-surface)] border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[var(--color-text)] mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text)]">Failed to load data</h3>
              <p className="text-sm text-[var(--color-muted)] mt-1">{error}</p>
              <button
                onClick={() => { setError(null); setLoading(true); fetchVolumeData(); }}
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
        <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Volume Analytics</h1>
        <p className="text-[var(--color-muted)]">Analyze transaction volume and session trends</p>
      </div>

      {/* Filters */}
      <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-[var(--color-text)]">From:</label>
              <input
                type="date"
                value={filters.from}
                onChange={(e) => handleDateChange('from', e.target.value)}
                className="border border-[var(--color-border)] rounded px-3 py-2 text-sm min-h-[44px] bg-[var(--color-surface)]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-[var(--color-text)]">To:</label>
              <input
                type="date"
                value={filters.to}
                onChange={(e) => handleDateChange('to', e.target.value)}
                className="border border-[var(--color-border)] rounded px-3 py-2 text-sm min-h-[44px] bg-[var(--color-surface)]"
              />
            </div>
          </div>
          <div className="flex gap-1 bg-[var(--color-hover)] p-1 rounded">
            {(['day', 'week', 'month'] as const).map((period) => (
              <button
                key={period}
                onClick={() => handleGroupByChange(period)}
                className={`px-3 py-2 text-sm font-medium rounded transition-colors ${
                  filters.groupBy === period
                    ? 'bg-[var(--color-button)] text-[var(--color-bg)]'
                    : 'text-[var(--color-text)] hover:bg-[var(--color-surface)]'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[var(--color-green)]1A">
              <svg className="w-6 h-6" style={{ color: 'var(--color-green)' }} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-muted)] mb-1">Total Volume</p>
              <p className="text-2xl md:text-3xl font-bold text-[var(--color-text)]">
                {formatCurrency(data?.summary.totalVolume || 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
          <div className="flex items-center gap-4">
            <div className="p-3" style={{ backgroundColor: 'var(--color-text)1A' }}>
              <svg className="w-6 h-6 text-[var(--color-text)]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-muted)] mb-1">Total Sessions</p>
              <p className="text-2xl md:text-3xl font-bold text-[var(--color-text)]">
                {(data?.summary.totalSessions || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Volume Over Time */}
        <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">
            Volume Over Time
          </h3>
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.timeSeries || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Volume']} />
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

        {/* Sessions Over Time */}
        <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">
            Sessions Over Time
          </h3>
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.timeSeries || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="sessionCount" 
                  fill="var(--color-text)" 
                  fillOpacity={0.8}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Per-Merchant Volume (Master Only) */}
      {isMaster && data?.merchants && (
        <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">
            Per-Merchant Volume Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-hover)] border-b border-[var(--color-border)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                    Merchant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                    Volume
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                    Sessions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {data.merchants.map((merchant, index) => (
                  <tr key={index} className="hover:bg-[var(--color-hover)]">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                      {merchant.merchantName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                      {formatCurrency(merchant.volume)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                      {merchant.sessionCount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}