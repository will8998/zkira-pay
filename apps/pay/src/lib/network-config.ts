'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type SolanaNetwork = 'devnet' | 'testnet' | 'mainnet-beta';

export interface NetworkConfig {
  rpcUrl: string;
  usdcMint: string;
  label: string;
  badge: {
    bgClass: string;
    textClass: string;
    borderClass: string;
  };
}

export const NETWORK_CONFIG: Record<SolanaNetwork, NetworkConfig> = {
  devnet: {
    rpcUrl: 'https://api.devnet.solana.com',
    usdcMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    label: 'Devnet',
    badge: {
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-700',
      borderClass: 'border-amber-200',
    },
  },
  testnet: {
    rpcUrl: 'https://api.testnet.solana.com',
    usdcMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    label: 'Testnet',
    badge: {
      bgClass: 'bg-[#E8E5DE]',
      textClass: 'text-[#1A3A1A]',
      borderClass: 'border-[#C8C3B8]',
    },
  },
  'mainnet-beta': {
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    usdcMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    label: 'Mainnet',
    badge: {
      bgClass: 'bg-zinc-900',
      textClass: 'text-zinc-200',
      borderClass: 'border-zinc-700',
    },
  },
};

export function getRpcUrl(network: SolanaNetwork): string {
  return NETWORK_CONFIG[network].rpcUrl;
}

export function getUsdcMint(network: SolanaNetwork): string {
  return NETWORK_CONFIG[network].usdcMint;
}

export function getNetworkLabel(network: SolanaNetwork): string {
  return NETWORK_CONFIG[network].label;
}

export function getExplorerUrl(type: 'address' | 'tx', value: string, network: SolanaNetwork): string {
  const base = 'https://explorer.solana.com';
  const path = type === 'tx' ? 'tx' : 'address';
  const clusterParam = network === 'mainnet-beta' ? '' : `?cluster=${network}`;
  return `${base}/${path}/${value}${clusterParam}`;
}

export interface NetworkContextType {
  network: SolanaNetwork;
  setNetwork: (network: SolanaNetwork) => void;
}

export const NetworkContext = createContext<NetworkContextType>({
  network: 'devnet',
  setNetwork: () => {},
});

export function useNetwork() {
  return useContext(NetworkContext);
}

function getStoredNetwork(): SolanaNetwork {
  if (typeof window === 'undefined') return 'devnet';
  const stored = sessionStorage.getItem('zkira_network');
  if (stored === 'devnet' || stored === 'testnet' || stored === 'mainnet-beta') {
    return stored;
  }
  return 'devnet';
}

function storeNetwork(network: SolanaNetwork) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('zkira_network', network);
  }
}

export function NetworkProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [network, setNetworkState] = useState<SolanaNetwork>(getStoredNetwork);

  const setNetwork = useCallback((n: SolanaNetwork) => {
    setNetworkState(n);
    storeNetwork(n);
  }, []);

  return React.createElement(NetworkContext.Provider, { value: { network, setNetwork } }, children);
}