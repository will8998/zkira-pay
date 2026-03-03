'use client';

import { useState, useCallback } from 'react';
import type { SwapRequest, SwapResponse } from '@zkira/swap-types';
import { createSwap } from '@/lib/api';

export function useSwap() {
  const [swap, setSwap] = useState<SwapResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: SwapRequest): Promise<SwapResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await createSwap(data);
      setSwap(result);
      setLoading(false);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create swap';
      setError(message);
      setLoading(false);
      return null;
    }
  }, []);

  return { swap, loading, error, create };
}
