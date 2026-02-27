// Pure TypeScript crypto library for PRIV protocol
export const PRIV_CRYPTO_VERSION = '0.1.0';

// Key generation and meta-address management
export {
  generateMetaAddress,
  encodeMetaAddress,
  decodeMetaAddress,
  isValidPublicKey,
} from './keys.js';
export type { MetaAddress } from './keys.js';

// Stealth address derivation and discovery
export {
  deriveStealthAddress,
  scanAnnouncements,
  deriveStealthPrivateKey,
  verifyStealthAddress,
} from './stealth.js';
export type {
  StealthAddressResult,
  Announcement,
  MatchedAnnouncement,
} from './stealth.js';

// Metadata encryption (AES-256-GCM)
export {
  encryptMetadata,
  decryptMetadata,
} from './encryption.js';

// Payment link claim secrets
export {
  generateClaimSecret,
  hashClaimSecret,
  verifyClaimSecret,
} from './claim.js';

// Byte utilities
export {
  bytesToHex,
  hexToBytes,
  bytesToBase58,
  base58ToBytes,
  concatBytes,
  randomBytes,
} from './utils.js';
