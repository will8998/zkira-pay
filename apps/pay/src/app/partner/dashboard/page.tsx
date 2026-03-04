'use client';

import { useState, useEffect, useCallback } from 'react';
import { getWhitelabelConfig } from '@/config/whitelabel';
import { toast } from 'sonner';

interface ReferralPayment {
  date: string;
  pool: string;
  amount: string;
  txHash: string;
  blockNumber: number;
}

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? 'https://arb1.arbitrum.io/rpc';
const ARBISCAN_TX_URL = 'https://arbiscan.io/tx/';

export default function PartnerDashboard() {
  const [partnerAddress, setPartnerAddress] = useState('');
  const [payments, setPayments] = useState<ReferralPayment[]>([]);
  const [totalEarnings, setTotalEarnings] = useState('0');
  const [transactionCount, setTransactionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidAddress, setIsValidAddress] = useState(false);

  const config = getWhitelabelConfig();

  // Pre-fill partner address from whitelabel config if available
  useEffect(() => {
    if (config.isWhitelabel && config.referrerAddress !== '0x0000000000000000000000000000000000000000') {
      setPartnerAddress(config.referrerAddress);
      setIsValidAddress(true);
    }
  }, [config]);

  const handleAddressChange = (value: string) => {
    setPartnerAddress(value);
    const isEthereumAddress = /^0x[a-fA-F0-9]{40}$/.test(value);
    setIsValidAddress(isEthereumAddress);
  };

  const fetchReferralPayments = useCallback(async () => {
    if (!partnerAddress || !isValidAddress) return;

    setIsLoading(true);
    try {
      const { JsonRpcProvider, Contract } = await import('ethers');
      const provider = new JsonRpcProvider(RPC_URL);

      // TODO: Replace with actual pool addresses from environment or config
      const poolAddresses = [
        process.env.NEXT_PUBLIC_POOL_ADDRESS ?? 'TBD_POOL_ADDRESS',
        // Add more pool addresses as needed
      ].filter(addr => addr !== 'TBD_POOL_ADDRESS');

      if (poolAddresses.length === 0) {
        toast.error('No pool addresses configured');
        return;
      }

      const poolAbi = [
        'event ReferralPayment(address indexed referrer, uint256 amount, address indexed recipient)'
      ];

      let allPayments: ReferralPayment[] = [];
      let totalAmount = 0n;

      for (const poolAddress of poolAddresses) {
        try {
          const poolContract = new Contract(poolAddress, poolAbi, provider);
          const filter = poolContract.filters.ReferralPayment(partnerAddress);
          const events = await poolContract.queryFilter(filter, -10000, 'latest'); // Last ~10k blocks

          for (const event of events) {
            const block = await provider.getBlock(event.blockNumber);
            const amount = BigInt(event.args.amount);
            totalAmount += amount;

            allPayments.push({
              date: new Date(block.timestamp * 1000).toLocaleDateString(),
              pool: poolAddress,
              amount: (Number(amount) / 1e6).toFixed(2), // Assuming 6 decimals (USDC)
              txHash: event.transactionHash,
              blockNumber: event.blockNumber,
            });
          }
        } catch (error) {
          console.error(`Error fetching events for pool ${poolAddress}:`, error);
        }
      }

      // Sort by block number (newest first)
      allPayments.sort((a, b) => b.blockNumber - a.blockNumber);

      setPayments(allPayments);
      setTotalEarnings((Number(totalAmount) / 1e6).toFixed(2));
      setTransactionCount(allPayments.length);

      if (allPayments.length === 0) {
        toast.info('No referral payments found for this address');
      }
    } catch (error) {
      toast.error(`Failed to fetch referral data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [partnerAddress, isValidAddress]);

  return (
    <div className="container mx-auto px-4 py-8 pb-tab">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[var(--color-text)] uppercase tracking-wider mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
          Partner Dashboard
        </h1>
        <p className="text-[var(--color-text-secondary)] text-lg">
          Track your referral earnings from ZKIRA protocol fees
        </p>
      </div>

      {/* Address Input */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-xl mb-8">
        <h2 className="text-xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-4" style={{ fontFamily: 'var(--font-mono)' }}>
          Partner Address
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Ethereum Address (Referrer)
            </label>
            <input
              type="text"
              value={partnerAddress}
              onChange={(e) => handleAddressChange(e.target.value)}
              className={`
                w-full px-4 py-3 bg-[var(--color-bg)] border text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none transition-colors font-mono
                ${isValidAddress 
                  ? 'border-[var(--color-green)] focus:border-[var(--color-green)]'
                  : partnerAddress && !isValidAddress
                  ? 'border-[var(--color-red)] focus:border-[var(--color-red)]'
                  : 'border-[var(--color-border)] focus:border-[var(--color-button)]'
                }
              `}
              placeholder="Enter your partner address (e.g., 0x742d35Cc...)"
            />
            {partnerAddress && !isValidAddress && (
              <p className="text-sm text-[var(--color-red)] mt-1">Invalid Ethereum address</p>
            )}
          </div>

          <button
            onClick={fetchReferralPayments}
            disabled={!isValidAddress || isLoading}
            className="px-6 py-3 bg-[var(--color-button)] text-[var(--color-bg)] hover:bg-[var(--color-button-hover)] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed btn-press"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Loading...</span>
              </div>
            ) : (
              '📊 Fetch Earnings Data'
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 border border-green-700/30 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">💰</span>
            <h3 className="text-lg font-bold text-green-400 uppercase tracking-wide" style={{ fontFamily: 'var(--font-mono)' }}>
              Total Earnings
            </h3>
          </div>
          <p className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-mono)' }}>
            {totalEarnings} USDC
          </p>
          <p className="text-sm text-green-300">
            All-time referral commission
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-700/30 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📈</span>
            <h3 className="text-lg font-bold text-blue-400 uppercase tracking-wide" style={{ fontFamily: 'var(--font-mono)' }}>
              Transactions
            </h3>
          </div>
          <p className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-mono)' }}>
            {transactionCount}
          </p>
          <p className="text-sm text-blue-300">
            Referral payments received
          </p>
        </div>
      </div>

      {/* Payments Table */}
      {payments.length > 0 && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          <div className="p-6 border-b border-[var(--color-border)]">
            <h2 className="text-xl font-bold text-[var(--color-text)] uppercase tracking-wide" style={{ fontFamily: 'var(--font-mono)' }}>
              Recent Payments
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-bg)]">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-bold text-[var(--color-text)] uppercase tracking-wider" style={{ fontFamily: 'var(--font-mono)' }}>
                    Date
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-bold text-[var(--color-text)] uppercase tracking-wider" style={{ fontFamily: 'var(--font-mono)' }}>
                    Pool
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-bold text-[var(--color-text)] uppercase tracking-wider" style={{ fontFamily: 'var(--font-mono)' }}>
                    Amount
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-bold text-[var(--color-text)] uppercase tracking-wider" style={{ fontFamily: 'var(--font-mono)' }}>
                    Transaction
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {payments.map((payment, index) => (
                  <tr key={index} className="hover:bg-[var(--color-hover)] transition-colors">
                    <td className="px-6 py-4 text-sm text-[var(--color-text)]">
                      {payment.date}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--color-text)] font-mono">
                      {payment.pool.slice(0, 8)}...{payment.pool.slice(-6)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-green-400">
                      {payment.amount} USDC
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <a
                        href={`${ARBISCAN_TX_URL}${payment.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--color-button)] hover:text-[var(--color-button-hover)] underline font-mono"
                      >
                        {payment.txHash.slice(0, 10)}...{payment.txHash.slice(-8)} →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && payments.length === 0 && partnerAddress && isValidAddress && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-12 rounded-xl text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-bold text-[var(--color-text)] mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
            No Payments Found
          </h3>
          <p className="text-[var(--color-text-secondary)] max-w-md mx-auto">
            This partner address hasn't received any referral payments yet. Start referring users to earn commissions!
          </p>
        </div>
      )}
    </div>
  );
}