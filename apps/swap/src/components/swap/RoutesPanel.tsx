'use client';

import { useEffect, useRef, useState } from 'react';
import { useSwapContext } from '@/context/SwapContext';
import { useQuotes } from '@/hooks/useQuotes';
import { formatNumber, formatUSD, formatDuration } from '@/lib/utils';
import type { RouteQuote } from '@zkira/swap-types';

type RouteFilter = 'best' | 'fastest' | 'private';

export default function RoutesPanel() {
  const {
    fromToken,
    toToken,
    amount,
    selectedRoute,
    setSelectedRoute,
    setRoutes: setContextRoutes,
  } = useSwapContext();

  const { routes, loading, error, countdown } = useQuotes({
    amount: amount ? parseFloat(amount) : null,
    fromToken,
    toToken
  });

  const [activeFilter, setActiveFilter] = useState<RouteFilter>('best');

  // Keep selectedRoute in sync with latest routes data
  const selectedKeywordRef = useRef<string | null>(null);
  selectedKeywordRef.current = selectedRoute?.exchangeKeyword ?? null;

  useEffect(() => {
    if (routes.length === 0) return;
    const currentKeyword = selectedKeywordRef.current;
    if (!currentKeyword) {
      setSelectedRoute(routes[0]);
      return;
    }
    const match = routes.find(r => r.exchangeKeyword === currentKeyword);
    setSelectedRoute(match ?? routes[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routes, setSelectedRoute]);

  useEffect(() => {
    setContextRoutes(routes);
  }, [routes, setContextRoutes]);

  const handleRouteSelect = (route: RouteQuote) => {
    setSelectedRoute(route);
  };

  const getBestRouteAmount = () => {
    if (routes.length === 0) return 0;
    return routes[0].toAmount;
  };

  const getYouSave = (route: RouteQuote) => {
    const best = getBestRouteAmount();
    if (!best || best === 0) return 0;
    return ((route.toAmount - best) / best) * 100;
  };

  const getFilteredRoutes = (): RouteQuote[] => {
    const sorted = [...routes];
    switch (activeFilter) {
      case 'best':
        return sorted.sort((a, b) => b.toAmount - a.toAmount);
      case 'fastest':
        return sorted.sort((a, b) => a.estimatedTimeSeconds - b.estimatedTimeSeconds);
      case 'private':
        return sorted.filter(r => r.isPrivate).sort((a, b) => b.toAmount - a.toAmount);
      default:
        return sorted;
    }
  };

  const filteredRoutes = getFilteredRoutes();

  const filters: { key: RouteFilter; label: string; icon: string }[] = [
    { key: 'best', label: 'Best', icon: '★' },
    { key: 'fastest', label: 'Fastest', icon: '⚡' },
    { key: 'private', label: 'Private', icon: '🔒' },
  ];

  return (
    <div className="card-base w-full flex flex-col">
      {/* Header: filter tabs + countdown */}
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="flex items-center border-b border-[var(--color-border)] flex-1">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`filter-tab ${activeFilter === f.key ? 'active' : ''}`}
            >
              <span className="mr-1.5">{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[var(--color-text-secondary)] pl-3 pb-2">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-mono">{countdown}s</span>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto">
        {/* Loading */}
        {loading && (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="border border-[var(--border-subtle)] p-4 animate-pulse skeleton-shimmer">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-[var(--color-border)] h-6 w-6"></div>
                  <div className="bg-[var(--color-border)] h-5 w-32"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="bg-[var(--color-border)] h-4 w-20"></div>
                  <div className="bg-[var(--color-border)] h-4 w-16"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filteredRoutes.length === 0 && !error && (
          <div className="text-center py-12 text-[var(--color-text-secondary)]">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            {activeFilter === 'private' ? (
              <>
                <p>No privacy routes for this pair</p>
                <p className="text-xs mt-1">Try &quot;Best&quot; or &quot;Fastest&quot;</p>
              </>
            ) : amount && parseFloat(amount) > 0 && fromToken && toToken ? (
              <>
                <p>No walletless routes for this pair</p>
                <p className="text-xs mt-1">Try stablecoin pairs (USDT, USDC)</p>
              </>
            ) : (
              <>
                <p>No available routes</p>
                <p className="text-xs mt-1">Enter amount and select tokens to see routes</p>
              </>
            )}
          </div>
        )}

        {/* Desktop table */}
        {!loading && filteredRoutes.length > 0 && (
          <div className="hidden lg:block">
            <table className="routes-table">
              <thead>
                <tr>
                  <th>Exchange</th>
                  <th>Quote</th>
                  <th>Min. Received</th>
                  <th>Gas Fee</th>
                  <th>You Save</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoutes.map((route, index) => {
                  const isSelected = selectedRoute?.exchangeKeyword === route.exchangeKeyword;
                  const pct = getYouSave(route);
                  return (
                    <tr
                      key={route.exchangeKeyword || index}
                      onClick={() => handleRouteSelect(route)}
                      className={isSelected ? 'route-selected' : ''}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[var(--color-text)] font-medium text-sm">{route.exchangeTitle}</span>
                              {route.walletLess && <span className="badge-walletless">Walletless</span>}
                              {route.isPrivate && <span className="badge-privacy">Privacy</span>}
                            </div>
                            <div className="text-[10px] text-[var(--color-muted)] uppercase tracking-wider mt-0.5">
                              {route.exchangeType} | {route.exchangeType === 'DEX' ? 'Instant' : `~${Math.round(route.estimatedTimeSeconds / 60)} mins`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td><span className="text-[var(--color-text)] font-medium">{formatNumber(route.toAmount, 4)} {route.toTokenSymbol}</span></td>
                      <td><span className="text-[var(--color-text-secondary)]">{route.minReceived ? `${formatNumber(route.minReceived, 4)} ${route.toTokenSymbol}` : 'Market Price'}</span></td>
                      <td><span className="text-[var(--color-text-secondary)]">{formatUSD(route.gasFeeUsd)}</span></td>
                      <td>
                        <span className={`font-medium ${pct >= 0 ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
                          {pct === 0 ? 'Best' : pct > 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile cards */}
        {!loading && filteredRoutes.length > 0 && (
          <div className="lg:hidden p-4 space-y-3">
            {filteredRoutes.map((route, index) => {
              const isSelected = selectedRoute?.exchangeKeyword === route.exchangeKeyword;
              const pct = getYouSave(route);
              return (
                <div
                  key={route.exchangeKeyword || index}
                  onClick={() => handleRouteSelect(route)}
                  className={`border p-4 cursor-pointer transition-all hover:bg-[var(--color-hover)] ${
                    isSelected ? 'border-[var(--color-red)] neon-glow-subtle' : 'border-[var(--border-subtle)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--color-text)] font-medium text-sm">{route.exchangeTitle}</span>
                      {route.walletLess && <span className="badge-walletless">Walletless</span>}
                      {route.isPrivate && <span className="badge-privacy">Privacy</span>}
                    </div>
                    <div className="text-[10px] text-[var(--color-muted)] uppercase">
                      {route.exchangeType} | {route.exchangeType === 'DEX' ? 'Instant' : formatDuration(route.estimatedTimeSeconds)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text)] text-lg font-bold">{formatNumber(route.toAmount, 4)} {route.toTokenSymbol}</span>
                    <span className={`text-sm font-medium ${pct >= 0 ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
                      {pct === 0 ? 'Best' : pct > 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-[var(--color-text-secondary)]">
                    <span>Fee: {formatUSD(route.gasFeeUsd)}</span>
                    <span>Min: {route.minReceived ? formatNumber(route.minReceived, 4) : 'Market'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-8 text-[var(--color-red)]">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Failed to load routes</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
