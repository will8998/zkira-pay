'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ReceiptManager, type PoolNote, type EncryptedReceipt } from '@zkira/sdk';
import { useBrowserWallet } from '@/components/BrowserWalletProvider';
import { toast } from 'sonner';
import { ChainTokenSelector, type ChainTokenSelection } from '@/components/ChainTokenSelector';
import { getChainConfig, type Chain, type PoolEntry } from '@/config/pool-registry';

interface DepositWizardProps {
  onComplete?: () => void;
}

type Step = 'amount' | 'send' | 'waiting' | 'depositing' | 'receipt';

/** Relayer URL */
const RELAYER_URL = process.env.NEXT_PUBLIC_RELAYER_URL ?? 'http://localhost:3013';
/** Polling interval for USDC balance checks (ms) */
const POLL_INTERVAL_MS = 5000;


export function DepositWizard({ onComplete }: DepositWizardProps) {
  const { address, privateKey, isCreated, createWallet } = useBrowserWallet();

  const [currentStep, setCurrentStep] = useState<Step>('amount');
  const [depositNote, setDepositNote] = useState<PoolNote | null>(null);
  const [password, setPassword] = useState('');
  const [isPolling, setIsPolling] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [selection, setSelection] = useState<ChainTokenSelection | null>(null);

  // Dynamic values from selection
  const selectedChain = selection?.chain ?? 'arbitrum';
  const selectedPool = selection?.pool;
  const poolAddress = selectedPool?.address ?? '';
  const tokenAddress = selectedChain === 'arbitrum'
    ? getChainConfig('arbitrum').tokens.find(t => t.id === selection?.token)?.address ?? ''
    : getChainConfig('tron').tokens.find(t => t.id === selection?.token)?.address ?? '';
  const rpcUrl = getChainConfig(selectedChain).rpcUrl;
  const denominationRaw = BigInt(selection?.denomination ?? '0');

  // Auto-create wallet on mount if not already created
  useEffect(() => {
    if (!isCreated) {
      createWallet();
    }
  }, [isCreated, createWallet]);



  const handleBackToAmount = () => {
    if (currentStep === 'send') {
      setCurrentStep('amount');
      setSelection(null);
    }
  };

  const copyAddress = useCallback(async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch {
      toast.error('Failed to copy address');
    }
  }, [address]);

  /**
   * Poll the USDC balance of the ephemeral wallet until denomination is met.
   */
  const pollForFunds = useCallback(async (signal: AbortSignal): Promise<void> => {
    if (!address) throw new Error('No wallet address');

    const { JsonRpcProvider, Contract } = await import('ethers');
    const provider = new JsonRpcProvider(rpcUrl);

    // USDC contract ABI for balanceOf
    const usdcAbi = ['function balanceOf(address) view returns (uint256)'];

    while (!signal.aborted) {
      try {
        const usdcContract = new Contract(tokenAddress, usdcAbi, provider);
        const balance: bigint = await usdcContract.balanceOf(address);
        if (balance >= denominationRaw) {
          return;
        }
      } catch {
        // Balance check failed — keep polling
      }
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, POLL_INTERVAL_MS);
        signal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
      });
    }
    throw new DOMException('Aborted', 'AbortError');
  }, [address, denominationRaw, rpcUrl, tokenAddress]);

  /**
   * Generate a random bigint from 31 bytes (fits in BN254 field).
   */
  const generateRandomFieldElement = (): bigint => {
    const bytes = new Uint8Array(31);
    crypto.getRandomValues(bytes);
    let result = 0n;
    for (let i = 0; i < bytes.length; i++) {
      result = (result << 8n) + BigInt(bytes[i]);
    }
    return result;
  };

  /**
   * Full deposit flow: poll → approve USDC → deposit commitment → save note.
   */
  const startDepositFlow = useCallback(async () => {
    // Ensure wallet is ready — await creation if useEffect hasn't finished
    let walletAddress = address;
    let walletPrivateKey = privateKey;
    if (!walletAddress || !walletPrivateKey) {
      const walletData = await createWallet();
      walletAddress = walletData.address;
      walletPrivateKey = walletData.privateKey;
    }
    if (!selection?.pool) {
      toast.error('Select a pool first');
      return;
    }

    setIsPolling(true);
    setCurrentStep('waiting');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Stage 1: Wait for USDC funds
      await pollForFunds(controller.signal);

      // Funds detected — move to depositing
      setIsPolling(false);
      setCurrentStep('depositing');
      setIsDepositing(true);

      const { JsonRpcProvider, Contract, Wallet } = await import('ethers');
      const provider = new JsonRpcProvider(rpcUrl);
      const wallet = new Wallet(walletPrivateKey, provider);

      // Stage 2: Generate commitment
      const { buildMimcSponge } = await import('circomlibjs');
      const mimcSponge = await buildMimcSponge();

      const nullifier = generateRandomFieldElement();
      const secret = generateRandomFieldElement();
      const commitment = mimcSponge.F.toObject(
        mimcSponge.multiHash([nullifier, secret], 0n, 1)
      );

      // Stage 3: Approve USDC spend for pool contract
      const usdcAbi = [
        'function approve(address spender, uint256 amount) returns (bool)',
        'function balanceOf(address) view returns (uint256)'
      ];
      const usdcContract = new Contract(tokenAddress, usdcAbi, wallet);
      
      const approveTx = await usdcContract.approve(poolAddress, denominationRaw);
      await approveTx.wait(); // Wait for confirmation

      // Stage 4: Call pool.deposit(commitment)
      const commitmentHex = '0x' + commitment.toString(16).padStart(64, '0');
      const poolAbi = ['function deposit(bytes32) external payable'];
      const poolContract = new Contract(poolAddress, poolAbi, wallet);
      const depositTx = await poolContract.deposit(commitmentHex);

      // Wait for deposit confirmation and get leaf index from events
      const depositReceipt = await depositTx.wait();
      const leafIndex = parseLeafIndexFromReceipt(depositReceipt);

      const note: PoolNote = {
        nullifier,
        secret,
        commitment,
        leafIndex,
      };

      setDepositNote(note);
      setIsDepositing(false);
      setCurrentStep('receipt');
    } catch (error: unknown) {
      setIsPolling(false);
      setIsDepositing(false);

      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      toast.error(error instanceof Error ? error.message : 'Deposit failed. Please try again.');
      setCurrentStep('send');
    }
  }, [address, privateKey, createWallet, selection, pollForFunds, rpcUrl, tokenAddress, poolAddress, denominationRaw]);

  // Start deposit flow when entering send step
  useEffect(() => {
    if (currentStep === 'send') {
      const timer = setTimeout(() => {
        startDepositFlow();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [currentStep, startDepositFlow]);

  const downloadReceipt = async () => {
    if (!depositNote || !password.trim()) {
      toast.error('Please enter a password to encrypt your receipt');
      return;
    }

    try {
      const receipt = await ReceiptManager.encrypt(
        depositNote,
        password,
        poolAddress,
        denominationRaw,
      );
      ReceiptManager.downloadReceipt(receipt);
      toast.success('Receipt downloaded successfully');

      // Reset wizard
      setCurrentStep('amount');
      setSelection(null);
      setDepositNote(null);
      setPassword('');

      onComplete?.();
    } catch {
      toast.error('Failed to create receipt. Please try again.');
    }
  };

  const getStepNumber = (step: Step): number => {
    const stepMap: Record<Step, number> = {
      amount: 1,
      send: 2,
      waiting: 3,
      depositing: 4,
      receipt: 5,
    };
    return stepMap[step];
  };

  const isStepCompleted = (step: Step): boolean => {
    const current = getStepNumber(currentStep);
    const target = getStepNumber(step);
    return current > target;
  };

  const isStepActive = (step: Step): boolean => {
    return currentStep === step;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-between relative">
        {/* Connection Lines */}
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--color-border)]"></div>
        </div>

        {/* Step Circles */}
        {(['amount', 'send', 'waiting', 'depositing', 'receipt'] as Step[]).map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = isStepCompleted(step);
          const isActive = isStepActive(step);

          return (
            <div
              key={step}
              className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 bg-[var(--color-bg)]"
              style={{
                borderColor: isCompleted || isActive ? 'var(--color-button)' : 'var(--color-border)',
                background: isActive ? 'var(--color-button)' : isCompleted ? 'var(--color-green)' : 'var(--color-bg)',
              }}
            >
              {isCompleted ? (
                <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <span
                  className="text-sm font-bold"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: isActive ? 'var(--color-bg)' : 'var(--color-text-secondary)',
                  }}
                >
                  {stepNumber}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-xl">
        {/* Step 1: Choose Deposit */}
        {currentStep === 'amount' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
                Choose Deposit
              </h2>
              <p className="text-[var(--color-text-secondary)] text-sm">
                Select network, token, and amount. Larger pools provide stronger privacy.
              </p>
            </div>

            <ChainTokenSelector
              onSelectionChange={setSelection}
            />

            <button
              onClick={() => {
                if (selection?.pool) {
                  setCurrentStep('send');
                }
              }}
              disabled={!selection?.pool}
              className="w-full px-6 py-4 bg-[var(--color-button)] text-[var(--color-bg)] hover:bg-[var(--color-button-hover)] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed btn-press"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              CONTINUE →
            </button>
          </div>
        )}

        {/* Step 2: Send Funds */}
        {currentStep === 'send' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
                Send {selection?.pool?.label ?? ''}
              </h2>
              <p className="text-[var(--color-text-secondary)] text-sm">
                Send exactly {selection?.pool?.label ?? ''} to this address from your exchange or wallet
              </p>
            </div>

            {/* QR Code and Address */}
            <div className="bg-[var(--color-bg)] border border-[var(--color-border)] p-6 rounded-xl text-center">
              <div className="inline-block p-4 bg-white rounded-xl mb-4">
                <QRCodeSVG value={address ?? ''} size={200} />
              </div>
              
              <div className="space-y-3">
                <div className="text-xs uppercase tracking-wide text-[var(--color-text-secondary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                  Deposit Address ({getChainConfig(selectedChain).name})
                </div>
                <div className="bg-[var(--color-hover)] border border-[var(--color-border)] p-3 rounded font-mono text-sm text-[var(--color-text)] break-all">
                  {address}
                </div>
                <button
                  onClick={copyAddress}
                  className="px-4 py-2 bg-[var(--color-button)] text-[var(--color-bg)] hover:bg-[var(--color-button-hover)] font-medium transition-colors btn-press text-sm"
                >
                  {copiedAddress ? '✓ Copied' : '📋 Copy Address'}
                </button>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="text-sm">
                  <div className="font-bold text-[var(--color-warning-text)] mb-1" style={{ fontFamily: 'var(--font-mono)' }}>
                    DO NOT CLOSE THIS TAB
                  </div>
                  <div className="text-[var(--color-warning-text)] opacity-80">
                    Keep this page open until the deposit is complete. Closing it will lose your deposit.
                  </div>
                </div>
              </div>
            </div>

            {/* Back Button */}
            <button
              onClick={handleBackToAmount}
              className="w-full px-4 py-3 bg-[var(--color-hover)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] font-medium transition-colors btn-press"
            >
              ← Change Amount
            </button>
          </div>
        )}

        {/* Step 3: Waiting for Funds */}
        {currentStep === 'waiting' && (
          <div className="space-y-6 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-[var(--color-border)] border-t-[var(--color-button)] rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
                Waiting for {selection?.pool?.label ?? ''}
              </h2>
              <p className="text-[var(--color-text-secondary)] text-sm">
                This usually takes 1-2 minutes from an exchange
              </p>
            </div>

            {/* Pulsing indicators */}
            <div className="flex justify-center space-x-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 bg-[var(--color-button)] rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 200}ms` }}
                ></div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Depositing */}
        {currentStep === 'depositing' && (
          <div className="space-y-6 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <svg className="animate-spin h-16 w-16 text-[var(--color-green)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
                Depositing into Shielded Pool
              </h2>
              <p className="text-[var(--color-text-secondary)] text-sm">
                Funds received! Approving USDC and submitting deposit to pool...
              </p>
            </div>
          </div>
        )}

        {/* Step 5: Save Receipt */}
        {currentStep === 'receipt' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
                Deposit Successful!
              </h2>
              <p className="text-[var(--color-text-secondary)] text-sm">
                Your {selection?.pool?.label ?? ''} is now in the shielded pool
              </p>
            </div>

            {/* Receipt Warning */}
            <div className="bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🔒</span>
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-warning-text)] uppercase tracking-wide" style={{ fontFamily: 'var(--font-mono)' }}>
                    SAVE YOUR RECEIPT
                  </h3>
                  <p className="text-sm text-[var(--color-warning-text)] opacity-80">
                    Without this receipt and password, your funds CANNOT be recovered
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-warning-text)] mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
                    CREATE PASSWORD
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password to encrypt receipt"
                    className="w-full px-4 py-3 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-secondary)] focus:border-[var(--color-button)] focus:outline-none transition-colors"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <button
                  onClick={downloadReceipt}
                  disabled={!password.trim()}
                  className="w-full px-6 py-4 bg-[var(--color-green)] text-black hover:bg-[var(--color-green-hover)] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed btn-press"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  💾 DOWNLOAD ENCRYPTED RECEIPT
                </button>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => {
                  setCurrentStep('amount');
                  setSelection(null);
                  setDepositNote(null);
                  setPassword('');
                  onComplete?.();
                }}
                className="px-6 py-3 bg-[var(--color-hover)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] font-medium transition-colors btn-press"
              >
                Start New Deposit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Parse the leafIndex from an Ethereum transaction receipt's event logs.
 * The Pool contract emits a Deposit(bytes32 commitment, uint32 leafIndex, uint256 timestamp) event.
 */
function parseLeafIndexFromReceipt(receipt: any): number {
  // Look for Deposit event in logs
  const depositEventTopic = '0x...'; // TODO: Replace with actual Deposit event topic hash
  
  for (const log of receipt.logs || []) {
    if (log.topics && log.topics[0] === depositEventTopic) {
      // The leafIndex is in the event data - decode it
      // For now, return a placeholder until the actual contract ABI is available
      // In a real implementation, you'd use ethers.utils.parseLog() with the contract ABI
      return 0; // Placeholder
    }
  }
  
  // Fallback: return 0 if we can't parse (will be resolved during withdrawal tree rebuild)
  return 0;
}
