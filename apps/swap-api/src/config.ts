export interface AppConfig {
  port: number;
  rocketxApiKey: string;
  rocketxBaseUrl: string;
  corsOrigins: string[];
  rateLimit: {
    maxRequests: number;
    windowMs: number;
  };
}

export function loadConfig(): AppConfig {
  const port = parseInt(process.env.PORT || '3014', 10);
  const rocketxApiKey = process.env.ROCKETX_API_KEY;

  if (!rocketxApiKey) {
    throw new Error('ROCKETX_API_KEY environment variable is required');
  }

  return {
    port,
    rocketxApiKey,
    rocketxBaseUrl: process.env.ROCKETX_BASE_URL || 'https://api.rocketx.exchange',
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3015,https://swap.zkira.xyz').split(','),
    rateLimit: {
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '150', 10),
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    },
  };
}