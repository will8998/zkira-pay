import { Wallet, JsonRpcProvider, formatEther } from 'ethers';
import type { Provider } from 'ethers';

export class RelayerWallet {
  public readonly wallet: Wallet;
  public readonly provider: Provider;
  public readonly address: string;

  constructor(privateKey: string, provider: JsonRpcProvider) {
    if (!privateKey) {
      throw new Error('RELAYER_PRIVATE_KEY is required');
    }

    this.provider = provider;
    this.wallet = new Wallet(privateKey, provider);
    this.address = this.wallet.address;
  }

  /**
   * Check ETH balance of the relayer wallet (formatted as string in ETH).
   */
  async checkBalance(): Promise<string> {
    const balance = await this.provider.getBalance(this.address);
    return formatEther(balance);
  }

  /**
   * Check if the Arbitrum node is reachable by fetching the latest block number.
   */
  async isConnected(): Promise<boolean> {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      return blockNumber > 0;
    } catch {
      return false;
    }
  }
}
