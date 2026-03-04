/**
 * TronBrowserWallet - A lightweight wallet for browser-based ephemeral Tron keypairs.
 *
 * Generates a random Tron keypair using secp256k1 (same as Ethereum).
 * Implements the TronWalletAdapter interface, enabling walletless mode where
 * the browser generates and manages an ephemeral keypair.
 * The keypair is NOT persisted to storage — it exists only in memory for the session.
 *
 * @example
 * ```typescript
 * // Create a new ephemeral keypair
 * const wallet = await TronBrowserWallet.createAsync();
 *
 * // Or create from an existing private key
 * const wallet = await TronBrowserWallet.fromPrivateKeyAsync('0xabcdef...');
 *
 * // Get the Tron address (base58 format, starts with T)
 * console.log(wallet.address);
 *
 * // Create a TronWeb instance for signing transactions
 * const tronWeb = await wallet.createTronWeb('https://api.trongrid.io');
 * ```
 */

export interface TronWalletAdapter {
  /** Base58 Tron address (T...) */
  address: string;
  /** Hex private key (without 0x prefix) */
  getPrivateKey(): string;
}

export class TronBrowserWallet implements TronWalletAdapter {
  private readonly _privateKey: string;
  private _address: string = '';

  /**
   * Creates a new TronBrowserWallet with a freshly generated ephemeral keypair.
   * Uses crypto.getRandomValues for cryptographically secure randomness.
   *
   * @returns A new TronBrowserWallet instance with a random keypair
   */
  static create(): TronBrowserWallet {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const hex = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return new TronBrowserWallet(hex);
  }

  /**
   * Creates a TronBrowserWallet from an existing hex-encoded private key.
   *
   * @param privateKey - Hex-encoded private key (with or without 0x prefix)
   * @returns A new TronBrowserWallet instance wrapping the provided key
   */
  static fromPrivateKey(privateKey: string): TronBrowserWallet {
    const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
    return new TronBrowserWallet(cleanKey);
  }

  /**
   * Creates and initializes a new TronBrowserWallet with a freshly generated keypair.
   * Derives the Tron address from the private key using TronWeb.
   *
   * @returns A new initialized TronBrowserWallet instance
   * @throws Error if TronWeb is unavailable or address derivation fails
   */
  static async createAsync(): Promise<TronBrowserWallet> {
    const wallet = TronBrowserWallet.create();
    await wallet.init();
    return wallet;
  }

  /**
   * Creates and initializes a TronBrowserWallet from an existing private key.
   * Derives the Tron address from the private key using TronWeb.
   *
   * @param privateKey - Hex-encoded private key (with or without 0x prefix)
   * @returns A new initialized TronBrowserWallet instance
   * @throws Error if TronWeb is unavailable or address derivation fails
   */
  static async fromPrivateKeyAsync(privateKey: string): Promise<TronBrowserWallet> {
    const wallet = TronBrowserWallet.fromPrivateKey(privateKey);
    await wallet.init();
    return wallet;
  }

  /**
   * Constructs a TronBrowserWallet instance.
   * Note: The address is not derived until init() is called.
   *
   * @param privateKey - Hex-encoded private key (without 0x prefix)
   */
  private constructor(privateKey: string) {
    this._privateKey = privateKey;
  }

  /**
   * Initializes the wallet by deriving the Tron address from the private key.
   * Must be called before accessing the address property.
   * Uses dynamic import for SSR safety and to handle missing tronweb gracefully.
   *
   * @throws Error if TronWeb is unavailable or address derivation fails
   */
  private async init(): Promise<void> {
    // Dynamic import to avoid SSR issues and handle missing tronweb gracefully
    const TronWebModule = await import('tronweb');
    const TronWeb = (TronWebModule.default || TronWebModule) as unknown as {
      address: { fromPrivateKey(key: string): string | null };
    };

    if (!TronWeb.address || typeof TronWeb.address.fromPrivateKey !== 'function') {
      throw new Error('TronWeb.address.fromPrivateKey is not available');
    }

    const address = TronWeb.address.fromPrivateKey(this._privateKey);
    if (!address) {
      throw new Error('Failed to derive Tron address from private key');
    }

    this._address = address;
  }

  /**
   * Returns the Tron address in base58 format (starts with T).
   *
   * @returns Base58-encoded Tron address
   * @throws Error if wallet has not been initialized
   */
  get address(): string {
    if (!this._address) {
      throw new Error('Wallet not initialized. Use createAsync() or fromPrivateKeyAsync().');
    }
    return this._address;
  }

  /**
   * Returns the hex-encoded private key.
   * Use with caution — the key should not be exposed to untrusted code.
   *
   * @returns Hex-encoded private key (without 0x prefix)
   */
  getPrivateKey(): string {
    return this._privateKey;
  }

  /**
   * Creates a TronWeb instance connected to a full node.
   * The instance is pre-configured with this wallet's private key for signing.
   *
   * @param fullHost - TronGrid URL (e.g., https://api.trongrid.io)
   * @returns A TronWeb instance ready for transaction signing
   * @throws Error if TronWeb is unavailable
   */
  async createTronWeb(fullHost: string): Promise<unknown> {
    const TronWebModule = await import('tronweb');
    const TronWeb = TronWebModule.default || TronWebModule;
    const TronWebConstructor = TronWeb as unknown as new (opts: { fullHost: string; privateKey: string }) => unknown;

    return new TronWebConstructor({
      fullHost,
      privateKey: this._privateKey,
    });
  }
}
