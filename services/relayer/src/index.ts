import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { Connection } from '@solana/web3.js';
import { loadConfig } from './config.js';
import { RelayerWallet } from './services/wallet.js';
import { createHealthRoutes } from './routes/health.js';
import { createRelayRoutes } from './routes/relay.js';
import { createRateLimitMiddleware } from './middleware/rate-limit.js';

const config = loadConfig();

// Initialize Solana connection
const connection = new Connection(config.solanaRpcUrl, 'confirmed');

// Initialize relayer wallet
let wallet: RelayerWallet;
if (config.relayerPrivateKey) {
  wallet = new RelayerWallet(config.relayerPrivateKey);
  console.log(`Relayer wallet: ${wallet.publicKey.toBase58()}`);
} else {
  console.warn('RELAYER_PRIVATE_KEY not set — relay endpoints will fail');
  // Create a dummy wallet that will fail on signing
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

// Routes
app.route('/', createHealthRoutes(connection, wallet));
app.route('/relay', createRelayRoutes(connection, wallet));

// Root endpoint
app.get('/', (c) => c.json({ name: 'zkira-relayer', version: '0.1.0' }));

// Start server
console.log(`Starting PRIV relayer on port ${config.port}...`);
serve({
  fetch: app.fetch,
  port: config.port,
});
console.log(`PRIV relayer running at http://localhost:${config.port}`);

export default app;
