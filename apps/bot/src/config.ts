export interface BotConfig {
  botToken: string;
  solanaRpcUrl: string;
  payAppUrl: string;
  apiUrl: string;
  mode: 'polling' | 'webhook';
  webhookDomain: string;
  webhookPort: number;
  webhookSecret: string;
}

export function loadConfig(): BotConfig {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN environment variable is required');
  }

  const mode = (process.env.BOT_MODE || 'polling') as 'polling' | 'webhook';

  const webhookDomain = process.env.WEBHOOK_DOMAIN || '';
  if (mode === 'webhook' && !webhookDomain) {
    throw new Error('WEBHOOK_DOMAIN is required when BOT_MODE=webhook');
  }

  return {
    botToken,
    solanaRpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    payAppUrl: process.env.PAY_APP_URL || 'https://app.zkira.xyz',
    apiUrl: process.env.API_URL || 'http://localhost:3012',
    mode,
    webhookDomain,
    webhookPort: parseInt(process.env.WEBHOOK_PORT || '3014', 10),
    webhookSecret: process.env.WEBHOOK_SECRET || '',
  };
}
