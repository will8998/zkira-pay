import { sign, verify } from 'hono/jwt';
import type { JWTPayload } from 'hono/utils/jwt/types';

export interface AdminJwtPayload extends JWTPayload {
  role: 'master' | 'merchant';
  merchantId: string | null;
  merchantName: string | null;
}

const JWT_EXPIRY_SECONDS = 24 * 60 * 60; // 24 hours

export async function signAdminToken(
  payload: Omit<AdminJwtPayload, 'iat' | 'exp'>,
  secret: string,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return sign(
    {
      ...payload,
      iat: now,
      exp: now + JWT_EXPIRY_SECONDS,
    },
    secret,
  );
}

export async function verifyAdminToken(
  token: string,
  secret: string,
): Promise<AdminJwtPayload | null> {
  try {
    const payload = await verify(token, secret) as AdminJwtPayload;
    return payload;
  } catch {
    return null;
  }
}
