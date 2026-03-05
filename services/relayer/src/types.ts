// Request/Response types for session routes
export interface SessionCreateRequest {
  address: string; // 0x EVM address
  partnerId?: string; // Distributor UUID for volume tracking
}

export interface SessionCreateResponse {
  success: boolean;
  address: string;
  poolAddress: string; // Which pool was assigned
}

export interface DepositBroadcastRequest {
  signedTransaction: string; // 0x-prefixed hex of signed tx
  partnerId?: string; // Distributor UUID for volume tracking
}

export interface WithdrawRelayRequest {
  proof: string;           // 0x-prefixed hex (256 bytes encoded)
  root: string;            // bytes32 hex
  nullifierHash: string;   // bytes32 hex
  recipient: string;       // 0x address
  relayer: string;         // 0x address (relayer's own address)
  fee: string;             // uint256 decimal string
  refund: string;          // uint256 decimal string (usually "0")
  poolAddress: string;     // Which pool to withdraw from
  partnerId?: string;      // Distributor UUID for volume tracking
}

export interface RelayResponse {
  success: boolean;
  txHash?: string;
  error?: string;
  code?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
}

// Balance response
export interface BalanceResponse {
  balance: string;
  uiAmount: string;
}

// Pool status for monitoring
export interface PoolStatus {
  address: string;
  denomination: string;
  isPaused: boolean;
  nextIndex: number;
  balance: string;
}

// Health check
export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: number;
  version: string;
  arbConnection: boolean;
  walletBalance?: string;
  relayerAddress?: string;
}

// Rate limiting types
export interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Transaction status
export interface TransactionStatusResponse {
  confirmed: boolean;
  receipt?: {
    status: number;
    gasUsed: string;
    effectiveGasPrice: string;
    blockNumber: number;
  };
  error?: string;
}

// === Tron-specific types ===

export interface TronWithdrawRelayRequest {
  proof: string;           // hex encoded proof
  root: string;            // hex bytes32
  nullifierHash: string;   // hex bytes32
  recipient: string;       // base58 Tron address
  relayer: string;         // base58 Tron address (relayer's own)
  fee: string;             // uint256 decimal string
  refund: string;          // uint256 decimal string (usually "0")
  poolAddress: string;     // base58 Tron pool address
  partnerId?: string;      // Distributor UUID for volume tracking
}

export interface TronRelayResponse {
  success: boolean;
  txId?: string;           // Tron uses txId not txHash
  error?: string;
  code?: string;
}

export interface TronPoolStatus {
  address: string;         // base58
  denomination: string;
  isPaused: boolean;
  nextIndex: number;
  balance: string;
}
