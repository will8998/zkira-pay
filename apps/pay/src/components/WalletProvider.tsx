'use client';

import { useMemo } from 'react';
import {
  ConnectionProvider,
  useWallet as useWalletAdapter,
  useConnection as useConnectionAdapter,
} from '@solana/wallet-adapter-react';
import {
  UnifiedWalletProvider,
  useUnifiedWalletContext,
} from '@jup-ag/wallet-adapter';
import type { Adapter } from '@solana/wallet-adapter-base';
import { useNetwork, getRpcUrl, type SolanaNetwork } from '@/lib/network-config';

// Re-export standard hooks — consumers don't need to change imports
export { useUnifiedWalletContext };
export const useWallet = useWalletAdapter;
export const useConnection = useConnectionAdapter;

function mapNetworkToCluster(network: SolanaNetwork): 'devnet' | 'testnet' | 'mainnet-beta' {
  return network;
}

function InnerProvider({ children }: { children: React.ReactNode }) {
  const { network } = useNetwork();
  const endpoint = useMemo(() => getRpcUrl(network), [network]);
  const wallets: Adapter[] = useMemo(() => [], []); // Wallet Standard auto-discovers

  return (
    <ConnectionProvider endpoint={endpoint}>
      <UnifiedWalletProvider
        wallets={wallets}
        config={{
          autoConnect: true,
          env: mapNetworkToCluster(network),
          metadata: {
            name: 'ZKIRA Pay',
            description: 'Confidential Payments on Solana',
            url: 'https://app.zkira.xyz',
            iconUrls: ['/icon.svg'],
          },
          theme: 'dark',
          lang: 'en',
        }}
      >
        {children}
      </UnifiedWalletProvider>
    </ConnectionProvider>
  );
}

export function WalletContextProvider({ children }: { children: React.ReactNode }) {
  return <InnerProvider>{children}</InnerProvider>;
}
