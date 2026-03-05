/**
 * Pool Registry — Maps chain + token + denomination to pool configurations.
 * Pool addresses are populated after deployment. Use placeholder addresses (zero) until then.
 */

export type NetworkMode = 'mainnet' | 'testnet';
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

/** Testnet chain configs (Arbitrum Sepolia, Tron Nile) */
export const CHAIN_CONFIGS_TESTNET: Record<Chain, ChainConfig> = {
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum Sepolia',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    chainId: 421614,
    explorerTxUrl: 'https://sepolia.arbiscan.io/tx/{tx}',
    explorerAddressUrl: 'https://sepolia.arbiscan.io/address/{address}',
    gasTokenSymbol: 'ETH',
    tokens: [
      {
        id: 'usdc',
        name: 'USD Coin (Test)',
        symbol: 'USDC',
        decimals: 6,
        address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
        hasBlacklistCheck: false,
      },
      {
        id: 'usdt',
        name: 'Tether USD (Test)',
        symbol: 'USDT',
        decimals: 6,
        address: '0x93d67359a0f6f117150a70fdde6bb96782497248',
        hasBlacklistCheck: false,
      },
      {
        id: 'dai',
        name: 'Dai Stablecoin (Test)',
        symbol: 'DAI',
        decimals: 18,
        address: '0x9bc8388dd439fa3365b1f78a81242adbb4677759',
        hasBlacklistCheck: false,
      },
    ],
  },
  tron: {
    id: 'tron',
    name: 'Tron Nile Testnet',
    rpcUrl: 'https://nile.trongrid.io',
    chainId: 'nile',
    explorerTxUrl: 'https://nile.tronscan.org/#/transaction/{tx}',
    explorerAddressUrl: 'https://nile.tronscan.org/#/address/{address}',
    gasTokenSymbol: 'TRX',
    tokens: [
      {
        id: 'usdt',
        name: 'Tether USD (Test)',
        symbol: 'USDT',
        decimals: 6,
        address: 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj', // Nile USDT
        hasBlacklistCheck: false,
      },
    ],
  },
};

/**
 * Mainnet pool addresses — NOT YET DEPLOYED.
 * These will be populated after mainnet deployment.
 */
export const POOL_REGISTRY: Record<Chain, Record<TokenId, PoolEntry[]>> = {
  arbitrum: {
    usdc: [],
    usdt: [],
    dai: [],
  },
  tron: {
    usdc: [],
    usdt: [
      { address: 'T0000000000000000000000000000000000', token: 'usdt', denomination: '10000000', label: '10 USDT', chain: 'tron' },
      { address: 'T0000000000000000000000000000000000', token: 'usdt', denomination: '100000000', label: '100 USDT', chain: 'tron' },
      { address: 'T0000000000000000000000000000000000', token: 'usdt', denomination: '1000000000', label: '1,000 USDT', chain: 'tron' },
      { address: 'T0000000000000000000000000000000000', token: 'usdt', denomination: '10000000000', label: '10,000 USDT', chain: 'tron' },
      { address: 'T0000000000000000000000000000000000', token: 'usdt', denomination: '100000000000', label: '100,000 USDT', chain: 'tron' },
      { address: 'T0000000000000000000000000000000000', token: 'usdt', denomination: '1000000000000', label: '1,000,000 USDT', chain: 'tron' },
    ],
    dai: [],
  },
};

/**
 * Testnet pool addresses — deployed on Arbitrum Sepolia (421614).
 * Source: contracts/arbitrum/deployment-421614.json
 */
export const POOL_REGISTRY_TESTNET: Record<Chain, Record<TokenId, PoolEntry[]>> = {
  arbitrum: {
    usdc: [
      { address: '0x5483f032b8dd01e1Ab6742e9F62E2764A0b2B03F', token: 'usdc', denomination: '1000000', label: '1 USDC', chain: 'arbitrum' },
      { address: '0xE8e00C8E7359920cf347B60d4C16Dd164D1F3044', token: 'usdc', denomination: '5000000', label: '5 USDC', chain: 'arbitrum' },
      { address: '0xB4290BF0CF0E489aEba2D74F99aD8B233C0bBe65', token: 'usdc', denomination: '10000000', label: '10 USDC', chain: 'arbitrum' },
      { address: '0x4e56A5D0458f00F7a617b4E8B79D212175579Da6', token: 'usdc', denomination: '25000000', label: '25 USDC', chain: 'arbitrum' },
      { address: '0x5AfC12fC507175F30d8811c7Faf4567124287Cbf', token: 'usdc', denomination: '50000000', label: '50 USDC', chain: 'arbitrum' },
      { address: '0x405DCa143e2787a35EeF0228bD1b246eAfa9dFc6', token: 'usdc', denomination: '100000000', label: '100 USDC', chain: 'arbitrum' },
      { address: '0x850294c718d9f259331A51ce9e943FeC7FE49d74', token: 'usdc', denomination: '250000000', label: '250 USDC', chain: 'arbitrum' },
      { address: '0xf70f408D6564A3a01241966A5c9e938a8ef03351', token: 'usdc', denomination: '500000000', label: '500 USDC', chain: 'arbitrum' },
      { address: '0x0aED1B6577A604FD78fc78F5283E57a1c30eCB96', token: 'usdc', denomination: '1000000000', label: '1,000 USDC', chain: 'arbitrum' },
      { address: '0x340f68E89Baeb0c485b9309BC226a5000c2f5e42', token: 'usdc', denomination: '2500000000', label: '2,500 USDC', chain: 'arbitrum' },
      { address: '0x042562e064C4fE60847a802CC0760AED7A78ee78', token: 'usdc', denomination: '5000000000', label: '5,000 USDC', chain: 'arbitrum' },
      { address: '0x92f4D0Fe9cDaa19c2C25065168672cc54C7D113d', token: 'usdc', denomination: '10000000000', label: '10,000 USDC', chain: 'arbitrum' },
      { address: '0x648eF82C5161278133B4a0D31Cb18169bC3abb15', token: 'usdc', denomination: '25000000000', label: '25,000 USDC', chain: 'arbitrum' },
      { address: '0xBD17F019d0C88AE87DF1B5C29398455f2BbD913D', token: 'usdc', denomination: '50000000000', label: '50,000 USDC', chain: 'arbitrum' },
      { address: '0x4b6f57314028daE8eAA5953D6f15a1AB685989E0', token: 'usdc', denomination: '100000000000', label: '100,000 USDC', chain: 'arbitrum' },
      { address: '0xC694B11a22c045E7666EA84aa242C0207E9b63Bc', token: 'usdc', denomination: '1000000000000', label: '1,000,000 USDC', chain: 'arbitrum' },
    ],
    usdt: [
      { address: '0x6158F93F549E6c722060F8A17f5A57932dC6FD96', token: 'usdt', denomination: '1000000', label: '1 USDT', chain: 'arbitrum' },
      { address: '0x54764bcE2aCd3cDdADde8d0707d3DC7CE018EcC5', token: 'usdt', denomination: '5000000', label: '5 USDT', chain: 'arbitrum' },
      { address: '0x23d7eb0029c894E540321FFf8d6aa82EF3A5dC60', token: 'usdt', denomination: '10000000', label: '10 USDT', chain: 'arbitrum' },
      { address: '0x73425a2B7d5416b20cD261b5fc99FA0b548b19C4', token: 'usdt', denomination: '25000000', label: '25 USDT', chain: 'arbitrum' },
      { address: '0xe41b9Eafcc3C2Fe3dE81d8a3c7b17e066702aBec', token: 'usdt', denomination: '50000000', label: '50 USDT', chain: 'arbitrum' },
      { address: '0xC85400B009765C4bF5bC1198F3202Bd8a8a8837C', token: 'usdt', denomination: '100000000', label: '100 USDT', chain: 'arbitrum' },
      { address: '0xc9Ad6311c7091B98debDcccAea1aC2264eC9de23', token: 'usdt', denomination: '250000000', label: '250 USDT', chain: 'arbitrum' },
      { address: '0xEf7fA6C4258b6CD4BB48a1699CCF4049FB43932d', token: 'usdt', denomination: '500000000', label: '500 USDT', chain: 'arbitrum' },
      { address: '0xdc989736384175D9661CD7D860545Df2d0985D45', token: 'usdt', denomination: '1000000000', label: '1,000 USDT', chain: 'arbitrum' },
      { address: '0x2695E59D510d6315cB8799e9481d86e7e21e4D73', token: 'usdt', denomination: '2500000000', label: '2,500 USDT', chain: 'arbitrum' },
      { address: '0x91273cC2648cB6072878C561dd4a2b5D88D05A6F', token: 'usdt', denomination: '5000000000', label: '5,000 USDT', chain: 'arbitrum' },
      { address: '0x1B4db8d75A1F1C5f5893C2cE6fF7e6149560f9a6', token: 'usdt', denomination: '10000000000', label: '10,000 USDT', chain: 'arbitrum' },
      { address: '0x3f98e8605b99B35650B165a7609dAea8aB627977', token: 'usdt', denomination: '25000000000', label: '25,000 USDT', chain: 'arbitrum' },
      { address: '0x8aDB131e74ACD97FC26350dF44152D4EAa4BCF6E', token: 'usdt', denomination: '50000000000', label: '50,000 USDT', chain: 'arbitrum' },
      { address: '0x35337A273D747E946159C25f3fc933bf45D4AEAE', token: 'usdt', denomination: '100000000000', label: '100,000 USDT', chain: 'arbitrum' },
      { address: '0x1c7c82E367bB236d4181fCACe25AC2F8A7EcE159', token: 'usdt', denomination: '1000000000000', label: '1,000,000 USDT', chain: 'arbitrum' },
    ],
    dai: [
      { address: '0xeeEE4c84A29f332FD935ef1639519DD6ba3A88D3', token: 'dai', denomination: '1000000000000000000', label: '1 DAI', chain: 'arbitrum' },
      { address: '0xd45a8B3c89221c40743529f0E0984841B3b365F9', token: 'dai', denomination: '5000000000000000000', label: '5 DAI', chain: 'arbitrum' },
      { address: '0xeb1B56D8aEA4C01f718573DF937C6070E571894C', token: 'dai', denomination: '10000000000000000000', label: '10 DAI', chain: 'arbitrum' },
      { address: '0x5cAde5Dd14b290292B1623a409D45d93472Aaf2c', token: 'dai', denomination: '25000000000000000000', label: '25 DAI', chain: 'arbitrum' },
      { address: '0xEf7fA19E394A1EE32DFdA8548861cB998c506191', token: 'dai', denomination: '50000000000000000000', label: '50 DAI', chain: 'arbitrum' },
      { address: '0xfAD423f82C1Eaf877a23Ef343AA19DA96A719322', token: 'dai', denomination: '100000000000000000000', label: '100 DAI', chain: 'arbitrum' },
      { address: '0xadbCA98F162FB828109fE86652D32C23e4a27F1F', token: 'dai', denomination: '250000000000000000000', label: '250 DAI', chain: 'arbitrum' },
      { address: '0xE6953CcA127B50d250D413cA9D4b8E1Ded55A693', token: 'dai', denomination: '500000000000000000000', label: '500 DAI', chain: 'arbitrum' },
      { address: '0xc9A79012cCFE6723C0f360375dd26158DBE5b0Ce', token: 'dai', denomination: '1000000000000000000000', label: '1,000 DAI', chain: 'arbitrum' },
      { address: '0x8eE7bA79526f2e0E0369206B22D70bF46fB3d3dD', token: 'dai', denomination: '2500000000000000000000', label: '2,500 DAI', chain: 'arbitrum' },
      { address: '0x8888D2E448f9082914f1C0e9ad5498C87F24BfC0', token: 'dai', denomination: '5000000000000000000000', label: '5,000 DAI', chain: 'arbitrum' },
      { address: '0xEE71B90C71183acC29512A994Fe719c17A6F2fA6', token: 'dai', denomination: '10000000000000000000000', label: '10,000 DAI', chain: 'arbitrum' },
      { address: '0xcff965731c0D7688Dee88Df56339d42CAB3e7ED9', token: 'dai', denomination: '25000000000000000000000', label: '25,000 DAI', chain: 'arbitrum' },
      { address: '0x847b833f2dC4a1C76443f396beF3873CeeF0124D', token: 'dai', denomination: '50000000000000000000000', label: '50,000 DAI', chain: 'arbitrum' },
      { address: '0x38A9881667d8222cE585c23a185706D1946142eA', token: 'dai', denomination: '100000000000000000000000', label: '100,000 DAI', chain: 'arbitrum' },
      { address: '0xc755f72fb7640B2B4dC5CFC5886d82897f97a1df', token: 'dai', denomination: '1000000000000000000000000', label: '1,000,000 DAI', chain: 'arbitrum' },
    ],
  },
  tron: {
    usdc: [],
    usdt: [],
    dai: [],
  },
};

// === Helper functions ===

function getConfigs(mode: NetworkMode = 'mainnet') {
  return mode === 'testnet'
    ? { chains: CHAIN_CONFIGS_TESTNET, pools: POOL_REGISTRY_TESTNET }
    : { chains: CHAIN_CONFIGS, pools: POOL_REGISTRY };
}

export function getChainConfig(chain: Chain, mode: NetworkMode = 'mainnet'): ChainConfig {
  return getConfigs(mode).chains[chain];
}

export function getAvailableChains(mode: NetworkMode = 'mainnet'): Chain[] {
  return Object.keys(getConfigs(mode).chains) as Chain[];
}

export function getTokensForChain(chain: Chain, mode: NetworkMode = 'mainnet'): TokenInfo[] {
  return getConfigs(mode).chains[chain].tokens;
}

export function getPoolsForChainAndToken(chain: Chain, token: TokenId, mode: NetworkMode = 'mainnet'): PoolEntry[] {
  return getConfigs(mode).pools[chain][token] ?? [];
}

export function getExplorerTxUrl(chain: Chain, txHash: string, mode: NetworkMode = 'mainnet'): string {
  return getConfigs(mode).chains[chain].explorerTxUrl.replace('{tx}', txHash);
}

export function getExplorerAddressUrl(chain: Chain, address: string, mode: NetworkMode = 'mainnet'): string {
  return getConfigs(mode).chains[chain].explorerAddressUrl.replace('{address}', address);
}
