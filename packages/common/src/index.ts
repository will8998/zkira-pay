import { PublicKey } from '@solana/web3.js';

// ─── Program IDs (will be replaced with real keypairs before devnet deploy) ───

export const GHOST_REGISTRY_PROGRAM_ID = new PublicKey('EECGiV8qMJm7BT4HpLw3KBWUAETDDB8H33jaRtTRpe5v');
export const PAYMENT_ESCROW_PROGRAM_ID = new PublicKey('DvHQCrzhL8ofNQFqxkRHnqf4Gmkejv48DCFAUMGtKHmX');
export const CONDITIONAL_ESCROW_PROGRAM_ID = new PublicKey('ET3eDt2vfvXXeUaDC4wJ1od9EZ2r6DGMmwiBzXJLAovJ');
export const MULTISIG_ESCROW_PROGRAM_ID = new PublicKey('yLGC8fizXAfvxT8AnQaVFCjEAScz5o4zqmBHoPVs3bu');

// ─── Core Types ───

/** Stealth meta-address: two Ed25519 public keys (spend + view). */
export interface MetaAddress {
  spendPubkey: Uint8Array;
  viewPubkey: Uint8Array;
}

/** On-chain announcement emitted when someone sends to a stealth address. */
export interface Announcement {
  ephemeralPubkey: Uint8Array;
  stealthAddress: Uint8Array;
  tokenMint: PublicKey;
  encryptedMetadata: Uint8Array;
  timestamp: number;
  slot: number;
}

/** Payment escrow state. */
export interface PaymentEscrow {
  address: PublicKey;
  creator: PublicKey;
  tokenMint: PublicKey;
  amount: bigint;
  claimHash: Uint8Array;
  recipientMeta: MetaAddress | null;
  expiry: number;
  claimed: boolean;
  refunded: boolean;
  nonce: bigint;
  feeBps: number;
}

/** Milestone escrow state. */
export interface MilestoneEscrow {
  address: PublicKey;
  creator: PublicKey;
  tokenMint: PublicKey;
  totalAmount: bigint;
  releasedAmount: bigint;
  recipientMeta: MetaAddress | null;
  claimHash: Uint8Array;
  expiry: number;
  milestoneCount: number;
  milestonesReleased: number;
  milestoneAmounts: bigint[];
  milestoneReleased: boolean[];
  refunded: boolean;
  nonce: bigint;
  feeBps: number;
  createdAt: number;
}

/** Protocol configuration singleton. */
export interface ProtocolConfig {
  admin: PublicKey;
  feeRecipient: PublicKey;
  feeBps: number;
  paused: boolean;
}

// ─── Constants ───

export const ZKIRA_FEE_BPS = 25; // 0.25%
export const MAX_EXPIRY_SECONDS = 30 * 24 * 60 * 60;
export const MIN_EXPIRY_SECONDS = 60 * 60;
export const CLAIM_SECRET_LENGTH = 32;
export const META_ADDRESS_PREFIX = 'zkira:ma:';

// ─── PDA Seeds ───

const enc = (s: string) => new TextEncoder().encode(s);

export const SEEDS = {
  META_ADDRESS: enc('meta'),
  ANNOUNCEMENT: enc('announce'),
  ESCROW: enc('escrow'),
  CONFIG: enc('config'),
  ESCROW_VAULT: enc('vault'),
  MILESTONE_ESCROW: enc('milestone_escrow'),
  MILESTONE_VAULT: enc('milestone_vault'),
  MULTISIG_ESCROW: enc('multisig_escrow'),
  MULTISIG_VAULT: enc('multisig_vault'),
} as const;

// ─── Errors ───

export class ZkiraError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ZkiraError';
  }
}

export class InvalidMetaAddressError extends ZkiraError {
  constructor(message = 'Invalid meta-address format or keys') {
    super(message, 'INVALID_META_ADDRESS');
  }
}

export class PaymentNotFoundError extends ZkiraError {
  constructor(message = 'Payment escrow not found') {
    super(message, 'PAYMENT_NOT_FOUND');
  }
}

export class PaymentExpiredError extends ZkiraError {
  constructor(message = 'Payment has expired') {
    super(message, 'PAYMENT_EXPIRED');
  }
}

export class PaymentAlreadyClaimedError extends ZkiraError {
  constructor(message = 'Payment already claimed') {
    super(message, 'PAYMENT_ALREADY_CLAIMED');
  }
}

export class InvalidClaimSecretError extends ZkiraError {
  constructor(message = 'Invalid claim secret') {
    super(message, 'INVALID_CLAIM_SECRET');
  }
}

export class ProtocolPausedError extends ZkiraError {
  constructor(message = 'Protocol is paused') {
    super(message, 'PROTOCOL_PAUSED');
  }
}
