import { Context, Next } from 'hono';
import { RateLimitEntry } from '../types.js';

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      // First request or window expired
      this.store.set(key, {
        count: 1,
        resetAt: now + this.windowMs,
      });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    // Increment count
    entry.count++;
    return true;
  }

  getRemainingRequests(key: string): number {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.resetAt) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }

  getResetTime(key: string): number {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.resetAt) {
      return Date.now() + this.windowMs;
    }
    return entry.resetAt;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key);
      }
    }
  }
}

export function createRateLimitMiddleware(maxRequests: number, windowMs: number = 60000) {
  const rateLimiter = new RateLimiter(maxRequests, windowMs);

  return async (c: Context, next: Next) => {
    // Get client IP (handle various proxy headers)
    const clientIp = 
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      c.req.header('x-real-ip') ||
      c.req.header('cf-connecting-ip') ||
      'unknown';

    if (!rateLimiter.isAllowed(clientIp)) {
      const resetTime = rateLimiter.getResetTime(clientIp);
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

      c.header('X-RateLimit-Limit', maxRequests.toString());
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
      c.header('Retry-After', retryAfter.toString());

      return c.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        429
      );
    }

    // Add rate limit headers
    const remaining = rateLimiter.getRemainingRequests(clientIp);
    const resetTime = rateLimiter.getResetTime(clientIp);

    c.header('X-RateLimit-Limit', maxRequests.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());

    await next();
  };
}