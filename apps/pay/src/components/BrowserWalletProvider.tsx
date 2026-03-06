'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

// Module-scoped encryption key — lives only in memory, lost on page refresh
let encryptionKey: CryptoKey | null = null;

async function getOrCreateKey(): Promise<CryptoKey> {
  if (encryptionKey) return encryptionKey;
  encryptionKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false, // non-extractable
    ['encrypt', 'decrypt']
  );
  return encryptionKey;
}

async function encryptData(data: string): Promise<string> {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(data);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  // Store as base64: iv (12 bytes) + ciphertext
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptData(stored: string): Promise<string | null> {
  if (!encryptionKey) return null; // Key lost (page refresh) — can't decrypt
  try {
    const combined = Uint8Array.from(atob(stored), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      encryptionKey,
      ciphertext
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return null; // Decryption failed — key mismatch or corrupted data
  }
}
const STORAGE_KEY = 'omnipay_ephemeral_wallet';

interface WalletContextValue {
  /** Ethereum address (0x...) */
  address: string | null;
  /** Hex-encoded private key */
  privateKey: string | null;
  /** Whether the wallet has been created or imported */
  isCreated: boolean;
  /** Generate a fresh ephemeral Ethereum keypair */
  createWallet: () => Promise<{ address: string; privateKey: string }>;
  /** Import a wallet from an existing private key */
  importWallet: (privateKey: string) => Promise<void>;
  /** Clear the current wallet state */
  clearWallet: () => void;
}

const WalletContext = createContext<WalletContextValue>({
  address: null,
  privateKey: null,
  isCreated: false,
  createWallet: async () => ({ address: '', privateKey: '' }),
  importWallet: async () => {},
  clearWallet: () => {},
});

export function BrowserWalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);

  const [privateKey, setPrivateKey] = useState<string | null>(null);

  // Attempt to read and decrypt wallet data from sessionStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    decryptData(stored).then(json => {
      if (!json) return; // Decryption failed (key lost after refresh)
      try {
        const parsed = JSON.parse(json);
        if (parsed.address) setAddress(parsed.address);
        if (parsed.privateKey) setPrivateKey(parsed.privateKey);
      } catch (e) { console.warn('Failed to parse wallet data:', e); }
    }).catch(e => console.warn('Failed to decrypt wallet data:', e));
  }, []);

  const createWallet = useCallback(async (): Promise<{ address: string; privateKey: string }> => {
    // Dynamic import to avoid SSR issues
    const { Wallet } = await import('ethers');
    
    // Generate 32 random bytes for private key
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const hex = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Create wallet from random private key
    const wallet = new Wallet('0x' + hex);
    setAddress(wallet.address);
    setPrivateKey(wallet.privateKey);
    const payload = JSON.stringify({ address: wallet.address, privateKey: wallet.privateKey, createdAt: new Date().toISOString() });
    encryptData(payload).then(encrypted => {
      try { sessionStorage.setItem(STORAGE_KEY, encrypted); } catch (e) { console.warn('Failed to persist wallet to sessionStorage:', e); }
    }).catch(e => console.warn('Failed to encrypt wallet data:', e));
    return { address: wallet.address, privateKey: wallet.privateKey };
  }, []);

  const importWallet = useCallback(async (pk: string) => {
    const { Wallet } = await import('ethers');
    
    try {
      // Ensure private key has 0x prefix
      const normalizedPk = pk.startsWith('0x') ? pk : '0x' + pk;
      const wallet = new Wallet(normalizedPk);
      setAddress(wallet.address);
      setPrivateKey(wallet.privateKey);
      const payload = JSON.stringify({ address: wallet.address, privateKey: wallet.privateKey, createdAt: new Date().toISOString() });
      encryptData(payload).then(encrypted => {
        try { sessionStorage.setItem(STORAGE_KEY, encrypted); } catch (e) { console.warn('Failed to persist wallet to sessionStorage:', e); }
      }).catch(e => console.warn('Failed to encrypt wallet data:', e));
    } catch (error) {
      throw new Error('Invalid private key');
    }
  }, []);

  const clearWallet = useCallback(() => {
    setAddress(null);
    setPrivateKey(null);
    encryptionKey = null;
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) { console.warn('Failed to clear wallet from sessionStorage:', e); }
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address,
        privateKey,
        isCreated: !!address,
        createWallet,
        importWallet,
        clearWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

/**
 * Hook to access the ephemeral Ethereum browser wallet.
 * Must be used within a BrowserWalletProvider.
 */
export function useBrowserWallet(): WalletContextValue {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useBrowserWallet must be used within a BrowserWalletProvider');
  }
  return context;
}
