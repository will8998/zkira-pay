export interface ApiConfig {
  solanaRpcUrl: string;
  port: number;
  host: string;
  indexIntervalMs: number;
  databaseUrl: string;
  adminPassword: string;
  jwtSecret: string;
  relayerSecret: string; // Shared secret for relayer→API calls
}

export function loadConfig(): ApiConfig {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD environment variable is required');
  }
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return {
    solanaRpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    port: parseInt(process.env.PORT || '3021', 10),
    host: process.env.HOST || '0.0.0.0',
    indexIntervalMs: parseInt(process.env.INDEX_INTERVAL || '10000', 10),
    databaseUrl,
    adminPassword,
    jwtSecret,
    relayerSecret: process.env.RELAYER_SECRET || (() => { throw new Error('RELAYER_SECRET environment variable is required'); })(),
  };
}