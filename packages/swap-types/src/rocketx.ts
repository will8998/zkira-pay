// === RocketX API Response Types ===
// These match the actual response shapes from api.rocketx.exchange

export interface RocketXExchangeInfo {
  id: string | number;
  title: string;
  logo: string;
  keyword: string;
  allow_diff_wallet: boolean;
  walletLess: boolean;
  memoRequired?: boolean;
  private?: boolean;
  refundAddressRequired?: boolean;
  exchange_type: 'CEX' | 'DEX';
}

export interface RocketXTokenInfo {
  id: number;
  contract_address: string;
  token_decimals: number;
  token_symbol: string;
  token_name: string;
  network_symbol: string;
  icon_url: string;
  network_name: string;
  chainId: string; // hex string like "0x1"
  network_shorthand: string;
  network_logo: string;
  network_type: string; // "EVM", etc.
  block_explorer_url: string;
  max_amount: number;
  deposit_time: number;
  withdrawal_time: number;
  network_id: string; // "ethereum", "binance", etc.
  price: number;
  is_native_token: number; // 0 or 1
}

export interface RocketXEstTime {
  avg: number;
  min: number | null;
  max: number | null;
  type?: string | null;
  estTimeInSeconds1?: {
    avg: number;
    min: number | null;
    max: number | null;
  };
  estTimeInSeconds2?: number;
}

export interface RocketXAdditionalInfo {
  avgPrice: {
    from: number;
    to: number;
  };
  priceImpact: number;
  priceImpactWithoutGasFee: number;
  totalFeeUsd: number;
  savingUsd: number;
  slippageTolerance?: number;
  minRecieved?: number; // Note: typo in API response (recieved not received)
}

export interface RocketXQuote {
  exchangeInfo: RocketXExchangeInfo;
  fromTokenInfo: RocketXTokenInfo;
  toTokenInfo: RocketXTokenInfo;
  estTimeInSeconds: RocketXEstTime;
  type: string; // "transfer", "crosschainswap", etc.
  fromAmount: number;
  toAmount: number;
  platformFeeUsd: number;
  platformFeeInPercent: number;
  excludingFee: number;
  includingFee: number;
  includingFeeWithPfFee: number;
  discount: number;
  isTxnAllowed: boolean;
  gasFeeUsd: number;
  depositAddress?: string;
  allowanceAddress?: string;
  additionalInfo: RocketXAdditionalInfo;
}

export interface RocketXPlatformToken {
  totalHolding: number;
  eligibleDiscount: number;
  holdingByNetwork: Record<string, unknown>;
}

export interface RocketXQuotationResponse {
  platformToken: RocketXPlatformToken;
  quotes: RocketXQuote[];
  alternateRoute: unknown | null;
}

// Token list response (GET /v1/tokens)
export interface RocketXTokenListItem {
  id: number;
  token_name: string;
  token_symbol: string;
  coin_id: string;
  icon_url: string;
  contract_address: string;
  token_decimals: number;
  network_id: string;
  chainId: string; // hex string
  walletless_enabled: boolean;
  is_native_token: boolean;
  buy_enabled: boolean;
  sell_enabled: boolean;
  score: number;
}

export interface RocketXTokensResponse {
  data: RocketXTokenListItem[];
  totalPages: number;
  currentPage: number;
  perPage: number;
}

// Config response (GET /v1/configs)
export interface RocketXSupportedExchange {
  id: string | number;
  title: string;
  logo: string;
  keyword: string;
  exchange_type: 'CEX' | 'DEX';
}

export interface RocketXSupportedNetwork {
  name: string;
  network_id: string;
  chainId: string;
  network_type: string;
  logo: string;
  block_explorer_url: string;
}

export interface RocketXConfigsResponse {
  configs: Record<string, unknown>;
  supported_exchanges: RocketXSupportedExchange[];
  supported_network: RocketXSupportedNetwork[];
}

// Swap request/response (POST /v1/swap)
export interface RocketXSwapRequest {
  fromTokenId: number;
  toTokenId: number;
  fromNetwork: string;
  toNetwork: string;
  amount: number;
  exchangeKeyword: string;
  toAddress: string;
  refundAddress?: string;
  slippage?: number;
}

export interface RocketXSwapResponse {
  requestId: string;
  depositAddress: string;
  status: string;
  fromAmount: number;
  toAmount: number;
  [key: string]: unknown; // May have additional fields
}

// Status response (GET /v1/status)
export interface RocketXStatusResponse {
  requestId: string;
  status: string; // "pending", "confirming", "exchanging", "success", "failed", "refunded"
  fromAmount: number;
  toAmount: number;
  fromToken: string;
  toToken: string;
  txHash?: string;
  txHashOut?: string;
  [key: string]: unknown;
}