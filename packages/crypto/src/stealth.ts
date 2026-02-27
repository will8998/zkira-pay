import { ed25519, edwardsToMontgomeryPub, edwardsToMontgomeryPriv, x25519 } from '@noble/curves/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { sha512 } from '@noble/hashes/sha512';
import { concatBytes, zeroize } from './utils.js';
import { isValidPublicKey } from './keys.js';

const L = 2n ** 252n + 27742317777372353535851937790883648493n;
const STEALTH_DOMAIN = new TextEncoder().encode('priv_stealth');

function deriveStealthScalar(sharedSecret: Uint8Array): bigint {
  const hash = sha256(concatBytes(STEALTH_DOMAIN, sharedSecret, new Uint8Array([0])));
  let scalar = 0n;
  for (let i = hash.length - 1; i >= 0; i--) {
    scalar = (scalar << 8n) | BigInt(hash[i]);
  }
  scalar = scalar % L;
  if (scalar === 0n) throw new Error('Derived stealth scalar is zero');
  return scalar;
}

function computeSharedSecret(privkey: Uint8Array, pubkey: Uint8Array): Uint8Array {
  const xPriv = edwardsToMontgomeryPriv(privkey);
  const xPub = edwardsToMontgomeryPub(pubkey);
  return x25519.getSharedSecret(xPriv, xPub);
}

function validatePrivateKey(key: Uint8Array, name: string): void {
  if (!(key instanceof Uint8Array)) throw new TypeError(`${name}: expected Uint8Array`);
  if (key.length !== 32) throw new Error(`${name}: expected 32 bytes, got ${key.length}`);
}

function validatePubkey(key: Uint8Array, name: string): void {
  if (!(key instanceof Uint8Array)) throw new TypeError(`${name}: expected Uint8Array`);
  if (key.length !== 32) throw new Error(`${name}: expected 32 bytes, got ${key.length}`);
  if (!isValidPublicKey(key)) throw new Error(`${name}: not a valid Ed25519 public key`);
}

export interface StealthAddressResult {
  stealthPubkey: Uint8Array;
  ephemeralPubkey: Uint8Array;
  sharedSecret: Uint8Array;
}

/**
 * SENDER: Derive a one-time stealth address for a recipient.
 * 1. Generate ephemeral Ed25519 keypair
 * 2. ECDH: shared = x25519(eph_priv, view_pubkey)
 * 3. stealth_scalar = SHA256("priv_stealth" || shared || 0x00) mod L
 * 4. stealth_pubkey = spend_pubkey + stealth_scalar * G
 */
export function deriveStealthAddress(
  recipientSpendPubkey: Uint8Array,
  recipientViewPubkey: Uint8Array,
): StealthAddressResult {
  validatePubkey(recipientSpendPubkey, 'recipientSpendPubkey');
  validatePubkey(recipientViewPubkey, 'recipientViewPubkey');

  const ephPrivkey = ed25519.utils.randomPrivateKey();
  const ephPubkey = ed25519.getPublicKey(ephPrivkey);
  const sharedSecret = computeSharedSecret(ephPrivkey, recipientViewPubkey);
  // Zeroize ephemeral private key — no longer needed after ECDH
  zeroize(ephPrivkey);
  const stealthScalar = deriveStealthScalar(sharedSecret);

  const spendPoint = ed25519.ExtendedPoint.fromHex(recipientSpendPubkey);
  const stealthOffset = ed25519.ExtendedPoint.BASE.multiply(stealthScalar);
  const stealthPoint = spendPoint.add(stealthOffset);

  if (stealthPoint.is0()) throw new Error('Stealth address is the identity point');

  return { stealthPubkey: stealthPoint.toRawBytes(), ephemeralPubkey: ephPubkey, sharedSecret };
}

export interface Announcement {
  ephemeralPubkey: Uint8Array;
  stealthAddress: Uint8Array;
}

export interface MatchedAnnouncement {
  index: number;
  ephemeralPubkey: Uint8Array;
  stealthAddress: Uint8Array;
  sharedSecret: Uint8Array;
}

/**
 * RECIPIENT: Scan announcements to find payments addressed to us.
 */
export function scanAnnouncements(
  announcements: Announcement[],
  viewPrivkey: Uint8Array,
  spendPubkey: Uint8Array,
): MatchedAnnouncement[] {
  validatePrivateKey(viewPrivkey, 'viewPrivkey');
  validatePubkey(spendPubkey, 'spendPubkey');

  const spendPoint = ed25519.ExtendedPoint.fromHex(spendPubkey);
  const matches: MatchedAnnouncement[] = [];

  for (let i = 0; i < announcements.length; i++) {
    const ann = announcements[i];
    if (!isValidPublicKey(ann.ephemeralPubkey)) continue;
    if (ann.stealthAddress.length !== 32) continue;

    try {
      const sharedSecret = computeSharedSecret(viewPrivkey, ann.ephemeralPubkey);
      const stealthScalar = deriveStealthScalar(sharedSecret);
      const stealthOffset = ed25519.ExtendedPoint.BASE.multiply(stealthScalar);
      const expectedPoint = spendPoint.add(stealthOffset);
      const expectedBytes = expectedPoint.toRawBytes();

      if (constantTimeEqual(expectedBytes, ann.stealthAddress)) {
        matches.push({ index: i, ephemeralPubkey: ann.ephemeralPubkey, stealthAddress: ann.stealthAddress, sharedSecret });
      } else {
        // Zeroize shared secret for non-matching announcements
        zeroize(sharedSecret);
      }
    } catch {
      continue;
    }
  }

  return matches;
}

/**
 * RECIPIENT: Derive the private key controlling a stealth address.
 * stealth_privkey_scalar = expand(spend_seed) + stealth_scalar mod L
 */
export function deriveStealthPrivateKey(
  spendPrivkey: Uint8Array,
  viewPrivkey: Uint8Array,
  ephemeralPubkey: Uint8Array,
): Uint8Array {
  validatePrivateKey(spendPrivkey, 'spendPrivkey');
  validatePrivateKey(viewPrivkey, 'viewPrivkey');
  validatePubkey(ephemeralPubkey, 'ephemeralPubkey');

  const sharedSecret = computeSharedSecret(viewPrivkey, ephemeralPubkey);
  const stealthScalar = deriveStealthScalar(sharedSecret);
  // Zeroize intermediate shared secret after scalar derivation
  zeroize(sharedSecret);
  const spendScalar = expandPrivateKeyScalar(spendPrivkey);
  const stealthPrivScalar = (spendScalar + stealthScalar) % L;

  if (stealthPrivScalar === 0n) throw new Error('Stealth private key scalar is zero');
  return scalarToBytes(stealthPrivScalar);
}

/**
 * Verify that a stealth address matches the expected derivation.
 */
export function verifyStealthAddress(
  stealthAddress: Uint8Array,
  recipientSpendPubkey: Uint8Array,
  sharedSecret: Uint8Array,
): boolean {
  if (!(stealthAddress instanceof Uint8Array) || stealthAddress.length !== 32) return false;
  if (!isValidPublicKey(recipientSpendPubkey)) return false;
  if (!(sharedSecret instanceof Uint8Array) || sharedSecret.length !== 32) return false;

  try {
    const stealthScalar = deriveStealthScalar(sharedSecret);
    const spendPoint = ed25519.ExtendedPoint.fromHex(recipientSpendPubkey);
    const stealthOffset = ed25519.ExtendedPoint.BASE.multiply(stealthScalar);
    const expectedPoint = spendPoint.add(stealthOffset);
    return constantTimeEqual(expectedPoint.toRawBytes(), stealthAddress);
  } catch {
    return false;
  }
}

function expandPrivateKeyScalar(seed: Uint8Array): bigint {
  const hash = sha512(seed);
  const a = hash.slice(0, 32);
  a[0] &= 248;
  a[31] &= 127;
  a[31] |= 64;
  let scalar = 0n;
  for (let i = 31; i >= 0; i--) {
    scalar = (scalar << 8n) | BigInt(a[i]);
  }
  return scalar % L;
}

function scalarToBytes(scalar: bigint): Uint8Array {
  const bytes = new Uint8Array(32);
  let s = scalar;
  for (let i = 0; i < 32; i++) {
    bytes[i] = Number(s & 0xffn);
    s >>= 8n;
  }
  return bytes;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}
