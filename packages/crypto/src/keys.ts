import { ed25519 } from '@noble/curves/ed25519';
import { bytesToHex, hexToBytes } from './utils.js';

/** Stealth meta-address: spend and view keypairs. */
export interface MetaAddress {
  spendPrivkey: Uint8Array;
  spendPubkey: Uint8Array;
  viewPrivkey: Uint8Array;
  viewPubkey: Uint8Array;
}

/**
 * Generate a new stealth meta-address (spend + view keypairs).
 */
export function generateMetaAddress(): MetaAddress {
  const spendPrivkey = ed25519.utils.randomPrivateKey();
  const spendPubkey = ed25519.getPublicKey(spendPrivkey);
  const viewPrivkey = ed25519.utils.randomPrivateKey();
  const viewPubkey = ed25519.getPublicKey(viewPrivkey);
  return { spendPrivkey, spendPubkey, viewPrivkey, viewPubkey };
}

const META_ADDRESS_PREFIX = 'zkira:ma:';

/**
 * Encode a meta-address as a single string for sharing.
 * Format: "zkira:ma:<spendPubkeyHex><viewPubkeyHex>"
 */
export function encodeMetaAddress(spendPubkey: Uint8Array, viewPubkey: Uint8Array): string {
  validatePublicKey(spendPubkey, 'spendPubkey');
  validatePublicKey(viewPubkey, 'viewPubkey');
  return META_ADDRESS_PREFIX + bytesToHex(spendPubkey) + bytesToHex(viewPubkey);
}

/**
 * Decode a meta-address string back to its component public keys.
 */
export function decodeMetaAddress(encoded: string): { spendPubkey: Uint8Array; viewPubkey: Uint8Array } {
  if (typeof encoded !== 'string') throw new TypeError('Expected string');
  if (!encoded.startsWith(META_ADDRESS_PREFIX)) {
    throw new Error(`Invalid meta-address: must start with "${META_ADDRESS_PREFIX}"`);
  }
  const hex = encoded.slice(META_ADDRESS_PREFIX.length);
  if (hex.length !== 128) {
    throw new Error('Invalid meta-address: expected 128 hex characters after prefix');
  }
  const spendPubkey = hexToBytes(hex.slice(0, 64));
  const viewPubkey = hexToBytes(hex.slice(64));
  validatePublicKey(spendPubkey, 'spendPubkey');
  validatePublicKey(viewPubkey, 'viewPubkey');
  return { spendPubkey, viewPubkey };
}

/**
 * Validate that bytes represent a valid Ed25519 public key (on the curve).
 */
export function isValidPublicKey(pubkey: Uint8Array): boolean {
  if (!(pubkey instanceof Uint8Array) || pubkey.length !== 32) return false;
  try {
    const point = ed25519.ExtendedPoint.fromHex(pubkey);
    if (point.is0()) return false;
    point.assertValidity();
    if (!point.isTorsionFree()) return false;
    return true;
  } catch {
    return false;
  }
}

function validatePublicKey(pubkey: Uint8Array, name: string): void {
  if (!(pubkey instanceof Uint8Array)) throw new TypeError(`${name}: expected Uint8Array`);
  if (pubkey.length !== 32) throw new Error(`${name}: expected 32 bytes, got ${pubkey.length}`);
  if (!isValidPublicKey(pubkey)) throw new Error(`${name}: not a valid Ed25519 public key`);
}
