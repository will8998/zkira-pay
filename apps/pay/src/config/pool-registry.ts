/**
 * Frontend Pool Registry — Re-exports SDK pool registry with UI-specific helpers.
 *
 * This module bridges the SDK's pool registry (chain/token/denomination mappings)
 * with the frontend's React components. Provides convenience functions for
 * the ChainTokenSelector, DepositWizard, and WithdrawWizard components.
 */

import {
  CHAIN_CONFIGS,
  POOL_REGISTRY,
  getChainConfig,
  getAvailableChains,
  getTokensForChain,
  getPoolsForChainAndToken,
  getExplorerTxUrl,
  getExplorerAddressUrl,
  type Chain,
  type TokenId,
  type ChainConfig,
  type TokenInfo,
  type PoolEntry,
} from '@zkira/sdk';

// Re-export everything from SDK registry
export {
  CHAIN_CONFIGS,
  POOL_REGISTRY,
  getChainConfig,
  getAvailableChains,
  getTokensForChain,
  getPoolsForChainAndToken,
  getExplorerTxUrl,
  getExplorerAddressUrl,
  type Chain,
  type TokenId,
  type ChainConfig,
  type TokenInfo,
  type PoolEntry,
};

/** Default chain selection (Arbitrum is primary) */
export const DEFAULT_CHAIN: Chain = 'arbitrum';

/** Default token per chain */
export const DEFAULT_TOKEN: Record<Chain, TokenId> = {
  arbitrum: 'usdc',
  tron: 'usdt',
};

/**
 * Get the default denomination for a chain/token pair.
 * Returns the middle denomination (100 units) if available, otherwise the first.
 */
export function getDefaultDenomination(
  chain: Chain,
  token: TokenId
): PoolEntry | null {
  const pools = getPoolsForChainAndToken(chain, token);
  if (pools.length === 0) return null;
  // Prefer the 100-unit denomination (index 1) as default
  return pools.length > 1 ? pools[1] : pools[0];
}

/**
 * Check if a chain/token combination is available (has pools configured).
 */
export function isTokenAvailableOnChain(chain: Chain, token: TokenId): boolean {
  return getPoolsForChainAndToken(chain, token).length > 0;
}

/**
 * Get all available tokens for a chain that actually have pools.
 * Filters out tokens with empty pool arrays.
 */
export function getAvailableTokensForChain(chain: Chain): TokenInfo[] {
  return getTokensForChain(chain).filter((t) =>
    isTokenAvailableOnChain(chain, t.id)
  );
}

/**
 * Find a specific pool by chain, token, and denomination string.
 * Returns the first matching pool or null.
 */
export function findPool(
  chain: Chain,
  token: TokenId,
  denomination: string
): PoolEntry | null {
  const pools = getPoolsForChainAndToken(chain, token);
  return pools.find((p) => p.denomination === denomination) ?? null;
}

/**
 * Get denomination options formatted for UI display.
 * Returns array of { value: denomination, label: "100 USDC" } objects.
 */
export function getDenominationOptions(
  chain: Chain,
  token: TokenId
): Array<{ value: string; label: string; pool: PoolEntry }> {
  const pools = getPoolsForChainAndToken(chain, token);
  return pools.map((p) => ({
    value: p.denomination,
    label: p.label,
    pool: p,
  }));
}

/**
 * Get the gas token symbol for a chain (ETH for Arbitrum, TRX for Tron).
 */
export function getGasTokenSymbol(chain: Chain): string {
  return getChainConfig(chain).gasTokenSymbol;
}

/**
 * Format a pool address for display (truncated).
 */
export function formatPoolAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
