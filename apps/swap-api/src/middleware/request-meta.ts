import type { Context, Next } from 'hono';

export interface RequestMeta {
  clientIp: string;
  userAgent: string;
}

declare module 'hono' {
  interface ContextVariableMap {
    requestMeta: RequestMeta;
  }
}

function extractClientIp(c: Context): string {
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0];
    if (first) return first.trim();
  }

  const realIp = c.req.header('x-real-ip');
  if (realIp) return realIp.trim();

  return '0.0.0.0';
}

export async function requestMetaMiddleware(c: Context, next: Next): Promise<void> {
  const meta: RequestMeta = {
    clientIp: extractClientIp(c),
    userAgent: c.req.header('user-agent') ?? 'unknown',
  };

  c.set('requestMeta', meta);

  await next();
}
