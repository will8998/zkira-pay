import { Hono } from 'hono';
import type { AppEnv } from '../app.js';
import type { SwapResponse, RocketXSwapRequest } from '@zkira/swap-types';
import { RocketXClient, RocketXApiError } from '../services/rocketx-client.js';
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

  const rocketxBody: RocketXSwapRequest = {
    fee: 1,
    fromTokenId: parsed.data.fromTokenId,
    toTokenId: parsed.data.toTokenId,
    amount: parsed.data.amount,
    slippage: parsed.data.slippage ?? 1,
    disableEstimate: false,
    destinationAddress: parsed.data.destinationAddress,
  };

  try {
    const data = await client.createSwap(rocketxBody);

    if (data.err) {
      return c.json({ error: data.err, status: 400 }, 400);
    }

    const response: SwapResponse = {
      requestId: data.requestId,
      depositAddress: data.swap?.depositAddress ?? '',
      status: 'pending',
      fromAmount: data.swap?.fromAmount ?? parsed.data.amount,
      toAmount: data.swap?.toAmount ?? 0,
      fromTokenSymbol: data.fromTokenInfo?.token_symbol ?? '',
      toTokenSymbol: data.toTokenInfo?.token_symbol ?? '',
      memo: data.swap?.tx?.memo || null,
    };

    return c.json(response);
  } catch (err) {
    if (err instanceof RocketXApiError) {
      const message = typeof err.body === 'object' && err.body !== null && 'err' in err.body
        ? String((err.body as Record<string, unknown>).err)
        : `Exchange error (${err.status})`;
      return c.json({ error: message, status: err.status }, err.status as 400);
    }
    throw err;
  }
});

export default swapRoutes;
