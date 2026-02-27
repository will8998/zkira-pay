import { PublicKey, TransactionInstruction, AccountMeta, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { sha256 } from '@noble/hashes/sha256';
import { CONDITIONAL_ESCROW_PROGRAM_ID } from '@zkira/common';
import { findMilestoneEscrow, findMilestoneVault } from './pda.js';
import type {
  CreateCreateMilestoneEscrowIxParams,
  CreateReleaseMilestoneIxParams,
  CreateRefundUnreleasedIxParams,
} from './types.js';

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
 * Creates a create milestone escrow instruction for the conditional-escrow program.
 */
export function createCreateMilestoneEscrowIx(params: CreateCreateMilestoneEscrowIxParams): TransactionInstruction {
  const {
    creator,
    creatorTokenAccount,
    tokenMint,
    totalAmount,
    claimHash,
    recipientSpendPubkey,
    recipientViewPubkey,
    expiry,
    nonce,
    milestoneAmounts,
  } = params;

  // Compute discriminator
  const discriminator = getInstructionDiscriminator('create_milestone_escrow');

  // Serialize instruction data matching Anchor instruction order:
  // nonce: u64, claim_hash: [u8; 32], total_amount: u64, expiry: i64,
  // recipient_spend_pubkey: [u8; 32], recipient_view_pubkey: [u8; 32],
  // milestone_count: u8, milestone_amounts: Vec<u64>
  const nonceBytes = serializeU64(nonce);
  const claimHashBytes = new Uint8Array(claimHash);
  const totalAmountBytes = serializeU64(totalAmount);
  const expiryBytes = serializeI64(BigInt(expiry));
  const recipientSpendPubkeyBytes = new Uint8Array(recipientSpendPubkey);
  const recipientViewPubkeyBytes = new Uint8Array(recipientViewPubkey);
  const milestoneCountBytes = serializeU8(milestoneAmounts.length);
  
  // Serialize Vec<u64> with 4-byte length prefix
  const milestoneAmountsLenBytes = serializeU32(milestoneAmounts.length);
  const milestoneAmountsBytes = new Uint8Array(milestoneAmounts.length * 8);
  for (let i = 0; i < milestoneAmounts.length; i++) {
    const amountBytes = serializeU64(milestoneAmounts[i]);
    milestoneAmountsBytes.set(amountBytes, i * 8);
  }

  const data = concatBytes(
    discriminator,
    nonceBytes,
    claimHashBytes,
    totalAmountBytes,
    expiryBytes,
    recipientSpendPubkeyBytes,
    recipientViewPubkeyBytes,
    milestoneCountBytes,
    milestoneAmountsLenBytes,
    milestoneAmountsBytes
  );

  // Derive PDAs
  const [escrow] = findMilestoneEscrow(creator, nonce);
  const [vault] = findMilestoneVault(escrow);

  // Build accounts — order MUST match Anchor CreateMilestoneEscrow struct:
  // escrow, vault, token_mint, creator_ata, creator, token_program,
  // associated_token_program, system_program
  const accounts: AccountMeta[] = [
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
    programId: CONDITIONAL_ESCROW_PROGRAM_ID,
    data: Buffer.from(data),
  });
}

/**
 * Creates a release milestone instruction for the conditional-escrow program.
 */
export function createReleaseMilestoneIx(params: CreateReleaseMilestoneIxParams): TransactionInstruction {
  const { 
    creator, 
    creatorTokenAccount, 
    claimer, 
    claimerTokenAccount, 
    escrowAddress, 
    milestoneIndex, 
    claimSecret, 
    tokenMint 
  } = params;

  // Compute discriminator
  const discriminator = getInstructionDiscriminator('release_milestone');

  // Serialize instruction data — milestone_index: u8, claim_secret: Vec<u8>
  const milestoneIndexBytes = serializeU8(milestoneIndex);
  const claimSecretBytes = new Uint8Array(claimSecret);
  const claimSecretLenBytes = serializeU32(claimSecretBytes.length);

  const data = concatBytes(discriminator, milestoneIndexBytes, claimSecretLenBytes, claimSecretBytes);

  // Derive PDAs
  const [vault] = findMilestoneVault(escrowAddress);

  // Build accounts — order MUST match Anchor ReleaseMilestone struct:
  // escrow, vault, token_mint, claimer_ata, creator_ata, creator, claimer,
  // token_program, associated_token_program, system_program
  const accounts: AccountMeta[] = [
    { pubkey: escrowAddress, isSigner: false, isWritable: true },
    { pubkey: vault, isSigner: false, isWritable: true },
    { pubkey: tokenMint, isSigner: false, isWritable: false },
    { pubkey: claimerTokenAccount, isSigner: false, isWritable: true },
    { pubkey: creatorTokenAccount, isSigner: false, isWritable: true },
    { pubkey: creator, isSigner: true, isWritable: true },
    { pubkey: claimer, isSigner: true, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys: accounts,
    programId: CONDITIONAL_ESCROW_PROGRAM_ID,
    data: Buffer.from(data),
  });
}

/**
 * Creates a refund unreleased instruction for the conditional-escrow program.
 */
export function createRefundUnreleasedIx(params: CreateRefundUnreleasedIxParams): TransactionInstruction {
  const { creator, creatorTokenAccount, escrowAddress, tokenMint } = params;

  // Compute discriminator
  const discriminator = getInstructionDiscriminator('refund_unreleased');

  // No additional data needed for refund
  const data = discriminator;

  // Derive PDAs
  const [vault] = findMilestoneVault(escrowAddress);

  // Build accounts — order MUST match Anchor RefundUnreleased struct:
  // escrow, vault, token_mint, creator_ata, creator, token_program
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
    programId: CONDITIONAL_ESCROW_PROGRAM_ID,
    data: Buffer.from(data),
  });
}