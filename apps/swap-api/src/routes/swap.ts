import { Hono } from 'hono';
import type { AppEnv } from '../app.js';
import type { SwapResponse } from '@zkira/swap-types';
import { RocketXClient } from '../services/rocketx-client.js';
import { swapBodySchema } from '../schemas/swap.js';

const swapRoutes = new Hono<AppEnv>();

swapRoutes.post('/swap', async (c) => {
  const config = c.get('config');
  const client = new RocketXClient(config.rocketxBaseUrl, config.rocketxApiKey);

  const body = await c.req.json();
  const parsed = swapBodySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten().fieldErrors, status: 400 }, 400);
  }

  const data = await client.createSwap(parsed.data);

  const response: SwapResponse = {
    requestId: data.requestId,
    depositAddress: data.depositAddress,
    status: data.status,
    fromAmount: data.fromAmount,
    toAmount: data.toAmount,
  };

  return c.json(response);
});

export default swapRoutes;
