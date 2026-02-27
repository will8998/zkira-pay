import { describe, it, expect } from 'vitest';
import { ed25519 } from '@noble/curves/ed25519';
import { generateMetaAddress } from '../keys.js';
import { deriveStealthAddress, scanAnnouncements, deriveStealthPrivateKey, verifyStealthAddress } from '../stealth.js';

describe('stealth', () => {
  it('deriveStealthAddress produces valid stealth pubkey', () => {
    const meta = generateMetaAddress();
    const result = deriveStealthAddress(meta.spendPubkey, meta.viewPubkey);
    expect(result.stealthPubkey.length).toBe(32);
    expect(result.ephemeralPubkey.length).toBe(32);
    expect(result.sharedSecret.length).toBe(32);
    expect(result.stealthPubkey).not.toEqual(meta.spendPubkey);
  });

  it('each call produces different stealth address', () => {
    const meta = generateMetaAddress();
    const a = deriveStealthAddress(meta.spendPubkey, meta.viewPubkey);
    const b = deriveStealthAddress(meta.spendPubkey, meta.viewPubkey);
    expect(a.stealthPubkey).not.toEqual(b.stealthPubkey);
  });

  it('scanAnnouncements finds matching stealth address', () => {
    const meta = generateMetaAddress();
    const result = deriveStealthAddress(meta.spendPubkey, meta.viewPubkey);
    const matches = scanAnnouncements(
      [{ ephemeralPubkey: result.ephemeralPubkey, stealthAddress: result.stealthPubkey }],
      meta.viewPrivkey, meta.spendPubkey,
    );
    expect(matches.length).toBe(1);
    expect(matches[0].index).toBe(0);
  });

  it('scanAnnouncements ignores non-matching', () => {
    const alice = generateMetaAddress();
    const bob = generateMetaAddress();
    const result = deriveStealthAddress(alice.spendPubkey, alice.viewPubkey);
    const matches = scanAnnouncements(
      [{ ephemeralPubkey: result.ephemeralPubkey, stealthAddress: result.stealthPubkey }],
      bob.viewPrivkey, bob.spendPubkey,
    );
    expect(matches.length).toBe(0);
  });

  it('finds multiple matches among noise', () => {
    const meta = generateMetaAddress();
    const other = generateMetaAddress();
    const r1 = deriveStealthAddress(meta.spendPubkey, meta.viewPubkey);
    const r2 = deriveStealthAddress(meta.spendPubkey, meta.viewPubkey);
    const noise = deriveStealthAddress(other.spendPubkey, other.viewPubkey);
    const matches = scanAnnouncements(
      [
        { ephemeralPubkey: r1.ephemeralPubkey, stealthAddress: r1.stealthPubkey },
        { ephemeralPubkey: noise.ephemeralPubkey, stealthAddress: noise.stealthPubkey },
        { ephemeralPubkey: r2.ephemeralPubkey, stealthAddress: r2.stealthPubkey },
      ],
      meta.viewPrivkey, meta.spendPubkey,
    );
    expect(matches.length).toBe(2);
    expect(matches[0].index).toBe(0);
    expect(matches[1].index).toBe(2);
  });

  it('deriveStealthPrivateKey matches stealth pubkey', () => {
    const meta = generateMetaAddress();
    const result = deriveStealthAddress(meta.spendPubkey, meta.viewPubkey);
    const stealthPrivkey = deriveStealthPrivateKey(meta.spendPrivkey, meta.viewPrivkey, result.ephemeralPubkey);
    expect(stealthPrivkey.length).toBe(32);
    const scalar = bytesToScalar(stealthPrivkey);
    const derivedPub = ed25519.ExtendedPoint.BASE.multiply(scalar).toRawBytes();
    expect(derivedPub).toEqual(result.stealthPubkey);
  });

  it('verifyStealthAddress returns true for valid', () => {
    const meta = generateMetaAddress();
    const result = deriveStealthAddress(meta.spendPubkey, meta.viewPubkey);
    expect(verifyStealthAddress(result.stealthPubkey, meta.spendPubkey, result.sharedSecret)).toBe(true);
  });

  it('verifyStealthAddress returns false for wrong spend pubkey', () => {
    const meta = generateMetaAddress();
    const other = generateMetaAddress();
    const result = deriveStealthAddress(meta.spendPubkey, meta.viewPubkey);
    expect(verifyStealthAddress(result.stealthPubkey, other.spendPubkey, result.sharedSecret)).toBe(false);
  });
});

function bytesToScalar(bytes: Uint8Array): bigint {
  let scalar = 0n;
  for (let i = bytes.length - 1; i >= 0; i--) {
    scalar = (scalar << 8n) | BigInt(bytes[i]);
  }
  return scalar;
}
