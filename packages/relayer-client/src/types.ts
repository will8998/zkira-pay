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
