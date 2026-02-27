import { PublicKey } from '@solana/web3.js';

// Request/Response types
export interface RelayClaimRequest {
  transaction: string; // Base64-encoded serialized transaction (partially signed by claimer)
}

export interface RelayClaimResponse {
  success: true;
  txSignature: string;
}

export interface RelayStatusResponse {
  confirmed: boolean;
  slot?: number;
  error?: string;
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: number;
  version: string;
  solanaConnection: boolean;
  walletBalance?: number;
}

// Error response type
export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

// Rate limiting types
export interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Escrow account data structure (manual deserialization)
export interface PaymentEscrow {
  creator: PublicKey;
  tokenMint: PublicKey;
  amount: bigint;
  claimHash: Uint8Array; // 32 bytes
  recipientSpendPubkey: Uint8Array; // 32 bytes
  recipientViewPubkey: Uint8Array; // 32 bytes
  expiry: bigint;
  claimed: boolean;
  refunded: boolean;
  nonce: bigint;
  feeBps: number;
  bump: number;
  createdAt: bigint;
}

// Protocol config data structure (manual deserialization)
export interface ProtocolConfig {
  admin: PublicKey;
  feeRecipient: PublicKey;
  feeBps: number;
  paused: boolean;
  bump: number;
}

// Transaction builder parameters
export interface BuildClaimTransactionParams {
  escrowAddress: PublicKey;
  claimSecret: Uint8Array;
  claimerPubkey: PublicKey;
}

// Program constants
export const PAYMENT_ESCROW_PROGRAM_ID = new PublicKey('DvHQCrzhL8ofNQFqxkRHnqf4Gmkejv48DCFAUMGtKHmX');
export const GHOST_REGISTRY_PROGRAM_ID = new PublicKey('EECGiV8qMJm7BT4HpLw3KBWUAETDDB8H33jaRtTRpe5v');

// PDA seed constants
export const CONFIG_SEED = 'config';
export const ESCROW_SEED = 'escrow';
export const VAULT_SEED = 'vault';