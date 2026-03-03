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
    setSelectedRoute
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
    if (percentage < 0) return 'text-zkira-red';
    if (percentage === 0) return 'text-zkira-text-secondary';
    return 'text-zkira-green';
  };

  return (
    <div className="bg-zkira-card rounded-xl border border-zkira-border p-6 w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-zkira-text">Best Routes</h2>
        <div className="flex items-center gap-2 text-zkira-text-secondary">
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
            <div className="border border-zkira-border rounded-lg p-4 animate-pulse">
              <div className="flex items-center justify-between mb-2">
                <div className="bg-zkira-border rounded h-5 w-16"></div>
                <div className="bg-zkira-border rounded-full h-4 w-4"></div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-zkira-border rounded-full h-6 w-6"></div>
                  <div className="bg-zkira-border rounded h-6 w-24"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="bg-zkira-border rounded h-4 w-20"></div>
                <div className="bg-zkira-border rounded h-4 w-16"></div>
              </div>
            </div>
            <div className="border border-zkira-border rounded-lg p-4 animate-pulse">
              <div className="flex items-center justify-between mb-2">
                <div className="bg-zkira-border rounded h-5 w-20"></div>
                <div className="bg-zkira-border rounded-full h-4 w-4"></div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-zkira-border rounded-full h-6 w-6"></div>
                  <div className="bg-zkira-border rounded h-6 w-28"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="bg-zkira-border rounded h-4 w-24"></div>
                <div className="bg-zkira-border rounded h-4 w-20"></div>
              </div>
            </div>
          </>
        )}

        {!loading && routes.length === 0 && !error && (
          <div className="text-center py-8 text-zkira-text-secondary">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No available routes</p>
            <p className="text-xs mt-1">Enter amount and select tokens to see routes</p>
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
                border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:bg-zkira-card-hover
                ${isSelected
                  ? 'route-card-selected border-zkira-green'
                  : 'border-zkira-border hover:border-zkira-border-light'
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
                  <button className="text-zkira-text-secondary hover:text-zkira-text transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                {isSelected && (
                  <div className="text-zkira-green">
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
                      className="w-6 h-6 rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <span className="text-white text-lg font-bold">
                    {formatNumber(route.toAmount, 6)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-zkira-text-secondary">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{formatDuration(route.estimatedTimeSeconds)}</span>
                  </div>
                  <span className="text-zkira-text-secondary">
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
          <div className="text-center py-8 text-zkira-red">
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
