'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin-api';
import { 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AnalyticsData {
  dailyPayments: Array<{ date: string; payments: number }>;
  dailyVolume: Array<{ date: string; volume: number }>;
  userGrowth: Array<{ date: string; users: number }>;
  paymentSuccessRate: Array<{ name: string; value: number }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      const response = await adminFetch('/api/admin/analytics');
      setData(response);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);
  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-[var(--color-skeleton)] rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-80 bg-[var(--color-skeleton)]"></div>
            ))}
          </div>
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
                onClick={() => { setError(null); setLoading(true); fetchAnalytics(); }}
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

  const successRateColors = ['var(--color-green)', '#EF4444'];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Analytics</h1>
        <p className="text-[var(--color-muted)]">Detailed analytics and insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Daily Payments Chart */}
        <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">
            Daily Payments (Last 30 Days)
          </h3>
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.dailyPayments || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="payments" fill="var(--color-text)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Volume Chart */}
        <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">
            Daily Volume (Last 30 Days)
          </h3>
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.dailyVolume || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
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

        {/* User Growth Chart */}
        <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">
            Cumulative User Growth
          </h3>
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.userGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="var(--color-text-secondary)" 
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-text-secondary)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Success Rate */}
        <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">
            Payment Success Rate
          </h3>
          <div className="h-48 md:h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.paymentSuccessRate || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(data?.paymentSuccessRate || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={successRateColors[index % successRateColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap justify-center mt-4 space-x-6">
            {(data?.paymentSuccessRate || []).map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: successRateColors[index % successRateColors.length] }}
                />
                <span className="text-sm text-[var(--color-muted)]">
                  {entry.name}: {entry.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}