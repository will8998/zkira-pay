import type {
  RocketXQuote,
  RocketXTokenListItem,
  RocketXSupportedNetwork,
  RocketXSupportedExchange,
  RocketXConfigsResponse,
} from './rocketx.js';

// === Our API Types ===
// These are the types our swap-api exposes to the frontend

// Health
export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
}

// Config (passthrough from RocketX with our additions)
export interface ConfigsResponse {
  supported_exchanges: RocketXSupportedExchange[];
  supported_networks: RocketXSupportedNetwork[];
}

// Tokens — we pass through RocketX token list items
export type TokenItem = RocketXTokenListItem;

export interface TokensResponse {
  tokens: TokenItem[];
  totalPages: number;
  currentPage: number;
  perPage: number;
}

// Quote — we pass through RocketX quotes with route categorization
export type RouteType = 'standard' | 'private';

export interface RouteQuote {
  exchangeKeyword: string;
  exchangeTitle: string;
  exchangeLogo: string;
  exchangeType: 'CEX' | 'DEX';
  isPrivate: boolean;
  walletLess: boolean;
  allowDiffWallet: boolean;
  refundAddressRequired: boolean;
  fromAmount: number;
  toAmount: number;
  fromTokenSymbol: string;
  toTokenSymbol: string;
  fromNetwork: string;
  toNetwork: string;
  estimatedTimeSeconds: number;
  gasFeeUsd: number;
  platformFeeUsd: number;
  platformFeePercent: number;
  priceImpact: number;
  minReceived?: number;
  depositAddress?: string;
  allowanceAddress?: string;
  isTxnAllowed: boolean;
  routeType: RouteType;
}

export interface QuotationResponse {
  quotes: RouteQuote[];
}

// Swap
export interface SwapRequest {
  fromTokenId: number;
  toTokenId: number;
  fromNetwork: string;
  toNetwork: string;
  amount: number;
  exchangeKeyword: string;
  toAddress: string;
  refundAddress?: string;
  slippage?: number;
  inviteCode?: string;
}

export interface SwapResponse {
  requestId: string;
  depositAddress: string;
  status: string;
  fromAmount: number;
  toAmount: number;
}

// Status
export type SwapStatusValue = 'pending' | 'confirming' | 'exchanging' | 'success' | 'failed' | 'refunded';

export interface StatusResponse {
  requestId: string;
  status: SwapStatusValue;
  fromAmount: number;
  toAmount: number;
  fromToken: string;
  toToken: string;
  txHash?: string;
  txHashOut?: string;
}

// Error
export interface ApiErrorResponse {
  error: string;
  status: number;
  details?: unknown;
}

// Swap step (frontend state machine)
export type SwapStep = 'idle' | 'quoting' | 'ready' | 'submitting' | 'depositing' | 'tracking';