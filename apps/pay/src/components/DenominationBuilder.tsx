'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getDenominationOptions, type Chain, type TokenId, type PoolEntry } from '@/config/pool-registry';
import type { DenominationSelection, DenominationSet } from '@/types/payment';

interface DenominationBuilderProps {
  chain: Chain;
  token: TokenId;
  onChange: (set: DenominationSet) => void;
  disabled?: boolean;
}

export function DenominationBuilder({
  chain,
  token,
  onChange,
  disabled = false,
}: DenominationBuilderProps) {
  // State to track count for each denomination
  const [counts, setCounts] = useState<Record<string, number>>({});

  // Get available denominations (memoized to prevent useEffect re-triggers)
  const denominations = useMemo(() => getDenominationOptions(chain, token), [chain, token]);

  // Initialize counts to 0 for all denominations
  useEffect(() => {
    const initialCounts: Record<string, number> = {};
    denominations.forEach((d) => {
      initialCounts[d.value] = 0;
    });
    setCounts(initialCounts);
  }, [denominations]);

  // Calculate and notify parent of changes
  useEffect(() => {
    const selections: DenominationSelection[] = [];
    let totalRaw = BigInt(0);

    denominations.forEach((d) => {
      const count = counts[d.value] || 0;
      if (count > 0) {
        selections.push({
          pool: d.pool,
          count,
        });
        totalRaw += BigInt(d.pool.denomination) * BigInt(count);
      }
    });

    // Format total label
    const tokenSymbol = denominations[0]?.pool.label.split(' ')[1] || '';
    const totalLabel = formatAmount(totalRaw, tokenSymbol);

    const denominationSet: DenominationSet = {
      chain,
      token,
      selections,
      totalRaw,
      totalLabel,
      remainder: 0,
      remainderLabel: '',
    };

    onChange(denominationSet);
  }, [counts, denominations, chain, token, onChange]);

  // Format amount for display
  const formatAmount = (raw: bigint, symbol: string): string => {
    // Get decimals from first pool (assumes all pools use same token)
    if (denominations.length === 0) return '0';
    
    // Use token decimals - USDC/USDT typically have 6 decimals, DAI has 18
    const decimals = 6; // Default to 6 for USDC/USDT
    const divisor = BigInt(10 ** decimals);
    const formatted = Number(raw) / Number(divisor);
    
    return `${formatted.toLocaleString()} ${symbol}`;
  };

  const handleCountChange = useCallback((denomination: string, delta: number) => {
    setCounts(prev => {
      const currentCount = prev[denomination] || 0;
      const newCount = Math.max(0, Math.min(20, currentCount + delta));
      return { ...prev, [denomination]: newCount };
    });
  }, []);

  const btnBase = 'w-8 h-8 rounded border text-sm font-medium transition-all flex items-center justify-center';
  const btnActive = 'border-zinc-300 bg-zinc-300/10 text-zinc-400 hover:bg-zinc-300/20 cursor-pointer';
  const btnInactive = 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800 cursor-pointer';
  const btnDisabled = 'opacity-30 cursor-not-allowed border-zinc-800 bg-zinc-900/30 text-zinc-600';

  if (denominations.length === 0) {
    return (
      <div className="p-4 text-center text-zinc-500 border border-zinc-800 rounded-lg bg-zinc-900/30">
        No denominations available for this token on {chain}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <h3 
        className="text-lg font-bold text-zinc-300 uppercase tracking-wider"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        SELECT AMOUNTS
      </h3>

      {/* Denomination list */}
      <div className="space-y-3">
        {denominations.map((d) => {
          const count = counts[d.value] || 0;
          const subtotalRaw = BigInt(d.pool.denomination) * BigInt(count);
          const tokenSymbol = d.label.split(' ')[1] || '';
          const subtotalLabel = formatAmount(subtotalRaw, tokenSymbol);
          
          return (
            <div 
              key={d.value} 
              className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
            >
              {/* Denomination label */}
              <div 
                className="text-sm font-medium text-zinc-300 min-w-0"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {d.label}
              </div>

              {/* Counter controls */}
              <div className="flex items-center gap-3">
                {/* Decrease button */}
                <button
                  type="button"
                  disabled={disabled || count <= 0}
                  onClick={() => handleCountChange(d.value, -1)}
                  className={`${btnBase} ${
                    disabled || count <= 0 
                      ? btnDisabled 
                      : count > 0 
                        ? btnActive
                        : btnInactive
                  }`}
                >
                  −
                </button>

                {/* Count display */}
                <div 
                  className="w-8 text-center text-sm font-bold text-zinc-200"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {count}
                </div>

                {/* Increase button */}
                <button
                  type="button"
                  disabled={disabled || count >= 20}
                  onClick={() => handleCountChange(d.value, 1)}
                  className={`${btnBase} ${
                    disabled || count >= 20 
                      ? btnDisabled 
                      : btnActive
                  }`}
                >
                  +
                </button>

                {/* Subtotal */}
                <div 
                  className="text-sm text-zinc-400 text-right min-w-[100px]"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  = {subtotalLabel.split(' ')[0]}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total separator and amount */}
      <div className="border-t border-zinc-700 pt-4 space-y-2">
        <div className="flex justify-center">
          <div className="text-zinc-600 text-xs tracking-[0.3em]">
            ════════════════════════════════
          </div>
        </div>
        <div 
          className="text-lg font-bold text-zinc-200 flex justify-between items-center"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span className="tracking-wider">TOTAL:</span>
          <span className="text-zinc-400">
            {(() => {
              let totalRaw = BigInt(0);
              denominations.forEach((d) => {
                const count = counts[d.value] || 0;
                totalRaw += BigInt(d.pool.denomination) * BigInt(count);
              });
              const tokenSymbol = denominations[0]?.pool.label.split(' ')[1] || '';
              return formatAmount(totalRaw, tokenSymbol);
            })()}
          </span>
        </div>
      </div>
    </div>
  );
}