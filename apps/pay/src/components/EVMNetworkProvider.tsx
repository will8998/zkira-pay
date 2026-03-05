'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { NetworkMode } from '@/config/pool-registry';
import { getStoredEVMNetworkMode, storeEVMNetworkMode } from '@/config/pool-registry';

interface EVMNetworkContextValue {
  /** Current network mode */
  mode: NetworkMode;
  /** Switch network mode — clears wallet state since addresses differ */
  setMode: (mode: NetworkMode) => void;
  /** Whether currently on testnet */
  isTestnet: boolean;
}

const EVMNetworkContext = createContext<EVMNetworkContextValue>({
  mode: 'testnet',
  setMode: () => {},
  isTestnet: true,
});

export function EVMNetworkProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<NetworkMode>(getStoredEVMNetworkMode);

  const setMode = useCallback((newMode: NetworkMode) => {
    setModeState(newMode);
    storeEVMNetworkMode(newMode);
  }, []);

  return (
    <EVMNetworkContext.Provider
      value={{
        mode,
        setMode,
        isTestnet: mode === 'testnet',
      }}
    >
      {children}
    </EVMNetworkContext.Provider>
  );
}

/**
 * Hook to access the EVM network mode (testnet/mainnet).
 * Must be used within an EVMNetworkProvider.
 */
export function useEVMNetwork(): EVMNetworkContextValue {
  return useContext(EVMNetworkContext);
}
