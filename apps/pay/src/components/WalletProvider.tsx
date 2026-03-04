'use client';

import { createContext, useContext, type ReactNode } from 'react';

/**
 * Stub WalletProvider — Solana wallet integration removed.
 * The new EVM flow uses BrowserWalletProvider instead.
 * These exports maintain API compatibility for legacy components.
 */

interface WalletState {
  connected: boolean;
  publicKey: null;
  signTransaction: null;
  disconnect: () => void;
}

interface ConnectionState {
  connection: null;
}

const walletStub: WalletState = {
  connected: false,
  publicKey: null,
  signTransaction: null,
  disconnect: () => {},
};

const connectionStub: ConnectionState = {
  connection: null,
};

const WalletContext = createContext(walletStub);
const ConnectionContext = createContext(connectionStub);
const UnifiedWalletContext = createContext({ setShowModal: (_show: boolean) => {} });

export function useWallet() {
  return useContext(WalletContext);
}

export function useConnection() {
  return useContext(ConnectionContext);
}

export function useUnifiedWalletContext() {
  return useContext(UnifiedWalletContext);
}

export function WalletContextProvider({ children }: { children: ReactNode }) {
  return (
    <WalletContext.Provider value={walletStub}>
      <ConnectionContext.Provider value={connectionStub}>
        <UnifiedWalletContext.Provider value={{ setShowModal: () => {} }}>
          {children}
        </UnifiedWalletContext.Provider>
      </ConnectionContext.Provider>
    </WalletContext.Provider>
  );
}
