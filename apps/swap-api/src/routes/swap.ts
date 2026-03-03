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
    return c.json({ error: 'Invalid request: ' + Object.values(parsed.error.flatten().fieldErrors).flat().join(', '), status: 400 }, 400);
  }

  const rocketxBody: RocketXSwapRequest = {
    fee: 1,
    fromTokenId: parsed.data.fromTokenId,
    toTokenId: parsed.data.toTokenId,
    amount: parsed.data.amount,
    slippage: parsed.data.slippage ?? 1,
    disableEstimate: false,
    destinationAddress: parsed.data.destinationAddress,
    ...(parsed.data.refundAddress ? { refundAddress: parsed.data.refundAddress } : {}),
    ...(parsed.data.exchangeId ? { exchangeId: parsed.data.exchangeId } : {}),
  };

  try {
    const data = await client.createSwap(rocketxBody);

    // RocketX returns 200 with err field when swap is rejected
    if (data.err) {
      const code = (data as Record<string, unknown>).code;
      console.error('[SWAP] RocketX rejected swap:', JSON.stringify({ err: data.err, code, body: rocketxBody }));

      // Map known error codes/messages to user-friendly messages
      let userMessage = String(data.err);
      if (userMessage.toLowerCase().includes('address') && userMessage.toLowerCase().includes('not valid')) {
        userMessage = 'Destination address is not valid for the receiving network';
      } else if (userMessage.toLowerCase() === 'bad request') {
        userMessage = 'Exchange rejected this swap — try a different amount or token pair';
      }
      return c.json({ error: userMessage, status: 400 }, 400);
    }

    // Validate that we got the expected response shape
    if (!data.requestId) {
      console.error('[SWAP] RocketX returned success but missing requestId:', JSON.stringify(data));
      return c.json({ error: 'Exchange returned an incomplete response — please try again', status: 502 }, 502);
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
      console.error('[SWAP] RocketX API error:', JSON.stringify({ status: err.status, body: err.body, request: rocketxBody }));
      let message: string;
      if (typeof err.body === 'object' && err.body !== null) {
        const b = err.body as Record<string, unknown>;
        message = String(b.err || b.message || b.error || `Exchange error (${err.status})`);
      } else {
        message = `Exchange error (${err.status})`;
      }
      // Translate generic messages
      if (message.toLowerCase() === 'bad request') {
        message = 'Exchange rejected this swap — try a different amount or token pair';
      }
      return c.json({ error: message, status: err.status }, err.status as 400);
    }
    console.error('[SWAP] Unexpected error:', err);
    throw err;
  }
});

export default swapRoutes;
