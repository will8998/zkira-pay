import { serve } from '@hono/node-server';
import { loadConfig } from './config.js';
import { createApp } from './app.js';

async function main() {
  const config = loadConfig();
  const app = createApp(config);

  console.log('Starting Swap API server...');
  console.log(`Port: ${config.port}`);
  console.log(`RocketX Base URL: ${config.rocketxBaseUrl}`);

  serve({
    fetch: app.fetch,
    port: config.port,
  });

  console.log(`Swap API running on http://localhost:${config.port}`);
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
