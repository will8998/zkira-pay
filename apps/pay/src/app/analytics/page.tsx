'use client';

import { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PageHeader } from '@/components/PageHeader';

const API_URL = '';

// Data formatting helpers
const formatUSD = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
const formatNumber = (num: number) => new Intl.NumberFormat().format(num);
const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// Analytics data interfaces
interface AnalyticsStats {
  totalUsers: number;
  totalPayments: number;
  totalVolume: string;
  activeEscrows: number;
  totalTransactions: number;
  totalInvoices: number;
  totalReferrals: number;
  recentPayments7d: number;
  recentUsers7d: number;
}

interface ChartData {
  paymentsByDay: { date: string; count: number }[];
  volumeByDay: { date: string; volume: string }[];
  usersByDay: { date: string; count: number }[];
}

interface BreakdownData {
  paymentStatus: { status: string; count: number }[];
  userTiers: { tier: string; count: number }[];
}

interface ActivityItem {
  type: 'sent' | 'received' | 'escrow_created';
  amount: string;
  tokenMint: string;
  status: string;
  createdAt: string;
}

interface AnalyticsData {
  stats: AnalyticsStats;
  charts: ChartData;
  breakdown: BreakdownData;
  recentActivity: ActivityItem[];
}

// Custom tooltip component for charts
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1A1A1A] border border-[#282828] px-3 py-2 text-[12px]">
      <div className="text-[var(--color-muted)]">{label}</div>
      <div className="text-[var(--color-text)] font-[family-name:var(--font-mono)] tabular-nums font-semibold">
        {payload[0].value}
      </div>
    </div>
  );
};

// KPI Card component
function KPICard({ 
  label, 
  value, 
  subLabel, 
  delay = 0 
}: { 
  label: string; 
  value: string; 
  subLabel?: string; 
  delay?: number; 
}) {
  return (
    <div 
      className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4 animate-entrance"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-[13px] text-[var(--color-muted)] font-medium">{label}</div>
      <div className="text-lg font-[family-name:var(--font-mono)] tabular-nums font-bold text-[var(--color-text)] mt-1">
        {value}
      </div>
      {subLabel && (
        <div className="text-[11px] text-[var(--color-muted)] mt-1">{subLabel}</div>
      )}
    </div>
  );
}

// Chart wrapper component
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4 animate-entrance">
      <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] mb-4">
        {title}
      </div>
      {children}
    </div>
  );
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  let bgColor = '';
  let textColor = '';
  
  switch (status.toLowerCase()) {
    case 'completed':
    case 'claimed':
      bgColor = 'bg-[#9CDC6A]';
      textColor = 'text-black';
      break;
    case 'pending':
      bgColor = 'bg-[#FFD146]';
      textColor = 'text-black';
      break;
    case 'failed':
    case 'expired':
      bgColor = 'bg-[#FF2828]';
      textColor = 'text-white';
      break;
    default:
      bgColor = 'bg-[var(--color-muted)]';
      textColor = 'text-white';
  }
  
  return (
    <span className={`${bgColor} ${textColor} px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide`}>
      {status}
    </span>
  );
}

// Horizontal bar list item
function BarListItem({ label, count, total }: { label: string; count: number; total: number }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-b-0">
      <div className="flex items-center gap-3 flex-1">
        <div className="text-[13px] text-[var(--color-text)] min-w-0 flex-1">{label}</div>
        <div className="w-16 h-2 bg-[var(--color-hover)] relative">
          <div 
            className="h-full bg-[#FF2828] transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <div className="text-[13px] font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)] font-semibold ml-3">
        {formatNumber(count)}
      </div>
    </div>
  );
}

// Format activity type
function formatActivityType(type: string) {
  switch (type) {
    case 'sent':
      return 'Payment Sent';
    case 'received':
      return 'Payment Received';
    case 'escrow_created':
      return 'Escrow Created';
    default:
      return type;
  }
}

// Format relative time
function formatRelativeTime(timestamp: string) {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${API_URL}/api/analytics`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        
        const analyticsData = await response.json();
        setData(analyticsData);
        
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchAnalytics, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="px-4 md:px-6 py-4 md:py-6 max-w-6xl mx-auto">
      <PageHeader 
        title="Analytics" 
        description="ZKIRA Pay protocol statistics — live data" 
      />
      
      {loading && !data ? (
        <div className="space-y-6">
          {/* Loading skeleton for KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4">
                <div className="h-4 w-24 skeleton-shimmer mb-2" />
                <div className="h-6 w-16 skeleton-shimmer mb-1" />
                <div className="h-3 w-20 skeleton-shimmer" />
              </div>
            ))}
          </div>
          
          {/* Loading skeleton for charts */}
          <div className="space-y-6">
            <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4">
              <div className="h-4 w-32 skeleton-shimmer mb-4" />
              <div className="h-64 w-full skeleton-shimmer" />
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 animate-entrance text-center">
          <div className="text-[var(--color-red)] text-sm mb-4">
            {error}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] px-4 py-2 text-[12px] font-bold uppercase tracking-wider transition-colors"
          >
            Retry
          </button>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard 
              label="Total Users" 
              value={formatNumber(data.stats.totalUsers)} 
              subLabel={`${formatNumber(data.stats.recentUsers7d)} in last 7d`}
              delay={0}
            />
            <KPICard 
              label="Total Payments" 
              value={formatNumber(data.stats.totalPayments)} 
              subLabel={`${formatNumber(data.stats.recentPayments7d)} in last 7d`}
              delay={60}
            />
            <KPICard 
              label="Total Volume" 
              value={formatUSD(parseFloat(data.stats.totalVolume))} 
              subLabel="All-time volume"
              delay={120}
            />
            <KPICard 
              label="Active Escrows" 
              value={formatNumber(data.stats.activeEscrows)} 
              subLabel="Currently active"
              delay={180}
            />
          </div>

          {/* Secondary Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <KPICard 
              label="Total Transactions" 
              value={formatNumber(data.stats.totalTransactions)} 
              delay={240}
            />
            <KPICard 
              label="Total Invoices" 
              value={formatNumber(data.stats.totalInvoices)} 
              delay={300}
            />
            <KPICard 
              label="Total Referrals" 
              value={formatNumber(data.stats.totalReferrals)} 
              delay={360}
            />
          </div>

          {/* Payments Chart */}
          <ChartCard title="Payments — Last 30 Days">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data.charts.paymentsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={formatDate}
                />
                <YAxis 
                  tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} 
                  axisLine={false} 
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#FF2828" 
                  fill="#FF2828" 
                  fillOpacity={0.15} 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Volume Chart */}
          <ChartCard title="Volume (USD) — Last 30 Days">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data.charts.volumeByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={formatDate}
                />
                <YAxis 
                  tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={(value) => formatUSD(parseFloat(value))}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#9CDC6A" 
                  fill="#9CDC6A" 
                  fillOpacity={0.15} 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* New Users Chart */}
          <ChartCard title="New Users — Last 30 Days">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.charts.usersByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={formatDate}
                />
                <YAxis 
                  tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} 
                  axisLine={false} 
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar 
                  dataKey="count" 
                  fill="#FF2828" 
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Breakdowns Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Status */}
            <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4 animate-entrance">
              <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] mb-4">
                Payment Status
              </div>
              <div className="space-y-0">
                {data.breakdown.paymentStatus.map((item) => {
                  const total = data.breakdown.paymentStatus.reduce((sum, s) => sum + s.count, 0);
                  return (
                    <BarListItem 
                      key={item.status} 
                      label={item.status} 
                      count={item.count} 
                      total={total} 
                    />
                  );
                })}
              </div>
            </div>

            {/* User Tiers */}
            <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4 animate-entrance">
              <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] mb-4">
                User Tiers
              </div>
              <div className="space-y-0">
                {data.breakdown.userTiers.map((item) => {
                  const total = data.breakdown.userTiers.reduce((sum, t) => sum + t.count, 0);
                  return (
                    <BarListItem 
                      key={item.tier} 
                      label={item.tier} 
                      count={item.count} 
                      total={total} 
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-0 animate-entrance">
            <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] px-4 py-4 border-b border-[var(--border-subtle)]">
              Recent Activity
            </div>
            
            {data.recentActivity.length === 0 ? (
              <div className="p-6 text-center text-[var(--color-muted)] text-sm">
                No recent activity
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--color-hover)]">
                      <tr>
                        <th className="text-left text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] px-4 py-3">
                          Type
                        </th>
                        <th className="text-right text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] px-4 py-3">
                          Amount
                        </th>
                        <th className="text-center text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] px-4 py-3">
                          Status
                        </th>
                        <th className="text-right text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] px-4 py-3">
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                      {data.recentActivity.slice(0, 20).map((activity, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-[var(--color-text)]">
                            {formatActivityType(activity.type)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <span className="font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)] font-semibold">
                              ${parseFloat(activity.amount).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <StatusBadge status={activity.status} />
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-[var(--color-muted)]">
                            {formatRelativeTime(activity.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-2 p-4">
                  {data.recentActivity.slice(0, 20).map((activity, index) => (
                    <div 
                      key={index}
                      className="border border-[var(--border-subtle)] p-3 bg-[var(--color-surface)]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[13px] text-[var(--color-text)]">
                          {formatActivityType(activity.type)}
                        </div>
                        <StatusBadge status={activity.status} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)] font-semibold text-sm">
                          ${parseFloat(activity.amount).toFixed(2)}
                        </div>
                        <div className="text-[var(--color-muted)] text-xs">
                          {formatRelativeTime(activity.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}