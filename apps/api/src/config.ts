export interface ApiConfig {
  solanaRpcUrl: string;
  port: number;
  indexIntervalMs: number;
  databaseUrl: string;
  adminPassword: string;
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
  return {
    solanaRpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    port: parseInt(process.env.PORT || '3021', 10),
    indexIntervalMs: parseInt(process.env.INDEX_INTERVAL || '10000', 10),
    databaseUrl,
    adminPassword,
  };
}