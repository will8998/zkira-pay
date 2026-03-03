'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { TokenItem } from '@zkira/swap-types';
import { getTokens } from '@/lib/api';
import { POPULAR_TOKENS } from '@/lib/constants';

export function useTokens() {
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setLoading(true);
        const response = await getTokens({ perPage: 100 });
        setTokens(response.tokens);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, []);

  const sortedTokens = useMemo(() => {
    const popularTokens = tokens.filter(token => POPULAR_TOKENS.includes(token.token_symbol));
    const otherTokens = tokens.filter(token => !POPULAR_TOKENS.includes(token.token_symbol));

    popularTokens.sort((a, b) => {
      const aIndex = POPULAR_TOKENS.indexOf(a.token_symbol);
      const bIndex = POPULAR_TOKENS.indexOf(b.token_symbol);
      return aIndex - bIndex;
    });

    return [...popularTokens, ...otherTokens];
  }, [tokens]);

  const search = useCallback((query: string): TokenItem[] => {
    if (!query.trim()) {
      return sortedTokens;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = tokens.filter(token =>
      token.token_symbol.toLowerCase().includes(lowerQuery) ||
      token.token_name.toLowerCase().includes(lowerQuery)
    );

    const popularFiltered = filtered.filter(token => POPULAR_TOKENS.includes(token.token_symbol));
    const otherFiltered = filtered.filter(token => !POPULAR_TOKENS.includes(token.token_symbol));

    popularFiltered.sort((a, b) => {
      const aIndex = POPULAR_TOKENS.indexOf(a.token_symbol);
      const bIndex = POPULAR_TOKENS.indexOf(b.token_symbol);
      return aIndex - bIndex;
    });

    return [...popularFiltered, ...otherFiltered];
  }, [tokens, sortedTokens]);

  return { tokens: sortedTokens, loading, error, search };
}
