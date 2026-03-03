import type { Context } from 'hono';
import type { ApiErrorResponse } from '@zkira/swap-types';
import { RocketXApiError } from '../services/rocketx-client.js';

export function handleError(err: Error, c: Context): Response {
  console.error(`[ERROR] ${err.name}: ${err.message}`, err instanceof RocketXApiError ? err.body : '');

  if (err instanceof RocketXApiError) {
    const detail = err.body as Record<string, unknown> | null;
    const message =
      detail && typeof detail === 'object' && typeof detail.err === 'string'
        ? detail.err
        : err.message;
    const response: ApiErrorResponse = {
      error: message,
      status: err.status,
      details: err.body,
    };
    return c.json(response, err.status as 400);
  }

  const response: ApiErrorResponse = {
    error: 'Internal server error',
    status: 500,
  };
  return c.json(response, 500);
}
