import { Hono } from 'hono';

const health = new Hono();

health.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'zkira-api',
    version: '0.1.0',
  });
});

health.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'zkira-api',
    version: '0.1.0',
  });
});

export default health;