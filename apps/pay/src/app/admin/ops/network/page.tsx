'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin-api';
import { useAdminNetwork, getExplorerUrl } from '@/lib/admin-network';
import { StatsCard } from '@/components/admin/StatsCard';
import { toast } from 'sonner';

interface NetworkHealthData {
  rpcUrl: string;
  cluster: string;
  slot: number;
  blockTime: number;
  blockHeight: number;
  epochInfo: {
    epoch: number;
    slotIndex: number;
    slotsInEpoch: number;
    absoluteSlot: number;
  };
  tps: number;
  healthy: boolean;
  latencyMs: number;
  version?: string;
}

const AUTO_REFRESH_OPTIONS = [
  { value: 0, label: 'Off' },
  { value: 5000, label: '5s' },
  { value: 15000, label: '15s' },
  { value: 30000, label: '30s' }
];

export default function NetworkHealthPage() {
  const { network } = useAdminNetwork();
  const [data, setData] = useState<NetworkHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(0);

  const fetchData = async () => {
    try {
      const result = await adminFetch(`/api/admin/ops/network-health?network=${network}`);
      setData(result);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch network health:', error);
      toast.error('Failed to fetch network health data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [network]);

  useEffect(() => {
    if (autoRefresh === 0) return;

    const interval = setInterval(fetchData, autoRefresh);
    return () => clearInterval(interval);
  }, [autoRefresh, network]);

  const handleRefresh = () => {
    setLoading(true);
    fetchData();
  };

  const getLatencyColor = (latencyMs: number) => {
    if (latencyMs < 200) return 'var(--color-green)'; // Green
    if (latencyMs <= 500) return '#F59E0B'; // Yellow
    return 'var(--color-red)'; // Red
  };

  if (loading && !data) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse">
          <div className="mb-6">
            <div className="h-8 bg-[var(--color-skeleton)] rounded w-64 mb-2"></div>
            <div className="h-5 bg-[var(--color-skeleton)] rounded w-96"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-[var(--color-skeleton)]"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-40 bg-[var(--color-skeleton)]"></div>
            <div className="h-40 bg-[var(--color-skeleton)]"></div>
          </div>
        </div>
      </div>
    );
  }

  const epochProgress = data?.epochInfo
    ? (data.epochInfo.slotIndex / data.epochInfo.slotsInEpoch) * 100
    : 0;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-3 md:gap-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Network Health</h1>
          <p className="text-[var(--color-muted)]">Monitor Solana RPC and cluster status</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          {/* Auto-refresh selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-[var(--color-muted)]">Auto-refresh:</label>
            <select
              value={autoRefresh}
              onChange={(e) => setAutoRefresh(Number(e.target.value))}
              className="px-3 py-1 border border-[var(--color-border)] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-text)]/20"
            >
              {AUTO_REFRESH_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {lastUpdated && (
            <span className="text-sm text-[var(--color-muted)]">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="bg-[var(--color-button)] text-[var(--color-button-text)] px-4 py-2 hover:bg-[var(--color-button-hover)] transition-colors disabled:opacity-50 min-h-[44px]"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Slot Height"
          value={data?.slot?.toLocaleString() || '0'}
          icon={(
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0018 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l-1-3m1 3l-1-3m-16.5-3h16.5" />
            </svg>
          )}
          accentColor="#3B82F6"
        />
        <StatsCard
          title="Block Height"
          value={data?.blockHeight?.toLocaleString() || '0'}
          icon={(
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
          )}
          accentColor="var(--color-green)"
        />
        <StatsCard
          title="TPS"
          value={data?.tps?.toLocaleString() || '0'}
          icon={(
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          )}
          accentColor="#F59E0B"
        />
        <StatsCard
          title="RPC Latency"
          value={`${data?.latencyMs || 0}ms`}
          icon={(
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          accentColor={getLatencyColor(data?.latencyMs || 0)}
        />
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Status */}
        <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Network Status</h3>
          <div className="flex items-center gap-4">
            <div className={`w-4 h-4 rounded-full ${data?.healthy ? 'bg-[var(--color-green)]' : 'bg-[var(--color-red)]'}`}></div>
            <span className={`text-lg font-medium ${data?.healthy ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
              {data?.healthy ? 'Healthy' : 'Unhealthy'}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-sm text-[var(--color-muted)] mb-1">RPC Endpoint</p>
              <code className="font-mono text-sm text-[var(--color-text)] bg-[var(--color-hover)] px-2 py-1 rounded">
                {data?.rpcUrl || 'N/A'}
              </code>
            </div>
            <div>
              <p className="text-sm text-[var(--color-muted)] mb-1">Cluster</p>
              <span className="text-sm font-medium text-[var(--color-text)] bg-[var(--color-hover)] px-2 py-1 rounded">
                {data?.cluster || 'unknown'}
              </span>
            </div>
            {data?.version && (
              <div>
                <p className="text-sm text-[var(--color-muted)] mb-1">Solana Version</p>
                <span className="text-sm font-medium text-[var(--color-text)] bg-[var(--color-hover)] px-2 py-1 rounded">
                  {data.version}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Epoch Info */}
        <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Epoch Information</h3>
          {data?.epochInfo ? (
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">Epoch Number</span>
                <span className="font-mono text-[var(--color-text)]">{data.epochInfo.epoch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">Slot Index</span>
                <span className="font-mono text-[var(--color-text)]">{data.epochInfo.slotIndex.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">Slots in Epoch</span>
                <span className="font-mono text-[var(--color-text)]">{data.epochInfo.slotsInEpoch.toLocaleString()}</span>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-[var(--color-muted)]">Progress</span>
                  <span className="text-[var(--color-text)] font-medium">{epochProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-[var(--color-border)] rounded-full h-2">
                  <div
                    className="bg-[var(--color-green)] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${epochProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[var(--color-muted)]">No epoch data available</p>
          )}
        </div>
      </div>
    </div>
  );
}