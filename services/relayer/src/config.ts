export interface RelayerConfig {
  solanaRpcUrl: string;
  relayerPrivateKey: string;
  port: number;
  maxRelaysPerMinute: number;
  allowedOrigins: string[];
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
    solanaRpcUrl: getEnvVar('SOLANA_RPC_URL', 'https://api.devnet.solana.com'),
    relayerPrivateKey: getEnvVar('RELAYER_PRIVATE_KEY', ''),
    port: getEnvNumber('PORT', 3001),
    maxRelaysPerMinute: getEnvNumber('RATE_LIMIT', 10),
    allowedOrigins: getEnvArray('CORS_ORIGINS', ['*']),
  };
}
