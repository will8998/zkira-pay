import {
  bytesToHex as _bytesToHex,
  hexToBytes as _hexToBytes,
  concatBytes as _concatBytes,
  randomBytes as _randomBytes,
} from '@noble/hashes/utils';

/** Convert bytes to hex string (lowercase, no prefix). */
export function bytesToHex(bytes: Uint8Array): string {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError('Expected Uint8Array');
  }
  return _bytesToHex(bytes);
}

/** Convert hex string to bytes. Throws on invalid hex. */
export function hexToBytes(hex: string): Uint8Array {
  if (typeof hex !== 'string') {
    throw new TypeError('Expected hex string');
  }
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex string: odd length');
  }
  if (!/^[0-9a-fA-F]*$/.test(hex)) {
    throw new Error('Invalid hex string: non-hex characters');
  }
  return _hexToBytes(hex);
}

/** Concatenate multiple Uint8Arrays into one. */
export function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  return _concatBytes(...arrays);
}

/** Generate cryptographically secure random bytes. */
export function randomBytes(length: number): Uint8Array {
  if (length < 0 || !Number.isInteger(length)) {
    throw new Error('Invalid length: must be a non-negative integer');
  }
  return _randomBytes(length);
}

// Base58 alphabet (Bitcoin/Solana)
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE58_MAP = new Map<string, number>();
for (let i = 0; i < BASE58_ALPHABET.length; i++) {
  BASE58_MAP.set(BASE58_ALPHABET[i], i);
}

/** Encode bytes to Base58 string (Bitcoin/Solana alphabet). */
export function bytesToBase58(bytes: Uint8Array): string {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError('Expected Uint8Array');
  }
  if (bytes.length === 0) return '';

  let zeros = 0;
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    zeros++;
  }

  const input = Array.from(bytes);
  const encoded: number[] = [];

  let start = zeros;
  while (start < input.length) {
    let carry = 0;
    let allZero = true;
    for (let i = start; i < input.length; i++) {
      carry = carry * 256 + input[i];
      input[i] = Math.floor(carry / 58);
      carry = carry % 58;
      if (input[i] !== 0) allZero = false;
    }
    encoded.push(carry);
    if (allZero) break;
    while (start < input.length && input[start] === 0) {
      start++;
    }
  }

  let result = '';
  for (let i = 0; i < zeros; i++) {
    result += '1';
  }
  for (let i = encoded.length - 1; i >= 0; i--) {
    result += BASE58_ALPHABET[encoded[i]];
  }

  return result;
}

/** Decode Base58 string to bytes. Throws on invalid characters. */
export function base58ToBytes(base58: string): Uint8Array {
  if (typeof base58 !== 'string') {
    throw new TypeError('Expected string');
  }
  if (base58.length === 0) return new Uint8Array(0);

  let zeros = 0;
  for (let i = 0; i < base58.length && base58[i] === '1'; i++) {
    zeros++;
  }

  const size = Math.ceil(base58.length * 733 / 1000) + 1;
  const decoded = new Uint8Array(size);

  for (let i = zeros; i < base58.length; i++) {
    const charValue = BASE58_MAP.get(base58[i]);
    if (charValue === undefined) {
      throw new Error(`Invalid Base58 character: '${base58[i]}'`);
    }

    let carry = charValue;
    for (let j = size - 1; j >= 0; j--) {
      carry += 58 * decoded[j];
      decoded[j] = carry % 256;
      carry = Math.floor(carry / 256);
    }
  }

  let start = 0;
  while (start < size && decoded[start] === 0) {
    start++;
  }

  const result = new Uint8Array(zeros + (size - start));
  result.set(decoded.subarray(start), zeros);

  return result;
}


/** Securely zero-fill a buffer to prevent key material from lingering in memory. */
export function zeroize(buf: Uint8Array): void {
  if (!(buf instanceof Uint8Array)) return;
  buf.fill(0);
}