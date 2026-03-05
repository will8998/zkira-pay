import { db } from '../db/index.js';
import { merchants } from '../db/schema.js';
import { eq } from 'drizzle-orm';

// Admin/platform origins that are always allowed
const PLATFORM_ORIGINS = [
  'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', // Dev
  'https://omnipay.club', 'https://app.omnipay.club', 'https://admin.omnipay.club', // Production
  'https://app.zkira.xyz', 'https://zkira.xyz', 'https://admin.zkira.xyz', // Legacy
];

// Cache merchant origins for 60 seconds
let merchantOriginsCache: Set<string> | null = null;
let cacheExpiresAt = 0;

async function getMerchantOrigins(): Promise<Set<string>> {
  const now = Date.now();
  if (merchantOriginsCache && now < cacheExpiresAt) {
    return merchantOriginsCache;
  }

  try {
    const rows = await db.select({ allowedOrigins: merchants.allowedOrigins })
      .from(merchants)
      .where(eq(merchants.status, 'active'));

    const origins = new Set<string>();
    for (const row of rows) {
      if (row.allowedOrigins) {
        for (const origin of row.allowedOrigins) {
          if (origin) origins.add(origin);
        }
      }
    }

    merchantOriginsCache = origins;
    cacheExpiresAt = now + 60_000;
    return origins;
  } catch (error) {
    console.error('Failed to load merchant origins:', error);
    // Return cached value even if expired, or empty set
    return merchantOriginsCache || new Set();
  }
}

/**
 * Dynamic CORS origin function for Hono cors() middleware.
 * Checks platform origins first (fast), then merchant DB origins (cached).
 */
export async function dynamicOrigin(origin: string): Promise<string | undefined> {
  // Platform origins: always allowed
  if (PLATFORM_ORIGINS.includes(origin)) {
    return origin;
  }

  // Merchant origins: cached DB lookup
  const merchantOrigins = await getMerchantOrigins();
  if (merchantOrigins.has(origin)) {
    return origin;
  }

  // Not allowed — return undefined (Hono will not set Access-Control-Allow-Origin)
  return undefined;
}
