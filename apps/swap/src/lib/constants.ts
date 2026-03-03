import type { SwapStatusValue } from '@zkira/swap-types';

export const API_BASE = '/api/v1';

export const POPULAR_TOKENS = ['BTC', 'ETH', 'SOL', 'USDT', 'USDC', 'BNB', 'MATIC', 'ARB', 'AVAX'];

export const STATUS_LABELS: Record<SwapStatusValue, string> = {
  pending: 'Waiting for deposit',
  confirming: 'Confirming',
  exchanging: 'Exchanging',
  success: 'Completed',
  failed: 'Failed',
  refunded: 'Refunded',
};

export const QUOTE_DEBOUNCE_MS = 500;
export const STATUS_POLL_INTERVAL_MS = 5000;
export const TERMINAL_STATUSES: SwapStatusValue[] = ['success', 'failed', 'refunded'];

export const SOCIAL_LINKS = {
  twitter: 'https://x.com/zkira_xyz',
};

// Network categories for token selector
export type NetworkCategory = 'ALL' | 'EVM' | 'IBC' | 'OTHERS';

export const EVM_NETWORKS = [
  'ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism', 'base', 'avalanche',
  'fantom', 'cronos', 'gnosis', 'moonbeam', 'celo', 'zksync', 'linea',
  'scroll', 'mantle', 'blast', 'mode', 'polygon_zkevm', 'aurora',
];

export const IBC_NETWORKS = [
  'osmosis', 'cosmos', 'injective', 'sei', 'celestia', 'dymension', 'kava',
];

export function getNetworkCategory(networkId: string): NetworkCategory {
  const lower = networkId.toLowerCase();
  if (EVM_NETWORKS.includes(lower)) return 'EVM';
  if (IBC_NETWORKS.includes(lower)) return 'IBC';
  return 'OTHERS';
}
