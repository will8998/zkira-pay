import { Wallet } from 'ethers';
import type { EVMWalletAdapter } from './types.js';

/**
 * BrowserWallet - A lightweight wallet for browser-based ephemeral EVM keypairs.
 *
 * Wraps an ethers.js Wallet and implements the EVMWalletAdapter interface,
 * enabling walletless mode where the browser generates and manages an ephemeral keypair.
 * The keypair is NOT persisted to storage — it exists only in memory for the session.
 *
 * @example
 * ```typescript
 * // Create a new ephemeral keypair
 * const wallet = BrowserWallet.create();
 *
 * // Or create from an existing private key
 * const wallet = BrowserWallet.fromPrivateKey('0xabcdef...');
 *
 * // Use with PoolClient
 * const client = new PoolClient(wallet.getWallet(), poolConfig);
 * ```
 */
export class BrowserWallet implements EVMWalletAdapter {
  private readonly wallet: Wallet;

  /**
   * Creates a new BrowserWallet with a freshly generated ephemeral keypair.
   * Uses crypto.getRandomValues for cryptographically secure randomness.
   *
   * @returns A new BrowserWallet instance with a random keypair
   */
  static create(): BrowserWallet {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const hex = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return new BrowserWallet(new Wallet('0x' + hex));
  }

  /**
   * Creates a BrowserWallet from an existing hex-encoded private key.
   *
   * @param privateKey - Hex-encoded private key (with or without 0x prefix)
   * @returns A new BrowserWallet instance wrapping the provided key
   */
  static fromPrivateKey(privateKey: string): BrowserWallet {
    return new BrowserWallet(new Wallet(privateKey));
  }

  /**
   * Constructs a BrowserWallet instance.
   *
   * @param wallet - ethers.js Wallet instance
   */
  private constructor(wallet: Wallet) {
    this.wallet = wallet;
  }

  /** EVM address (0x...) */
  get address(): string {
    return this.wallet.address;
  }

  /**
   * Returns the hex-encoded private key.
   * Use with caution — the key should not be exposed to untrusted code.
   *
   * @returns Hex-encoded private key (0x-prefixed)
   */
  getPrivateKey(): string {
    return this.wallet.privateKey;
  }

  /**
   * Returns the underlying ethers.js Wallet instance.
   * Use this to connect to a provider for transaction signing.
   *
   * @returns ethers.js Wallet
   */
  getWallet(): Wallet {
    return this.wallet;
  }
}
