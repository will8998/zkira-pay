import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { bodyLimit } from 'hono/body-limit';
import { logger } from 'hono/logger';
import type { AppConfig } from './config.js';
import { handleError } from './middleware/error-handler.js';
import { requestMetaMiddleware } from './middleware/request-meta.js';
import healthRoutes from './routes/health.js';
import configRoutes from './routes/config.js';
import tokenRoutes from './routes/tokens.js';
import quoteRoutes from './routes/quote.js';
import swapRoutes from './routes/swap.js';
import statusRoutes from './routes/status.js';

export type AppEnv = {
  Variables: {
    config: AppConfig;
  };
};

export function createApp(config: AppConfig) {
  const app = new Hono<AppEnv>();

  // Middleware
  app.use('*', logger());
  app.use('*', cors({
    origin: config.corsOrigins,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  }));
  app.use('*', bodyLimit({ maxSize: 1024 * 1024 }));
  app.use('*', requestMetaMiddleware);

  // Inject config into context
  app.use('*', async (c, next) => {
    c.set('config', config);
    await next();
  });

  // Error handler
  app.onError(handleError);

  // Root endpoint
  app.get('/', (c) => c.json({ name: '@zkira/swap-api', version: '0.1.0' }));

  // API v1 routes
  app.route('/api/v1', healthRoutes);
  app.route('/api/v1', configRoutes);
  app.route('/api/v1', tokenRoutes);
  app.route('/api/v1', quoteRoutes);
  app.route('/api/v1', swapRoutes);
  app.route('/api/v1', statusRoutes);

  return app;
}
