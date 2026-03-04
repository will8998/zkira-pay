import { PublicKey, TransactionInstruction, AccountMeta, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { sha256 } from '@noble/hashes/sha256';
import { MULTISIG_ESCROW_PROGRAM_ID } from '@zkira/common';
import { findMultisigEscrow, findMultisigVault, findConfig } from './pda.js';
import type {
  CreateCreateMultisigEscrowIxParams,
  CreateApproveReleaseIxParams,
  CreateExecuteReleaseIxParams,
  CreateRefundMultisigEscrowIxParams,
} from './types.js';

export { MULTISIG_ESCROW_PROGRAM_ID };

/**
 * Computes the 8-byte Anchor instruction discriminator.
 */
function getInstructionDiscriminator(instructionName: string): Uint8Array {
  const hash = sha256(`global:${instructionName}`);
  return hash.slice(0, 8);
}

/**
 * Serializes a u64 as 8 bytes little-endian.
 */
function serializeU64(value: bigint): Uint8Array {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, value, true); // little-endian
  return new Uint8Array(buffer);
}

/**
 * Serializes an i64 as 8 bytes little-endian.
 */
function serializeI64(value: bigint): Uint8Array {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigInt64(0, value, true); // little-endian
  return new Uint8Array(buffer);
}

/**
 * Serializes a u32 as 4 bytes little-endian.
 */
function serializeU32(value: number): Uint8Array {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setUint32(0, value, true); // little-endian
  return new Uint8Array(buffer);
}

/**
 * Serializes a u8 as 1 byte.
 */
function serializeU8(value: number): Uint8Array {
  return new Uint8Array([value]);
}

/**
 * Concatenates multiple Uint8Arrays.
 */
function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * Creates a create multisig escrow instruction.
 */
export function createCreateMultisigEscrowIx(params: CreateCreateMultisigEscrowIxParams): TransactionInstruction {
  const {
    creator,
    creatorTokenAccount,
    tokenMint,
    amount,
    stealthAddress,
    recipientSpendPubkey,
    recipientViewPubkey,
    expiry,
    nonce,
    approverCount,
    requiredApprovals,
    approvers,
  } = params;

  // Compute discriminator
  const discriminator = getInstructionDiscriminator('create_multisig_escrow');

  // Serialize instruction data matching Anchor instruction order:
  // nonce: u64, stealth_address: [u8; 32], amount: u64, expiry: i64,
  // recipient_spend_pubkey: [u8; 32], recipient_view_pubkey: [u8; 32],
  // approver_count: u8, required_approvals: u8, approvers: Vec<Pubkey>
  const nonceBytes = serializeU64(nonce);
  const stealthAddressBytes = new Uint8Array(stealthAddress);
  const amountBytes = serializeU64(amount);
  const expiryBytes = serializeI64(BigInt(expiry));
  const recipientSpendPubkeyBytes = new Uint8Array(recipientSpendPubkey);
  const recipientViewPubkeyBytes = new Uint8Array(recipientViewPubkey);
  const approverCountBytes = serializeU8(approverCount);
  const requiredApprovalsBytes = serializeU8(requiredApprovals);
  
  // Serialize Vec<Pubkey> with 4-byte length prefix
  const approversLenBytes = serializeU32(approvers.length);
  const approversBytes = concatBytes(...approvers.map(pubkey => pubkey.toBytes()));

  const data = concatBytes(
    discriminator,
    nonceBytes,
    stealthAddressBytes,
    amountBytes,
    expiryBytes,
    recipientSpendPubkeyBytes,
    recipientViewPubkeyBytes,
    approverCountBytes,
    requiredApprovalsBytes,
    approversLenBytes,
    approversBytes
  );

  // Derive PDAs
  const [escrow] = findMultisigEscrow(creator, nonce);
  const [vault] = findMultisigVault(escrow);
  const [config] = findConfig();

  // Build accounts — order MUST match Anchor CreateMultisigEscrow struct
  const accounts: AccountMeta[] = [
    { pubkey: config, isSigner: false, isWritable: false },
    { pubkey: escrow, isSigner: false, isWritable: true },
    { pubkey: vault, isSigner: false, isWritable: true },
    { pubkey: tokenMint, isSigner: false, isWritable: false },
    { pubkey: creatorTokenAccount, isSigner: false, isWritable: true },
    { pubkey: creator, isSigner: true, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys: accounts,
    programId: MULTISIG_ESCROW_PROGRAM_ID,
    data: Buffer.from(data),
  });
}

/**
 * Creates an approve release instruction.
 */
export function createApproveReleaseIx(params: CreateApproveReleaseIxParams): TransactionInstruction {
  const { approver, escrowAddress } = params;

  // Compute discriminator
  const discriminator = getInstructionDiscriminator('approve_release');

  // No additional data needed for approve
  const data = discriminator;

  // Build accounts — order MUST match Anchor ApproveRelease struct
  const accounts: AccountMeta[] = [
    { pubkey: escrowAddress, isSigner: false, isWritable: true },
    { pubkey: approver, isSigner: true, isWritable: false },
  ];

  return new TransactionInstruction({
    keys: accounts,
    programId: MULTISIG_ESCROW_PROGRAM_ID,
    data: Buffer.from(data),
  });
}

/**
 * Creates an execute release instruction.
 */
export function createExecuteReleaseIx(params: CreateExecuteReleaseIxParams): TransactionInstruction {
  const { 
    claimer, 
    claimerTokenAccount, 
    escrowAddress, 
    // No claimSecret needed for stealth - claimer signs with stealth key
    feeRecipientTokenAccount, 
    tokenMint, 
    creator 
  } = params;

  // Compute discriminator
  const discriminator = getInstructionDiscriminator('execute_release');

  // No additional data — claimer proves identity by signing with stealth key

  const data = discriminator;

  // Derive PDAs
  const [vault] = findMultisigVault(escrowAddress);
  const [config] = findConfig();

  // Build accounts — order MUST match Anchor ExecuteRelease struct
  const accounts: AccountMeta[] = [
    { pubkey: config, isSigner: false, isWritable: false },
    { pubkey: escrowAddress, isSigner: false, isWritable: true },
    { pubkey: vault, isSigner: false, isWritable: true },
    { pubkey: tokenMint, isSigner: false, isWritable: false },
    { pubkey: claimerTokenAccount, isSigner: false, isWritable: true },
    { pubkey: feeRecipientTokenAccount, isSigner: false, isWritable: true },
    { pubkey: creator, isSigner: false, isWritable: true },
    { pubkey: claimer, isSigner: true, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys: accounts,
    programId: MULTISIG_ESCROW_PROGRAM_ID,
    data: Buffer.from(data),
  });
}

/**
 * Creates a refund multisig escrow instruction.
 */
export function createRefundMultisigEscrowIx(params: CreateRefundMultisigEscrowIxParams): TransactionInstruction {
  const { creator, creatorTokenAccount, escrowAddress, tokenMint } = params;

  // Compute discriminator
  const discriminator = getInstructionDiscriminator('refund_multisig_escrow');

  // No additional data needed for refund
  const data = discriminator;

  // Derive PDAs
  const [vault] = findMultisigVault(escrowAddress);

  // Build accounts — order MUST match Anchor RefundMultisigEscrow struct
  const accounts: AccountMeta[] = [
    { pubkey: escrowAddress, isSigner: false, isWritable: true },
    { pubkey: vault, isSigner: false, isWritable: true },
    { pubkey: tokenMint, isSigner: false, isWritable: false },
    { pubkey: creatorTokenAccount, isSigner: false, isWritable: true },
    { pubkey: creator, isSigner: true, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys: accounts,
    programId: MULTISIG_ESCROW_PROGRAM_ID,
    data: Buffer.from(data),
  });
}