'use client';

import { useEVMNetwork } from '@/components/EVMNetworkProvider';
import type { NetworkMode } from '@/config/pool-registry';

const MODES: { value: NetworkMode; label: string; dotColor: string }[] = [
  { value: 'mainnet', label: 'Mainnet', dotColor: '#22c55e' },
  { value: 'testnet', label: 'Testnet', dotColor: '#f59e0b' },
];

export function EVMNetworkToggle() {
  const { mode, setMode } = useEVMNetwork();

  return (
    <div className="flex items-center gap-0.5 bg-[var(--color-hover)] border border-[var(--color-border)] rounded-full p-0.5">
      {MODES.map((m) => {
        const isActive = mode === m.value;
        return (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition-all rounded-full ${
              isActive
                ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: isActive ? m.dotColor : 'var(--color-muted)' }}
            />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
