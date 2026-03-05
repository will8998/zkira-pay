/**
 * Dead drop encryption utilities for OMNIPAY.
 *
 * Two encryption schemes:
 *
 * 1. **Symmetric (AES-GCM)** — for Send flow claim codes.
 *    Sender encrypts the DepositBundle with a random 256-bit key,
 *    shares the key alongside the claim code.
 *
 * 2. **Asymmetric (X25519 + NaCl box)** — for Invoice/Request flow.
 *    Requester generates X25519 keypair. Payer encrypts each note
 *    to the requester's public key using NaCl box (curve25519-xsalsa20-poly1305).
 */

import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util';

// ──────────────────────────────────────────
// X25519 Keypair (Invoice / Request flow)
// ──────────────────────────────────────────

export interface X25519Keypair {
  /** Base64-encoded public key (32 bytes). */
  publicKey: string;
  /** Base64-encoded secret key (32 bytes). */
  secretKey: string;
}

/** Generate a new X25519 keypair for receiving encrypted invoice notes. */
export function generateX25519Keypair(): X25519Keypair {
  const kp = nacl.box.keyPair();
  return {
    publicKey: encodeBase64(kp.publicKey),
    secretKey: encodeBase64(kp.secretKey),
  };
}

/**
 * Encrypt a message to a recipient's X25519 public key.
 * Uses an ephemeral keypair so each encryption has a unique sender.
 *
 * @returns `{ ciphertext, nonce, ephemeralPubkey }` all base64-encoded.
 */
export function boxEncrypt(
  plaintext: string,
  recipientPubkeyB64: string,
): { ciphertext: string; nonce: string; ephemeralPubkey: string } {
  const ephemeral = nacl.box.keyPair();
  const recipientPubkey = decodeBase64(recipientPubkeyB64);
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const messageBytes = decodeUTF8(plaintext);

  const encrypted = nacl.box(messageBytes, nonce, recipientPubkey, ephemeral.secretKey);
  if (!encrypted) {
    throw new Error('NaCl box encryption failed');
  }

  return {
    ciphertext: encodeBase64(encrypted),
    nonce: encodeBase64(nonce),
    ephemeralPubkey: encodeBase64(ephemeral.publicKey),
  };
}

/**
 * Decrypt a NaCl box message using the recipient's secret key.
 */
export function boxDecrypt(
  ciphertextB64: string,
  nonceB64: string,
  senderPubkeyB64: string,
  recipientSecretKeyB64: string,
): string {
  const ciphertext = decodeBase64(ciphertextB64);
  const nonce = decodeBase64(nonceB64);
  const senderPubkey = decodeBase64(senderPubkeyB64);
  const secretKey = decodeBase64(recipientSecretKeyB64);

  const decrypted = nacl.box.open(ciphertext, nonce, senderPubkey, secretKey);
  if (!decrypted) {
    throw new Error('NaCl box decryption failed — wrong key or corrupted data');
  }

  return encodeUTF8(decrypted);
}

// ──────────────────────────────────────────
// Symmetric AES-GCM (Send flow claim codes)
// ──────────────────────────────────────────

/** Convert hex string to Uint8Array. */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

/** Import a raw hex key for AES-GCM. */
async function importAesKey(hexKey: string): Promise<CryptoKey> {
  const raw = hexToBytes(hexKey);
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

/**
 * Encrypt a plaintext string with AES-256-GCM.
 *
 * @param plaintext — UTF-8 string to encrypt
 * @param hexKey — 64-char hex-encoded 256-bit key
 * @returns `{ ciphertext, nonce }` both base64-encoded.
 */
export async function aesEncrypt(
  plaintext: string,
  hexKey: string,
): Promise<{ ciphertext: string; nonce: string }> {
  const key = await importAesKey(hexKey);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit nonce
  const data = new TextEncoder().encode(plaintext);

  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);

  return {
    ciphertext: encodeBase64(new Uint8Array(encrypted)),
    nonce: encodeBase64(iv),
  };
}

/**
 * Decrypt an AES-256-GCM ciphertext.
 *
 * @param ciphertextB64 — base64-encoded ciphertext
 * @param nonceB64 — base64-encoded 96-bit nonce
 * @param hexKey — 64-char hex-encoded 256-bit key
 * @returns Decrypted UTF-8 string.
 */
export async function aesDecrypt(
  ciphertextB64: string,
  nonceB64: string,
  hexKey: string,
): Promise<string> {
  const key = await importAesKey(hexKey);
  const iv = decodeBase64(nonceB64);
  const data = decodeBase64(ciphertextB64);

  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return new TextDecoder().decode(decrypted);
}
