'use client';

import { useState, useEffect } from 'react';
import type { HealthResponse } from '@zkira/swap-types';
import { getHealth } from '@/lib/api';

export function useHealth() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isOperational, setIsOperational] = useState(false);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const result = await getHealth();
        setHealth(result);
        setIsOperational(result.status === 'ok');
      } catch {
        setIsOperational(false);
      }
    };

    fetchHealth();
  }, []);

  return { health, isOperational };
}
