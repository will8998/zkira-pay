'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { SolanaNetwork as SolanaCluster, getExplorerUrl } from '@/lib/network-config';

export type { SolanaCluster };

export interface AdminNetworkContextType {
  network: SolanaCluster;
  setNetwork: (network: SolanaCluster) => void;
}

export const AdminNetworkContext = createContext<AdminNetworkContextType>({
  network: 'devnet',
  setNetwork: () => {},
});

export function useAdminNetwork() {
  return useContext(AdminNetworkContext);
}

export function AdminNetworkProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [network, setNetworkState] = useState<SolanaCluster>(getStoredNetwork);

  const setNetwork = useCallback((n: SolanaCluster) => {
    setNetworkState(n);
    storeNetwork(n);
  }, []);

  return React.createElement(AdminNetworkContext.Provider, { value: { network, setNetwork } }, children);
}

export function getStoredNetwork(): SolanaCluster {
  if (typeof window === 'undefined') return 'devnet';
  const stored = sessionStorage.getItem('zkira_admin_network');
  if (stored === 'devnet' || stored === 'testnet' || stored === 'mainnet-beta') {
    return stored;
  }
  return 'devnet';
}

export function storeNetwork(network: SolanaCluster) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('zkira_admin_network', network);
  }
}

export { getExplorerUrl };
