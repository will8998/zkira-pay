import { isAddress } from 'ethers';
import type { RelayerConfig } from '../config.js';

/**
 * Validates EVM addresses and withdraw request parameters.
 */
export class TransactionValidator {
  private allowedPoolAddresses: Set<string>;

  constructor(private config: RelayerConfig) {
    this.allowedPoolAddresses = new Set(
      config.poolAddresses.map((addr) => addr.toLowerCase()),
    );
  }

  /**
   * Validate that a pool address is in our allowed list.
   */
  isAllowedPool(poolAddress: string): boolean {
    return this.allowedPoolAddresses.has(poolAddress.toLowerCase());
  }

  /**
   * Validate an EVM address format.
   */
  isValidAddress(address: string): boolean {
    return isAddress(address);
  }

  /**
   * Validate a hex-encoded bytes32 value (with or without 0x prefix).
   */
  isValidBytes32(value: string): boolean {
    const hex = value.startsWith('0x') ? value.slice(2) : value;
    return /^[0-9a-fA-F]{64}$/.test(hex);
  }

  /**
   * Validate a hex-encoded byte string (proof data).
   */
  isValidHexBytes(value: string): boolean {
    const hex = value.startsWith('0x') ? value.slice(2) : value;
    return hex.length > 0 && hex.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(hex);
  }

  /**
   * Validate a uint256 decimal string.
   */
  isValidUint256(value: string): boolean {
    if (!/^\d+$/.test(value)) return false;
    try {
      const n = BigInt(value);
      return n >= 0n && n < 2n ** 256n;
    } catch {
      return false;
    }
  }

  /**
   * Validate a withdraw relay request's fields.
   */
  validateWithdrawRequest(params: {
    proof: string;
    root: string;
    nullifierHash: string;
    recipient: string;
    relayer: string;
    fee: string;
    refund: string;
    referrer: string;
    poolAddress: string;
  }): { valid: boolean; error?: string } {
    if (!this.isValidHexBytes(params.proof)) {
      return { valid: false, error: 'Invalid proof format (must be hex-encoded bytes)' };
    }

    if (!this.isValidBytes32(params.root)) {
      return { valid: false, error: 'Invalid root format (must be bytes32 hex)' };
    }

    if (!this.isValidBytes32(params.nullifierHash)) {
      return { valid: false, error: 'Invalid nullifierHash format (must be bytes32 hex)' };
    }

    if (!this.isValidAddress(params.recipient)) {
      return { valid: false, error: 'Invalid recipient address' };
    }

    if (!this.isValidAddress(params.relayer)) {
      return { valid: false, error: 'Invalid relayer address' };
    }

    if (!this.isValidUint256(params.fee)) {
      return { valid: false, error: 'Invalid fee (must be uint256 decimal string)' };
    }

    if (!this.isValidUint256(params.refund)) {
      return { valid: false, error: 'Invalid refund (must be uint256 decimal string)' };
    }

    if (!this.isValidAddress(params.referrer)) {
      return { valid: false, error: 'Invalid referrer address' };
    }

    if (!this.isAllowedPool(params.poolAddress)) {
      return { valid: false, error: 'Pool address not in allowed list' };
    }

    return { valid: true };
  }
}
