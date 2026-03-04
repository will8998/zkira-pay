import { PublicKey } from '@solana/web3.js';
import { GHOST_REGISTRY_PROGRAM_ID, PAYMENT_ESCROW_PROGRAM_ID, CONDITIONAL_ESCROW_PROGRAM_ID, MULTISIG_ESCROW_PROGRAM_ID, SEEDS } from '@zkira/common';


/**
 * Derives the announcement PDA for a given stealth address.
 * Seeds: ["announce", stealthAddress]
 */
export function findAnnouncement(stealthAddress: Uint8Array): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.ANNOUNCEMENT, stealthAddress],
    GHOST_REGISTRY_PROGRAM_ID
  );
}

/**
 * Derives the payment escrow PDA for a given creator and nonce.
 * Seeds: ["escrow", creator.toBytes(), nonce.to_le_bytes()]
 */
export function findEscrow(creator: PublicKey, nonce: bigint): [PublicKey, number] {
  const nonceBytes = new Uint8Array(new BigUint64Array([nonce]).buffer);
  return PublicKey.findProgramAddressSync(
    [SEEDS.ESCROW, creator.toBytes(), nonceBytes],
    PAYMENT_ESCROW_PROGRAM_ID
  );
}

/**
 * Derives the escrow vault PDA for a given escrow account.
 * Seeds: ["vault", escrow.toBytes()]
 */
export function findEscrowVault(escrow: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.ESCROW_VAULT, escrow.toBytes()],
    PAYMENT_ESCROW_PROGRAM_ID
  );
}

/**
 * Derives the protocol config PDA.
 * Seeds: ["config"]
 */
export function findConfig(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.CONFIG],
    PAYMENT_ESCROW_PROGRAM_ID
  );
}

/**
 * Derives the milestone escrow PDA for a given creator and nonce.
 * Seeds: ["milestone_escrow", creator.toBytes(), nonce.to_le_bytes()]
 */
export function findMilestoneEscrow(creator: PublicKey, nonce: bigint): [PublicKey, number] {
  const nonceBytes = new Uint8Array(new BigUint64Array([nonce]).buffer);
  return PublicKey.findProgramAddressSync(
    [SEEDS.MILESTONE_ESCROW, creator.toBytes(), nonceBytes],
    CONDITIONAL_ESCROW_PROGRAM_ID
  );
}

/**
 * Derives the milestone vault PDA for a given escrow account.
 * Seeds: ["milestone_vault", escrow.toBytes()]
 */
export function findMilestoneVault(escrow: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.MILESTONE_VAULT, escrow.toBytes()],
    CONDITIONAL_ESCROW_PROGRAM_ID
  );
}


/**
 * Derives the multisig escrow PDA for a given creator and nonce.
 * Seeds: ["multisig_escrow", creator.toBytes(), nonce.to_le_bytes()]
 */
export function findMultisigEscrow(creator: PublicKey, nonce: bigint): [PublicKey, number] {
  const nonceBytes = new Uint8Array(new BigUint64Array([nonce]).buffer);
  return PublicKey.findProgramAddressSync(
    [SEEDS.MULTISIG_ESCROW, creator.toBytes(), nonceBytes],
    MULTISIG_ESCROW_PROGRAM_ID
  );
}

/**
 * Derives the multisig vault PDA for a given escrow account.
 * Seeds: ["multisig_vault", escrow.toBytes()]
 */
export function findMultisigVault(escrow: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.MULTISIG_VAULT, escrow.toBytes()],
    MULTISIG_ESCROW_PROGRAM_ID
  );
}