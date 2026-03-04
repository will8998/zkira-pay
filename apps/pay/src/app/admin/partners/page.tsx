'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface Partner {
  address: string;
  feeBps: number;
  totalEarnings: string;
  isActive: boolean;
}

interface AdminWallet {
  address: string;
  signer: any;
}

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? 'https://arb1.arbitrum.io/rpc';
const POOL_ADDRESS = process.env.NEXT_PUBLIC_POOL_ADDRESS ?? 'TBD_POOL_ADDRESS';

export default function AdminPartnersPage() {
  const [wallet, setWallet] = useState<AdminWallet | null>(null);
  const [privateKey, setPrivateKey] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Contract state
  const [protocolFee, setProtocolFee] = useState('0');
  const [treasuryAddress, setTreasuryAddress] = useState('');
  const [partners, setPartners] = useState<Partner[]>([]);
  
  // Form state
  const [newPartnerAddress, setNewPartnerAddress] = useState('');
  const [newPartnerFee, setNewPartnerFee] = useState('');
  const [editingFee, setEditingFee] = useState<{ address: string; fee: string } | null>(null);

  // Admin ABI (simplified for demo - replace with actual contract ABI)
  const poolAdminAbi = [
    'function owner() view returns (address)',
    'function protocolFeeBps() view returns (uint256)',
    'function treasury() view returns (address)',
    'function referrerFeeBps(address) view returns (uint256)',
    'function setProtocolFee(uint256) external',
    'function setTreasury(address) external',
    'function registerReferrer(address, uint256) external',
    'function deregisterReferrer(address) external',
    'function updateReferrerFee(address, uint256) external',
    'event ReferrerRegistered(address indexed referrer, uint256 feeBps)',
    'event ReferrerDeregistered(address indexed referrer)',
    'event ReferralPayment(address indexed referrer, uint256 amount, address indexed recipient)'
  ];

  const connectWithPrivateKey = async () => {
    if (!privateKey.trim()) {
      toast.error('Please enter a private key');
      return;
    }

    try {
      const { JsonRpcProvider, Wallet } = await import('ethers');
      const provider = new JsonRpcProvider(RPC_URL);
      const wallet = new Wallet(privateKey, provider);
      
      setWallet({
        address: wallet.address,
        signer: wallet,
      });
      
      toast.success(`Connected: ${wallet.address.slice(0, 8)}...${wallet.address.slice(-6)}`);
      setPrivateKey(''); // Clear private key from UI
    } catch (error) {
      toast.error('Invalid private key');
    }
  };

  const connectExternalWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast.error('No wallet found. Please install MetaMask or another wallet.');
      return;
    }

    try {
      const { BrowserProvider } = await import('ethers');
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setWallet({
        address,
        signer,
      });

      toast.success(`Connected: ${address.slice(0, 8)}...${address.slice(-6)}`);
    } catch (error) {
      toast.error('Failed to connect wallet');
    }
  };

  const checkOwnership = useCallback(async () => {
    if (!wallet) return;

    try {
      const { Contract } = await import('ethers');
      const poolContract = new Contract(POOL_ADDRESS, poolAdminAbi, wallet.signer);
      
      const owner = await poolContract.owner();
      const isOwner = owner.toLowerCase() === wallet.address.toLowerCase();
      setIsOwner(isOwner);

      if (!isOwner) {
        toast.error('Access denied: Not the pool owner');
      }
    } catch (error) {
      toast.error('Failed to check ownership');
    }
  }, [wallet]);

  const loadContractData = useCallback(async () => {
    if (!wallet || !isOwner) return;

    setIsLoading(true);
    try {
      const { Contract, JsonRpcProvider } = await import('ethers');
      const provider = new JsonRpcProvider(RPC_URL);
      const poolContract = new Contract(POOL_ADDRESS, poolAdminAbi, provider);

      // Load basic contract data
      const [protocolFeeBps, treasury] = await Promise.all([
        poolContract.protocolFeeBps(),
        poolContract.treasury(),
      ]);

      setProtocolFee(protocolFeeBps.toString());
      setTreasuryAddress(treasury);

      // Load registered partners from events
      const registeredFilter = poolContract.filters.ReferrerRegistered();
      const deregisteredFilter = poolContract.filters.ReferrerDeregistered();
      
      const [registeredEvents, deregisteredEvents] = await Promise.all([
        poolContract.queryFilter(registeredFilter, -50000, 'latest'),
        poolContract.queryFilter(deregisteredFilter, -50000, 'latest'),
      ]);

      // Build current partners list
      const partnerMap = new Map<string, { feeBps: number; isActive: boolean }>();
      
      // Process registered events
      for (const event of registeredEvents) {
        const address = event.args.referrer;
        const feeBps = Number(event.args.feeBps);
        partnerMap.set(address.toLowerCase(), { feeBps, isActive: true });
      }
      
      // Process deregistered events (mark as inactive)
      for (const event of deregisteredEvents) {
        const address = event.args.referrer;
        const existing = partnerMap.get(address.toLowerCase());
        if (existing) {
          partnerMap.set(address.toLowerCase(), { ...existing, isActive: false });
        }
      }

      // Calculate total earnings for each partner
      const partnersWithEarnings: Partner[] = [];
      
      for (const [address, data] of partnerMap) {
        try {
          const paymentFilter = poolContract.filters.ReferralPayment(address);
          const paymentEvents = await poolContract.queryFilter(paymentFilter, -50000, 'latest');
          
          const totalAmount = paymentEvents.reduce((sum, event) => {
            return sum + BigInt(event.args.amount);
          }, 0n);

          partnersWithEarnings.push({
            address,
            feeBps: data.feeBps,
            totalEarnings: (Number(totalAmount) / 1e6).toFixed(2), // USDC has 6 decimals
            isActive: data.isActive,
          });
        } catch (error) {
          console.error(`Error loading data for partner ${address}:`, error);
          partnersWithEarnings.push({
            address,
            feeBps: data.feeBps,
            totalEarnings: '0.00',
            isActive: data.isActive,
          });
        }
      }

      setPartners(partnersWithEarnings);
    } catch (error) {
      toast.error('Failed to load contract data');
    } finally {
      setIsLoading(false);
    }
  }, [wallet, isOwner]);

  const updateProtocolFee = async () => {
    if (!wallet || !isOwner) return;

    try {
      const { Contract } = await import('ethers');
      const poolContract = new Contract(POOL_ADDRESS, poolAdminAbi, wallet.signer);
      
      const tx = await poolContract.setProtocolFee(protocolFee);
      toast.info('Transaction submitted...');
      await tx.wait();
      toast.success('Protocol fee updated');
    } catch (error) {
      toast.error('Failed to update protocol fee');
    }
  };

  const updateTreasury = async () => {
    if (!wallet || !isOwner) return;

    try {
      const { Contract } = await import('ethers');
      const poolContract = new Contract(POOL_ADDRESS, poolAdminAbi, wallet.signer);
      
      const tx = await poolContract.setTreasury(treasuryAddress);
      toast.info('Transaction submitted...');
      await tx.wait();
      toast.success('Treasury address updated');
    } catch (error) {
      toast.error('Failed to update treasury address');
    }
  };

  const registerPartner = async () => {
    if (!wallet || !isOwner || !newPartnerAddress || !newPartnerFee) return;

    const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(newPartnerAddress);
    if (!isValidAddress) {
      toast.error('Invalid Ethereum address');
      return;
    }

    const feeBps = parseInt(newPartnerFee);
    if (isNaN(feeBps) || feeBps < 0 || feeBps > 10000) {
      toast.error('Fee must be between 0-10000 basis points (0-100%)');
      return;
    }

    try {
      const { Contract } = await import('ethers');
      const poolContract = new Contract(POOL_ADDRESS, poolAdminAbi, wallet.signer);
      
      const tx = await poolContract.registerReferrer(newPartnerAddress, feeBps);
      toast.info('Transaction submitted...');
      await tx.wait();
      toast.success('Partner registered successfully');
      
      setNewPartnerAddress('');
      setNewPartnerFee('');
      loadContractData(); // Refresh data
    } catch (error) {
      toast.error('Failed to register partner');
    }
  };

  const deregisterPartner = async (address: string) => {
    if (!wallet || !isOwner) return;

    try {
      const { Contract } = await import('ethers');
      const poolContract = new Contract(POOL_ADDRESS, poolAdminAbi, wallet.signer);
      
      const tx = await poolContract.deregisterReferrer(address);
      toast.info('Transaction submitted...');
      await tx.wait();
      toast.success('Partner deregistered');
      
      loadContractData(); // Refresh data
    } catch (error) {
      toast.error('Failed to deregister partner');
    }
  };

  // Check ownership when wallet changes
  useEffect(() => {
    if (wallet) {
      checkOwnership();
    }
  }, [wallet, checkOwnership]);

  // Load contract data when user is verified as owner
  useEffect(() => {
    if (isOwner) {
      loadContractData();
    }
  }, [isOwner, loadContractData]);

  return (
    <div className="container mx-auto px-4 py-8 pb-tab">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[var(--color-text)] uppercase tracking-wider mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
          Admin: Partner Management
        </h1>
        <p className="text-[var(--color-text-secondary)] text-lg">
          Manage protocol partners and referral fee structure
        </p>
      </div>

      {/* Wallet Connection */}
      {!wallet ? (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-xl mb-8">
          <h2 className="text-xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-4" style={{ fontFamily: 'var(--font-mono)' }}>
            Connect Admin Wallet
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* External Wallet */}
            <div className="space-y-4">
              <h3 className="font-bold text-[var(--color-text)]">External Wallet</h3>
              <button
                onClick={connectExternalWallet}
                className="w-full px-4 py-3 bg-[var(--color-button)] text-[var(--color-bg)] hover:bg-[var(--color-button-hover)] font-bold transition-colors btn-press"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                🦊 Connect MetaMask
              </button>
            </div>

            {/* Private Key */}
            <div className="space-y-4">
              <h3 className="font-bold text-[var(--color-text)]">Private Key</h3>
              <input
                type="password"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="Enter admin private key"
                className="w-full px-4 py-3 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-button)] focus:outline-none transition-colors font-mono"
              />
              <button
                onClick={connectWithPrivateKey}
                disabled={!privateKey.trim()}
                className="w-full px-4 py-3 bg-[var(--color-hover)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed btn-press"
              >
                Connect with Key
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Wallet Status */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 rounded-xl mb-8">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-[var(--color-text-secondary)]">Connected:</span>
                <span className="ml-2 font-mono text-[var(--color-text)]">{wallet.address}</span>
                {isOwner && <span className="ml-2 px-2 py-1 bg-green-600 text-white text-xs rounded font-bold">OWNER</span>}
                {wallet && !isOwner && <span className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded font-bold">NO ACCESS</span>}
              </div>
              <button
                onClick={() => setWallet(null)}
                className="px-4 py-2 bg-[var(--color-hover)] text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>

          {/* Admin Panel (only show if owner) */}
          {isOwner && (
            <>
              {/* Protocol Settings */}
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-xl mb-8">
                <h2 className="text-xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-6" style={{ fontFamily: 'var(--font-mono)' }}>
                  Protocol Settings
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Protocol Fee */}
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-[var(--color-text)]">
                      Protocol Fee (basis points, 0-10000)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={protocolFee}
                        onChange={(e) => setProtocolFee(e.target.value)}
                        className="flex-1 px-4 py-3 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] focus:border-[var(--color-button)] focus:outline-none transition-colors font-mono"
                      />
                      <button
                        onClick={updateProtocolFee}
                        className="px-4 py-2 bg-[var(--color-button)] text-[var(--color-bg)] hover:bg-[var(--color-button-hover)] font-bold transition-colors btn-press"
                      >
                        Update
                      </button>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Current: {(Number(protocolFee) / 100).toFixed(2)}%
                    </p>
                  </div>

                  {/* Treasury */}
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-[var(--color-text)]">
                      Treasury Address
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={treasuryAddress}
                        onChange={(e) => setTreasuryAddress(e.target.value)}
                        className="flex-1 px-4 py-3 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] focus:border-[var(--color-button)] focus:outline-none transition-colors font-mono text-sm"
                      />
                      <button
                        onClick={updateTreasury}
                        className="px-4 py-2 bg-[var(--color-button)] text-[var(--color-bg)] hover:bg-[var(--color-button-hover)] font-bold transition-colors btn-press"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Add New Partner */}
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-xl mb-8">
                <h2 className="text-xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-6" style={{ fontFamily: 'var(--font-mono)' }}>
                  Add New Partner
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-bold text-[var(--color-text)] mb-2">
                      Partner Address
                    </label>
                    <input
                      type="text"
                      value={newPartnerAddress}
                      onChange={(e) => setNewPartnerAddress(e.target.value)}
                      placeholder="0x..."
                      className="w-full px-4 py-3 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] focus:border-[var(--color-button)] focus:outline-none transition-colors font-mono"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-[var(--color-text)] mb-2">
                      Fee (basis points)
                    </label>
                    <input
                      type="number"
                      value={newPartnerFee}
                      onChange={(e) => setNewPartnerFee(e.target.value)}
                      placeholder="e.g., 1000 = 10%"
                      className="w-full px-4 py-3 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] focus:border-[var(--color-button)] focus:outline-none transition-colors font-mono"
                    />
                  </div>
                  
                  <button
                    onClick={registerPartner}
                    disabled={!newPartnerAddress || !newPartnerFee}
                    className="px-6 py-3 bg-green-600 text-white hover:bg-green-700 font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed btn-press"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    ➕ Register Partner
                  </button>
                </div>
              </div>

              {/* Partners Table */}
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
                <div className="p-6 border-b border-[var(--color-border)]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[var(--color-text)] uppercase tracking-wide" style={{ fontFamily: 'var(--font-mono)' }}>
                      Registered Partners
                    </h2>
                    <button
                      onClick={loadContractData}
                      disabled={isLoading}
                      className="px-4 py-2 bg-[var(--color-button)] text-[var(--color-bg)] hover:bg-[var(--color-button-hover)] transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'Loading...' : '🔄 Refresh'}
                    </button>
                  </div>
                </div>
                
                {partners.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[var(--color-bg)]">
                        <tr>
                          <th className="text-left px-6 py-3 text-sm font-bold text-[var(--color-text)] uppercase tracking-wider" style={{ fontFamily: 'var(--font-mono)' }}>
                            Address
                          </th>
                          <th className="text-left px-6 py-3 text-sm font-bold text-[var(--color-text)] uppercase tracking-wider" style={{ fontFamily: 'var(--font-mono)' }}>
                            Fee (%)
                          </th>
                          <th className="text-left px-6 py-3 text-sm font-bold text-[var(--color-text)] uppercase tracking-wider" style={{ fontFamily: 'var(--font-mono)' }}>
                            Total Earnings
                          </th>
                          <th className="text-left px-6 py-3 text-sm font-bold text-[var(--color-text)] uppercase tracking-wider" style={{ fontFamily: 'var(--font-mono)' }}>
                            Status
                          </th>
                          <th className="text-left px-6 py-3 text-sm font-bold text-[var(--color-text)] uppercase tracking-wider" style={{ fontFamily: 'var(--font-mono)' }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)]">
                        {partners.map((partner, index) => (
                          <tr key={index} className="hover:bg-[var(--color-hover)] transition-colors">
                            <td className="px-6 py-4 text-sm text-[var(--color-text)] font-mono">
                              {partner.address.slice(0, 8)}...{partner.address.slice(-6)}
                            </td>
                            <td className="px-6 py-4 text-sm text-[var(--color-text)] font-bold">
                              {(partner.feeBps / 100).toFixed(2)}%
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-green-400">
                              {partner.totalEarnings} USDC
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-2 py-1 text-xs font-bold rounded ${
                                partner.isActive 
                                  ? 'bg-green-600 text-white' 
                                  : 'bg-red-600 text-white'
                              }`}>
                                {partner.isActive ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {partner.isActive && (
                                <button
                                  onClick={() => deregisterPartner(partner.address)}
                                  className="px-3 py-1 bg-red-600 text-white hover:bg-red-700 text-xs font-bold transition-colors btn-press"
                                >
                                  Deregister
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="text-6xl mb-4">👥</div>
                    <h3 className="text-xl font-bold text-[var(--color-text)] mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
                      No Partners Registered
                    </h3>
                    <p className="text-[var(--color-text-secondary)]">
                      Add your first partner using the form above
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}