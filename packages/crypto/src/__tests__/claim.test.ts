import { describe, it, expect } from 'vitest';
import { generateClaimSecret, hashClaimSecret, verifyClaimSecret } from '../claim.js';

describe('claim', () => {
  it('generateClaimSecret returns 32 random bytes', () => {
    const secret = generateClaimSecret();
    expect(secret).toBeInstanceOf(Uint8Array);
    expect(secret.length).toBe(32);
  });

  it('generates unique secrets', () => {
    expect(generateClaimSecret()).not.toEqual(generateClaimSecret());
  });

  it('hashClaimSecret returns 32-byte hash', () => {
    const hash = hashClaimSecret(generateClaimSecret());
    expect(hash.length).toBe(32);
  });

  it('hashClaimSecret is deterministic', () => {
    const s = generateClaimSecret();
    expect(hashClaimSecret(s)).toEqual(hashClaimSecret(s));
  });

  it('different secrets produce different hashes', () => {
    expect(hashClaimSecret(generateClaimSecret())).not.toEqual(hashClaimSecret(generateClaimSecret()));
  });

  it('verifyClaimSecret returns true for correct secret', () => {
    const s = generateClaimSecret();
    expect(verifyClaimSecret(s, hashClaimSecret(s))).toBe(true);
  });

  it('verifyClaimSecret returns false for wrong secret', () => {
    const s = generateClaimSecret();
    expect(verifyClaimSecret(generateClaimSecret(), hashClaimSecret(s))).toBe(false);
  });

  it('rejects non-32-byte input', () => {
    expect(() => hashClaimSecret(new Uint8Array(16))).toThrow('32 bytes');
  });
});
