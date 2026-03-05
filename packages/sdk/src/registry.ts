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
      { address: '0x971Ee437bD29423675aD8e0b424719075bf02289', token: 'usdc', denomination: '10000000', label: '10 USDC', chain: 'arbitrum' },
      { address: '0x56Dd6aa7C712E39933627e27c5DF330Fad8Fe1a0', token: 'usdc', denomination: '100000000', label: '100 USDC', chain: 'arbitrum' },
      { address: '0x87040106b478BAEDeFe744e63B017A8B7F3a3DF0', token: 'usdc', denomination: '1000000000', label: '1,000 USDC', chain: 'arbitrum' },
      { address: '0x646147469fe3B43883879E9aD895f66c42897B94', token: 'usdc', denomination: '10000000000', label: '10,000 USDC', chain: 'arbitrum' },
      { address: '0x3B659Cb5ceB70fA164086ADBC2a6956Ef2c7d89F', token: 'usdc', denomination: '100000000000', label: '100,000 USDC', chain: 'arbitrum' },
      { address: '0x70a004d43AD8911Ad0807e41eF360130CFeB0cd8', token: 'usdc', denomination: '1000000000000', label: '1,000,000 USDC', chain: 'arbitrum' },
    ],
    usdt: [
      { address: '0x7ad5C9Edd3b76F4D8C8341d318E3c84e1C7A1d8E', token: 'usdt', denomination: '10000000', label: '10 USDT', chain: 'arbitrum' },
      { address: '0xb98AA174426260f75ce856bC6740eE194FDA71b6', token: 'usdt', denomination: '100000000', label: '100 USDT', chain: 'arbitrum' },
      { address: '0x7D9e7acD6D6Edab2a50E0b56dEC78fE52c338E47', token: 'usdt', denomination: '1000000000', label: '1,000 USDT', chain: 'arbitrum' },
      { address: '0xC44E7A00D765064fDC01Bee5398a957B772B109B', token: 'usdt', denomination: '10000000000', label: '10,000 USDT', chain: 'arbitrum' },
      { address: '0x5E2945E6bB98204e47ceB2D3313F32e1fc279ed7', token: 'usdt', denomination: '100000000000', label: '100,000 USDT', chain: 'arbitrum' },
      { address: '0x24f70D4027E57C74C2Ea2191940DbdaDc1248b78', token: 'usdt', denomination: '1000000000000', label: '1,000,000 USDT', chain: 'arbitrum' },
    ],
    dai: [
      { address: '0x2F1C3549559a2d0b4d431FE9D17BAfFB2B3c2069', token: 'dai', denomination: '10000000000000000000', label: '10 DAI', chain: 'arbitrum' },
      { address: '0x608803d06E1C4755F322C11728Af1C93D096B50e', token: 'dai', denomination: '100000000000000000000', label: '100 DAI', chain: 'arbitrum' },
      { address: '0x3d0f200dCeFD067E10Ed59b5f2027c27C89A0931', token: 'dai', denomination: '1000000000000000000000', label: '1,000 DAI', chain: 'arbitrum' },
      { address: '0xF939758991CA8028D2E26C46263B12471956a98d', token: 'dai', denomination: '10000000000000000000000', label: '10,000 DAI', chain: 'arbitrum' },
      { address: '0x7f1EedE6146954FbA12De42c40026aB991505752', token: 'dai', denomination: '100000000000000000000000', label: '100,000 DAI', chain: 'arbitrum' },
      { address: '0x50e578E736551415058fB0fc99114176036D2A5f', token: 'dai', denomination: '1000000000000000000000000', label: '1,000,000 DAI', chain: 'arbitrum' },
    ],
  },
  tron: {
    usdc: [], // Not available on Tron
    usdt: [
      { address: 'T0000000000000000000000000000000000', token: 'usdt', denomination: '10000000', label: '10 USDT', chain: 'tron' },
      { address: 'T0000000000000000000000000000000000', token: 'usdt', denomination: '100000000', label: '100 USDT', chain: 'tron' },
      { address: 'T0000000000000000000000000000000000', token: 'usdt', denomination: '1000000000', label: '1,000 USDT', chain: 'tron' },
      { address: 'T0000000000000000000000000000000000', token: 'usdt', denomination: '10000000000', label: '10,000 USDT', chain: 'tron' },
      { address: 'T0000000000000000000000000000000000', token: 'usdt', denomination: '100000000000', label: '100,000 USDT', chain: 'tron' },
      { address: 'T0000000000000000000000000000000000', token: 'usdt', denomination: '1000000000000', label: '1,000,000 USDT', chain: 'tron' },
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
