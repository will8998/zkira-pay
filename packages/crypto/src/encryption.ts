import { sha256 } from '@noble/hashes/sha256';
import { randomBytes } from './utils.js';

const NONCE_SIZE = 12;
const TAG_SIZE = 16;

function deriveEncryptionKey(sharedSecret: Uint8Array): Uint8Array {
  if (!(sharedSecret instanceof Uint8Array) || sharedSecret.length === 0) {
    throw new Error('Invalid shared secret');
  }
  const domain = new TextEncoder().encode('priv_encrypt');
  const combined = new Uint8Array(domain.length + sharedSecret.length);
  combined.set(domain);
  combined.set(sharedSecret, domain.length);
  return sha256(combined);
}

/**
 * Encrypt metadata with AES-256-GCM using Web Crypto API.
 * @returns nonce (12 bytes) || ciphertext || authTag (16 bytes)
 */
export async function encryptMetadata(plaintext: Uint8Array, sharedSecret: Uint8Array): Promise<Uint8Array> {
  if (!(plaintext instanceof Uint8Array)) throw new TypeError('plaintext must be Uint8Array');
  if (!(sharedSecret instanceof Uint8Array) || sharedSecret.length === 0) {
    throw new Error('sharedSecret must be a non-empty Uint8Array');
  }

  const keyBytes = deriveEncryptionKey(sharedSecret);
  const nonce = randomBytes(NONCE_SIZE);

  const cryptoKey = await globalThis.crypto.subtle.importKey(
    'raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt'],
  );

  const encrypted = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce, tagLength: TAG_SIZE * 8 },
    cryptoKey, plaintext,
  );

  const encryptedBytes = new Uint8Array(encrypted);
  const result = new Uint8Array(NONCE_SIZE + encryptedBytes.length);
  result.set(nonce, 0);
  result.set(encryptedBytes, NONCE_SIZE);
  return result;
}

/**
 * Decrypt metadata encrypted with encryptMetadata.
 * @param encrypted - nonce (12 bytes) || ciphertext || authTag (16 bytes)
 */
export async function decryptMetadata(encrypted: Uint8Array, sharedSecret: Uint8Array): Promise<Uint8Array> {
  if (!(encrypted instanceof Uint8Array)) throw new TypeError('encrypted must be Uint8Array');
  if (encrypted.length < NONCE_SIZE + TAG_SIZE) throw new Error('Encrypted data too short');
  if (!(sharedSecret instanceof Uint8Array) || sharedSecret.length === 0) {
    throw new Error('sharedSecret must be a non-empty Uint8Array');
  }

  const keyBytes = deriveEncryptionKey(sharedSecret);
  const nonce = encrypted.slice(0, NONCE_SIZE);
  const ciphertextWithTag = encrypted.slice(NONCE_SIZE);

  const cryptoKey = await globalThis.crypto.subtle.importKey(
    'raw', keyBytes, { name: 'AES-GCM' }, false, ['decrypt'],
  );

  const decrypted = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: nonce, tagLength: TAG_SIZE * 8 },
    cryptoKey, ciphertextWithTag,
  );

  return new Uint8Array(decrypted);
}
