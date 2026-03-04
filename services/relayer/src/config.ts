export interface RelayerConfig {
  // === Arbitrum config (existing) ===
  rpcUrl: string;                    // Arbitrum RPC (e.g., https://arb1.arbitrum.io/rpc)
  relayerPrivateKey: string;         // Hex private key
  port: number;
  maxRelaysPerMinute: number;
  allowedOrigins: string[];
  poolAddresses: string[];           // ERC20Pool contract addresses (0x...)
  usdcAddress: string;               // USDC: 0xaf88d065e77c8cC2239327C5EDb3A432268e5831
  sanctionsOracleAddress: string;    // Chainalysis: 0x40C57923924B5c5c5455c48D93317139ADDaC8fb
  maxGasPrice: bigint;               // Max gas price in wei (safety cap)
  relayerFeePercent: number;         // Fee as % of denomination
  chainId: number;                   // 42161 (mainnet) or 421614 (sepolia)

  // === Arbitrum multi-token pool grouping ===
  usdtAddress: string;               // USDT on Arbitrum
  daiAddress: string;                // DAI on Arbitrum
  /** Pool addresses grouped by token for Arbitrum */
  arbitrumPoolsByToken: Record<string, string[]>;

  // === Tron config ===
  tronEnabled: boolean;              // Whether Tron relay is active
  tronFullHost: string;              // TronGrid URL
  tronPrivateKey: string;            // Tron relayer private key (hex)
  tronPoolAddresses: string[];       // Tron USDT pool addresses (base58)
  tronUsdtAddress: string;           // USDT TRC-20: TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
}

function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value ?? defaultValue!;
}

function getEnvNumber(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid number`);
  }
  return parsed;
}

function getEnvArray(name: string, defaultValue: string[]): string[] {
  const value = process.env[name];
  if (!value) return defaultValue;
  return value.split(',').map(s => s.trim()).filter(s => s.length > 0);
}

export function loadConfig(): RelayerConfig {
  return {
    // Existing Arbitrum fields
    rpcUrl: getEnvVar('ARB_RPC_URL', 'https://arb1.arbitrum.io/rpc'),
    relayerPrivateKey: getEnvVar('RELAYER_PRIVATE_KEY', ''),
    port: getEnvNumber('PORT', 3013),
    maxRelaysPerMinute: getEnvNumber('RATE_LIMIT', 10),
    allowedOrigins: getEnvArray('CORS_ORIGINS', ['*']),
    poolAddresses: getEnvArray('POOL_ADDRESSES', []),
    usdcAddress: getEnvVar('USDC_ADDRESS', '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'),
    sanctionsOracleAddress: getEnvVar('SANCTIONS_ORACLE', '0x40C57923924B5c5c5455c48D93317139ADDaC8fb'),
    maxGasPrice: BigInt(getEnvVar('MAX_GAS_PRICE', '1000000000')), // 1 gwei default
    relayerFeePercent: parseFloat(getEnvVar('RELAYER_FEE_PERCENT', '0.1')),
    chainId: getEnvNumber('CHAIN_ID', 42161),

    // Arbitrum multi-token
    usdtAddress: getEnvVar('USDT_ADDRESS', '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'),
    daiAddress: getEnvVar('DAI_ADDRESS', '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'),
    arbitrumPoolsByToken: {
      usdc: getEnvArray('ARB_USDC_POOLS', []),
      usdt: getEnvArray('ARB_USDT_POOLS', []),
      dai: getEnvArray('ARB_DAI_POOLS', []),
    },

    // Tron
    tronEnabled: getEnvVar('TRON_ENABLED', 'false') === 'true',
    tronFullHost: getEnvVar('TRON_FULL_HOST', 'https://api.trongrid.io'),
    tronPrivateKey: getEnvVar('TRON_PRIVATE_KEY', ''),
    tronPoolAddresses: getEnvArray('TRON_POOL_ADDRESSES', []),
    tronUsdtAddress: getEnvVar('TRON_USDT_ADDRESS', 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'),
  };
}
