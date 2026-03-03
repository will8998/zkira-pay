'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { TokenItem } from '@zkira/swap-types';
import { getTokens } from '@/lib/api';
import { POPULAR_TOKENS } from '@/lib/constants';

/** Deduplicate tokens by symbol — keep the highest-scored entry per symbol */
function deduplicateBySymbol(tokens: TokenItem[]): TokenItem[] {
  const seen = new Map<string, TokenItem>();
  for (const token of tokens) {
    const existing = seen.get(token.token_symbol);
    if (!existing || (token.score ?? 0) > (existing.score ?? 0)) {
      seen.set(token.token_symbol, token);
    }
  }
  return Array.from(seen.values());
}

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

  /** All tokens sorted: popular first, then rest */
  const sortedTokens = useMemo(() => {
    const popularTokens = tokens.filter(token => POPULAR_TOKENS.includes(token.token_symbol));
    const otherTokens = tokens.filter(token => !POPULAR_TOKENS.includes(token.token_symbol));

    popularTokens.sort((a, b) => {
      const aIndex = POPULAR_TOKENS.indexOf(a.token_symbol);
      const bIndex = POPULAR_TOKENS.indexOf(b.token_symbol);
      if (aIndex !== bIndex) return aIndex - bIndex;
      // Within same symbol, sort by network_id for consistency
      return a.network_id.localeCompare(b.network_id);
    });

    return [...popularTokens, ...otherTokens];
  }, [tokens]);

  /** Top tokens: one entry per symbol, popular ones first */
  const topTokens = useMemo(() => {
    const deduped = deduplicateBySymbol(tokens);
    const popular = deduped.filter(t => POPULAR_TOKENS.includes(t.token_symbol));
    const other = deduped.filter(t => !POPULAR_TOKENS.includes(t.token_symbol));

    popular.sort((a, b) => {
      return POPULAR_TOKENS.indexOf(a.token_symbol) - POPULAR_TOKENS.indexOf(b.token_symbol);
    });

    return [...popular, ...other];
  }, [tokens]);

  const search = useCallback((query: string): TokenItem[] => {
    if (!query.trim()) {
      return sortedTokens;
    }

    const lowerQuery = query.toLowerCase();

    // Tier 1: Exact symbol match
    const exactMatches = tokens.filter(token =>
      token.token_symbol.toLowerCase() === lowerQuery
    );

    // Tier 2: Starts with matches (symbol or name)
    const startsWithMatches = tokens.filter(token =>
      token.token_symbol.toLowerCase() !== lowerQuery && (
        token.token_symbol.toLowerCase().startsWith(lowerQuery) ||
        token.token_name.toLowerCase().startsWith(lowerQuery)
      )
    );

    // Tier 3: Contains matches (symbol, name, or network)
    const containsMatches = tokens.filter(token =>
      !token.token_symbol.toLowerCase().startsWith(lowerQuery) &&
      !token.token_name.toLowerCase().startsWith(lowerQuery) &&
      token.token_symbol.toLowerCase() !== lowerQuery && (
        token.token_symbol.toLowerCase().includes(lowerQuery) ||
        token.token_name.toLowerCase().includes(lowerQuery) ||
        token.network_id.toLowerCase().includes(lowerQuery)
      )
    );

    // Sort each tier: popular tokens first
    const sortTier = (tier: TokenItem[]) => {
      const popular = tier.filter(token => POPULAR_TOKENS.includes(token.token_symbol));
      const other = tier.filter(token => !POPULAR_TOKENS.includes(token.token_symbol));

      popular.sort((a, b) => {
        const aIndex = POPULAR_TOKENS.indexOf(a.token_symbol);
        const bIndex = POPULAR_TOKENS.indexOf(b.token_symbol);
        if (aIndex !== bIndex) return aIndex - bIndex;
        // Within same symbol, sort by network_id for consistency
        return a.network_id.localeCompare(b.network_id);
      });

      return [...popular, ...other];
    };

    return [
      ...sortTier(exactMatches),
      ...sortTier(startsWithMatches),
      ...sortTier(containsMatches)
    ];
  }, [tokens, sortedTokens]);

  /** Get all network variants for a given token symbol */
  const getNetworkVariants = useCallback((symbol: string): TokenItem[] => {
    return tokens.filter(t => t.token_symbol === symbol);
  }, [tokens]);

  return { tokens: sortedTokens, topTokens, loading, error, search, getNetworkVariants };
}
