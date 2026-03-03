'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { TokenItem, RouteQuote, SwapResponse, SwapStep } from '@zkira/swap-types';
import { getTokens } from '@/lib/api';

interface SwapState {
  fromToken: TokenItem | null;
  toToken: TokenItem | null;
  amount: string;
  isPrivate: boolean;
  destinationAddress: string;
  refundAddress: string;
  step: SwapStep;
  selectedRoute: RouteQuote | null;
  routes: RouteQuote[];
  swap: SwapResponse | null;
  error: string | null;
}

interface SwapContextValue extends SwapState {
  setFromToken: (token: TokenItem | null) => void;
  setToToken: (token: TokenItem | null) => void;
  setAmount: (amount: string) => void;
  setIsPrivate: (isPrivate: boolean) => void;
  setDestinationAddress: (addr: string) => void;
  setRefundAddress: (addr: string) => void;
  setStep: (step: SwapStep) => void;
  setSelectedRoute: (route: RouteQuote | null) => void;
  setRoutes: (routes: RouteQuote[]) => void;
  setSwap: (swap: SwapResponse | null) => void;
  setError: (error: string | null) => void;
  flipTokens: () => void;
  reset: () => void;
}

const initialState: SwapState = {
  fromToken: null,
  toToken: null,
  amount: '',
  isPrivate: false,
  destinationAddress: '',
  refundAddress: '',
  step: 'idle',
  selectedRoute: null,
  routes: [],
  swap: null,
  error: null,
};

const SwapContext = createContext<SwapContextValue | null>(null);

export function SwapProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SwapState>(initialState);

  // Set default USDT tokens on mount
  useEffect(() => {
    const setDefaultTokens = async () => {
      if (state.fromToken !== null) return;

      try {
        const response = await getTokens({ perPage: 100 });
        const tokens = response.tokens;

        // Default: BTC on bitcoin → ETH on ethereum (clearly different tokens)
        const fromToken =
          tokens.find(t => t.token_symbol === 'BTC' && t.network_id === 'BTC') ||
          tokens.find(t => t.token_symbol === 'BTC');

        const toToken =
          tokens.find(t => t.token_symbol === 'ETH' && t.network_id === 'ethereum') ||
          tokens.find(t => t.token_symbol === 'ETH');

        if (fromToken && toToken) {
          setState(prev => ({ ...prev, fromToken, toToken }));
        }
      } catch (error) {
        console.debug('Failed to set default tokens:', error);
      }
    };

    setDefaultTokens();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setFromToken = useCallback((token: TokenItem | null) => {
    setState(prev => ({ ...prev, fromToken: token, selectedRoute: null }));
  }, []);

  const setToToken = useCallback((token: TokenItem | null) => {
    setState(prev => ({ ...prev, toToken: token, selectedRoute: null }));
  }, []);

  const setAmount = useCallback((amount: string) => {
    setState(prev => ({ ...prev, amount }));
  }, []);

  const setIsPrivate = useCallback((isPrivate: boolean) => {
    setState(prev => ({ ...prev, isPrivate, selectedRoute: null }));
  }, []);

  const setDestinationAddress = useCallback((destinationAddress: string) => {
    setState(prev => ({ ...prev, destinationAddress }));
  }, []);

  const setRefundAddress = useCallback((refundAddress: string) => {
    setState(prev => ({ ...prev, refundAddress }));
  }, []);

  const setStep = useCallback((step: SwapStep) => {
    setState(prev => ({ ...prev, step }));
  }, []);

  const setSelectedRoute = useCallback((selectedRoute: RouteQuote | null) => {
    setState(prev => ({
      ...prev,
      selectedRoute,
      isPrivate: selectedRoute?.isPrivate ?? prev.isPrivate,
    }));
  }, []);

  const setRoutes = useCallback((routes: RouteQuote[]) => {
    setState(prev => ({ ...prev, routes }));
  }, []);

  const setSwap = useCallback((swap: SwapResponse | null) => {
    setState(prev => ({ ...prev, swap }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const flipTokens = useCallback(() => {
    setState(prev => ({
      ...prev,
      fromToken: prev.toToken,
      toToken: prev.fromToken,
      selectedRoute: null,
    }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return (
    <SwapContext.Provider
      value={{
        ...state,
        setFromToken,
        setToToken,
        setAmount,
        setIsPrivate,
        setDestinationAddress,
        setRefundAddress,
        setStep,
        setSelectedRoute,
        setRoutes,
        setSwap,
        setError,
        flipTokens,
        reset,
      }}
    >
      {children}
    </SwapContext.Provider>
  );
}

export function useSwapContext(): SwapContextValue {
  const context = useContext(SwapContext);
  if (!context) {
    throw new Error('useSwapContext must be used within a SwapProvider');
  }
  return context;
}
