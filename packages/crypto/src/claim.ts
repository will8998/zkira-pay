import { sha256 } from '@noble/hashes/sha256';
import { randomBytes } from './utils.js';

const CLAIM_DOMAIN = new TextEncoder().encode('priv_claim');

/** Generate a random 32-byte claim secret for payment links. */
export function generateClaimSecret(): Uint8Array {
  return randomBytes(32);
}

/**
 * Hash a claim secret for on-chain storage.
 * hash = SHA-256("priv_claim" || secret)
 */
export function hashClaimSecret(secret: Uint8Array): Uint8Array {
  if (!(secret instanceof Uint8Array)) throw new TypeError('secret must be Uint8Array');
  if (secret.length !== 32) throw new Error(`secret must be 32 bytes, got ${secret.length}`);

  const combined = new Uint8Array(CLAIM_DOMAIN.length + secret.length);
  combined.set(CLAIM_DOMAIN);
  combined.set(secret, CLAIM_DOMAIN.length);
  return sha256(combined);
}

/**
 * Verify a claim secret against a previously stored hash.
 */
export function verifyClaimSecret(secret: Uint8Array, hash: Uint8Array): boolean {
  if (!(secret instanceof Uint8Array) || secret.length !== 32) return false;
  if (!(hash instanceof Uint8Array) || hash.length !== 32) return false;

  const computed = hashClaimSecret(secret);
  let diff = 0;
  for (let i = 0; i < 32; i++) {
    diff |= computed[i] ^ hash[i];
  }
  return diff === 0;
}
