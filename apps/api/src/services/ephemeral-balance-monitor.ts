import { JsonRpcProvider, Contract, formatUnits } from 'ethers';
import { db } from '../db/index.js';
import { gatewaySessions } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

// Token address registry
const TOKEN_ADDRESSES = {
  // Arbitrum Sepolia (chainId 421614)
  '421614': {
    'USDC': '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    'USDT': '0x3870546cfd600ba87e4726f43a3f53e4f245e23b',
    'DAI': '0xc5Fa5669E326DA8B2C35540257cD48811F40a36B'
  },
  // Arbitrum Mainnet (chainId 42161)
  '42161': {
    'USDC': '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    'USDT': '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    'DAI': '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'
  }
};

// Token decimals
const TOKEN_DECIMALS = {
  'USDC': 6,
  'USDT': 6,
  'DAI': 18
};

export class EphemeralBalanceMonitor {
  private provider: JsonRpcProvider;
  private pollIntervalMs: number;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(rpcUrl: string, pollIntervalMs: number = 15000) {
    this.provider = new JsonRpcProvider(rpcUrl);
    this.pollIntervalMs = pollIntervalMs;
  }

  start(): void {
    if (this.intervalId) {
      console.warn('EphemeralBalanceMonitor is already running');
      return;
    }

    console.log('Starting EphemeralBalanceMonitor...');
    this.tick(); // Run immediately
    this.intervalId = setInterval(() => this.tick(), this.pollIntervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('EphemeralBalanceMonitor stopped');
    }
  }

  private async tick(): Promise<void> {
    try {
      // Query pending deposit sessions that have ephemeralWallet set
      const sessions = await db
        .select({
          id: gatewaySessions.id,
          merchantId: gatewaySessions.merchantId,
          ephemeralWallet: gatewaySessions.ephemeralWallet,
          amount: gatewaySessions.amount,
          token: gatewaySessions.token,
          chain: gatewaySessions.chain
        })
        .from(gatewaySessions)
        .where(
          and(
            eq(gatewaySessions.status, 'pending'),
            eq(gatewaySessions.sessionType, 'deposit'),
            // ephemeralWallet IS NOT NULL
            eq(gatewaySessions.ephemeralWallet, gatewaySessions.ephemeralWallet)
          )
        );

      console.log(`Checking ${sessions.length} pending deposit sessions...`);

      for (const session of sessions) {
        if (!session.ephemeralWallet) continue;

        try {
          await this.checkSessionBalance({ ...session, ephemeralWallet: session.ephemeralWallet });
        } catch (error) {
          console.error(`Failed to check balance for session ${session.id}:`, error);
          // Continue processing other sessions
        }
      }
    } catch (error) {
      console.error('Failed to fetch pending sessions:', error);
    }
  }

  private async checkSessionBalance(session: {
    id: string;
    merchantId: string;
    ephemeralWallet: string;
    amount: string;
    token: string;
    chain: string;
  }): Promise<void> {
    // Resolve the ERC-20 contract address
    const chainId = this.getChainId(session.chain);
    const tokenAddress = this.getTokenAddress(chainId, session.token);
    
    if (!tokenAddress) {
      console.warn(`Unknown token ${session.token} on chain ${session.chain} for session ${session.id}`);
      return;
    }

    // Create ERC-20 contract instance
    const erc20Contract = new Contract(tokenAddress, ERC20_ABI, this.provider);

    // Get current balance
    const balance = await erc20Contract.balanceOf(session.ephemeralWallet);
    
    // Parse expected amount to same precision
    const decimals = TOKEN_DECIMALS[session.token.toUpperCase() as keyof typeof TOKEN_DECIMALS] || 18;
    const expectedAmount = BigInt(Math.floor(parseFloat(session.amount) * Math.pow(10, decimals)));
    
    console.log(`Session ${session.id}: balance=${formatUnits(balance, decimals)}, expected=${session.amount}`);

    if (balance >= expectedAmount) {
      // Sufficient balance detected - get transaction hash
      let txHash = 'auto-detected';
      
      try {
        // Query the last Transfer event to this address to get the tx hash
        const filter = erc20Contract.filters.Transfer(null, session.ephemeralWallet);
        const events = await erc20Contract.queryFilter(filter, -1000); // last 1000 blocks
        if (events.length > 0) {
          txHash = events[events.length - 1].transactionHash;
        }
      } catch (error) {
        console.warn(`Failed to get transaction hash for session ${session.id}:`, error);
      }

      // Update the session with txHash and commitment placeholder
      await db.update(gatewaySessions)
        .set({ 
          txHash, 
          commitment: 'gateway-deposit', 
          updatedAt: new Date() 
        })
        .where(eq(gatewaySessions.id, session.id));

      console.log(`Deposit detected for session ${session.id}: ${txHash}`);
    } else if (balance > 0n) {
      // Partial payment detected
      console.log(`Partial payment detected for session ${session.id}: ${formatUnits(balance, decimals)}/${session.amount}`);
    }
  }

  private getChainId(chain: string): string {
    switch (chain.toLowerCase()) {
      case 'arbitrum':
      case 'arbitrum-mainnet':
        return '42161';
      case 'arbitrum-sepolia':
      case 'arbitrum-testnet':
        return '421614';
      default:
        // Default to Arbitrum Sepolia for unknown chains
        return '421614';
    }
  }

  private getTokenAddress(chainId: string, token: string): string | null {
    const chainTokens = TOKEN_ADDRESSES[chainId as keyof typeof TOKEN_ADDRESSES];
    if (!chainTokens) return null;
    
    return chainTokens[token.toUpperCase() as keyof typeof chainTokens] || null;
  }
}