import { Hono } from 'hono';
import type { HealthResponse } from '@zkira/swap-types';

const healthRoutes = new Hono();

healthRoutes.get('/health', (c) => {
  const response: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  };
  return c.json(response);
});

export default healthRoutes;
