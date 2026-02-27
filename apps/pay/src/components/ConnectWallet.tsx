'use client';

import { toast } from 'sonner';
import { useWallet, useUnifiedWalletContext } from './WalletProvider';
import { useCallback } from 'react';

export function ConnectWallet() {
  const { connected, connecting, publicKey, disconnect } = useWallet();
  const { setShowModal } = useUnifiedWalletContext();

  const handleConnect = useCallback(() => {
    setShowModal(true);
  }, [setShowModal]);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
      toast('Wallet disconnected');
    } catch {
      // ignore
    }
  }, [disconnect]);

  // Connected state — show address + network
  if (connected && publicKey) {
    const addr = publicKey.toBase58();
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-0.5 mb-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[var(--color-green)] rounded-full animate-pulse-green" />
            <span className="text-[10px] font-medium tracking-[0.08em] text-[var(--color-green)] uppercase">Connected</span>
          </div>
          <span className="text-[10px] font-medium tracking-[0.08em] text-[var(--color-muted)] uppercase">Devnet</span>
        </div>
        <button
          onClick={handleDisconnect}
          className="bg-[var(--color-surface)] hover:bg-[var(--color-hover)] border border-[var(--border-subtle)] text-[var(--color-text)] hover:border-[var(--border-subtle-hover)] transition-all duration-200 flex items-center gap-2 w-full btn-press font-medium px-2.5 py-2.5 text-[13px] min-h-[44px]"
        >
          <div className="w-6 h-6 bg-[var(--color-hover)] border border-[var(--border-subtle)] rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-semibold text-[var(--color-text)]">{addr.slice(0, 2)}</span>
          </div>
          <span className="font-[family-name:var(--font-mono)] text-[12px] tabular-nums">{addr.slice(0, 4)}…{addr.slice(-4)}</span>
        </button>
      </div>
    );
  }

  // Connecting state
  if (connecting) {
    return (
      <button
        disabled
        className="bg-[var(--color-hover)] border border-[var(--border-subtle)] text-[var(--color-text-secondary)] font-medium px-3 py-1.5 text-[13px] transition-colors duration-200 flex items-center gap-2 w-full justify-center min-h-[44px]"
      >
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Connecting…
      </button>
    );
  }

  // Default — connect button
  return (
    <button
      onClick={handleConnect}
      className="bg-[var(--color-button)] hover:bg-[var(--color-button-hover)] border border-[var(--color-button)] text-[var(--color-button-text)] btn-press font-medium px-3 py-2.5 text-[13px] transition-colors duration-200 w-full text-center min-h-[48px]"
    >
      Connect Wallet
    </button>
  );
}
