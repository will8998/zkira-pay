import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { JsonRpcProvider } from 'ethers';
import { loadConfig } from './config.js';
import { RelayerWallet } from './services/wallet.js';
import { createHealthRoutes } from './routes/health.js';
import { createRelayRoutes } from './routes/relay.js';
import { createTronRelayRoutes } from './routes/relay-tron.js';
import { TronRelayerWallet } from './services/wallet-tron.js';
import { createSessionRoutes } from './routes/session.js';
import { createRateLimitMiddleware } from './middleware/rate-limit.js';

const config = loadConfig();

// Initialize Arbitrum provider
const provider = new JsonRpcProvider(config.rpcUrl, config.chainId);

// Initialize relayer wallet with ethers.js
let wallet: RelayerWallet;
if (config.relayerPrivateKey) {
  wallet = new RelayerWallet(config.relayerPrivateKey, provider);
} else {
  console.warn('RELAYER_PRIVATE_KEY not set — relay endpoints will fail');
  wallet = null!;
}

// Create Hono app
const app = new Hono();

// Global middleware
app.use('*', cors({ origin: config.allowedOrigins }));
app.use('*', logger());

// Rate limiting on relay endpoints
const rateLimitMiddleware = createRateLimitMiddleware(config.maxRelaysPerMinute);
app.use('/relay/*', rateLimitMiddleware);
app.use('/session/withdraw', rateLimitMiddleware);

// Routes
app.route('/', createHealthRoutes(wallet));
app.route('/relay', createRelayRoutes(wallet, config));
app.route('/session', createSessionRoutes(wallet, config));

// Tron relay routes (conditional — only if Tron is configured)
let tronWallet: TronRelayerWallet | null = null;
if (config.tronPrivateKey && config.tronFullHost) {
  TronRelayerWallet.create(config.tronPrivateKey, config.tronFullHost)
    .then((tw) => {
      tronWallet = tw;
      app.route('/tron/relay', createTronRelayRoutes(tw, config));
    })
    .catch((err) => {
      console.warn('Failed to initialize Tron wallet:', err instanceof Error ? err.message : err);
    });
}

// Root endpoint
app.get('/', (c) => c.json({ name: 'zkira-relayer', version: '0.1.0' }));

// Start server
serve({
  fetch: app.fetch,
  port: config.port,
  hostname: config.host,
});

export default app;
