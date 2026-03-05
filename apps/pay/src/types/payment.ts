/**
 * Payment flow types for ZKIRA Pay.
 *
 * These types underpin the Send, Request, Claim, and Invoice flows
 * that sit on top of the Tornado Cash deposit/withdraw cycle.
 */

import type { PoolEntry, Chain, TokenId } from '@/config/pool-registry';

// ──────────────────────────────────────────
// Denomination Builder
// ──────────────────────────────────────────

/** A single denomination selection in the multi-denomination builder. */
export interface DenominationSelection {
  pool: PoolEntry;
  /** How many deposits of this denomination the user wants. */
  count: number;
}

/** Full denomination set chosen by user. */
export interface DenominationSet {
  chain: Chain;
  token: TokenId;
  selections: DenominationSelection[];
  /** Sum of all (denomination × count) in raw token units. */
  totalRaw: bigint;
  /** Human-readable total (e.g. "2,500 USDC"). */
  totalLabel: string;
  /** Amount that cannot be covered by pool denominations (in human-readable units, e.g. 920). */
  remainder: number;
  /** Human-readable remainder label (e.g. "920 USDC"). Empty string if no remainder. */
  remainderLabel: string;
}

// ──────────────────────────────────────────
// Deposit Bundle (notes produced by deposits)
// ──────────────────────────────────────────

/** A single deposit note after a successful pool deposit. */
export interface DepositNoteRecord {
  /** MiMC nullifier. */
  nullifier: string;
  /** MiMC secret. */
  secret: string;
  /** Poseidon/MiMC commitment. */
  commitment: string;
  /** On-chain leaf index in Merkle tree. */
  leafIndex: number;
  /** Pool contract address. */
  pool: string;
  /** Raw denomination (string because bigint is not JSON-safe). */
  denomination: string;
  /** Chain the deposit lives on. */
  chain: Chain;
  /** Token deposited. */
  token: TokenId;
}

/** Bundle of deposit notes from a multi-denomination send. */
export interface DepositBundle {
  notes: DepositNoteRecord[];
  /** ISO-8601 timestamp when bundle was created. */
  createdAt: string;
  /** Total value in raw token units. */
  totalRaw: string;
}

// ──────────────────────────────────────────
// Claim Code (Send flow)
// ──────────────────────────────────────────

/** A claim code that references a dead drop containing encrypted notes. */
export interface ClaimCodeData {
  /** Short code e.g. "ZKIRA-A7X9-B3M2". */
  code: string;
  /** Symmetric key used to encrypt the dead drop payload, hex-encoded. */
  encryptionKey: string;
}

// ──────────────────────────────────────────
// Dead Drop (server-mediated note exchange)
// ──────────────────────────────────────────

/** Payload stored on the dead drop server (encrypted). */
export interface DeadDropPayload {
  /** AES-GCM encrypted DepositBundle, base64-encoded. */
  ciphertext: string;
  /** AES-GCM nonce, base64-encoded. */
  nonce: string;
  /** Version of the encryption scheme (for future-proofing). */
  version: number;
}

/** Dead drop entry as returned by the API. */
export interface DeadDropEntry {
  /** Dead drop identifier (derived from claim code). */
  id: string;
  /** Encrypted payload. */
  payload: DeadDropPayload;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
  /** ISO-8601 expiry timestamp (e.g. 72 hours from creation). */
  expiresAt: string;
  /** Whether this dead drop has been claimed (read). */
  claimed: boolean;
}

// ──────────────────────────────────────────
// Invoice / Request Payment
// ──────────────────────────────────────────

/** An invoice created by a requester. */
export interface InvoiceRequest {
  /** Unique invoice ID (UUID). */
  invoiceId: string;
  /** Chain the invoice expects payment on. */
  chain: Chain;
  /** Token the invoice expects. */
  token: TokenId;
  /** Denomination selections the payer must deposit. */
  denominations: DenominationSelection[];
  /** Total requested amount in raw token units. */
  totalRaw: string;
  /** Human-readable total. */
  totalLabel: string;
  /** X25519 public key of the requester (base64). Used by payer to encrypt notes. */
  recipientPubkey: string;
  /** Optional memo / description. */
  memo?: string;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
  /** ISO-8601 expiry timestamp. */
  expiresAt: string;
  /** Status: waiting for payer deposits. */
  status: 'pending' | 'funded' | 'withdrawn' | 'expired';
}

/** A single encrypted note attached to an invoice (payer → requester). */
export interface InvoiceNoteEntry {
  /** Encrypted DepositNoteRecord, NaCl box (base64). */
  ciphertext: string;
  /** NaCl box nonce (base64). */
  nonce: string;
  /** Payer's ephemeral X25519 public key (base64). */
  ephemeralPubkey: string;
}

// ──────────────────────────────────────────
// Transaction History (localStorage)
// ──────────────────────────────────────────

export type HistoryEntryType = 'send' | 'request' | 'claim' | 'invoice_pay' | 'deposit' | 'withdraw';

export interface HistoryEntry {
  /** Unique ID. */
  id: string;
  type: HistoryEntryType;
  chain: Chain;
  token: TokenId;
  /** Raw amount in token units. */
  amountRaw: string;
  /** Human label (e.g. "2,500 USDC"). */
  amountLabel: string;
  /** ISO-8601 timestamp. */
  timestamp: string;
  /** Claim code (for sends). */
  claimCode?: string;
  /** Invoice ID (for requests / invoice pays). */
  invoiceId?: string;
  /** Transaction hashes (for on-chain events). */
  txHashes?: string[];
  /** Status. */
  status: 'pending' | 'complete' | 'failed';
}
