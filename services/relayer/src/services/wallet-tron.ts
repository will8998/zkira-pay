/** Minimal TronWeb interface for relayer usage */
interface TronWebInstance {
  trx: {
    getBalance(address: string): Promise<number>;
    getCurrentBlock(): Promise<{ block_header?: unknown } | null>;
    getTransaction(txId: string): Promise<{ ret?: Array<{ contractRet: string }> } | null>;
    getTransactionInfo(txId: string): Promise<{ 
      receipt?: { 
        result: string; 
        energy_usage_total: number; 
      }; 
      blockNumber?: number; 
    } | null>;
  };
  contract(): { at(address: string): Promise<TronContract> };
  defaultAddress: { base58: string };
  address: { toHex(base58: string): string };
}

interface TronContract {
  withdraw(
    proof: string, 
    root: string, 
    nullifierHash: string, 
    recipient: string, 
    relayer: string, 
    fee: string, 
    refund: string, 
    referrer: string
  ): { send(opts: { feeLimit: number; callValue?: number }): Promise<string> };
  denomination(): { call(): Promise<{ _hex?: string } | bigint | string> };
  nextIndex(): { call(): Promise<{ _hex?: string } | bigint | string> };
  isSpent(nullifierHash: string): { call(): Promise<boolean> };
  paused(): { call(): Promise<boolean> };
}

export class TronRelayerWallet {
  public readonly tronWeb: TronWebInstance;
  public readonly address: string;

  private constructor(tronWeb: TronWebInstance, address: string) {
    this.tronWeb = tronWeb;
    this.address = address;
  }

  static async create(privateKey: string, fullHost: string): Promise<TronRelayerWallet> {
    if (!privateKey) {
      throw new Error('TRON_PRIVATE_KEY is required');
    }

    // Dynamic import for ESM compatibility
    const TronWebModule = await import('tronweb');
    const TronWeb = TronWebModule.default || TronWebModule;

    // Create TronWeb instance — cast via unknown to bypass module type narrowing
    const TronWebConstructor = TronWeb as unknown as new (opts: { fullHost: string; privateKey: string }) => TronWebInstance;
    const tronWeb = new TronWebConstructor({
      fullHost,
      privateKey,
    });

    // Get relayer address from TronWeb instance
    const address = tronWeb.defaultAddress.base58;

    return new TronRelayerWallet(tronWeb, address);
  }

  /**
   * Check TRX balance of the relayer wallet (formatted as string in TRX).
   */
  async checkBalance(): Promise<string> {
    const balanceSun = await this.tronWeb.trx.getBalance(this.address);
    return (balanceSun / 1_000_000).toFixed(6); // Convert SUN to TRX
  }

  /**
   * Check if TronGrid is reachable by fetching the latest block.
   */
  async isConnected(): Promise<boolean> {
    try {
      const block = await this.tronWeb.trx.getCurrentBlock();
      return !!block && !!block.block_header;
    } catch {
      return false;
    }
  }
}