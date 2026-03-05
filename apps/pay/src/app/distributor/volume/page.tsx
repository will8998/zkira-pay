'use client';

import { useEffect, useState } from 'react';
import { distributorFetch } from '@/lib/distributor-api';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface Distributor {
  id: string;
  name: string;
  tier: 'master' | 'sub' | 'agent';
}

interface VolumeDataPoint {
  period: string;
  commissions: number;
  sourceVolume: number;
  commissionCount: number;
}

interface VolumeSummary {
  totalCommissions: number;
  totalSourceVolume: number;
  commissionCount: number;
}

interface VolumeData {
  summary: VolumeSummary;
  breakdown: VolumeDataPoint[];
}

export default function VolumeAnalyticsPage() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [selectedDistributorId, setSelectedDistributorId] = useState<string>('');
  const [volumeData, setVolumeData] = useState<VolumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [volumeLoading, setVolumeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Fetch all distributors for dropdown
  useEffect(() => {
    const fetchDistributors = async () => {
      try {
        const response = await distributorFetch('/api/gateway/distributors');
        setDistributors(response.distributors || []);
      } catch (error) {
        console.error('Failed to fetch distributors:', error);
        setError(error instanceof Error ? error.message : 'Failed to load distributors');
      } finally {
        setLoading(false);
      }
    };

    fetchDistributors();
  }, []);

  // Fetch volume data when distributor is selected or date filters change
  useEffect(() => {
    if (!selectedDistributorId) {
      setVolumeData(null);
      return;
    }

    const fetchVolumeData = async () => {
      setVolumeLoading(true);

      try {
        const queryParams = new URLSearchParams({
          groupBy: 'day',
          ...(dateFrom && { from: dateFrom }),
          ...(dateTo && { to: dateTo }),
        });

        const response = await distributorFetch(`/api/gateway/distributors/${selectedDistributorId}/volume?${queryParams}`);
        setVolumeData(response);
      } catch (error) {
        console.error('Failed to fetch volume data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load volume data');
      } finally {
        setVolumeLoading(false);
      }
    };

    fetchVolumeData();
  }, [selectedDistributorId, dateFrom, dateTo]);

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formatChartData = (data: VolumeDataPoint[]) => {
    return data.map(item => ({
      ...item,
      label: new Date(item.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-[var(--color-skeleton)] rounded w-48 mb-6"></div>
          <div className="h-10 bg-[var(--color-skeleton)] rounded mb-4"></div>
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
              <h3 className="text-sm font-semibold text-[#991B1B]">Failed to load data</h3>
              <p className="text-sm text-[#991B1B] mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Volume Analytics</h1>
        <p className="text-[var(--color-muted)]">Analyze distributor commission volume and performance</p>
      </div>

      {/* Controls */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Select Distributor
            </label>
            <select
              value={selectedDistributorId}
              onChange={(e) => setSelectedDistributorId(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
            >
              <option value="">Choose a distributor...</option>
              {distributors.map(distributor => (
                <option key={distributor.id} value={distributor.id}>
                  {distributor.name} ({distributor.tier})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
              className="px-4 py-2 text-sm border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {selectedDistributorId && volumeData && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#E8F5E0] rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#4D9A2A]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-muted)]">Total Commissions</p>
                  <p className="text-lg font-semibold text-[var(--color-text)]">
                    {formatCurrency(volumeData.summary.totalCommissions)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#EEF2FF] rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#6366F1]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-muted)]">Total Source Volume</p>
                  <p className="text-lg font-semibold text-[var(--color-text)]">
                    {formatCurrency(volumeData.summary.totalSourceVolume)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#FEF3C7] rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#F59E0B]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-muted)]">Commission Count</p>
                  <p className="text-lg font-semibold text-[var(--color-text)]">
                    {volumeData.summary.commissionCount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Volume Chart */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 md:p-6">
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">
              Volume Over Time
            </h3>
            
            {volumeLoading ? (
              <div className="h-64 animate-pulse">
                <div className="h-full bg-[var(--color-skeleton)] rounded"></div>
              </div>
            ) : (
              <div className="h-64">
                {volumeData.breakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formatChartData(volumeData.breakdown)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis 
                        dataKey="label" 
                        stroke="var(--color-muted)" 
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="var(--color-muted)" 
                        fontSize={12}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '4px'
                        }}
                        formatter={(value: number, name: string) => [
                          formatCurrency(value),
                          name === 'commissions' ? 'Commissions' : 'Source Volume'
                        ]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="commissions" 
                        stackId="1"
                        stroke="#4D9A2A" 
                        fill="#4D9A2A" 
                        fillOpacity={0.6}
                        name="Commissions"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="sourceVolume" 
                        stackId="2"
                        stroke="#9CA3AF" 
                        fill="#9CA3AF" 
                        fillOpacity={0.4}
                        name="Source Volume"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-[var(--color-muted)]">
                    No volume data for this period
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {selectedDistributorId && !volumeData && !volumeLoading && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 text-center">
          <p className="text-[var(--color-muted)]">No volume data available for this distributor</p>
        </div>
      )}

      {!selectedDistributorId && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 text-center">
          <p className="text-[var(--color-muted)]">Select a distributor to view volume analytics</p>
        </div>
      )}
    </div>
  );
}