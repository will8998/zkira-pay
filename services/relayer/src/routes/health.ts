import { Hono } from 'hono';
import { RelayerWallet } from '../services/wallet.js';
import type { HealthResponse } from '../types.js';

export function createHealthRoutes(wallet: RelayerWallet) {
  const health = new Hono();

  health.get('/health', async (c) => {
    let arbConnection = false;
    let walletBalance: string | undefined;

    try {
      arbConnection = await wallet.isConnected();
      walletBalance = await wallet.checkBalance();
    } catch {
      arbConnection = false;
    }

    const status = arbConnection ? 'healthy' : 'unhealthy';

    const response: HealthResponse = {
      status,
      timestamp: Date.now(),
      version: '0.1.0',
      arbConnection,
      walletBalance,
      relayerAddress: wallet.address,
    };

    return c.json(response, arbConnection ? 200 : 503);
  });

  return health;
}
