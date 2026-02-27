'use client';

import { useState, useEffect, useCallback } from 'react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { useWallet, useConnection } from './WalletProvider';
import { useNetwork, getUsdcMint } from '@/lib/network-config';


export interface BalanceState {
  sol: number | null;
  usdc: number | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useBalance(): BalanceState {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const { network } = useNetwork();
  const [sol, setSol] = useState<number | null>(null);
  const [usdc, setUsdc] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!publicKey || !connected) {
      setSol(null);
      setUsdc(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch SOL and USDC balances in parallel
      const [solBalance, usdcBalance] = await Promise.allSettled([
        connection.getBalance(publicKey),
        (async () => {
          const ata = await getAssociatedTokenAddress(new PublicKey(getUsdcMint(network)), publicKey);
          const info = await connection.getTokenAccountBalance(ata);
          return info.value.uiAmount;
        })(),
      ]);

      if (solBalance.status === 'fulfilled') {
        setSol(solBalance.value / LAMPORTS_PER_SOL);
      } else {
        setSol(0);
      }

      if (usdcBalance.status === 'fulfilled') {
        setUsdc(usdcBalance.value ?? 0);
      } else {
        // ATA might not exist yet — that's fine, balance is 0
        setUsdc(0);
      }
    } catch (err) {
      console.error('Error fetching balances:', err);
      setError('Failed to fetch balances');
    } finally {
      setLoading(false);
    }
  }, [publicKey, connected, connection]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return { sol, usdc, loading, error, refresh: fetchBalances };
}
