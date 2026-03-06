import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

// Strong scrypt parameters per OWASP 2026 guidance
const SCRYPT_N = 131072;  // 2^17 — cost parameter
const SCRYPT_R = 8;       // block size
const SCRYPT_P = 1;       // parallelism
const SCRYPT_MAXMEM = 256 * SCRYPT_N * SCRYPT_R; // Required memory allocation

// Legacy scrypt defaults (Node.js default: N=16384, r=8, p=1)
// Kept for decrypting records created before the parameter upgrade
const LEGACY_SCRYPT_N = 16384;

const ALGORITHM = 'aes-256-gcm';
// Legacy salt — retained ONLY for decrypting pre-existing records where salt column is NULL
const LEGACY_SALT = 'zkira-ephemeral-wallets';

function deriveKey(salt: string, costN: number = SCRYPT_N): Buffer {
  const secret = process.env.EPHEMERAL_WALLET_SECRET;
  if (!secret) throw new Error('EPHEMERAL_WALLET_SECRET environment variable must be set');
  const maxmem = 256 * costN * SCRYPT_R;
  return scryptSync(secret, salt, 32, { N: costN, r: SCRYPT_R, p: SCRYPT_P, maxmem });
}

export function encryptPrivateKey(privateKey: string): { encrypted: string; iv: string; authTag: string; salt: string } {
  const salt = randomBytes(16).toString('hex');
  const key = deriveKey(salt, SCRYPT_N);
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag,
    salt,
  };
}

/**
 * Decrypt with per-record salt. Falls back to legacy hardcoded salt when
 * `salt` is null/undefined (backward compatibility for existing rows).
 * 
 * Automatically tries strong scrypt params first, falls back to legacy params
 * if decryption fails (for records encrypted before the parameter upgrade).
 */
export function decryptPrivateKey(encrypted: string, iv: string, authTag: string, salt?: string | null): string {
  const effectiveSalt = salt || LEGACY_SALT;
  
  // Try strong params first (new records)
  try {
    const key = deriveKey(effectiveSalt, SCRYPT_N);
    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    // Fall back to legacy params (pre-upgrade records)
  }

  // Legacy params fallback
  const key = deriveKey(effectiveSalt, LEGACY_SCRYPT_N);
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
