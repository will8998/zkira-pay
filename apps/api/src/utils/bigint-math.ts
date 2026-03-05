/**
 * BigInt-based financial math utilities to prevent floating-point precision errors.
 * Uses 6 decimal places to match database numeric(20, 6) precision.
 */

export const SCALE = BigInt(1_000_000); // 10^6 for 6 decimal places

/**
 * Convert decimal string like "123.456789" to scaled BigInt.
 * Handles up to 6 decimal places, truncating any additional precision.
 * 
 * @param value - Decimal string (e.g., "123.456789")
 * @returns Scaled BigInt (e.g., 123456789n for "123.456789")
 */
export function toBigInt6(value: string): bigint {
  const [whole, frac = ''] = value.split('.');
  const paddedFrac = (frac + '000000').slice(0, 6);
  return BigInt(whole + paddedFrac);
}

/**
 * Convert scaled BigInt back to string with exactly 6 decimal places.
 * 
 * @param value - Scaled BigInt (e.g., 123456789n)
 * @returns Decimal string (e.g., "123.456789")
 */
export function fromBigInt6(value: bigint): string {
  const isNeg = value < BigInt(0);
  const abs = isNeg ? -value : value;
  const whole = abs / SCALE;
  const frac = (abs % SCALE).toString().padStart(6, '0');
  return `${isNeg ? '-' : ''}${whole}.${frac}`;
}