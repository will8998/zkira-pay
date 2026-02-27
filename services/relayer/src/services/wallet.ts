import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';

export class RelayerWallet {
  private keypair: Keypair;

  constructor(privateKeyBase58: string) {
    try {
      // Decode base58 private key and create keypair
      const secretKey = this.decodeBase58(privateKeyBase58);
      this.keypair = Keypair.fromSecretKey(secretKey);
    } catch (error) {
      throw new Error(`Invalid private key format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  get publicKey(): PublicKey {
    return this.keypair.publicKey;
  }

  sign(transaction: Transaction): Transaction {
    transaction.sign(this.keypair);
    return transaction;
  }

  async checkBalance(connection: Connection): Promise<number> {
    try {
      const balance = await connection.getBalance(this.keypair.publicKey);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      throw new Error(`Failed to check wallet balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Simple base58 decoder (avoiding external dependencies)
  private decodeBase58(encoded: string): Uint8Array {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const base = alphabet.length;
    
    let decoded = 0n;
    let multi = 1n;
    
    for (let i = encoded.length - 1; i >= 0; i--) {
      const char = encoded[i];
      const index = alphabet.indexOf(char);
      if (index === -1) {
        throw new Error(`Invalid character '${char}' in base58 string`);
      }
      decoded += BigInt(index) * multi;
      multi *= BigInt(base);
    }
    
    // Convert to bytes
    const bytes: number[] = [];
    while (decoded > 0n) {
      bytes.unshift(Number(decoded % 256n));
      decoded = decoded / 256n;
    }
    
    // Handle leading zeros
    for (let i = 0; i < encoded.length && encoded[i] === '1'; i++) {
      bytes.unshift(0);
    }
    
    return new Uint8Array(bytes);
  }
}