import { describe, it, expect } from 'vitest';
import { encryptMetadata, decryptMetadata } from '../encryption.js';
import { randomBytes } from '../utils.js';

describe('encryption', () => {
  it('encrypt then decrypt roundtrips correctly', async () => {
    const plaintext = new TextEncoder().encode('Hello, PRIV protocol!');
    const sharedSecret = randomBytes(32);

    const encrypted = await encryptMetadata(plaintext, sharedSecret);
    const decrypted = await decryptMetadata(encrypted, sharedSecret);

    expect(decrypted).toEqual(plaintext);
  });

  it('encrypted data is larger than plaintext (nonce + tag)', async () => {
    const plaintext = new TextEncoder().encode('test data');
    const sharedSecret = randomBytes(32);

    const encrypted = await encryptMetadata(plaintext, sharedSecret);
    // 12 (nonce) + plaintext.length + 16 (tag)
    expect(encrypted.length).toBe(12 + plaintext.length + 16);
  });

  it('different encryptions produce different ciphertexts (unique nonce)', async () => {
    const plaintext = new TextEncoder().encode('same plaintext');
    const sharedSecret = randomBytes(32);

    const a = await encryptMetadata(plaintext, sharedSecret);
    const b = await encryptMetadata(plaintext, sharedSecret);

    expect(a).not.toEqual(b); // Different nonces
  });

  it('decryption fails with wrong secret', async () => {
    const plaintext = new TextEncoder().encode('secret message');
    const correctSecret = randomBytes(32);
    const wrongSecret = randomBytes(32);

    const encrypted = await encryptMetadata(plaintext, correctSecret);

    await expect(decryptMetadata(encrypted, wrongSecret)).rejects.toThrow();
  });

  it('handles empty plaintext', async () => {
    const plaintext = new Uint8Array(0);
    const sharedSecret = randomBytes(32);

    const encrypted = await encryptMetadata(plaintext, sharedSecret);
    const decrypted = await decryptMetadata(encrypted, sharedSecret);

    expect(decrypted).toEqual(plaintext);
  });

  it('handles large plaintext', async () => {
    const plaintext = randomBytes(10_000);
    const sharedSecret = randomBytes(32);

    const encrypted = await encryptMetadata(plaintext, sharedSecret);
    const decrypted = await decryptMetadata(encrypted, sharedSecret);

    expect(decrypted).toEqual(plaintext);
  });

  it('rejects non-Uint8Array plaintext', async () => {
    const sharedSecret = randomBytes(32);
    await expect(
      encryptMetadata('not bytes' as unknown as Uint8Array, sharedSecret),
    ).rejects.toThrow();
  });

  it('rejects empty shared secret', async () => {
    const plaintext = new Uint8Array([1, 2, 3]);
    await expect(
      encryptMetadata(plaintext, new Uint8Array(0)),
    ).rejects.toThrow();
  });

  it('rejects truncated encrypted data', async () => {
    const sharedSecret = randomBytes(32);
    const tooShort = new Uint8Array(20); // Less than nonce + tag
    await expect(decryptMetadata(tooShort, sharedSecret)).rejects.toThrow();
  });
});
