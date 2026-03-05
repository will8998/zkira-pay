'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DEFAULT_CHAIN,
  DEFAULT_TOKEN,
  getAvailableChains,
  getAvailableTokensForChain,
  getDenominationOptions,
  getDefaultDenomination,
  getGasTokenSymbol,
  type Chain,
  type TokenId,
  type PoolEntry,
} from '@/config/pool-registry';

export interface ChainTokenSelection {
  chain: Chain;
  token: TokenId;
  denomination: string;
  pool: PoolEntry | null;
  gasTokenSymbol: string;
}

interface ChainTokenSelectorProps {
  onSelectionChange: (selection: ChainTokenSelection) => void;
  /** Initial chain selection (defaults to 'arbitrum') */
  initialChain?: Chain;
  /** Initial token selection (defaults to chain default) */
  initialToken?: TokenId;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Compact mode (horizontal layout) */
  compact?: boolean;
}

/** Chain display metadata */
const CHAIN_LABELS: Record<Chain, { name: string; icon: string }> = {
  arbitrum: { name: 'Arbitrum', icon: '⬡' },
  tron: { name: 'Tron', icon: '◈' },
};

/** Token display icons */
const TOKEN_ICONS: Record<string, string> = {
  usdc: '$',
  usdt: '₮',
  dai: '◈',
};

export function ChainTokenSelector({
  onSelectionChange,
  initialChain = DEFAULT_CHAIN,
  initialToken,
  disabled = false,
  compact = false,
}: ChainTokenSelectorProps) {
  const [chain, setChain] = useState<Chain>(initialChain);
  const [token, setToken] = useState<TokenId>(initialToken ?? DEFAULT_TOKEN[initialChain]);
  const [denomination, setDenomination] = useState<string>('');

  // Available options based on current selection
  const chains = getAvailableChains();
  const tokens = getAvailableTokensForChain(chain);
  const denominations = useMemo(() => getDenominationOptions(chain, token), [chain, token]);

  // Initialize denomination when chain or token changes
  useEffect(() => {
    const defaultPool = getDefaultDenomination(chain, token);
    if (defaultPool) {
      setDenomination(defaultPool.denomination);
    }
  }, [chain, token]);

  // Notify parent of selection changes
  useEffect(() => {
    const selectedPool = denominations.find(d => d.value === denomination)?.pool ?? null;
    onSelectionChange({
      chain,
      token,
      denomination,
      pool: selectedPool,
      gasTokenSymbol: getGasTokenSymbol(chain),
    });
  }, [chain, token, denomination, denominations, onSelectionChange]);

  const handleChainChange = useCallback((newChain: Chain) => {
    setChain(newChain);
    // Reset token to chain's default when switching chains
    setToken(DEFAULT_TOKEN[newChain]);
  }, []);

  const handleTokenChange = useCallback((newToken: TokenId) => {
    setToken(newToken);
  }, []);

  const btnBase = 'flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all';
  const btnActive = 'border-emerald-500 bg-emerald-500/10 text-emerald-400';
  const btnInactive = 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600';
  const btnDisabled = 'opacity-50 cursor-not-allowed';

  return (
    <div className={`space-y-4 ${compact ? 'sm:flex sm:space-y-0 sm:gap-4' : ''}`}>
      {/* Chain Selector */}
      <div className={compact ? 'sm:flex-1' : ''}>
        <label className="block text-sm font-medium text-zinc-400 mb-2">Network</label>
        <div className="flex gap-2">
          {chains.map((c) => (
            <button
              key={c}
              type="button"
              disabled={disabled}
              onClick={() => handleChainChange(c)}
              className={`${btnBase} ${chain === c ? btnActive : btnInactive} ${disabled ? btnDisabled : 'cursor-pointer'}`}
            >
              <span className="mr-1.5">{CHAIN_LABELS[c].icon}</span>
              {CHAIN_LABELS[c].name}
            </button>
          ))}
        </div>
      </div>

      {/* Token Selector */}
      <div className={compact ? 'sm:flex-1' : ''}>
        <label className="block text-sm font-medium text-zinc-400 mb-2">Token</label>
        <div className="flex gap-2">
          {tokens.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={disabled}
              onClick={() => handleTokenChange(t.id)}
              className={`${btnBase} ${token === t.id ? btnActive : btnInactive} ${disabled ? btnDisabled : 'cursor-pointer'}`}
            >
              <span className="mr-1.5">{TOKEN_ICONS[t.id] ?? '●'}</span>
              {t.symbol}
            </button>
          ))}
        </div>
        {tokens.length === 0 && (
          <p className="text-sm text-zinc-500 mt-1">No tokens available on this network</p>
        )}
      </div>

      {/* Denomination Selector */}
      <div className={compact ? 'sm:flex-1' : ''}>
        <label className="block text-sm font-medium text-zinc-400 mb-2">Amount</label>
        <div className="flex gap-2">
          {denominations.map((d) => (
            <button
              key={d.value}
              type="button"
              disabled={disabled}
              onClick={() => setDenomination(d.value)}
              className={`${btnBase} ${denomination === d.value ? btnActive : btnInactive} ${disabled ? btnDisabled : 'cursor-pointer'}`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
