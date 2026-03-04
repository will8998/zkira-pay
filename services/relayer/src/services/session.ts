import { Contract, isAddress, formatUnits } from 'ethers';
import { RelayerWallet } from './wallet.js';
import type { RelayerConfig } from '../config.js';
import type { PoolStatus } from '../types.js';

const POOL_ABI = [
  'function denomination() external view returns (uint256)',
  'function nextIndex() external view returns (uint32)',
  'function isSpent(bytes32 _nullifierHash) external view returns (bool)',
  'function paused() external view returns (bool)',
];

const ERC20_ABI = [
  'function balanceOf(address) external view returns (uint256)',
];

export class SessionService {
  constructor(
    private wallet: RelayerWallet,
    private config: RelayerConfig,
  ) {}

  /**
   * Validate an EVM address format.
   */
  isValidAddress(address: string): boolean {
    return isAddress(address);
  }

  /**
   * Pick a healthy (not paused) pool from configured pools.
   * Returns the first healthy pool address, or null if none available.
   */
  async pickHealthyPool(): Promise<string | null> {
    for (const poolAddress of this.config.poolAddresses) {
      try {
        const status = await this.getPoolStatus(poolAddress);
        if (!status.isPaused) {
          return poolAddress;
        }
      } catch {
        // Skip pools that fail status checks
        continue;
      }
    }
    return null;
  }

  /**
   * Get the USDC balance for an EVM address.
   * Returns raw balance (in smallest unit) and UI amount (divided by 1e6).
   */
  async getUsdcBalance(address: string): Promise<{ balance: string; uiAmount: string }> {
    try {
      const contract = new Contract(this.config.usdcAddress, ERC20_ABI, this.wallet.provider);
      const result: bigint = await contract.balanceOf(address);
      const raw = result.toString();
      const uiAmount = formatUnits(result, 6);
      return { balance: raw, uiAmount };
    } catch {
      return { balance: '0', uiAmount: '0.0' };
    }
  }

  /**
   * Get status of a specific pool contract.
   */
  async getPoolStatus(poolAddress: string): Promise<PoolStatus> {
    const poolContract = new Contract(poolAddress, POOL_ABI, this.wallet.provider);

    const [denomination, isPaused, nextIndex] = await Promise.all([
      poolContract.denomination().then((r: bigint) => r.toString()).catch(() => '0'),
      poolContract.paused().catch(() => false),
      poolContract.nextIndex().then((r: bigint) => Number(r)).catch(() => 0),
    ]);

    // Get USDC balance of the pool
    const poolBalance = await this.getUsdcBalance(poolAddress);

    return {
      address: poolAddress,
      denomination: denomination.toString(),
      isPaused: Boolean(isPaused),
      nextIndex: nextIndex as number,
      balance: poolBalance.balance,
    };
  }

  /**
   * Get status for all configured pools.
   */
  async getAllPoolStatuses(): Promise<PoolStatus[]> {
    const statuses = await Promise.all(
      this.config.poolAddresses.map(async (addr) => {
        try {
          return await this.getPoolStatus(addr);
        } catch {
          return {
            address: addr,
            denomination: '0',
            isPaused: true, // Mark as paused if status check fails
            nextIndex: 0,
            balance: '0',
          };
        }
      }),
    );
    return statuses;
  }
}
