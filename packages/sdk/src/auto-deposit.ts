import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { ShieldedPoolClient } from './pool.js';
import { BrowserWallet } from './browser-wallet.js';
import { ReceiptManager } from './receipt.js';
import type { PoolConfig, PoolNote, EncryptedReceipt } from './types.js';

export interface AutoDepositConfig {
  connection: Connection;
  wallet: BrowserWallet;
  poolConfig: PoolConfig;
  /** Polling interval in ms for balance checks (default: 3000) */
  pollIntervalMs?: number;
}

export interface AutoDepositResult {
  /** Base64-encoded partially-signed transaction ready for relayer */
  transaction: string;
  /** The pool note (unencrypted — encrypt before storing) */
  note: PoolNote;
}

export class AutoDepositManager {
  private connection: Connection;
  private wallet: BrowserWallet;
  private poolConfig: PoolConfig;
  private pollIntervalMs: number;

  constructor(config: AutoDepositConfig) {
    this.connection = config.connection;
    this.wallet = config.wallet;
    this.poolConfig = config.poolConfig;
    this.pollIntervalMs = config.pollIntervalMs ?? 3000;
  }

  /**
   * Get the USDC deposit address for the ephemeral wallet.
   */
  getDepositAddress(): string {
    return this.wallet.publicKey.toBase58();
  }

  /**
   * Wait for USDC to arrive at the ephemeral wallet's ATA.
   * Polls the balance until it reaches at least the pool denomination.
   * Returns when funds are detected.
   * 
   * @param abortSignal - Optional AbortSignal to cancel polling
   * @returns The detected balance in raw token units
   */
  async waitForFunds(abortSignal?: AbortSignal): Promise<bigint> {
    const ata = await getAssociatedTokenAddress(
      this.poolConfig.tokenMint,
      this.wallet.publicKey
    );

    return new Promise<bigint>((resolve, reject) => {
      const poll = async () => {
        if (abortSignal?.aborted) {
          reject(new Error('Deposit cancelled'));
          return;
        }

        try {
          const balance = await this.connection.getTokenAccountBalance(ata);
          const amount = BigInt(balance.value.amount);
          
          if (amount >= this.poolConfig.denomination) {
            resolve(amount);
            return;
          }
        } catch {
          // ATA doesn't exist yet — keep polling
        }

        setTimeout(poll, this.pollIntervalMs);
      };

      poll();
    });
  }

  /**
   * Build a deposit transaction for relay submission.
   * Call this after waitForFunds() resolves.
   * 
   * @returns Transaction (base64) and note for receipt creation
   */
  async buildDepositTransaction(): Promise<AutoDepositResult> {
    const poolClient = new ShieldedPoolClient(
      this.connection,
      this.wallet,
      this.poolConfig
    );

    const { transaction, note } = await poolClient.depositForRelay(
      this.poolConfig.tokenMint
    );

    // Serialize transaction to base64 for relay submission
    const serialized = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    
    // Use browser-safe base64 encoding
    const base64Tx = btoa(String.fromCharCode(...serialized));

    return {
      transaction: base64Tx,
      note,
    };
  }

  /**
   * Encrypt a pool note into a downloadable receipt.
   */
  async createReceipt(
    note: PoolNote,
    password: string
  ): Promise<EncryptedReceipt> {
    return ReceiptManager.encrypt(
      note,
      password,
      this.poolConfig.poolAddress.toBase58(),
      this.poolConfig.denomination
    );
  }
}