import { PublicKey, TransactionInstruction, AccountMeta, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { sha256 } from '@noble/hashes/sha256';
import { GHOST_REGISTRY_PROGRAM_ID, PAYMENT_ESCROW_PROGRAM_ID } from '@zkira/common';
import { findMetaAddress, findAnnouncement, findEscrow, findEscrowVault, findConfig } from './pda.js';
import type {
  CreateRegisterMetaAddressIxParams,
  CreateSendToStealthIxParams,
  CreateCreatePaymentIxParams,
  CreateClaimPaymentIxParams,
  CreateRefundPaymentIxParams,
} from './types.js';

/**
 * Computes the 8-byte Anchor instruction discriminator.
 */
function getInstructionDiscriminator(instructionName: string): Uint8Array {
  const hash = sha256(`global:${instructionName}`);
  return hash.slice(0, 8);
}

/**
 * Serializes a string with 4-byte length prefix (little-endian).
 */
function serializeString(str: string): Uint8Array {
  const bytes = new TextEncoder().encode(str);
  const buffer = new ArrayBuffer(4 + bytes.length);
  const view = new DataView(buffer);
  view.setUint32(0, bytes.length, true); // little-endian
  new Uint8Array(buffer, 4).set(bytes);
  return new Uint8Array(buffer);
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
 * Serializes a u16 as 2 bytes little-endian.
 */
function serializeU16(value: number): Uint8Array {
  const buffer = new ArrayBuffer(2);
  const view = new DataView(buffer);
  view.setUint16(0, value, true); // little-endian
  return new Uint8Array(buffer);
}

/**
 * Serializes a boolean as 1 byte.
 */
function serializeBool(value: boolean): Uint8Array {
  return new Uint8Array([value ? 1 : 0]);
}

/**
 * Serializes an Option<T> with 1-byte discriminator.
 */
function serializeOption<T>(value: T | undefined, serializer: (val: T) => Uint8Array): Uint8Array {
  if (value === undefined) {
    return new Uint8Array([0]); // None
  }
  const serialized = serializer(value);
  const result = new Uint8Array(1 + serialized.length);
  result[0] = 1; // Some
  result.set(serialized, 1);
  return result;
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
 * Creates a register meta-address instruction for the ghost-registry program.
 */
export function createRegisterMetaAddressIx(params: CreateRegisterMetaAddressIxParams): TransactionInstruction {
  const { owner, spendPubkey, viewPubkey, label } = params;

  // Compute discriminator
  const discriminator = getInstructionDiscriminator('register_meta_address');

  // Serialize instruction data
  const spendPubkeyBytes = new Uint8Array(spendPubkey);
  const viewPubkeyBytes = new Uint8Array(viewPubkey);
  const labelBytes = serializeOption(label, serializeString);

  const data = concatBytes(discriminator, spendPubkeyBytes, viewPubkeyBytes, labelBytes);

  // Derive PDAs
  const [metaAddress] = findMetaAddress(owner);

  // Build accounts
  const accounts: AccountMeta[] = [
    { pubkey: owner, isSigner: true, isWritable: false },
    { pubkey: metaAddress, isSigner: false, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys: accounts,
    programId: GHOST_REGISTRY_PROGRAM_ID,
    data: Buffer.from(data),
  });
}

/**
 * Creates a send to stealth instruction for the ghost-registry program.
 */
export function createSendToStealthIx(params: CreateSendToStealthIxParams): TransactionInstruction {
  const { sender, senderTokenAccount, tokenMint, amount, stealthAddress, ephemeralPubkey, encryptedMetadata } = params;

  // Compute discriminator
  const discriminator = getInstructionDiscriminator('send_to_stealth');

  // Serialize instruction data
  const amountBytes = serializeU64(amount);
  const stealthAddressBytes = new Uint8Array(stealthAddress);
  const ephemeralPubkeyBytes = new Uint8Array(ephemeralPubkey);
  const encryptedMetadataLength = serializeU32(encryptedMetadata.length);
  const encryptedMetadataBytes = new Uint8Array(encryptedMetadata);

  const data = concatBytes(
    discriminator,
    amountBytes,
    stealthAddressBytes,
    ephemeralPubkeyBytes,
    encryptedMetadataLength,
    encryptedMetadataBytes
  );

  // Derive PDAs
  const [announcement] = findAnnouncement(stealthAddress);
  const stealthPubkey = new PublicKey(stealthAddress);

  // Build accounts
  const accounts: AccountMeta[] = [
    { pubkey: sender, isSigner: true, isWritable: false },
    { pubkey: senderTokenAccount, isSigner: false, isWritable: true },
    { pubkey: stealthPubkey, isSigner: false, isWritable: false },
    { pubkey: tokenMint, isSigner: false, isWritable: false },
    { pubkey: announcement, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys: accounts,
    programId: GHOST_REGISTRY_PROGRAM_ID,
    data: Buffer.from(data),
  });
}

/**
 * Creates a create payment instruction for the payment-escrow program.
 */
export function createCreatePaymentIx(params: CreateCreatePaymentIxParams): TransactionInstruction {
  const {
    creator,
    creatorTokenAccount,
    tokenMint,
    amount,
    claimHash,
    recipientSpendPubkey,
    recipientViewPubkey,
    expiry,
    nonce,
  } = params;

  // Compute discriminator
  const discriminator = getInstructionDiscriminator('create_payment');

  // Serialize instruction data matching Anchor instruction order:
  // nonce: u64, claim_hash: [u8; 32], amount: u64, expiry: i64,
  // recipient_spend_pubkey: [u8; 32], recipient_view_pubkey: [u8; 32]
  const nonceBytes = serializeU64(nonce);
  const claimHashBytes = new Uint8Array(claimHash);
  const amountBytes = serializeU64(amount);
  const expiryBytes = serializeI64(BigInt(expiry));
  const recipientSpendPubkeyBytes = new Uint8Array(recipientSpendPubkey);
  const recipientViewPubkeyBytes = new Uint8Array(recipientViewPubkey);

  const data = concatBytes(
    discriminator,
    nonceBytes,
    claimHashBytes,
    amountBytes,
    expiryBytes,
    recipientSpendPubkeyBytes,
    recipientViewPubkeyBytes
  );

  // Derive PDAs
  const [escrow] = findEscrow(creator, nonce);
  const [vault] = findEscrowVault(escrow);
  const [config] = findConfig();

  // Build accounts — order MUST match Anchor CreatePayment struct:
  // config, escrow, vault, token_mint, creator_ata, creator, token_program,
  // associated_token_program, system_program
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
    programId: PAYMENT_ESCROW_PROGRAM_ID,
    data: Buffer.from(data),
  });
}

/**
 * Creates a claim payment instruction for the payment-escrow program.
 */
export function createClaimPaymentIx(params: CreateClaimPaymentIxParams): TransactionInstruction {
  const { claimer, claimerTokenAccount, escrowAddress, claimSecret, feeRecipientTokenAccount, tokenMint, creator } = params;

  // Compute discriminator
  const discriminator = getInstructionDiscriminator('claim_payment');

  // Serialize instruction data — claim_secret is Vec<u8> in Anchor (4-byte length prefix)
  const claimSecretBytes = new Uint8Array(claimSecret);
  const claimSecretLenBytes = serializeU32(claimSecretBytes.length);

  const data = concatBytes(discriminator, claimSecretLenBytes, claimSecretBytes);

  // Derive PDAs
  const [vault] = findEscrowVault(escrowAddress);
  const [config] = findConfig();

  // Build accounts — order MUST match Anchor ClaimPayment struct:
  // config, escrow, vault, token_mint, claimer_ata, fee_recipient_ata,
  // creator, claimer, token_program, associated_token_program, system_program
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
    programId: PAYMENT_ESCROW_PROGRAM_ID,
    data: Buffer.from(data),
  });
}

/**
 * Creates a refund payment instruction for the payment-escrow program.
 */
export function createRefundPaymentIx(params: CreateRefundPaymentIxParams): TransactionInstruction {
  const { creator, creatorTokenAccount, escrowAddress, tokenMint } = params;

  // Compute discriminator
  const discriminator = getInstructionDiscriminator('refund_payment');

  // No additional data needed for refund
  const data = discriminator;

  // Derive PDAs
  const [vault] = findEscrowVault(escrowAddress);

  // Build accounts — order MUST match Anchor RefundPayment struct:
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
    programId: PAYMENT_ESCROW_PROGRAM_ID,
    data: Buffer.from(data),
  });
}