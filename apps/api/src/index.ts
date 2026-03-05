import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { bodyLimit } from 'hono/body-limit';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { Connection } from '@solana/web3.js';

import { loadConfig } from './config.js';
import { AccountIndexer } from './services/indexer.js';
import healthRoutes from './routes/health.js';
import announcementRoutes, { setIndexer as setAnnouncementIndexer } from './routes/announcements.js';
import paymentRoutes, { setIndexer as setPaymentIndexer } from './routes/payments.js';
import escrowRoutes, { setIndexer as setEscrowIndexer } from './routes/escrows.js';
import metaRoutes from './routes/meta.js';
import userRoutes from './routes/users.js';
import contactRoutes from './routes/contacts.js';
import invoiceRoutes from './routes/invoices.js';
import transactionRoutes from './routes/transactions.js';
import apiKeyRoutes from './routes/api-keys.js';
import adminRoutes from './routes/admin.js';
import pointsRoutes from './routes/points.js';
import adminPointsRoutes from './routes/admin-points.js';
import referralRoutes from './routes/referrals.js';
import contentRoutes from './routes/content.js';
import paymentLinkRoutes from './routes/payment-links.js';
import analyticsRoutes from './routes/analytics.js';
import deadDropRoutes from './routes/dead-drop.js';
import { merchantApiKeyAuth } from './middleware/merchant-auth.js';
import { DepositMonitor } from './services/deposit-monitor.js';
import { startWebhookProcessor, stopWebhookProcessor } from './services/webhook.js';
import gatewaySessionRoutes from './routes/gateway-sessions.js';
import gatewayWithdrawalRoutes from './routes/gateway-withdrawals.js';
import gatewayReportRoutes from './routes/gateway-reports.js';
import gatewayDisputeRoutes from './routes/gateway-disputes.js';
import gatewayPoolRoutes from './routes/gateway-pools.js';
import { createPathBasedAuth } from './middleware/auth.js';
import { rateLimit } from './middleware/rate-limit.js';
import { createPathBasedRateLimit } from './middleware/rate-limit.js';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: [
    'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', // Local development
    'https://app.zkira.xyz', 'https://zkira.xyz', 'https://admin.zkira.xyz' // Production
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Admin-Password'],
}));
app.use('*', bodyLimit({ maxSize: 1024 * 1024 })); // 1MB max body size

// Global rate limiting on all API routes
app.use('/api/*', rateLimit);

// Apply middleware to payment routes
app.use('/api/payments/*', createPathBasedAuth('/api/payments'));
app.use('/api/payments/*', createPathBasedRateLimit('/api/payments'));
// Invoices v2 (dead-drop flow) are public; legacy /api/invoices/:wallet still requires auth
app.use('/api/invoices/*', async (c, next) => {
  if (c.req.path.startsWith('/api/invoices/v2')) return next();
  return createPathBasedAuth('/api/invoices')(c, next);
});
app.use('/api/contacts/*', createPathBasedAuth('/api/contacts'));
app.use('/api/transactions/*', createPathBasedAuth('/api/transactions'));
app.use('/api/api-keys/*', createPathBasedAuth('/api/api-keys'));
// Referral public routes don't need API key auth; admin routes use adminAuth middleware internally

// Gateway routes use merchant API key auth
app.use('/api/gateway/*', merchantApiKeyAuth);

// Root endpoint
app.get('/', (c) => c.json({ name: 'zkira-api', version: '0.1.0' }));

// Routes
app.route('/', healthRoutes);
app.route('/', announcementRoutes);
app.route('/', escrowRoutes);
app.route('/', paymentRoutes);
app.route('/', metaRoutes);
app.route('/', userRoutes);
app.route('/', contactRoutes);
app.route('/', invoiceRoutes);
app.route('/', transactionRoutes);
app.route('/', apiKeyRoutes);
app.route('/', adminRoutes);
app.route('/', pointsRoutes);
app.route('/', adminPointsRoutes);
app.route('/', referralRoutes);
app.route('/', contentRoutes);
app.route('/', paymentLinkRoutes);
app.route('/', analyticsRoutes);
app.route('/', deadDropRoutes);
app.route('/', gatewaySessionRoutes);
app.route('/', gatewayWithdrawalRoutes);
app.route('/', gatewayReportRoutes);
app.route('/', gatewayDisputeRoutes);
app.route('/', gatewayPoolRoutes);

// Start server
async function startServer() {
  const config = loadConfig();
  
  // Server startup logging (no sensitive data)




  // Initialize Solana connection
  const connection = new Connection(config.solanaRpcUrl, 'confirmed');

  // Initialize and start indexer
  const indexer = new AccountIndexer(connection, config.indexIntervalMs);
  
  // Set indexer for all route handlers
  setAnnouncementIndexer(indexer);
  setEscrowIndexer(indexer);
  setPaymentIndexer(indexer);

  // Start indexing
  indexer.start();

  // Start gateway services
  const depositMonitor = new DepositMonitor(30_000);
  depositMonitor.start();
  const webhookProcessorId = startWebhookProcessor();

  // Graceful shutdown
  process.on('SIGINT', () => {
    // Graceful shutdown initiated
    indexer.stop();
    depositMonitor.stop();
    stopWebhookProcessor(webhookProcessorId);
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    // Graceful shutdown initiated
    indexer.stop();
    depositMonitor.stop();
    stopWebhookProcessor(webhookProcessorId);
    process.exit(0);
  });

  // Start HTTP server
  // HTTP server starting
  serve({
    fetch: app.fetch,
    port: config.port,
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;