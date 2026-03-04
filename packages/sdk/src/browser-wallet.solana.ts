import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { WalletAdapter } from './types.js';

/**
 * BrowserWallet - A lightweight wallet adapter for browser-based ephemeral keypairs.
 *
 * This class wraps a Solana Keypair and implements the WalletAdapter interface,
 * enabling walletless mode where the browser generates and manages an ephemeral keypair.
 * The keypair is NOT persisted to storage - it exists only in memory for the session.
 *
 * @example
 * ```typescript
 * // Create a new ephemeral keypair
 * const wallet = BrowserWallet.create();
 *
 * // Or create from an existing keypair
 * const keypair = Keypair.generate();
 * const wallet = BrowserWallet.fromKeypair(keypair);
 *
 * // Use with ShieldedPoolClient
 * const client = new ShieldedPoolClient(poolConfig, wallet);
 * ```
 */
export class BrowserWallet implements WalletAdapter {
  private readonly keypair: Keypair;

  /**
   * Creates a new BrowserWallet with a freshly generated ephemeral keypair.
   *
   * @returns A new BrowserWallet instance with a random keypair
   */
  static create(): BrowserWallet {
    return new BrowserWallet(Keypair.generate());
  }

  /**
   * Creates a BrowserWallet from an existing Keypair.
   *
   * @param keypair - The Solana Keypair to wrap
   * @returns A new BrowserWallet instance wrapping the provided keypair
   */
  static fromKeypair(keypair: Keypair): BrowserWallet {
    return new BrowserWallet(keypair);
  }

  /**
   * Constructs a BrowserWallet instance.
   *
   * @param keypair - The Solana Keypair to wrap
   */
  private constructor(keypair: Keypair) {
    this.keypair = keypair;
  }

  /**
   * The public key of the wrapped keypair.
   * Implements WalletAdapter.publicKey
   */
  get publicKey(): PublicKey {
    return this.keypair.publicKey;
  }

  /**
   * Signs a transaction using partial signing.
   * This allows the transaction to be co-signed by other parties (e.g., a relayer).
   *
   * Implements WalletAdapter.signTransaction
   *
   * @param tx - The transaction to sign
   * @returns The transaction with this wallet's signature added
   */
  async signTransaction(tx: Transaction): Promise<Transaction> {
    tx.partialSign(this.keypair);
    return tx;
  }

  /**
   * Partially signs a transaction synchronously.
   * Useful for advanced use cases where async is not needed.
   *
   * @param tx - The transaction to sign
   * @returns The transaction with this wallet's signature added
   */
  partialSign(tx: Transaction): Transaction {
    tx.partialSign(this.keypair);
    return tx;
  }

  /**
   * Returns the underlying Keypair for advanced use cases.
   * Use with caution - the keypair should not be exposed to untrusted code.
   *
   * @returns The wrapped Keypair instance
   */
  getKeypair(): Keypair {
    return this.keypair;
  }
}
