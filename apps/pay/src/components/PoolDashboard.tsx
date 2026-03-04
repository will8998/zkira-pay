'use client';

import { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { ShieldedPoolClient, PoolConfig, PoolState } from '@zkira/sdk';
import { useWallet, useConnection } from '@/components/WalletProvider';
import { useNetwork, getUsdcMint } from '@/lib/network-config';
import { toast } from 'sonner';

export function PoolDashboard() {
  const { connection } = useConnection();
  const { wallet } = useWallet();
  const { network } = useNetwork();
  const [poolState, setPoolState] = useState<PoolState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pool configuration (devnet defaults)
  const poolConfig: PoolConfig = {
    poolAddress: new PublicKey('6g5RquPcpe81VzB6CtmuS8pzbXs7nZ5CT7gZt4fLKedx'), // Default pool address
    tokenMint: new PublicKey(getUsdcMint(network)),
    denomination: BigInt(10_000_000), // 10 USDC (6 decimals)
    circuitWasmUrl: '/circuits/withdraw.wasm',
    circuitZkeyUrl: '/circuits/withdraw_final.zkey',
  };

  const fetchPoolState = async () => {
    if (!wallet) return;

    try {
      setLoading(true);
      setError(null);

      const client = new ShieldedPoolClient(connection, wallet, poolConfig);
      const state = await client.getPoolState();
      setPoolState(state);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pool state';
      setError(errorMessage);
      console.warn('Pool state fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch pool state on mount and every 30 seconds
  useEffect(() => {
    fetchPoolState();
    const interval = setInterval(fetchPoolState, 30000);
    return () => clearInterval(interval);
  }, [wallet, connection, network]);

  const denomination = Number(poolConfig.denomination) / 1_000_000; // Convert to USDC
  const anonymitySet = poolState ? poolState.depositCount - poolState.withdrawalCount : 0;

  const stats = [
    {
      label: 'Denomination',
      value: `${denomination} USDC`,
      icon: '💰',
      description: 'Fixed amount per deposit',
    },
    {
      label: 'Total Deposits',
      value: poolState ? poolState.depositCount.toLocaleString() : '—',
      icon: '📥',
      description: 'Total number of deposits',
    },
    {
      label: 'Total Withdrawals',
      value: poolState ? poolState.withdrawalCount.toLocaleString() : '—',
      icon: '📤',
      description: 'Total number of withdrawals',
    },
    {
      label: 'Anonymity Set',
      value: poolState ? anonymitySet.toLocaleString() : '—',
      icon: '🔐',
      description: 'Active deposits providing privacy',
    },
    {
      label: 'Pending Withdrawals',
      value: poolState ? poolState.pendingWithdrawals.toLocaleString() : '—',
      icon: '⏳',
      description: 'Withdrawals awaiting batch processing',
    },
    {
      label: 'Pool Status',
      value: poolState ? (poolState.paused ? 'PAUSED' : 'ACTIVE') : '—',
      icon: poolState?.paused ? '⏸️' : '▶️',
      description: 'Current pool operational status',
      status: poolState?.paused ? 'danger' : 'success',
    },
  ];

  if (error) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">⚠️</span>
          <h2 className="text-lg font-semibold text-[var(--color-text)] uppercase tracking-wide" style={{ fontFamily: 'var(--font-mono)' }}>
            Pool Dashboard
          </h2>
        </div>
        <div className="text-[var(--color-red)] text-sm mb-3">
          Failed to load pool data: {error}
        </div>
        <button
          onClick={fetchPoolState}
          disabled={loading}
          className="px-4 py-2 text-sm bg-[var(--color-button)] text-[var(--color-bg)] hover:bg-[var(--color-button-hover)] font-medium transition-colors disabled:opacity-40 btn-press"
        >
          {loading ? 'Retrying...' : 'Retry'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-xl">🛡️</span>
          <h2 className="text-lg font-semibold text-[var(--color-text)] uppercase tracking-wide" style={{ fontFamily: 'var(--font-mono)' }}>
            Pool Dashboard
          </h2>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)] text-sm">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Updating...</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-lg">{stat.icon}</span>
              <h3 className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-text-muted)] font-medium">
                {stat.label}
              </h3>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span 
                className={`text-xl font-bold tabular-nums ${
                  stat.status === 'danger' ? 'text-[var(--color-red)]' :
                  stat.status === 'success' ? 'text-[var(--color-green)]' :
                  'text-[var(--color-text)]'
                }`}
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {stat.value}
              </span>
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
              {stat.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
        <p className="text-[11px] text-[var(--color-text-secondary)] flex items-center gap-2">
          <span>🔄</span>
          Auto-refreshes every 30 seconds. Network: {network}
        </p>
      </div>
    </div>
  );
}