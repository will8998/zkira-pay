// ZKIRA SDK - TypeScript client for interacting with ZKIRA protocol

export const SDK_VERSION = '0.1.0';

// Main client class
export { ZkiraClient } from './client.js';

// PDA derivation helpers
export {
  findMetaAddress,
  findAnnouncement,
  findEscrow,
  findEscrowVault,
  findConfig,
  findMilestoneEscrow,
  findMilestoneVault,
  findMultisigEscrow,
  findMultisigVault,
} from './pda.js';

// Transaction instruction builders
export {
  createRegisterMetaAddressIx,
  createSendToStealthIx,
  createCreatePaymentIx,
  createClaimPaymentIx,
  createRefundPaymentIx,
} from './instructions.js';

// Multisig escrow instruction builders
export {
  createCreateMultisigEscrowIx,
  createApproveReleaseIx,
  createExecuteReleaseIx,
  createRefundMultisigEscrowIx,
} from './multisig-instructions.js';

// Milestone escrow instruction builders
export {
  createCreateMilestoneEscrowIx,
  createReleaseMilestoneIx,
  createRefundUnreleasedIx,
} from './milestone-instructions.js';

// Types and interfaces
export type {
  // SDK-specific types
  WalletAdapter,
  CreatePaymentLinkResult,
  ClaimPaymentResult,
  RefundPaymentResult,
  RegisterMetaAddressResult,
  CreatePaymentLinkParams,
  ClaimPaymentParams,
  RefundPaymentParams,
  RegisterMetaAddressParams,
  ScanForPaymentsParams,
  CreateRegisterMetaAddressIxParams,
  CreateSendToStealthIxParams,
  CreateCreatePaymentIxParams,
  CreateClaimPaymentIxParams,
  CreateRefundPaymentIxParams,
  CreateCreateMilestoneEscrowIxParams,
  CreateReleaseMilestoneIxParams,
  CreateRefundUnreleasedIxParams,
  // Multisig escrow types
  MultisigEscrow,
  CreateCreateMultisigEscrowIxParams,
  CreateApproveReleaseIxParams,
  CreateExecuteReleaseIxParams,
  CreateRefundMultisigEscrowIxParams,
  CreateMultisigEscrowParams,
  CreateMultisigEscrowResult,
  ApproveMultisigReleaseParams,
  ApproveMultisigReleaseResult,
  ExecuteMultisigReleaseParams,
  ExecuteMultisigReleaseResult,
  RefundMultisigEscrowParams,
  RefundMultisigEscrowResult,
  // Re-exported from @zkira/common
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
  // Re-exported from @zkira/crypto
  StealthAddressResult,
  MatchedAnnouncement,
} from './types.js';
