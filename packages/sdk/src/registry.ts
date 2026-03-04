/**
 * Pool Registry — Maps chain + token + denomination to pool configurations.
 * Pool addresses are populated after deployment. Use placeholder addresses (zero) until then.
 */

export type Chain = 'arbitrum' | 'tron';
export type TokenId = 'usdc' | 'usdt' | 'dai';

export interface TokenInfo {
  id: TokenId;
  name: string;
  symbol: string;
  decimals: number;
  /** Token contract address on this chain */
  address: string;
  /** Whether ERC20Pool should check token blacklist on deposit */
  hasBlacklistCheck: boolean;
}

export interface ChainConfig {
  id: Chain;
  name: string;
  /** RPC endpoint */
  rpcUrl: string;
  /** Chain ID (EVM) or network name (Tron) */
  chainId: number | string;
  /** Block explorer URL template. Use {tx} for tx hash placeholder */
  explorerTxUrl: string;
  /** Block explorer URL template for addresses */
  explorerAddressUrl: string;
  /** Available tokens on this chain */
  tokens: TokenInfo[];
  /** Native gas token symbol (ETH for Arbitrum, TRX for Tron) */
  gasTokenSymbol: string;
}

export interface PoolEntry {
  /** Pool contract address */
  address: string;
  /** Token this pool accepts */
  token: TokenId;
  /** Denomination in token's native units (bigint as string for JSON) */
  denomination: string;
  /** Human-readable denomination (e.g., "100 USDC") */
  label: string;
  /** Chain this pool is on */
  chain: Chain;
}

export const CHAIN_CONFIGS: Record<Chain, ChainConfig> = {
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum One',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    chainId: 42161,
    explorerTxUrl: 'https://arbiscan.io/tx/{tx}',
    explorerAddressUrl: 'https://arbiscan.io/address/{address}',
    gasTokenSymbol: 'ETH',
    tokens: [
      {
        id: 'usdc',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        hasBlacklistCheck: true,
      },
      {
        id: 'usdt',
        name: 'Tether USD',
        symbol: 'USDT',
        decimals: 6,
        address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
        hasBlacklistCheck: false, // USDT0 uses isBlocked(), different interface
      },
      {
        id: 'dai',
        name: 'Dai Stablecoin',
        symbol: 'DAI',
        decimals: 18,
        address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
        hasBlacklistCheck: false,
      },
    ],
  },
  tron: {
    id: 'tron',
    name: 'Tron Mainnet',
    rpcUrl: 'https://api.trongrid.io',
    chainId: 'mainnet',
    explorerTxUrl: 'https://tronscan.org/#/transaction/{tx}',
    explorerAddressUrl: 'https://tronscan.org/#/address/{address}',
    gasTokenSymbol: 'TRX',
    tokens: [
      {
        id: 'usdt',
        name: 'Tether USD',
        symbol: 'USDT',
        decimals: 6,
        address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        hasBlacklistCheck: true, // Tron USDT has isBlackListed (capital L)
      },
    ],
  },
};

/**
 * Pool addresses — populated after deployment.
 * Format: chain → token → denomination_label → pool_addresses[]
 *
 * PLACEHOLDER: All zeros until deployment. Update with actual addresses after deploy.
 */
export const POOL_REGISTRY: Record<Chain, Record<TokenId, PoolEntry[]>> = {
  arbitrum: {
    usdc: [
      { address: '0x0000000000000000000000000000000000000000', token: 'usdc', denomination: '10000000', label: '10 USDC', chain: 'arbitrum' },
      { address: '0x0000000000000000000000000000000000000000', token: 'usdc', denomination: '100000000', label: '100 USDC', chain: 'arbitrum' },
      { address: '0x0000000000000000000000000000000000000000', token: 'usdc', denomination: '1000000000', label: '1,000 USDC', chain: 'arbitrum' },
    ],
    usdt: [
      { address: '0x0000000000000000000000000000000000000000', token: 'usdt', denomination: '10000000', label: '10 USDT', chain: 'arbitrum' },
      { address: '0x0000000000000000000000000000000000000000', token: 'usdt', denomination: '100000000', label: '100 USDT', chain: 'arbitrum' },
      { address: '0x0000000000000000000000000000000000000000', token: 'usdt', denomination: '1000000000', label: '1,000 USDT', chain: 'arbitrum' },
    ],
    dai: [
      { address: '0x0000000000000000000000000000000000000000', token: 'dai', denomination: '10000000000000000000', label: '10 DAI', chain: 'arbitrum' },
      { address: '0x0000000000000000000000000000000000000000', token: 'dai', denomination: '100000000000000000000', label: '100 DAI', chain: 'arbitrum' },
      { address: '0x0000000000000000000000000000000000000000', token: 'dai', denomination: '1000000000000000000000', label: '1,000 DAI', chain: 'arbitrum' },
    ],
  },
  tron: {
    usdc: [], // Not available on Tron
    usdt: [
      { address: 'T0000000000000000000000000000000000', token: 'usdt', denomination: '10000000', label: '10 USDT', chain: 'tron' },
      { address: 'T0000000000000000000000000000000000', token: 'usdt', denomination: '100000000', label: '100 USDT', chain: 'tron' },
      { address: 'T0000000000000000000000000000000000', token: 'usdt', denomination: '1000000000', label: '1,000 USDT', chain: 'tron' },
    ],
    dai: [], // Not available on Tron
  },
};

// === Helper functions ===

export function getChainConfig(chain: Chain): ChainConfig {
  return CHAIN_CONFIGS[chain];
}

export function getAvailableChains(): Chain[] {
  return Object.keys(CHAIN_CONFIGS) as Chain[];
}

export function getTokensForChain(chain: Chain): TokenInfo[] {
  return CHAIN_CONFIGS[chain].tokens;
}

export function getPoolsForChainAndToken(chain: Chain, token: TokenId): PoolEntry[] {
  return POOL_REGISTRY[chain][token] ?? [];
}

export function getExplorerTxUrl(chain: Chain, txHash: string): string {
  return CHAIN_CONFIGS[chain].explorerTxUrl.replace('{tx}', txHash);
}

export function getExplorerAddressUrl(chain: Chain, address: string): string {
  return CHAIN_CONFIGS[chain].explorerAddressUrl.replace('{address}', address);
}
