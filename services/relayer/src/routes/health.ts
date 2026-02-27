import { Hono } from 'hono';
import { Connection } from '@solana/web3.js';
import { RelayerWallet } from '../services/wallet.js';

export function createHealthRoutes(connection: Connection, wallet: RelayerWallet) {
  const health = new Hono();

  health.get('/health', async (c) => {
    let solanaConnection = false;
    let walletBalance: number | undefined;

    try {
      const slot = await connection.getSlot();
      solanaConnection = slot > 0;
      walletBalance = await wallet.checkBalance(connection);
    } catch {
      solanaConnection = false;
    }

    const status = solanaConnection ? 'healthy' : 'unhealthy';

    return c.json({
      status,
      timestamp: Date.now(),
      version: '0.1.0',
      solanaConnection,
      walletBalance,
    }, solanaConnection ? 200 : 503);
  });

  return health;
}
