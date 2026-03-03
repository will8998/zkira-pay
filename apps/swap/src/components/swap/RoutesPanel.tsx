'use client';

import { useEffect, useRef } from 'react';
import { useSwapContext } from '@/context/SwapContext';
import { useQuotes } from '@/hooks/useQuotes';
import { formatNumber, formatUSD, formatDuration } from '@/lib/utils';
import type { RouteQuote } from '@zkira/swap-types';

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

  // Keep selectedRoute in sync with latest routes data.
  // Without this, selectedRoute becomes stale after quote refreshes,
  // causing the "To" field to show outdated amounts.
  const selectedKeywordRef = useRef<string | null>(null);
  selectedKeywordRef.current = selectedRoute?.exchangeKeyword ?? null;

  useEffect(() => {
    if (routes.length === 0) return;

    const currentKeyword = selectedKeywordRef.current;
    if (!currentKeyword) {
      // No route selected yet — pick the best (first)
      setSelectedRoute(routes[0]);
      return;
    }

    // Update selectedRoute with fresh data from the new routes
    const match = routes.find(r => r.exchangeKeyword === currentKeyword);
    setSelectedRoute(match ?? routes[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routes, setSelectedRoute]);

  // Push routes into context so SwapCard can access them for auto-fallback
  useEffect(() => {
    setContextRoutes(routes);
  }, [routes, setContextRoutes]);

  const handleRouteSelect = (route: RouteQuote) => {
    setSelectedRoute(route);
  };

  const formatCountdown = (seconds: number) => {
    return `${seconds}s`;
  };

  const getBestRouteAmount = () => {
    if (routes.length === 0) return 0;
    return routes[0].toAmount;
  };

  const getPercentDiff = (route: RouteQuote) => {
    const best = getBestRouteAmount();
    if (!best || best === 0) return 0;
    return ((route.toAmount - best) / best) * 100;
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage < 0) return 'text-[var(--color-red)]';
    if (percentage === 0) return 'text-[var(--color-text-secondary)]';
    return 'text-[var(--color-green)]';
  };

  return (
    <div className="card-base p-6 w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] tracking-wide">Best Routes</h2>
        <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm">({formatCountdown(countdown)})</span>
        </div>
      </div>

      <div className="space-y-3">
        {loading && (
          <>
            <div className="border border-[var(--border-subtle)] p-4 animate-pulse skeleton-shimmer">
              <div className="flex items-center justify-between mb-2">
                <div className="bg-[var(--color-border)] h-5 w-16"></div>
                <div className="bg-[var(--color-border)] h-4 w-4"></div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-[var(--color-border)] h-6 w-6"></div>
                  <div className="bg-[var(--color-border)] h-6 w-24"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="bg-[var(--color-border)] h-4 w-20"></div>
                <div className="bg-[var(--color-border)] h-4 w-16"></div>
              </div>
            </div>
            <div className="border border-[var(--border-subtle)] p-4 animate-pulse skeleton-shimmer">
              <div className="flex items-center justify-between mb-2">
                <div className="bg-[var(--color-border)] h-5 w-20"></div>
                <div className="bg-[var(--color-border)] h-4 w-4"></div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-[var(--color-border)] h-6 w-6"></div>
                  <div className="bg-[var(--color-border)] h-6 w-28"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="bg-[var(--color-border)] h-4 w-24"></div>
                <div className="bg-[var(--color-border)] h-4 w-20"></div>
              </div>
            </div>
          </>
        )}

        {!loading && routes.length === 0 && !error && (
          <div className="text-center py-8 text-[var(--color-text-secondary)]">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            {amount && parseFloat(amount) > 0 && fromToken && toToken ? (
              <>
                <p>No walletless routes for this pair</p>
                <p className="text-xs mt-1">Try stablecoin pairs (USDT, USDC) for the best experience</p>
              </>
            ) : (
              <>
                <p>No available routes</p>
                <p className="text-xs mt-1">Enter amount and select tokens to see routes</p>
              </>
            )}
          </div>
        )}

        {!loading && routes.map((route, index) => {
          const isSelected = selectedRoute?.exchangeKeyword === route.exchangeKeyword;
          const percentDiff = getPercentDiff(route);

          return (
            <div
              key={route.exchangeKeyword || index}
              onClick={() => handleRouteSelect(route)}
              className={`
                border p-4 cursor-pointer transition-all duration-200 hover:bg-[var(--color-hover)] hover:scale-[1.01]
                ${isSelected
                  ? 'route-card-selected neon-glow-subtle'
                  : 'border-[var(--border-subtle)] hover:border-[var(--border-subtle-hover)]'
                }
              `}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`
                    px-2 py-1 rounded text-xs font-medium
                    ${route.routeType === 'private'
                      ? 'route-badge-private'
                      : 'route-badge-standard'
                    }
                  `}>
                    {route.isPrivate ? 'Privacy' : 'Standard'}
                  </span>
                  <button className="text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                {isSelected && (
                  <div className="text-[var(--color-red)]">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {route.exchangeLogo && (
                    <img
                      src={route.exchangeLogo}
                      alt={route.exchangeTitle}
                      className="w-6 h-6"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <span className="text-[var(--color-text)] text-lg font-bold">
                    {formatNumber(route.toAmount, 6)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-[var(--color-text-secondary)]">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{formatDuration(route.estimatedTimeSeconds)}</span>
                  </div>
                  <span className="text-[var(--color-text-secondary)]">
                    {formatUSD(route.platformFeeUsd)}
                  </span>
                </div>

                <span className={`font-medium ${getPercentageColor(percentDiff)}`}>
                  {percentDiff === 0 ? 'Best' :
                   percentDiff > 0 ? `+${percentDiff.toFixed(1)}%` :
                   `${percentDiff.toFixed(1)}%`}
                </span>
              </div>
            </div>
          );
        })}

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
