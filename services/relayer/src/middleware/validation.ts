import { isAddress } from 'ethers';
import type { Context, Next } from 'hono';
import type { WithdrawRelayRequest } from '../types.js';

/**
 * Middleware to validate withdraw relay request body structure.
 */
export async function validateWithdrawRequest(c: Context, next: Next) {
  try {
    const body = await c.req.json() as WithdrawRelayRequest;

    if (!body || typeof body !== 'object') {
      return c.json(
        {
          success: false,
          error: 'Invalid request body',
          code: 'INVALID_REQUEST_BODY',
        },
        400,
      );
    }

    // Validate required fields exist and are strings
    const requiredFields = [
      'proof', 'root', 'nullifierHash', 'recipient',
      'relayer', 'fee', 'refund', 'referrer', 'poolAddress',
    ] as const;

    for (const field of requiredFields) {
      if (!body[field] || typeof body[field] !== 'string') {
        return c.json(
          {
            success: false,
            error: `Missing or invalid field: ${field}`,
            code: 'INVALID_FIELD',
          },
          400,
        );
      }
    }

    // Validate EVM addresses
    if (!isAddress(body.recipient)) {
      return c.json(
        {
          success: false,
          error: 'Invalid recipient address',
          code: 'INVALID_RECIPIENT',
        },
        400,
      );
    }

    if (!isAddress(body.relayer)) {
      return c.json(
        {
          success: false,
          error: 'Invalid relayer address',
          code: 'INVALID_RELAYER',
        },
        400,
      );
    }

    if (!isAddress(body.poolAddress)) {
      return c.json(
        {
          success: false,
          error: 'Invalid pool address',
          code: 'INVALID_POOL_ADDRESS',
        },
        400,
      );
    }

    if (!isAddress(body.referrer)) {
      return c.json(
        {
          success: false,
          error: 'Invalid referrer address',
          code: 'INVALID_REFERRER',
        },
        400,
      );
    }

    // Store validated body in context
    c.set('validatedBody', body);

    await next();
  } catch {
    return c.json(
      {
        success: false,
        error: 'Internal validation error',
        code: 'VALIDATION_ERROR',
      },
      500,
    );
  }
}

/**
 * Middleware to validate a transaction hash parameter.
 */
export async function validateTransactionHash(c: Context, next: Next) {
  try {
    const txHash = c.req.param('txHash');

    if (!txHash) {
      return c.json(
        {
          success: false,
          error: 'Missing transaction hash',
          code: 'MISSING_TX_HASH',
        },
        400,
      );
    }

    // EVM transaction hashes are 0x + 64 hex characters
    if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
      return c.json(
        {
          success: false,
          error: 'Invalid transaction hash format (expected 0x + 64 hex characters)',
          code: 'INVALID_TX_HASH',
        },
        400,
      );
    }

    c.set('validatedTxHash', txHash);
    await next();
  } catch {
    return c.json(
      {
        success: false,
        error: 'Internal validation error',
        code: 'VALIDATION_ERROR',
      },
      500,
    );
  }
}
