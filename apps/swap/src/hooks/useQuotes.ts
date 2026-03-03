'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { TokenItem, RouteQuote } from '@zkira/swap-types';
import { getQuotation } from '@/lib/api';
import { QUOTE_DEBOUNCE_MS } from '@/lib/constants';
import { useDebounce } from './useDebounce';
import { isSameToken } from '@/lib/utils';

const QUOTE_REFRESH_INTERVAL = 60;

interface UseQuotesParams {
  amount: number | null;
  fromToken: TokenItem | null;
  toToken: TokenItem | null;
}

export function useQuotes({ amount, fromToken, toToken }: UseQuotesParams) {
  const [routes, setRoutes] = useState<RouteQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(QUOTE_REFRESH_INTERVAL);
  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const debouncedAmount = useDebounce(amount, QUOTE_DEBOUNCE_MS);

  const fetchQuotes = useCallback(async (signal?: AbortSignal) => {
    if (!debouncedAmount || debouncedAmount <= 0 || !fromToken || !toToken || isSameToken(fromToken, toToken)) {
      setRoutes([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getQuotation({
        fromTokenId: fromToken.id,
        toTokenId: toToken.id,
        fromNetwork: fromToken.network_id,
        toNetwork: toToken.network_id,
        amount: debouncedAmount,
      });

      if (!signal?.aborted) {
        setRoutes(result.quotes);
        setLoading(false);
        setCountdown(QUOTE_REFRESH_INTERVAL);
      }
    } catch (err) {
      if (!signal?.aborted) {
        setError(err instanceof Error ? err.message : 'Failed to fetch quotes');
        setRoutes([]);
        setLoading(false);
      }
    }
  }, [debouncedAmount, fromToken, toToken]);

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    if (!debouncedAmount || debouncedAmount <= 0 || !fromToken || !toToken || isSameToken(fromToken, toToken)) {
      setRoutes([]);
      setLoading(false);
      setError(null);
      setCountdown(QUOTE_REFRESH_INTERVAL);
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    fetchQuotes(controller.signal);

    intervalRef.current = setInterval(() => {
      fetchQuotes(controller.signal);
    }, QUOTE_REFRESH_INTERVAL * 1000);

    countdownRef.current = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? QUOTE_REFRESH_INTERVAL : prev - 1));
    }, 1000);

    return () => {
      controller.abort();
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [debouncedAmount, fromToken, toToken, fetchQuotes]);

  useEffect(() => {
    if (amount && amount > 0 && fromToken && toToken) {
      setLoading(true);
    }
  }, [amount, fromToken, toToken]);

  return { routes, loading, error, countdown };
}
