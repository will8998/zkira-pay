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

export const STATUS_COLORS: Record<SwapStatusValue, string> = {
  pending: 'text-zkira-yellow',
  confirming: 'text-zkira-yellow',
  exchanging: 'text-zkira-blue',
  success: 'text-zkira-green',
  failed: 'text-zkira-red',
  refunded: 'text-zkira-yellow',
};

export const QUOTE_DEBOUNCE_MS = 500;
export const STATUS_POLL_INTERVAL_MS = 5000;
export const TERMINAL_STATUSES: SwapStatusValue[] = ['success', 'failed', 'refunded'];

export const SOCIAL_LINKS = {
  twitter: 'https://x.com/zkira_xyz',
};
