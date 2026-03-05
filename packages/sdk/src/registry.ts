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
      { address: '0x98E9D74542f096962936702666a05fafaBfe5faf', token: 'usdc', denomination: '1000000', label: '1 USDC', chain: 'arbitrum' },
      { address: '0x56feE0A13c5B3EBF81c04C5BedE69FfF7bE2b269', token: 'usdc', denomination: '5000000', label: '5 USDC', chain: 'arbitrum' },
      { address: '0x698313719944Ec8e571B4d250e3594e3fd895f97', token: 'usdc', denomination: '10000000', label: '10 USDC', chain: 'arbitrum' },
      { address: '0xA628af5b22Ad9c19BA756e40EdA77e6A3E05CF44', token: 'usdc', denomination: '25000000', label: '25 USDC', chain: 'arbitrum' },
      { address: '0x37c09933CaddEE27b46a9F64Be3CBa44782BC890', token: 'usdc', denomination: '50000000', label: '50 USDC', chain: 'arbitrum' },
      { address: '0x5064D30988B456A81C2e119ab52818e4a1A5c5Ed', token: 'usdc', denomination: '100000000', label: '100 USDC', chain: 'arbitrum' },
      { address: '0x3e202D832F710E83Ea542377621BF63694A30235', token: 'usdc', denomination: '250000000', label: '250 USDC', chain: 'arbitrum' },
      { address: '0x1BBb974451Ce509743e5787aba8090f95b38F257', token: 'usdc', denomination: '500000000', label: '500 USDC', chain: 'arbitrum' },
      { address: '0x7221170F93dFBB9F017c43bf6027b12aD8072889', token: 'usdc', denomination: '1000000000', label: '1,000 USDC', chain: 'arbitrum' },
      { address: '0x095CF170985D3f8C6317450BAeB8B613896b8b4d', token: 'usdc', denomination: '2500000000', label: '2,500 USDC', chain: 'arbitrum' },
      { address: '0x5BB495F2e9593cE19824ECD3dDb214f06834b2b9', token: 'usdc', denomination: '5000000000', label: '5,000 USDC', chain: 'arbitrum' },
      { address: '0xaf733d07794F1D9971540E167ad721E58d2fb2f5', token: 'usdc', denomination: '10000000000', label: '10,000 USDC', chain: 'arbitrum' },
      { address: '0x9B40f228548e4b1a4Fbdb24657c4778918639795', token: 'usdc', denomination: '25000000000', label: '25,000 USDC', chain: 'arbitrum' },
      { address: '0xE74c1706E130bE84b942d219248952C448D7fB1b', token: 'usdc', denomination: '50000000000', label: '50,000 USDC', chain: 'arbitrum' },
      { address: '0xAF0024aCBEa126FaD0D75861DD2F9c300DF12A56', token: 'usdc', denomination: '100000000000', label: '100,000 USDC', chain: 'arbitrum' },
      { address: '0x11892Ca87f30aea15DB031Cfe5F9cF34069725BA', token: 'usdc', denomination: '1000000000000', label: '1,000,000 USDC', chain: 'arbitrum' },
    ],
    usdt: [
      { address: '0xe12427fBb72ac9cbdc72Bf5eB183edF566bD5f87', token: 'usdt', denomination: '1000000', label: '1 USDT', chain: 'arbitrum' },
      { address: '0x74781D4c8dbfba55BBFEBeA22B914ca38b0794eB', token: 'usdt', denomination: '5000000', label: '5 USDT', chain: 'arbitrum' },
      { address: '0x03593c41fb085f7eEd8a7201A1572A3710b9961F', token: 'usdt', denomination: '10000000', label: '10 USDT', chain: 'arbitrum' },
      { address: '0xF701C32C16C40F92f00a71684A9E4d0E340E71dA', token: 'usdt', denomination: '25000000', label: '25 USDT', chain: 'arbitrum' },
      { address: '0x3edF8C88EdF0495C9F123eEa9F4b8Dd5d11f1103', token: 'usdt', denomination: '50000000', label: '50 USDT', chain: 'arbitrum' },
      { address: '0x8cA0e84c4C2368908B6a65De5Bd5aaf1b0237f10', token: 'usdt', denomination: '100000000', label: '100 USDT', chain: 'arbitrum' },
      { address: '0xE8F551b01beAd2C2ddb9E0713ea69C54Ea7601D3', token: 'usdt', denomination: '250000000', label: '250 USDT', chain: 'arbitrum' },
      { address: '0x01ccD93f52c2BF05Ad5F5d229413663119f66b8C', token: 'usdt', denomination: '500000000', label: '500 USDT', chain: 'arbitrum' },
      { address: '0x4b9Ec2255074AeD546365b21e7758eFc39C33D70', token: 'usdt', denomination: '1000000000', label: '1,000 USDT', chain: 'arbitrum' },
      { address: '0x7492A2804D2C364A151CDc5e2DA4cf3E99809502', token: 'usdt', denomination: '2500000000', label: '2,500 USDT', chain: 'arbitrum' },
      { address: '0x72a9Bcb3CCd8B3746f67eb4E7295294eaFfa3cDb', token: 'usdt', denomination: '5000000000', label: '5,000 USDT', chain: 'arbitrum' },
      { address: '0x166a5336422a0d49ac0Ea54a461405E77D7B023f', token: 'usdt', denomination: '10000000000', label: '10,000 USDT', chain: 'arbitrum' },
      { address: '0x36677AE61490756D48e64D9C7BB994149a7f9470', token: 'usdt', denomination: '25000000000', label: '25,000 USDT', chain: 'arbitrum' },
      { address: '0x7067BEC5115335aB379b10F1F61ac37d739C82D9', token: 'usdt', denomination: '50000000000', label: '50,000 USDT', chain: 'arbitrum' },
      { address: '0x97C7596EAAd77fEc1fC488e73eA900C38BF79ee8', token: 'usdt', denomination: '100000000000', label: '100,000 USDT', chain: 'arbitrum' },
      { address: '0x86bd50B606730631221Cc651E7C8ecdc513D86e9', token: 'usdt', denomination: '1000000000000', label: '1,000,000 USDT', chain: 'arbitrum' },
    ],
    dai: [
      { address: '0xd6576Ffe8CDb46F68B64043F008b967675401B3e', token: 'dai', denomination: '1000000000000000000', label: '1 DAI', chain: 'arbitrum' },
      { address: '0x60d6D80c7F1B7ae2695C060Cb8DcdA535BB37aFF', token: 'dai', denomination: '5000000000000000000', label: '5 DAI', chain: 'arbitrum' },
      { address: '0xc1B9dAeFdB2daF2e931ef1251ebDF6D83976EC0a', token: 'dai', denomination: '10000000000000000000', label: '10 DAI', chain: 'arbitrum' },
      { address: '0x23fCf05D980782f1caFB7c398C162221036101E8', token: 'dai', denomination: '25000000000000000000', label: '25 DAI', chain: 'arbitrum' },
      { address: '0xC1Ed03b9d482a330e283eB64CB19B52139a7aBc1', token: 'dai', denomination: '50000000000000000000', label: '50 DAI', chain: 'arbitrum' },
      { address: '0xa954D95D388e565c8f4377132a8e0687935AB498', token: 'dai', denomination: '100000000000000000000', label: '100 DAI', chain: 'arbitrum' },
      { address: '0xE3C521A26C147f8598779a6095612224B8e23f25', token: 'dai', denomination: '250000000000000000000', label: '250 DAI', chain: 'arbitrum' },
      { address: '0x363302036B8A52Bc57d5699877cd37b5859f549C', token: 'dai', denomination: '500000000000000000000', label: '500 DAI', chain: 'arbitrum' },
      { address: '0x401097a6C1fCBe3DEf9eD2A949745A138D4663E5', token: 'dai', denomination: '1000000000000000000000', label: '1,000 DAI', chain: 'arbitrum' },
      { address: '0x8FD175F101Fccf2fCBC1BbF2A65747c1Cd3aAd37', token: 'dai', denomination: '2500000000000000000000', label: '2,500 DAI', chain: 'arbitrum' },
      { address: '0xC24c358d083C92b321f07cbFE3b33e0aa1a51729', token: 'dai', denomination: '5000000000000000000000', label: '5,000 DAI', chain: 'arbitrum' },
      { address: '0x39feBE8C14a2150253183d2590b567B770C82b76', token: 'dai', denomination: '10000000000000000000000', label: '10,000 DAI', chain: 'arbitrum' },
      { address: '0x4cDC1047E83DA732CE0cD535154E5BA1e756EF68', token: 'dai', denomination: '25000000000000000000000', label: '25,000 DAI', chain: 'arbitrum' },
      { address: '0xb2b42A6844D615C6158A560684B87d152AE828a1', token: 'dai', denomination: '50000000000000000000000', label: '50,000 DAI', chain: 'arbitrum' },
      { address: '0xAb6c66070C5Bb853cc1D3719E43854f33D2625be', token: 'dai', denomination: '100000000000000000000000', label: '100,000 DAI', chain: 'arbitrum' },
      { address: '0x1A71834AE58565ff49EFd1c0652e71C0A6277a6E', token: 'dai', denomination: '1000000000000000000000000', label: '1,000,000 DAI', chain: 'arbitrum' },
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
