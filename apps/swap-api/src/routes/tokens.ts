import { Hono } from 'hono';
import type { AppEnv } from '../app.js';
import type { TokensResponse } from '@zkira/swap-types';
import { RocketXClient } from '../services/rocketx-client.js';
import { tokensQuerySchema } from '../schemas/tokens.js';

const tokenRoutes = new Hono<AppEnv>();

tokenRoutes.get('/tokens', async (c) => {
  const config = c.get('config');
  const client = new RocketXClient(config.rocketxBaseUrl, config.rocketxApiKey);

  const parsed = tokensQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten().fieldErrors, status: 400 }, 400);
  }

  const data = await client.getTokens(parsed.data);

  const response: TokensResponse = {
    tokens: data.data,
    totalPages: data.totalPages,
    currentPage: data.currentPage,
    perPage: data.perPage,
  };

  return c.json(response);
});

export default tokenRoutes;
