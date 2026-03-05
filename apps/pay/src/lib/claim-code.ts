/**
 * Claim code generation and derivation for OMNIPAY dead drops.
 *
 * Claim codes look like: OMNIPAY-A7X9-B3M2
 *   - Human-friendly, easy to copy/paste
 *   - The code itself is NOT secret — the encryption key is separate
 *   - A deterministic dead-drop ID is derived from the code via SHA-256
 */

/** Alphabet for claim code segments (unambiguous uppercase). */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I

/** Generate a random segment of `len` characters. */
function randomSegment(len: number): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let segment = '';
  for (let i = 0; i < len; i++) {
    segment += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return segment;
}

/**
 * Generate a new claim code and its companion AES-256 encryption key.
 *
 * @returns `{ code, encryptionKey }` where encryptionKey is hex-encoded.
 */
export function generateClaimCode(): { code: string; encryptionKey: string } {
  const code = `OMNIPAY-${randomSegment(4)}-${randomSegment(4)}`;

  // 256-bit encryption key (independent of code)
  const keyBytes = new Uint8Array(32);
  crypto.getRandomValues(keyBytes);
  const encryptionKey = Array.from(keyBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return { code, encryptionKey };
}

/**
 * Derive a deterministic dead-drop ID from a claim code.
 * Uses SHA-256 so the server never sees the raw code in any useful form.
 */
export async function deriveDeadDropId(code: string): Promise<string> {
  const encoded = new TextEncoder().encode(code.toUpperCase().trim());
  const hash = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
