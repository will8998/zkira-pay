'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { DenominationBuilder } from '@/components/DenominationBuilder';
import { ChainTokenSelector, type ChainTokenSelection } from '@/components/ChainTokenSelector';
import { generateClaimCode, deriveDeadDropId } from '@/lib/claim-code';
import { aesEncrypt } from '@/lib/dead-drop-crypto';
import type { DenominationSet, DepositNoteRecord, DepositBundle, ClaimCodeData } from '@/types/payment';
import type { Chain, TokenId, PoolEntry } from '@/config/pool-registry';
import { getChainConfig } from '@/config/pool-registry';
import { ReceiptManager, type PoolNote } from '@zkira/sdk';
import { useBrowserWallet } from '@/components/BrowserWalletProvider';
import { QRCodeSVG } from 'qrcode.react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3012';
const RELAYER_URL = process.env.NEXT_PUBLIC_RELAYER_URL ?? 'http://localhost:3013';
const POLL_INTERVAL_MS = 5000;

type WizardStep = 'select' | 'depositing' | 'complete';

interface DepositQueueItem {
  pool: PoolEntry;
  index: number;
  total: number;
}

export function SendPaymentWizard() {
  const { address, privateKey, isCreated, createWallet } = useBrowserWallet();

  // Wizard state
  const [step, setStep] = useState<WizardStep>('select');
  const [chain, setChain] = useState<Chain>('arbitrum');
  const [token, setToken] = useState<TokenId>('usdc');
  const [denomSet, setDenomSet] = useState<DenominationSet | null>(null);

  // Deposit progress
  const [currentDepositIndex, setCurrentDepositIndex] = useState(0);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [depositStatus, setDepositStatus] = useState<'waiting' | 'funding' | 'approving' | 'depositing'>('waiting');
  const [collectedNotes, setCollectedNotes] = useState<DepositNoteRecord[]>([]);

  // Result
  const [claimCode, setClaimCode] = useState<ClaimCodeData | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);

  // Abort
  const abortRef = useRef<AbortController | null>(null);

  // Build the flat queue of deposits from DenominationSet
  const buildQueue = useCallback((set: DenominationSet): DepositQueueItem[] => {
    const queue: DepositQueueItem[] = [];
    let idx = 0;
    for (const sel of set.selections) {
      for (let i = 0; i < sel.count; i++) {
        queue.push({ pool: sel.pool, index: idx, total: 0 });
        idx++;
      }
    }
    // Fill in total
    return queue.map((q) => ({ ...q, total: idx }));
  }, []);

  // Poll for token balance on ephemeral wallet
  const pollForFunds = useCallback(async (
    signal: AbortSignal,
    tokenAddress: string,
    rpcUrl: string,
    requiredAmount: bigint,
  ): Promise<void> => {
    if (!address) throw new Error('No wallet address');
    const { JsonRpcProvider, Contract } = await import('ethers');
    const provider = new JsonRpcProvider(rpcUrl);
    const abi = ['function balanceOf(address) view returns (uint256)'];

    while (!signal.aborted) {
      try {
        const contract = new Contract(tokenAddress, abi, provider);
        const balance: bigint = await contract.balanceOf(address);
        if (balance >= requiredAmount) return;
      } catch {
        // keep polling
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
  }, [address]);

  // Generate random field element for MiMC commitment
  const randomFieldElement = (): bigint => {
    const bytes = new Uint8Array(31);
    crypto.getRandomValues(bytes);
    let result = 0n;
    for (let i = 0; i < bytes.length; i++) {
      result = (result << 8n) + BigInt(bytes[i]);
    }
    return result;
  };

  // Parse leaf index from deposit receipt
  const parseLeafIndex = (receipt: { logs?: Array<{ topics?: string[]; data?: string }> }): number => {
    // Deposit event signature: Deposit(bytes32 indexed commitment, uint32 leafIndex, uint256 timestamp)
    for (const log of receipt.logs ?? []) {
      if (log.topics && log.topics.length >= 1 && log.data) {
        try {
          // leafIndex is the first uint32 in the data field
          const leafIndexHex = log.data.slice(0, 66); // 0x + 64 chars
          return Number(BigInt(leafIndexHex));
        } catch {
          continue;
        }
      }
    }
    return 0;
  };

  // Execute a single deposit into a pool
  const executeDeposit = useCallback(async (
    pool: PoolEntry,
    signal: AbortSignal,
  ): Promise<DepositNoteRecord> => {
    if (!address || !privateKey) throw new Error('Wallet not ready');

    const chainConfig = getChainConfig(chain);
    const rpcUrl = chainConfig.rpcUrl;
    const tokenAddress = chainConfig.tokens.find((t) => t.id === token)?.address ?? '';
    const denominationRaw = BigInt(pool.denomination);

    // Wait for funds
    setDepositStatus('funding');
    await pollForFunds(signal, tokenAddress, rpcUrl, denominationRaw);

    // Approve + deposit
    setDepositStatus('approving');
    const { JsonRpcProvider, Contract, Wallet } = await import('ethers');
    const provider = new JsonRpcProvider(rpcUrl);
    const wallet = new Wallet(privateKey, provider);

    const { buildMimcSponge } = await import('circomlibjs');
    const mimcSponge = await buildMimcSponge();

    const nullifier = randomFieldElement();
    const secret = randomFieldElement();
    const commitment = mimcSponge.F.toObject(
      mimcSponge.multiHash([nullifier, secret], 0n, 1),
    );

    // Approve token spend
    const tokenAbi = ['function approve(address spender, uint256 amount) returns (bool)'];
    const tokenContract = new Contract(tokenAddress, tokenAbi, wallet);
    const approveTx = await tokenContract.approve(pool.address, denominationRaw);
    await approveTx.wait();

    // Deposit
    setDepositStatus('depositing');
    const commitmentHex = '0x' + commitment.toString(16).padStart(64, '0');
    const poolAbi = ['function deposit(bytes32) external payable'];
    const poolContract = new Contract(pool.address, poolAbi, wallet);
    const depositTx = await poolContract.deposit(commitmentHex);
    const depositReceipt = await depositTx.wait();

    const leafIndex = parseLeafIndex(depositReceipt);

    return {
      nullifier: nullifier.toString(),
      secret: secret.toString(),
      commitment: commitment.toString(),
      leafIndex,
      pool: pool.address,
      denomination: pool.denomination,
      chain,
      token,
    };
  }, [address, privateKey, chain, token, pollForFunds]);

  // Start the full send flow
  const startSendFlow = useCallback(async () => {
    if (!denomSet || denomSet.selections.length === 0) {
      toast.error('Select at least one denomination');
      return;
    }

    // Ensure wallet exists
    if (!isCreated) createWallet();

    const queue = buildQueue(denomSet);
    setTotalDeposits(queue.length);
    setCurrentDepositIndex(0);
    setCollectedNotes([]);
    setStep('depositing');

    const controller = new AbortController();
    abortRef.current = controller;
    const notes: DepositNoteRecord[] = [];

    try {
      // Sequential deposits — each one must complete before next starts
      for (let i = 0; i < queue.length; i++) {
        if (controller.signal.aborted) break;
        setCurrentDepositIndex(i);
        setDepositStatus('waiting');

        const note = await executeDeposit(queue[i].pool, controller.signal);
        notes.push(note);
        setCollectedNotes([...notes]);
      }

      // All deposits done — create dead drop
      const bundle: DepositBundle = {
        notes,
        createdAt: new Date().toISOString(),
        totalRaw: denomSet.totalRaw.toString(),
      };

      // Generate claim code and encrypt bundle
      const { code, encryptionKey } = generateClaimCode();
      const bundleJson = JSON.stringify(bundle);
      const { ciphertext, nonce } = await aesEncrypt(bundleJson, encryptionKey);

      // Derive dead drop ID and upload
      const dropId = await deriveDeadDropId(code);
      const response = await fetch(`${API_URL}/api/dead-drop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dropId,
          payload: { ciphertext, nonce, version: 1 },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to create dead drop: ${errorBody}`);
      }

      setClaimCode({ code, encryptionKey });
      setStep('complete');
      toast.success('Payment sent! Share the claim code with the recipient.');

    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast.error(error instanceof Error ? error.message : 'Send flow failed');
      setStep('select');
    }
  }, [denomSet, isCreated, createWallet, buildQueue, executeDeposit]);

  // Copy helpers
  const copyToClipboard = useCallback(async (text: string, setCopied: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  }, []);

  const handleChainTokenChange = useCallback((sel: ChainTokenSelection) => {
    setChain(sel.chain);
    setToken(sel.token);
  }, []);

  // Cancel
  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    setStep('select');
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1
          className="text-3xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-2"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Send Payment
        </h1>
        <p className="text-[var(--color-text-secondary)] text-sm">
          Send funds privately via shielded pool. Recipient claims with a code.
        </p>
      </div>

      {/* Step: Select Amounts */}
      {step === 'select' && (
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-xl">
            <ChainTokenSelector onSelectionChange={handleChainTokenChange} />
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-xl">
            <DenominationBuilder
              chain={chain}
              token={token}
              onChange={setDenomSet}
            />
          </div>

          <button
            onClick={startSendFlow}
            disabled={!denomSet || denomSet.selections.length === 0 || denomSet.totalRaw === 0n}
            className="w-full px-6 py-4 bg-[var(--color-button)] text-[var(--color-bg)] hover:bg-[var(--color-button-hover)] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed btn-press"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            START DEPOSITS →
          </button>
        </div>
      )}

      {/* Step: Depositing */}
      {step === 'depositing' && (
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-xl">
            {/* Progress */}
            <div className="text-center mb-6">
              <h2
                className="text-2xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-2"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Deposit {currentDepositIndex + 1} of {totalDeposits}
              </h2>
              <p className="text-[var(--color-text-secondary)] text-sm">
                {depositStatus === 'waiting' && 'Waiting for funds to arrive...'}
                {depositStatus === 'funding' && 'Checking wallet balance...'}
                {depositStatus === 'approving' && 'Approving token spend...'}
                {depositStatus === 'depositing' && 'Depositing into shielded pool...'}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-[var(--color-border)] rounded-full h-2 mb-6">
              <div
                className="bg-[var(--color-button)] h-2 rounded-full transition-all duration-500"
                style={{ width: `${((currentDepositIndex + (depositStatus === 'depositing' ? 0.8 : 0.3)) / totalDeposits) * 100}%` }}
              />
            </div>

            {/* QR Code for funding */}
            {(depositStatus === 'waiting' || depositStatus === 'funding') && address && (
              <div className="text-center space-y-4">
                <div className="inline-block p-4 bg-white rounded-xl">
                  <QRCodeSVG value={address} size={180} />
                </div>
                <div
                  className="bg-[var(--color-hover)] border border-[var(--color-border)] p-3 rounded font-mono text-sm text-[var(--color-text)] break-all"
                >
                  {address}
                </div>
                <button
                  onClick={() => copyToClipboard(address, () => toast.success('Address copied'))}
                  className="px-4 py-2 bg-[var(--color-button)] text-[var(--color-bg)] hover:bg-[var(--color-button-hover)] font-medium transition-colors btn-press text-sm"
                >
                  📋 Copy Address
                </button>
              </div>
            )}

            {/* Spinner for approve/deposit */}
            {(depositStatus === 'approving' || depositStatus === 'depositing') && (
              <div className="flex justify-center">
                <div className="w-16 h-16 border-4 border-[var(--color-border)] border-t-[var(--color-button)] rounded-full animate-spin" />
              </div>
            )}

            {/* Completed deposits */}
            {collectedNotes.length > 0 && (
              <div className="mt-6 space-y-2">
                <h3
                  className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wide"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  Completed Deposits
                </h3>
                {collectedNotes.map((note, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm text-[var(--color-text)]"
                  >
                    <span className="text-[var(--color-green)]">✓</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>
                      Deposit #{i + 1} — Pool {note.pool.slice(0, 8)}...
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Warning */}
          <div className="bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="text-sm">
                <div
                  className="font-bold text-[var(--color-warning-text)] mb-1"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  DO NOT CLOSE THIS TAB
                </div>
                <div className="text-[var(--color-warning-text)] opacity-80">
                  Keep this page open until all deposits complete.
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleCancel}
            className="w-full px-4 py-3 bg-[var(--color-hover)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] font-medium transition-colors btn-press"
          >
            ← Cancel
          </button>
        </div>
      )}

      {/* Step: Complete */}
      {step === 'complete' && claimCode && (
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-xl text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2
              className="text-2xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-2"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Payment Sent!
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm mb-6">
              Share the claim code and password below with the recipient.
            </p>

            {/* Claim Code */}
            <div className="space-y-4">
              <div className="bg-[var(--color-bg)] border border-[var(--color-border)] p-6 rounded-xl">
                <div
                  className="text-xs uppercase tracking-wide text-[var(--color-text-secondary)] mb-2"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  CLAIM CODE
                </div>
                <div
                  className="text-2xl font-bold text-[var(--color-text)] tracking-wider mb-3"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {claimCode.code}
                </div>
                <button
                  onClick={() => copyToClipboard(claimCode.code, setCopiedCode)}
                  className="px-4 py-2 bg-[var(--color-button)] text-[var(--color-bg)] hover:bg-[var(--color-button-hover)] font-medium transition-colors btn-press text-sm"
                >
                  {copiedCode ? '✓ Copied' : '📋 Copy Code'}
                </button>
              </div>

              <div className="bg-[var(--color-bg)] border border-[var(--color-border)] p-6 rounded-xl">
                <div
                  className="text-xs uppercase tracking-wide text-[var(--color-text-secondary)] mb-2"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  ENCRYPTION PASSWORD
                </div>
                <div
                  className="text-sm font-mono text-[var(--color-text)] break-all mb-3"
                >
                  {claimCode.encryptionKey}
                </div>
                <button
                  onClick={() => copyToClipboard(claimCode.encryptionKey, setCopiedFull)}
                  className="px-4 py-2 bg-[var(--color-button)] text-[var(--color-bg)] hover:bg-[var(--color-button-hover)] font-medium transition-colors btn-press text-sm"
                >
                  {copiedFull ? '✓ Copied' : '📋 Copy Password'}
                </button>
              </div>
            </div>
          </div>

          {/* Security Warning */}
          <div className="bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔒</span>
              <div className="text-sm">
                <div
                  className="font-bold text-[var(--color-warning-text)] mb-1"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  SHARE SECURELY
                </div>
                <div className="text-[var(--color-warning-text)] opacity-80">
                  Send both the claim code and password to the recipient via a secure channel.
                  The code expires in 72 hours.
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setStep('select');
              setClaimCode(null);
              setCollectedNotes([]);
              setDenomSet(null);
            }}
            className="w-full px-6 py-4 bg-[var(--color-hover)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] font-medium transition-colors btn-press"
          >
            Send Another Payment
          </button>
        </div>
      )}
    </div>
  );
}
