import { PublicKey, Transaction } from '@solana/web3.js';

// Re-export relevant types from @zkira/common
export type {
  MetaAddress,
  Announcement,
  PaymentEscrow,
  MilestoneEscrow,
  ProtocolConfig,
  ZkiraError,
  InvalidMetaAddressError,
  PaymentNotFoundError,
  PaymentExpiredError,
  PaymentAlreadyClaimedError,
  InvalidClaimSecretError,
  ProtocolPausedError,
} from '@zkira/common';

// Re-export relevant types from @zkira/crypto
export type {
  StealthAddressResult,
  MatchedAnnouncement,
} from '@zkira/crypto';

/**
 * Wallet adapter interface for signing transactions.
 */
export interface WalletAdapter {
  publicKey: PublicKey;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
}

/**
 * Result of creating a payment link.
 */
export interface CreatePaymentLinkResult {
  paymentUrl: string;
  escrowAddress: PublicKey;
  claimSecret: Uint8Array;
  claimSecretHex: string;
  nonce: bigint;
}

/**
 * Result of claiming a payment.
 */
export interface ClaimPaymentResult {
  txSignature: string;
}

/**
 * Result of refunding a payment.
 */
export interface RefundPaymentResult {
  txSignature: string;
}

/**
 * Result of registering a meta-address.
 */
export interface RegisterMetaAddressResult {
  txSignature: string;
  metaAddress: PublicKey;
}

/**
 * Parameters for creating a payment link.
 */
export interface CreatePaymentLinkParams {
  recipientMetaAddress: string; // "zkira:ma:<hex>" encoded
  amount: bigint;
  tokenMint: PublicKey;
  expirySeconds?: number; // default 7 days
}

/**
 * Parameters for claiming a payment.
 */
export interface ClaimPaymentParams {
  escrowAddress: PublicKey;
  claimSecret: Uint8Array;
  claimerTokenAccount?: PublicKey; // auto-derive ATA if not provided
}

/**
 * Parameters for refunding a payment.
 */
export interface RefundPaymentParams {
  escrowAddress: PublicKey;
}

/**
 * Parameters for registering a meta-address.
 */
export interface RegisterMetaAddressParams {
  spendPubkey: Uint8Array;
  viewPubkey: Uint8Array;
  label?: string;
}

/**
 * Parameters for scanning for payments.
 */
export interface ScanForPaymentsParams {
  viewPrivkey: Uint8Array;
  spendPubkey: Uint8Array;
}

/**
 * Parameters for creating a register meta-address instruction.
 */
export interface CreateRegisterMetaAddressIxParams {
  owner: PublicKey;
  spendPubkey: Uint8Array;
  viewPubkey: Uint8Array;
  label?: string;
}

/**
 * Parameters for creating a send to stealth instruction.
 */
export interface CreateSendToStealthIxParams {
  sender: PublicKey;
  senderTokenAccount: PublicKey;
  tokenMint: PublicKey;
  amount: bigint;
  stealthAddress: Uint8Array;
  ephemeralPubkey: Uint8Array;
  encryptedMetadata: Uint8Array;
}

/**
 * Parameters for creating a create payment instruction.
 */
export interface CreateCreatePaymentIxParams {
  creator: PublicKey;
  creatorTokenAccount: PublicKey;
  tokenMint: PublicKey;
  amount: bigint;
  claimHash: Uint8Array;
  recipientSpendPubkey: Uint8Array;
  recipientViewPubkey: Uint8Array;
  expiry: number; // absolute Unix timestamp (seconds)
  nonce: bigint;
}

/**
 * Parameters for creating a claim payment instruction.
 */
export interface CreateClaimPaymentIxParams {
  claimer: PublicKey;
  claimerTokenAccount: PublicKey;
  escrowAddress: PublicKey;
  claimSecret: Uint8Array;
  feeRecipientTokenAccount: PublicKey;
  tokenMint: PublicKey;
  creator: PublicKey;  // original payment creator (for rent refund)
}

/**
 * Parameters for creating a refund payment instruction.
 */
export interface CreateRefundPaymentIxParams {
  creator: PublicKey;
  creatorTokenAccount: PublicKey;
  escrowAddress: PublicKey;
  tokenMint: PublicKey;
}

/**
 * Parameters for creating a create milestone escrow instruction.
 */
export interface CreateCreateMilestoneEscrowIxParams {
  creator: PublicKey;
  creatorTokenAccount: PublicKey;
  tokenMint: PublicKey;
  totalAmount: bigint;
  claimHash: Uint8Array;
  recipientSpendPubkey: Uint8Array;
  recipientViewPubkey: Uint8Array;
  expiry: number; // absolute Unix timestamp (seconds)
  nonce: bigint;
  milestoneAmounts: bigint[];
}

/**
 * Parameters for creating a release milestone instruction.
 */
export interface CreateReleaseMilestoneIxParams {
  creator: PublicKey;
  creatorTokenAccount: PublicKey;
  claimer: PublicKey;
  claimerTokenAccount: PublicKey;
  escrowAddress: PublicKey;
  milestoneIndex: number;
  claimSecret: Uint8Array;
  tokenMint: PublicKey;
}

/**
 * Parameters for creating a refund unreleased instruction.
 */
export interface CreateRefundUnreleasedIxParams {
  creator: PublicKey;
  creatorTokenAccount: PublicKey;
  escrowAddress: PublicKey;
  tokenMint: PublicKey;
}

/**
 * Multisig escrow state.
 */
export interface MultisigEscrow {
  address: PublicKey;
  creator: PublicKey;
  tokenMint: PublicKey;
  amount: bigint;
  recipientSpendPubkey: Uint8Array;
  recipientViewPubkey: Uint8Array;
  claimHash: Uint8Array;
  expiry: number;
  approverCount: number;
  requiredApprovals: number;
  currentApprovals: number;
  approvers: PublicKey[];
  approvalBitmap: number;
  released: boolean;
  refunded: boolean;
  nonce: bigint;
  feeBps: number;
  createdAt: number;
}

/**
 * Parameters for creating a create multisig escrow instruction.
 */
export interface CreateCreateMultisigEscrowIxParams {
  creator: PublicKey;
  creatorTokenAccount: PublicKey;
  tokenMint: PublicKey;
  amount: bigint;
  claimHash: Uint8Array;
  recipientSpendPubkey: Uint8Array;
  recipientViewPubkey: Uint8Array;
  expiry: number; // absolute Unix timestamp (seconds)
  nonce: bigint;
  approverCount: number;
  requiredApprovals: number;
  approvers: PublicKey[];
}

/**
 * Parameters for creating an approve release instruction.
 */
export interface CreateApproveReleaseIxParams {
  approver: PublicKey;
  escrowAddress: PublicKey;
}

/**
 * Parameters for creating an execute release instruction.
 */
export interface CreateExecuteReleaseIxParams {
  claimer: PublicKey;
  claimerTokenAccount: PublicKey;
  escrowAddress: PublicKey;
  claimSecret: Uint8Array;
  feeRecipientTokenAccount: PublicKey;
  tokenMint: PublicKey;
  creator: PublicKey; // original escrow creator (for rent refund)
}

/**
 * Parameters for creating a refund multisig escrow instruction.
 */
export interface CreateRefundMultisigEscrowIxParams {
  creator: PublicKey;
  creatorTokenAccount: PublicKey;
  escrowAddress: PublicKey;
  tokenMint: PublicKey;
}

/**
 * Parameters for creating a multisig escrow.
 */
export interface CreateMultisigEscrowParams {
  recipientMetaAddress: string; // "zkira:ma:<hex>" encoded
  amount: bigint;
  tokenMint: PublicKey;
  expirySeconds?: number; // default 7 days
  requiredApprovals: number;
  approvers: PublicKey[];
}

/**
 * Result of creating a multisig escrow.
 */
export interface CreateMultisigEscrowResult {
  escrowUrl: string;
  escrowAddress: PublicKey;
  claimSecret: Uint8Array;
  claimSecretHex: string;
  nonce: bigint;
}

/**
 * Parameters for approving a multisig release.
 */
export interface ApproveMultisigReleaseParams {
  escrowAddress: PublicKey;
}

/**
 * Result of approving a multisig release.
 */
export interface ApproveMultisigReleaseResult {
  txSignature: string;
}

/**
 * Parameters for executing a multisig release.
 */
export interface ExecuteMultisigReleaseParams {
  escrowAddress: PublicKey;
  claimSecret: Uint8Array;
  claimerTokenAccount?: PublicKey; // auto-derive ATA if not provided
}

/**
 * Result of executing a multisig release.
 */
export interface ExecuteMultisigReleaseResult {
  txSignature: string;
}

/**
 * Parameters for refunding a multisig escrow.
 */
export interface RefundMultisigEscrowParams {
  escrowAddress: PublicKey;
}

/**
 * Result of refunding a multisig escrow.
 */
export interface RefundMultisigEscrowResult {
  txSignature: string;
}