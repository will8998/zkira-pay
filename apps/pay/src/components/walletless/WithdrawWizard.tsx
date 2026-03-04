'use client';

import { useState, useRef, useCallback } from 'react';
import { ReceiptManager, type PoolNote, type EncryptedReceipt } from '@zkira/sdk';
import { toast } from 'sonner';
import { getWhitelabelConfig } from '@/config/whitelabel';
import {
  CHAIN_CONFIGS,
  POOL_REGISTRY,
  getExplorerTxUrl,
  type Chain,
  type PoolEntry,
} from '@/config/pool-registry';

interface WithdrawWizardProps {
  onComplete?: () => void;
}

type WizardStep = 'upload' | 'decrypt' | 'address' | 'processing' | 'complete';

interface ProcessingStage {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete' | 'error';
}

/** Relayer URL */
const RELAYER_URL = process.env.NEXT_PUBLIC_RELAYER_URL ?? 'http://localhost:3013';

// Dynamic based on detected chain
const getRpcUrl = (chain: Chain) => CHAIN_CONFIGS[chain].rpcUrl;
const getTxExplorerUrl = (chain: Chain, txHash: string) => getExplorerTxUrl(chain, txHash);

/**
 * Detect which chain and pool entry a pool address belongs to.
 * Checks all registered pools across all chains.
 */
function detectPoolChain(poolAddress: string): { chain: Chain; pool: PoolEntry } | null {
  for (const [chainId, tokenPools] of Object.entries(POOL_REGISTRY)) {
    for (const [tokenId, pools] of Object.entries(tokenPools)) {
      for (const pool of pools) {
        if (pool.address.toLowerCase() === poolAddress.toLowerCase()) {
          return { chain: chainId as Chain, pool };
        }
      }
    }
  }
  // Heuristic: Tron addresses start with T, EVM addresses start with 0x
  if (poolAddress.startsWith('T')) {
    return { chain: 'tron', pool: { address: poolAddress, token: 'usdt', denomination: '0', label: 'Unknown', chain: 'tron' } };
  }
  // Default to Arbitrum for 0x addresses
  return { chain: 'arbitrum', pool: { address: poolAddress, token: 'usdc', denomination: '0', label: 'Unknown', chain: 'arbitrum' } };
}
export function WithdrawWizard({ onComplete }: WithdrawWizardProps) {
  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  const [canGoBack, setCanGoBack] = useState(true);
  
  // Step data
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [receipt, setReceipt] = useState<EncryptedReceipt | null>(null);
  const [detectedChain, setDetectedChain] = useState<Chain>('arbitrum');
  const [password, setPassword] = useState('');
  const [decryptedNote, setDecryptedNote] = useState<PoolNote | null>(null);
  const [destinationAddress, setDestinationAddress] = useState('');
  const [isValidAddress, setIsValidAddress] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  
  // UI state
  const [isDragging, setIsDragging] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Processing stages for step 4
  const [processingStages, setProcessingStages] = useState<ProcessingStage[]>([
    { id: 'tree', label: 'Rebuilding Merkle tree...', status: 'pending' },
    { id: 'proof', label: 'Generating zero-knowledge proof...', status: 'pending' },
    { id: 'submit', label: 'Submitting withdrawal via relayer...', status: 'pending' },
  ]);

  // Step definitions
  const steps = [
    { id: 'upload', number: 1, title: 'Upload Receipt', completed: currentStep !== 'upload' },
    { id: 'decrypt', number: 2, title: 'Enter Password', completed: ['address', 'processing', 'complete'].includes(currentStep) },
    { id: 'address', number: 3, title: 'Destination', completed: ['processing', 'complete'].includes(currentStep) },
    { id: 'processing', number: 4, title: 'Processing', completed: currentStep === 'complete' },
    { id: 'complete', number: 5, title: 'Complete', completed: false },
  ];

  // File upload handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      toast.error('Please upload a .json file');
      return;
    }

    try {
      const content = await file.text();
      const parsed = ReceiptManager.parseReceipt(content);
      setUploadedFile(file);
      setReceipt(parsed);
      // Detect chain from pool address
      const detection = detectPoolChain(parsed.pool);
      if (detection) {
        setDetectedChain(detection.chain);
      }
      toast.success('Receipt uploaded successfully');
    } catch {
      toast.error('Invalid receipt file');
    }
  };

  // Decryption handler
  const handleDecrypt = async () => {
    if (!receipt || !password.trim()) return;

    setIsDecrypting(true);
    try {
      const note = await ReceiptManager.decrypt(receipt, password.trim());
      setDecryptedNote(note);
      setCurrentStep('address');
      toast.success('Receipt decrypted successfully');
    } catch {
      toast.error('Invalid password. Please try again.');
    } finally {
      setIsDecrypting(false);
    }
  };

  // Ethereum address validation (0x + 40 hex chars)
  const handleAddressChange = (value: string) => {
    setDestinationAddress(value);
    const isEthereumAddress = /^0x[a-fA-F0-9]{40}$/.test(value);
    setIsValidAddress(isEthereumAddress);
  };

  // Withdrawal process
  const handleWithdraw = async () => {
    if (!receipt || !decryptedNote || !isValidAddress) return;

    setCurrentStep('processing');
    setCanGoBack(false);

    const poolAddress = receipt.pool;
    const denomination = BigInt(receipt.denomination);
    const config = getWhitelabelConfig();

    // TODO: Add Tron withdrawal support. Currently only Arbitrum ZK proof generation is implemented.
    if (detectedChain === 'tron') {
      toast.error('Tron withdrawals are not yet supported. Please use Arbitrum pools.');
      setCanGoBack(true);
      return;
    }
    try {
      // Stage 1: Rebuild Merkle tree from on-chain deposit events
      setProcessingStages(prev => prev.map(stage => 
        stage.id === 'tree' ? { ...stage, status: 'active' } : stage
      ));

      const { JsonRpcProvider, Contract } = await import('ethers');
      const provider = new JsonRpcProvider(getRpcUrl(detectedChain));

      // Fetch all Deposit events from the pool contract
      const poolAbi = [
        'event Deposit(bytes32 indexed commitment, uint32 leafIndex, uint256 timestamp)'
      ];
      const poolContract = new Contract(poolAddress, poolAbi, provider);
      const depositFilter = poolContract.filters.Deposit();
      const events = await poolContract.queryFilter(depositFilter, 0, 'latest');
      // Build MiMC Merkle tree from deposit commitments
      const { buildMimcSponge } = await import('circomlibjs');
      const mimcSponge = await buildMimcSponge();

      // Tree parameters matching Tornado Cash (depth=20)
      const TREE_DEPTH = 20;
      const ZERO_VALUE = 0n;
      
      // Initialize tree levels with zero values
      const zeros: bigint[] = [ZERO_VALUE];
      for (let i = 1; i <= TREE_DEPTH; i++) {
        zeros[i] = mimcSponge.F.toObject(
          mimcSponge.multiHash([zeros[i - 1], zeros[i - 1]], 0n, 1)
        );
      }

      // Collect and sort commitments by leafIndex
      const deposits: Array<{ commitment: bigint; leafIndex: number }> = [];
      for (const event of events) {
        const commitment = BigInt(event.args.commitment);
        const leafIndex = Number(event.args.leafIndex);
        deposits.push({ commitment, leafIndex });
      }
      deposits.sort((a, b) => a.leafIndex - b.leafIndex);

      // Build tree layer by layer
      const layers: bigint[][] = [[]];
      for (const dep of deposits) {
        layers[0].push(dep.commitment);
      }

      // Pad layer 0 to next power of 2^TREE_DEPTH with zeros
      const treeSize = 1 << TREE_DEPTH;
      while (layers[0].length < treeSize) {
        layers[0].push(ZERO_VALUE);
      }

      // Build upper layers
      for (let level = 1; level <= TREE_DEPTH; level++) {
        layers[level] = [];
        const prevLayer = layers[level - 1];
        for (let i = 0; i < prevLayer.length; i += 2) {
          const left = prevLayer[i];
          const right = prevLayer[i + 1] ?? zeros[level - 1];
          const hash = mimcSponge.F.toObject(
            mimcSponge.multiHash([left, right], 0n, 1)
          );
          layers[level].push(hash);
        }
      }

      const root = layers[TREE_DEPTH][0];

      // Generate path elements and path indices for our note
      const leafIndex = decryptedNote.leafIndex;
      const pathElements: bigint[] = [];
      const pathIndices: number[] = [];
      let idx = leafIndex;

      for (let level = 0; level < TREE_DEPTH; level++) {
        const siblingIdx = idx % 2 === 0 ? idx + 1 : idx - 1;
        pathElements.push(layers[level][siblingIdx] ?? zeros[level]);
        pathIndices.push(idx % 2);
        idx = Math.floor(idx / 2);
      }

      setProcessingStages(prev => prev.map(stage => 
        stage.id === 'tree' ? { ...stage, status: 'complete' } : stage
      ));

      // Stage 2: Generate ZK proof
      setProcessingStages(prev => prev.map(stage => 
        stage.id === 'proof' ? { ...stage, status: 'active' } : stage
      ));

      // Compute nullifierHash = MiMCSponge(nullifier, nullifier)
      const nullifierHash = mimcSponge.F.toObject(
        mimcSponge.multiHash([decryptedNote.nullifier], 0n, 1)
      );

      // Circuit inputs for zero-knowledge proof
      const recipientBigInt = BigInt(destinationAddress); // Ethereum address is already a valid BigInt
      const relayerBigInt = 0n; // relayer gets fee from service, not from contract
      const fee = 0n;
      const refund = 0n;

      const circuitInputs = {
        // Private inputs
        nullifier: decryptedNote.nullifier.toString(),
        secret: decryptedNote.secret.toString(),
        pathElements: pathElements.map(e => e.toString()),
        pathIndices: pathIndices,
        // Public inputs
        root: root.toString(),
        nullifierHash: nullifierHash.toString(),
        recipient: recipientBigInt.toString(),
        relayer: relayerBigInt.toString(),
        fee: fee.toString(),
        refund: refund.toString(),
      };

      // Generate Groth16 proof using snarkjs
      const snarkjs = await import('snarkjs');
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        circuitInputs,
        '/circuits/withdraw.wasm',
        '/circuits/withdraw_final.zkey',
      );

      setProcessingStages(prev => prev.map(stage => 
        stage.id === 'proof' ? { ...stage, status: 'complete' } : stage
      ));

      // Stage 3: Submit withdrawal to relayer
      setProcessingStages(prev => prev.map(stage => 
        stage.id === 'submit' ? { ...stage, status: 'active' } : stage
      ));

      // Format proof for Solidity verifier: [a[0], a[1], b[0][0], b[0][1], b[1][0], b[1][1], c[0], c[1]]
      const proofData = {
        a: [proof.pi_a[0], proof.pi_a[1]],
        b: [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
        c: [proof.pi_c[0], proof.pi_c[1]],
      };

      // Use different relayer endpoints for different chains
      const relayerEndpoint = detectedChain === 'tron' ? '/tron/relay/withdraw' : '/session/withdraw';
      const withdrawResponse = await fetch(`${RELAYER_URL}${relayerEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pool: poolAddress,
          proof: proofData,
          root: publicSignals[0],
          nullifierHash: publicSignals[1],
          recipient: destinationAddress,
          relayer: '0x0000000000000000000000000000000000000000',
          fee: '0',
          refund: '0',
          referrer: config.referrerAddress, // Partner referrer address for fee splitting
        }),
      });

      if (!withdrawResponse.ok) {
        const errorBody = await withdrawResponse.text();
        throw new Error(`Relayer error: ${errorBody}`);
      }

      const result = await withdrawResponse.json();
      const txId = result.txId ?? result.txSignature ?? result.transactionHash ?? '';

      setProcessingStages(prev => prev.map(stage => 
        stage.id === 'submit' ? { ...stage, status: 'complete' } : stage
      ));

      setTransactionHash(txId);
      setCurrentStep('complete');
      toast.success('Withdrawal completed successfully!');

    } catch (error) {
      setProcessingStages(prev => prev.map(stage => 
        stage.status === 'active' ? { ...stage, status: 'error' } : stage
      ));
      toast.error(error instanceof Error ? error.message : 'Withdrawal failed. Please try again.');
      setCanGoBack(true);
    }
  };

  // Navigation
  const goBack = () => {
    if (!canGoBack) return;
    
    switch (currentStep) {
      case 'decrypt':
        setCurrentStep('upload');
        break;
      case 'address':
        setCurrentStep('decrypt');
        break;
      case 'processing':
        setCurrentStep('address');
        break;
    }
  };

  const goNext = () => {
    switch (currentStep) {
      case 'upload':
        if (receipt) setCurrentStep('decrypt');
        break;
      case 'address':
        if (isValidAddress) handleWithdraw();
        break;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            {/* Step Circle */}
            <div className={`
              relative w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all
              ${step.id === currentStep
                ? 'border-[var(--color-button)] bg-[var(--color-button)] text-[var(--color-bg)]'
                : step.completed
                ? 'border-[var(--color-green)] bg-[var(--color-green)] text-black'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]'
              }
            `}>
              {step.completed ? '✓' : step.number}
            </div>
            
            {/* Connection Line */}
            {index < steps.length - 1 && (
              <div className={`
                w-12 h-0.5 mx-3 transition-colors
                ${step.completed ? 'bg-[var(--color-green)]' : 'bg-[var(--color-border)]'}
              `} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-[var(--bg-card)] border border-[var(--color-border)] p-8 rounded-xl">
        
        {/* Step 1: Upload Receipt */}
        {currentStep === 'upload' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
                Upload Your Receipt
              </h2>
              <p className="text-[var(--color-text-secondary)]">
                Upload the encrypted receipt file you saved when making your deposit
              </p>
            </div>

            {/* File Upload Zone */}
            <div
              className={`
                border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                ${isDragging
                  ? 'border-[var(--color-button)] bg-[var(--color-button)]/5'
                  : 'border-[var(--color-border)] hover:border-[var(--color-button)]/60 hover:bg-[var(--color-hover)]'
                }
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {uploadedFile ? (
                <div className="space-y-3">
                  <div className="text-4xl">📄</div>
                  <div>
                    <p className="font-medium text-[var(--color-text)]">{uploadedFile.name}</p>
                    <p className="text-sm text-[var(--color-text-secondary)]">Click to choose a different file</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-4xl">📁</div>
                  <div>
                    <p className="font-medium text-[var(--color-text)]">Drop your receipt file here</p>
                    <p className="text-sm text-[var(--color-text-secondary)]">or click to browse (.json files only)</p>
                  </div>
                </div>
              )}
            </div>

            {/* Receipt Info */}
            {receipt && (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 rounded-lg space-y-2">
                <h3 className="font-medium text-[var(--color-text)]">Receipt Details</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Pool Address:</span>
                    <span className="text-[var(--color-text)] font-mono">
                      {receipt.pool.slice(0, 8)}...{receipt.pool.slice(-8)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Amount:</span>
                    <span className="text-[var(--color-text)] font-medium">
                      {(Number(receipt.denomination) / 1_000_000).toFixed(2)} {detectPoolChain(receipt.pool)?.pool.token.toUpperCase() ?? 'USDC'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Network:</span>
                    <span className="text-[var(--color-text)] font-medium">
                      {CHAIN_CONFIGS[detectedChain].name}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={goNext}
              disabled={!receipt}
              className="w-full px-6 py-3 bg-[var(--color-button)] text-[var(--color-bg)] hover:bg-[var(--color-button-hover)] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed btn-press"
            >
              Next
            </button>
          </div>
        )}

        {/* Step 2: Enter Password */}
        {currentStep === 'decrypt' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
                Enter Your Password
              </h2>
              <p className="text-[var(--color-text-secondary)]">
                Enter the password you used when creating this receipt
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleDecrypt()}
                  className="w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-button)] focus:outline-none transition-colors"
                  placeholder="Enter your password"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={goBack}
                  className="px-6 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleDecrypt}
                  disabled={!password.trim() || isDecrypting}
                  className="flex-1 px-6 py-3 bg-[var(--color-button)] text-[var(--color-bg)] hover:bg-[var(--color-button-hover)] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 btn-press"
                >
                  {isDecrypting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Decrypting...</span>
                    </>
                  ) : (
                    'Decrypt'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Destination Address */}
        {currentStep === 'address' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
                Destination Address
              </h2>
              <p className="text-[var(--color-text-secondary)]">
                Enter the Ethereum address where you want to receive your funds
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Ethereum Address
                </label>
                <input
                  type="text"
                  value={destinationAddress}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  className={`
                    w-full px-4 py-3 bg-[var(--color-surface)] border text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none transition-colors
                    ${isValidAddress 
                      ? 'border-[var(--color-green)] focus:border-[var(--color-green)]'
                      : destinationAddress && !isValidAddress
                      ? 'border-[var(--color-red)] focus:border-[var(--color-red)]'
                      : 'border-[var(--color-border)] focus:border-[var(--color-button)]'
                    }
                  `}
                  placeholder="Enter Ethereum address (e.g., 0x742d35Cc6634C0...)"
                  autoFocus
                />
                {destinationAddress && !isValidAddress && (
                  <p className="text-sm text-[var(--color-red)] mt-1">Invalid Ethereum address</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={goBack}
                  className="px-6 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={goNext}
                  disabled={!isValidAddress}
                  className="flex-1 px-6 py-3 bg-[var(--color-button)] text-[var(--color-bg)] hover:bg-[var(--color-button-hover)] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed btn-press"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Processing */}
        {currentStep === 'processing' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
                Generating Proof & Withdrawing
              </h2>
              <p className="text-[var(--color-text-secondary)]">
                Please wait while we process your withdrawal
              </p>
            </div>

            <div className="space-y-4">
              {processingStages.map((stage) => (
                <div key={stage.id} className="flex items-center gap-4 p-4 bg-[var(--color-surface)] rounded-lg">
                  <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold transition-all
                    ${stage.status === 'complete'
                      ? 'bg-[var(--color-green)] text-black'
                      : stage.status === 'active'
                      ? 'bg-[var(--color-button)] text-[var(--color-bg)]'
                      : stage.status === 'error'
                      ? 'bg-[var(--color-red)] text-white'
                      : 'bg-[var(--color-border)] text-[var(--color-text-muted)]'
                    }
                  `}>
                    {stage.status === 'complete' ? '✓' : stage.status === 'error' ? '✗' : stage.status === 'active' ? (
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : ''}
                  </div>
                  <span className={`
                    font-medium transition-colors
                    ${stage.status === 'active' ? 'text-[var(--color-text)]' : 'text-[var(--color-text-secondary)]'}
                  `}>
                    {stage.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Complete */}
        {currentStep === 'complete' && (
          <div className="space-y-6 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-[var(--color-green)] rounded-full flex items-center justify-center text-2xl text-black">
                ✓
              </div>
              <h2 className="text-2xl font-bold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-mono)' }}>
                Withdrawal Complete!
              </h2>
              <p className="text-[var(--color-text-secondary)] max-w-md mx-auto">
                Funds will arrive within ~1 minute. The relayer has submitted the transaction on your behalf.
              </p>
            </div>

            {transactionHash && (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 rounded-lg">
                <h3 className="font-medium text-[var(--color-text)] mb-2">Transaction Details</h3>
                <div className="text-sm">
                  <span className="text-[var(--color-text-secondary)]">Transaction Hash:</span>
                  <p className="font-mono text-[var(--color-text)] break-all mt-1">
                    {transactionHash}
                  </p>
                  <a
                    href={getTxExplorerUrl(detectedChain, transactionHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-sm text-[var(--color-button)] hover:text-[var(--color-button-hover)] underline"
                  >
                    View on {CHAIN_CONFIGS[detectedChain].name} Explorer →
                  </a>
                </div>
              </div>
            )}

            <button
              onClick={onComplete}
              className="px-8 py-3 bg-[var(--color-green)] text-black hover:bg-[var(--color-green-hover)] font-medium transition-colors btn-press"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
