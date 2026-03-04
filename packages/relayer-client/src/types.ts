/**
 * Request to relay a partially-signed claim transaction.
 * The transaction should be base64-encoded and partially signed by the claimer.
 */
export interface RelayClaimRequest {
  /** Base64-encoded serialized transaction (partially signed by claimer) */
  transaction: string;
}

/**
 * Response from a relay claim request.
 */
export interface RelayClaimResponse {
  /** Whether the relay was successful */
  success: boolean;
  /** Transaction signature if successful */
  txSignature?: string;
  /** Error code if failed */
  error?: string;
  /** Human-readable message */
  message?: string;
}

/**
 * Response from a relay status check.
 */
export interface RelayStatusResponse {
  /** Whether the transaction has been confirmed on-chain */
  confirmed: boolean;
  /** Slot number if confirmed */
  slot?: number;
  /** Error message if check failed */
  error?: string;
}

/**
 * Configuration for the RelayerClient.
 */
export interface RelayerClientConfig {
  /** Base URL of the relayer service (e.g., "https://relay.zkira.xyz" or "http://localhost:3001") */
  baseUrl: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
}

/**
 * Request to create a walletless session.
 */
export interface SessionCreateRequest {
  /** Public key of the ephemeral keypair */
  publicKey: string;
}

/**
 * Response from a session create request.
 */
export interface SessionCreateResponse {
  /** Whether the session creation was successful */
  success: boolean;
  /** Associated Token Account address if successful */
  ata?: string;
  /** Public key of the ephemeral keypair */
  publicKey?: string;
  /** Error message if failed */
  error?: string;
  /** Error code if failed */
  code?: string;
}

/**
 * Request to relay a shielded pool transaction.
 */
export interface SessionTransactionRequest {
  /** Base64-encoded serialized transaction */
  transaction: string;
}

/**
 * Response from a session transaction relay.
 */
export interface SessionTransactionResponse {
  /** Whether the relay was successful */
  success: boolean;
  /** Transaction signature if successful */
  txSignature?: string;
  /** Error message if failed */
  error?: string;
  /** Error code if failed */
  code?: string;
}

/**
 * Response from a balance check request.
 */
export interface SessionBalanceResponse {
  /** Balance in lamports */
  balance: string;
  /** Balance in UI amount (USDC) */
  uiAmount: string;
}
