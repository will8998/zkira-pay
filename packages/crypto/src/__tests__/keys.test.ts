import { describe, it, expect } from 'vitest';
import { generateMetaAddress, encodeMetaAddress, decodeMetaAddress, isValidPublicKey } from '../keys.js';

describe('keys', () => {
  it('generateMetaAddress returns valid keypairs', () => {
    const meta = generateMetaAddress();
    expect(meta.spendPrivkey).toBeInstanceOf(Uint8Array);
    expect(meta.spendPrivkey.length).toBe(32);
    expect(meta.spendPubkey.length).toBe(32);
    expect(meta.viewPrivkey.length).toBe(32);
    expect(meta.viewPubkey.length).toBe(32);
    expect(isValidPublicKey(meta.spendPubkey)).toBe(true);
    expect(isValidPublicKey(meta.viewPubkey)).toBe(true);
  });

  it('generates unique keypairs each time', () => {
    const a = generateMetaAddress();
    const b = generateMetaAddress();
    expect(a.spendPubkey).not.toEqual(b.spendPubkey);
  });

  it('encodeMetaAddress produces correct format', () => {
    const meta = generateMetaAddress();
    const encoded = encodeMetaAddress(meta.spendPubkey, meta.viewPubkey);
    expect(encoded).toMatch(/^zkira:ma:[0-9a-f]{128}$/);
  });

  it('decodeMetaAddress roundtrips correctly', () => {
    const meta = generateMetaAddress();
    const encoded = encodeMetaAddress(meta.spendPubkey, meta.viewPubkey);
    const decoded = decodeMetaAddress(encoded);
    expect(decoded.spendPubkey).toEqual(meta.spendPubkey);
    expect(decoded.viewPubkey).toEqual(meta.viewPubkey);
  });

  it('decodeMetaAddress rejects invalid prefix', () => {
    expect(() => decodeMetaAddress('invalid:prefix')).toThrow('must start with');
  });

  it('decodeMetaAddress rejects wrong length', () => {
    expect(() => decodeMetaAddress('zkira:ma:abcd')).toThrow('128 hex characters');
  });

  it('isValidPublicKey rejects zero bytes', () => {
    expect(isValidPublicKey(new Uint8Array(32))).toBe(false);
  });

  it('isValidPublicKey rejects wrong length', () => {
    expect(isValidPublicKey(new Uint8Array(16))).toBe(false);
  });
});
