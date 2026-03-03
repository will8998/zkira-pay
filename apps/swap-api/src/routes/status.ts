import { Hono } from 'hono';
import type { AppEnv } from '../app.js';
import type { StatusResponse, SwapStatusValue } from '@zkira/swap-types';
import { RocketXClient } from '../services/rocketx-client.js';
import { statusParamsSchema } from '../schemas/status.js';

const statusRoutes = new Hono<AppEnv>();

statusRoutes.get('/status/:requestId', async (c) => {
  const config = c.get('config');
  const client = new RocketXClient(config.rocketxBaseUrl, config.rocketxApiKey);

  const parsed = statusParamsSchema.safeParse({ requestId: c.req.param('requestId') });
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten().fieldErrors, status: 400 }, 400);
  }

  const data = await client.getStatus(parsed.data.requestId);

  const response: StatusResponse = {
    requestId: data.requestId,
    status: data.status as SwapStatusValue,
    fromAmount: data.fromAmount,
    toAmount: data.toAmount,
    fromToken: data.fromToken,
    toToken: data.toToken,
    txHash: data.txHash,
    txHashOut: data.txHashOut,
  };

  return c.json(response);
});

export default statusRoutes;
