import { JsonRpcProvider, Wallet, Contract, parseUnits } from 'ethers';
import { db } from '../db/index.js';
import { ephemeralWallets, gatewaySessions } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { decryptPrivateKey } from './crypto.js';

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
];

/**
 * SweepService moves funds from confirmed ephemeral wallets to the treasury address.
 * Runs on a polling interval, processes wallets with status='active' that belong
 * to confirmed sessions.
 */
export class SweepService {
  private provider: JsonRpcProvider;
  private pollIntervalMs: number;
  private intervalId: NodeJS.Timeout | null = null;
  private treasuryAddress: string;

  constructor(rpcUrl: string, treasuryAddress: string, pollIntervalMs: number = 60_000) {
    this.provider = new JsonRpcProvider(rpcUrl);
    this.treasuryAddress = treasuryAddress;
    this.pollIntervalMs = pollIntervalMs;
  }

  start(): void {
    if (this.intervalId) {
      console.warn('SweepService is already running');
      return;
    }

    if (!this.treasuryAddress) {
      console.warn('SweepService: No treasury address configured, sweep disabled');
      return;
    }

    console.log(`SweepService started (polling every ${this.pollIntervalMs / 1000}s, treasury: ${this.treasuryAddress})`);

    // First tick after 30s delay (give balance monitor time to detect deposits first)
    setTimeout(() => {
      this.tick().catch(err => console.error('SweepService initial tick failed:', err));
      this.intervalId = setInterval(() => {
        this.tick().catch(err => console.error('SweepService tick failed:', err));
      }, this.pollIntervalMs);
    }, 30_000);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('SweepService stopped');
    }
  }

  private async tick(): Promise<void> {
    try {
      // Find active ephemeral wallets that belong to confirmed sessions
      const walletsToSweep = await db
        .select({
          id: ephemeralWallets.id,
          address: ephemeralWallets.address,
          encryptedKey: ephemeralWallets.encryptedKey,
          iv: ephemeralWallets.iv,
          authTag: ephemeralWallets.authTag,
          salt: ephemeralWallets.salt,
          token: ephemeralWallets.token,
          chain: ephemeralWallets.chain,
        })
        .from(ephemeralWallets)
        .innerJoin(
          gatewaySessions,
          eq(ephemeralWallets.address, gatewaySessions.ephemeralWallet)
        )
        .where(
          and(
            eq(ephemeralWallets.status, 'active'),
            eq(gatewaySessions.status, 'confirmed')
          )
        )
        .limit(20); // Process up to 20 per tick

      if (walletsToSweep.length === 0) return;

      console.log(`SweepService: processing ${walletsToSweep.length} wallets`);

      for (const wallet of walletsToSweep) {
        try {
          await this.sweepWallet(wallet);
        } catch (error) {
          console.error(`SweepService: failed to sweep wallet ${wallet.address}:`, error);
          // Continue with other wallets
        }
      }
    } catch (error) {
      console.error('SweepService tick error:', error);
    }
  }

  private async sweepWallet(wallet: {
    id: string;
    address: string;
    encryptedKey: string;
    iv: string;
    authTag: string;
    salt: string | null;
    token: string | null;
    chain: string | null;
  }): Promise<void> {
    // Decrypt the private key
    const privateKey = decryptPrivateKey(wallet.encryptedKey, wallet.iv, wallet.authTag, wallet.salt);

    // Create a signer from the ephemeral wallet
    const signer = new Wallet(privateKey, this.provider);

    // Determine token contract address
    const tokenAddress = this.resolveTokenAddress(wallet.token, wallet.chain);
    if (!tokenAddress) {
      console.warn(`SweepService: unknown token ${wallet.token} on chain ${wallet.chain}, marking as empty`);
      await this.markWalletStatus(wallet.id, 'empty');
      return;
    }

    const erc20 = new Contract(tokenAddress, ERC20_ABI, signer);

    // Get balance
    const balance: bigint = await erc20.balanceOf(wallet.address);
    if (balance === 0n) {
      // No tokens left — mark as empty
      await this.markWalletStatus(wallet.id, 'empty');
      return;
    }

    // Transfer all tokens to treasury
    try {
      const tx = await erc20.transfer(this.treasuryAddress, balance);
      const receipt = await tx.wait(1);

      if (receipt) {
        // Mark wallet as swept with the sweep tx hash
        await db.update(ephemeralWallets)
          .set({
            status: 'swept',
            txHash: receipt.hash,
            updatedAt: new Date(),
          })
          .where(eq(ephemeralWallets.id, wallet.id));

        console.log(`SweepService: swept ${wallet.address} → ${this.treasuryAddress} (tx: ${receipt.hash})`);
      }
    } catch (error) {
      // ERC-20 transfer requires gas (ETH). If the ephemeral wallet has no ETH,
      // the transfer will fail. In production, we'd need to fund gas first.
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message.includes('insufficient funds') || message.includes('gas')) {
        console.warn(`SweepService: wallet ${wallet.address} needs gas funding for sweep`);
      } else {
        throw error;
      }
    }
  }

  private async markWalletStatus(walletId: string, status: string): Promise<void> {
    await db.update(ephemeralWallets)
      .set({ status, updatedAt: new Date() })
      .where(eq(ephemeralWallets.id, walletId));
  }

  private resolveTokenAddress(token: string | null, chain: string | null): string | null {
    if (!token) return null;
    const upperToken = token.toUpperCase();

    // Default to Arbitrum Sepolia
    const isMainnet = chain?.toLowerCase() === 'arbitrum' || chain?.toLowerCase() === 'arbitrum-mainnet';

    const addresses: Record<string, Record<string, string>> = {
      mainnet: {
        'USDC': '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        'USDT': '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
        'DAI': '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      },
      testnet: {
        'USDC': '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
        'USDT': '0x3870546cfd600ba87e4726f43a3f53e4f245e23b',
        'DAI': '0xc5Fa5669E326DA8B2C35540257cD48811F40a36B',
      },
    };

    const network = isMainnet ? 'mainnet' : 'testnet';
    return addresses[network]?.[upperToken] || null;
  }
}
