import { Hono } from 'hono';
import type { AppEnv } from '../app.js';
import type { SwapResponse, RocketXSwapRequest } from '@zkira/swap-types';
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

  const rocketxBody: RocketXSwapRequest = {
    fee: 1,
    fromTokenId: parsed.data.fromTokenId,
    toTokenId: parsed.data.toTokenId,
    amount: parsed.data.amount,
    slippage: parsed.data.slippage ?? 1,
    disableEstimate: false,
    destinationAddress: parsed.data.destinationAddress,
  };

  const data = await client.createSwap(rocketxBody);

  const response: SwapResponse = {
    requestId: data.requestId,
    depositAddress: data.swap.depositAddress,
    status: 'pending',
    fromAmount: data.swap.fromAmount,
    toAmount: data.swap.toAmount,
    fromTokenSymbol: data.fromTokenInfo.token_symbol,
    toTokenSymbol: data.toTokenInfo.token_symbol,
    memo: data.swap.tx?.memo || null,
  };

  return c.json(response);
});

export default swapRoutes;
