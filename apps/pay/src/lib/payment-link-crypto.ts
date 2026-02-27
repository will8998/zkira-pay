// ─── Types ──────────────────────────────────────────────

export interface EncryptedPaymentLink {
  id: string;
  walletAddress: string;
  escrowAddress: string;
  encryptedData: string;
  iv: string;
  version: number;
  createdAt: string;
}

export interface StoredPaymentLink {
  escrowAddress: string;
  paymentUrl: string;
  createdAt: string;
}

// ─── Key Caching ────────────────────────────────────────

const keyCache = new Map<string, CryptoKey>();

// ─── Base64 Helpers ─────────────────────────────────────

function encodeBase64(buffer: ArrayBuffer | Uint8Array): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function decodeBase64(str: string): Uint8Array {
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

// ─── Core Crypto Functions ──────────────────────────────

/**
 * Derives an AES-256-GCM encryption key from wallet signature using HKDF-SHA256
 */
export async function deriveEncryptionKey(
  signMessage: (message: Uint8Array) => Promise<Uint8Array>,
  walletAddress: string
): Promise<CryptoKey> {
  try {
    // Create message to sign
    const message = new TextEncoder().encode(`zkira:enc:v1:${walletAddress}`);
    
    // Get signature from wallet
    const signature = await signMessage(message);
    
    // Import signature as key material for HKDF
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(signature),
      'HKDF',
      false,
      ['deriveKey']
    );
    
    // Derive AES-256-GCM key using HKDF
    const salt = new TextEncoder().encode('zkira-payment-links-v1');
    const info = new TextEncoder().encode('aes-256-gcm-key');
    
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt,
        info,
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    
    return derivedKey;
  } catch (error) {
    console.warn('Failed to derive encryption key:', error);
    throw new Error('Failed to derive encryption key');
  }
}

/**
 * Gets cached key or derives new one
 */
async function getOrDeriveKey(
  signMessage: (message: Uint8Array) => Promise<Uint8Array>,
  walletAddress: string
): Promise<CryptoKey> {
  const cached = keyCache.get(walletAddress);
  if (cached) {
    return cached;
  }
  
  const key = await deriveEncryptionKey(signMessage, walletAddress);
  keyCache.set(walletAddress, key);
  return key;
}

/**
 * Encrypts a payment URL using AES-256-GCM
 */
export async function encryptPaymentLink(
  paymentUrl: string,
  key: CryptoKey
): Promise<{ encryptedData: string; iv: string }> {
  try {
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt the payment URL
    const encoder = new TextEncoder();
    const data = encoder.encode(paymentUrl);
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    return {
      encryptedData: encodeBase64(encrypted),
      iv: encodeBase64(iv),
    };
  } catch (error) {
    console.warn('Failed to encrypt payment link:', error);
    throw new Error('Failed to encrypt payment link');
  }
}

/**
 * Decrypts a payment URL using AES-256-GCM
 */
export async function decryptPaymentLink(
  encryptedData: string,
  iv: string,
  key: CryptoKey
): Promise<string> {
  try {
    // Decode base64 data
    const encryptedBytes = decodeBase64(encryptedData);
    const ivBytes = decodeBase64(iv);
    
    // Decrypt the data
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBytes },
      key,
      encryptedBytes
    );
    
    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.warn('Failed to decrypt payment link:', error);
    throw new Error('Failed to decrypt payment link');
  }
}

// ─── High-Level API Functions ───────────────────────────

/**
 * Encrypts and stores a payment link on the server
 */
export async function encryptAndStore({
  walletAddress,
  escrowAddress,
  paymentUrl,
  signMessage,
}: {
  walletAddress: string;
  escrowAddress: string;
  paymentUrl: string;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
}): Promise<void> {
  try {
    // Get or derive encryption key
    const key = await getOrDeriveKey(signMessage, walletAddress);
    
    // Encrypt the payment URL
    const { encryptedData, iv } = await encryptPaymentLink(paymentUrl, key);
    
    // Store on server
    const response = await fetch('/api/payment-links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        escrowAddress,
        encryptedData,
        iv,
        version: 1,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
  } catch (error) {
    console.warn('Failed to encrypt and store payment link:', error);
    throw error;
  }
}

/**
 * Fetches and decrypts all payment links for a wallet
 */
export async function fetchAndDecrypt({
  walletAddress,
  signMessage,
}: {
  walletAddress: string;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
}): Promise<Map<string, string>> {
  try {
    // Fetch encrypted links from server
    const response = await fetch(`/api/payment-links/${walletAddress}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return new Map(); // No links found
      }
      throw new Error(`API error: ${response.status}`);
    }
    
    const data: { paymentLinks: EncryptedPaymentLink[] } = await response.json();
    
    // Get or derive encryption key
    const key = await getOrDeriveKey(signMessage, walletAddress);
    
    // Decrypt all links
    const decryptedLinks = new Map<string, string>();
    
    for (const link of data.paymentLinks) {
      try {
        const decryptedUrl = await decryptPaymentLink(
          link.encryptedData,
          link.iv,
          key
        );
        decryptedLinks.set(link.escrowAddress, decryptedUrl);
      } catch (error) {
        console.warn(`Failed to decrypt link for escrow ${link.escrowAddress}:`, error);
        // Skip this link but continue with others
      }
    }
    
    return decryptedLinks;
  } catch (error) {
    console.warn('Failed to fetch and decrypt payment links:', error);
    throw error;
  }
}

/**
 * Migrates payment links from localStorage to encrypted server storage
 */
export async function migrateLocalStorageToServer({
  walletAddress,
  signMessage,
}: {
  walletAddress: string;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
}): Promise<void> {
  try {
    // Check if localStorage is available
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    
    // Read existing links from localStorage
    const storedData = localStorage.getItem('zkira_payment_links');
    if (!storedData) {
      return; // No links to migrate
    }
    
    let storedLinks: StoredPaymentLink[];
    try {
      storedLinks = JSON.parse(storedData);
    } catch (error) {
      console.warn('Failed to parse localStorage payment links:', error);
      return;
    }
    
    if (!Array.isArray(storedLinks) || storedLinks.length === 0) {
      return; // No valid links to migrate
    }
    
    // Get or derive encryption key
    const key = await getOrDeriveKey(signMessage, walletAddress);
    
    // Encrypt all links
    const encryptedLinks = [];
    for (const link of storedLinks) {
      try {
        const { encryptedData, iv } = await encryptPaymentLink(link.paymentUrl, key);
        encryptedLinks.push({
          escrowAddress: link.escrowAddress,
          encryptedData,
          iv,
          version: 1,
        });
      } catch (error) {
        console.warn(`Failed to encrypt link for escrow ${link.escrowAddress}:`, error);
        // Skip this link but continue with others
      }
    }
    
    if (encryptedLinks.length === 0) {
      return; // No links successfully encrypted
    }
    
    // Send batch to server
    const response = await fetch('/api/payment-links/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        links: encryptedLinks,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    // Migration successful - could optionally clear localStorage here
    // but leaving it for backwards compatibility
  } catch (error) {
    console.warn('Failed to migrate localStorage to server:', error);
    throw error;
  }
}