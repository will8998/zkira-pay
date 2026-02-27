import type { Context, Next } from 'hono';

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

// In-memory storage for rate limiting (in production, use Redis or similar)
const rateLimitStore: Map<string, RateLimitEntry> = new Map();

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute

/**
 * Simple in-memory rate limiting middleware
 * Tracks requests per IP address
 */
export async function rateLimit(c: Context, next: Next) {
  // Get client IP address
  const clientIP = getClientIP(c);
  const now = Date.now();
  
  // Get or create rate limit entry for this IP
  let entry = rateLimitStore.get(clientIP);
  
  // If no entry exists or window has expired, create new entry
  if (!entry || (now - entry.windowStart) >= RATE_LIMIT_WINDOW_MS) {
    entry = {
      count: 1,
      windowStart: now,
    };
    rateLimitStore.set(clientIP, entry);
    
    // Clean up old entries periodically to prevent memory leaks
    cleanupExpiredEntries(now);
    
    await next();
    return;
  }
  
  // Check if rate limit exceeded
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    const remainingTime = RATE_LIMIT_WINDOW_MS - (now - entry.windowStart);
    const resetTime = Math.ceil(remainingTime / 1000);
    
    // Set rate limit headers
    c.res.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString());
    c.res.headers.set('X-RateLimit-Remaining', '0');
    c.res.headers.set('X-RateLimit-Reset', resetTime.toString());
    
    return c.json({ 
      error: 'Rate limit exceeded', 
      retryAfter: resetTime,
      message: `Too many requests. Try again in ${resetTime} seconds.`
    }, 429);
  }
  
  // Increment request count
  entry.count++;
  rateLimitStore.set(clientIP, entry);
  
  // Set rate limit headers
  const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - entry.count);
  const resetTime = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - entry.windowStart)) / 1000);
  
  c.res.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString());
  c.res.headers.set('X-RateLimit-Remaining', remaining.toString());
  c.res.headers.set('X-RateLimit-Reset', resetTime.toString());
  
  await next();
}

/**
 * Extract client IP address from request
 */
function getClientIP(c: Context): string {
  // Check for forwarded IP headers (for reverse proxies)
  const forwarded = c.req.header('X-Forwarded-For');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = c.req.header('X-Real-IP');
  if (realIP) {
    return realIP;
  }
  
  // Fallback to connection IP (may not be available in all environments)
  const connectionIP = c.req.header('X-Forwarded-For') || 
                      c.req.header('CF-Connecting-IP') || 
                      'unknown';
  
  return connectionIP;
}

/**
 * Clean up expired rate limit entries to prevent memory leaks
 */
function cleanupExpiredEntries(now: number) {
  // Only run cleanup occasionally to avoid performance impact
  if (Math.random() > 0.01) return; // 1% chance to run cleanup
  
  for (const [ip, entry] of rateLimitStore.entries()) {
    if ((now - entry.windowStart) >= RATE_LIMIT_WINDOW_MS) {
      rateLimitStore.delete(ip);
    }
  }
}

/**
 * Create middleware that only applies rate limiting to specific path patterns
 */
export function createPathBasedRateLimit(pathPattern: string) {
  return async (c: Context, next: Next) => {
    const path = c.req.path;
    
    // Check if current path matches the pattern
    if (path.startsWith(pathPattern)) {
      await rateLimit(c, next);
    } else {
      await next();
    }
  };
}