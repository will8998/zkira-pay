import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const LEGACY_SALT = 'zkira-ephemeral-wallets';

function deriveKey(salt: string): Buffer {
  const secret = process.env.EPHEMERAL_WALLET_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error('EPHEMERAL_WALLET_SECRET or ADMIN_PASSWORD must be set');
  // Derive a 32-byte key from the secret using scrypt
  return scryptSync(secret, salt, 32);
}

export function encryptPrivateKey(privateKey: string): { encrypted: string; iv: string; authTag: string; salt: string } {
  const salt = randomBytes(16).toString('hex');
  const key = deriveKey(salt);
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
 */
export function decryptPrivateKey(encrypted: string, iv: string, authTag: string, salt?: string | null): string {
  const key = deriveKey(salt || LEGACY_SALT);
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
