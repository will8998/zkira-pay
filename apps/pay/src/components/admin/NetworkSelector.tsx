'use client';

import { useAdminNetwork, type SolanaCluster } from '@/lib/admin-network';

const CLUSTERS: { value: SolanaCluster; label: string; color: string }[] = [
  { value: 'devnet', label: 'Devnet', color: 'var(--color-green)' },
  { value: 'testnet', label: 'Testnet', color: '#F59E0B' },
  { value: 'mainnet-beta', label: 'Mainnet', color: '#EF4444' },
];

export function NetworkSelector() {
  const { network, setNetwork } = useAdminNetwork();

  return (
    <div className="flex items-center gap-1 bg-[var(--color-hover)] border border-[var(--color-border)] p-1">
      {CLUSTERS.map((cluster) => {
        const isActive = network === cluster.value;
        return (
          <button
            key={cluster.value}
            onClick={() => setNetwork(cluster.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? 'bg-[var(--color-surface)] text-[var(--color-text)] rounded-md'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: isActive ? cluster.color : '#D1D5DB' }}
            />
            {cluster.label}
          </button>
        );
      })}
    </div>
  );
}
