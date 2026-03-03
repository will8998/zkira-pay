'use client';

import { useState, useEffect, useRef } from 'react';
import type { StatusResponse } from '@zkira/swap-types';
import { getStatus } from '@/lib/api';
import { STATUS_POLL_INTERVAL_MS, TERMINAL_STATUSES } from '@/lib/constants';

export function useStatus(requestId: string | null) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!requestId) {
      setStatus(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchStatus = async () => {
      try {
        const result = await getStatus(requestId);
        setStatus(result);
        setError(null);

        if (TERMINAL_STATUSES.includes(result.status)) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch status');
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchStatus();

    intervalRef.current = setInterval(fetchStatus, STATUS_POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [requestId]);

  return { status, loading, error };
}
