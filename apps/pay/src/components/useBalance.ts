'use client';

/**
 * Stub useBalance — Solana balance checking removed.
 * The new EVM flow manages balances through BrowserWalletProvider.
 */

export interface BalanceState {
  sol: number | null;
  usdc: number | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useBalance(): BalanceState {
  return {
    sol: null,
    usdc: null,
    loading: false,
    error: null,
    refresh: () => {},
  };
}
