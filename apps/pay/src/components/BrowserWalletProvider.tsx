'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

const STORAGE_KEY = 'zkira_ephemeral_wallet';

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
  const [address, setAddress] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.address || null;
      }
    } catch {}
    return null;
  });

  const [privateKey, setPrivateKey] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.privateKey || null;
      }
    } catch {}
    return null;
  });

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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        address: wallet.address,
        privateKey: wallet.privateKey,
        createdAt: new Date().toISOString(),
      }));
    } catch {}
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
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          address: wallet.address,
          privateKey: wallet.privateKey,
          createdAt: new Date().toISOString(),
        }));
      } catch {}
    } catch (error) {
      throw new Error('Invalid private key');
    }
  }, []);

  const clearWallet = useCallback(() => {
    setAddress(null);
    setPrivateKey(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
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
