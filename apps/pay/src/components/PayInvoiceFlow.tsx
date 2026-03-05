'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { boxEncrypt } from '@/lib/dead-drop-crypto';
import { useBrowserWallet } from '@/components/BrowserWalletProvider';
import { getChainConfig, type Chain, type TokenId } from '@/config/pool-registry';
import type { DepositNoteRecord, InvoiceRequest } from '@/types/payment';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3012';
const POLL_INTERVAL_MS = 5000;

type FlowStep = 'loading' | 'review' | 'depositing' | 'complete' | 'error';

interface PayInvoiceFlowProps {
  invoiceId: string;
}

interface DenominationEntry {
  pool: string;
  denomination: string;
  label: string;
  count: number;
}

export function PayInvoiceFlow({ invoiceId }: PayInvoiceFlowProps) {
  const { address, privateKey, isCreated, createWallet } = useBrowserWallet();

  const [step, setStep] = useState<FlowStep>('loading');
  const [invoice, setInvoice] = useState<{
    invoiceId: string;
    chain: string;
    token: string;
    denominations: DenominationEntry[];
    totalRaw: string;
    totalLabel: string;
    recipientPubkey: string;
    memo: string | null;
    status: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Deposit progress
  const [currentDepositIndex, setCurrentDepositIndex] = useState(0);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [depositStatus, setDepositStatus] = useState<'waiting' | 'funding' | 'approving' | 'depositing'>('waiting');
  const [collectedNotes, setCollectedNotes] = useState<DepositNoteRecord[]>([]);

  const abortRef = useRef<AbortController | null>(null);

  // Load invoice on mount
  useEffect(() => {
    const loadInvoice = async () => {
      try {
        const res = await fetch(`${API_URL}/api/invoices/v2/${invoiceId}`);
        if (!res.ok) {
          throw new Error(res.status === 404 ? 'Invoice not found' : 'Failed to load invoice');
        }
        const data = await res.json();
        setInvoice(data);
        setStep('review');
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load invoice');
        setStep('error');
      }
    };
    loadInvoice();
  }, [invoiceId]);

  // Ensure wallet exists
  useEffect(() => {
    if (!isCreated) createWallet();
  }, [isCreated, createWallet]);

  // Build flat deposit queue from invoice denominations
  const buildQueue = useCallback((): DenominationEntry[] => {
    if (!invoice) return [];
    const queue: DenominationEntry[] = [];
    for (const d of invoice.denominations) {
      for (let i = 0; i < d.count; i++) {
        queue.push(d);
      }
    }
    return queue;
  }, [invoice]);

  const randomFieldElement = (): bigint => {
    const bytes = new Uint8Array(31);
    crypto.getRandomValues(bytes);
    let result = 0n;
    for (let i = 0; i < bytes.length; i++) {
      result = (result << 8n) + BigInt(bytes[i]);
    }
    return result;
  };

  const parseLeafIndex = (receipt: { logs?: Array<{ topics?: string[]; data?: string }> }): number => {
    for (const log of receipt.logs ?? []) {
      if (log.topics && log.topics.length >= 1 && log.data) {
        try {
          const leafIndexHex = log.data.slice(0, 66);
          return Number(BigInt(leafIndexHex));
        } catch {
          continue;
        }
      }
    }
    return 0;
  };

  // Execute single deposit
  const executeDeposit = useCallback(async (
    denom: DenominationEntry,
    signal: AbortSignal,
  ): Promise<DepositNoteRecord> => {
    if (!address || !privateKey || !invoice) throw new Error('Not ready');

    const chain = invoice.chain as Chain;
    const token = invoice.token as TokenId;
    const chainConfig = getChainConfig(chain);
    const rpcUrl = chainConfig.rpcUrl;
    const tokenAddress = chainConfig.tokens.find((t) => t.id === token)?.address ?? '';
    const denominationRaw = BigInt(denom.denomination);

    // Poll for funds
    setDepositStatus('funding');
    const { JsonRpcProvider, Contract, Wallet } = await import('ethers');
    const provider = new JsonRpcProvider(rpcUrl);
    const abi = ['function balanceOf(address) view returns (uint256)'];

    while (!signal.aborted) {
      try {
        const contract = new Contract(tokenAddress, abi, provider);
        const balance: bigint = await contract.balanceOf(address);
        if (balance >= denominationRaw) break;
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
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

    // Approve + Deposit
    setDepositStatus('approving');
    const wallet = new Wallet(privateKey, provider);

    const { buildMimcSponge } = await import('circomlibjs');
    const mimcSponge = await buildMimcSponge();

    const nullifier = randomFieldElement();
    const secret = randomFieldElement();
    const commitment = mimcSponge.F.toObject(
      mimcSponge.multiHash([nullifier, secret], 0n, 1),
    );

    const tokenAbi2 = ['function approve(address spender, uint256 amount) returns (bool)'];
    const tokenContract = new Contract(tokenAddress, tokenAbi2, wallet);
    const approveTx = await tokenContract.approve(denom.pool, denominationRaw);
    await approveTx.wait();

    setDepositStatus('depositing');
    const commitmentHex = '0x' + commitment.toString(16).padStart(64, '0');
    const poolAbi = ['function deposit(bytes32) external payable'];
    const poolContract = new Contract(denom.pool, poolAbi, wallet);
    const depositTx = await poolContract.deposit(commitmentHex);
    const depositReceipt = await depositTx.wait();
    const leafIndex = parseLeafIndex(depositReceipt);

    return {
      nullifier: nullifier.toString(),
      secret: secret.toString(),
      commitment: commitment.toString(),
      leafIndex,
      pool: denom.pool,
      denomination: denom.denomination,
      chain,
      token,
    };
  }, [address, privateKey, invoice]);

  // Start pay flow
  const startPayFlow = useCallback(async () => {
    if (!invoice) return;

    const queue = buildQueue();
    setTotalDeposits(queue.length);
    setCurrentDepositIndex(0);
    setCollectedNotes([]);
    setStep('depositing');

    const controller = new AbortController();
    abortRef.current = controller;
    const notes: DepositNoteRecord[] = [];

    try {
      for (let i = 0; i < queue.length; i++) {
        if (controller.signal.aborted) break;
        setCurrentDepositIndex(i);
        setDepositStatus('waiting');

        const note = await executeDeposit(queue[i], controller.signal);
        notes.push(note);
        setCollectedNotes([...notes]);

        // Encrypt note to requester's pubkey and upload
        const noteJson = JSON.stringify(note);
        const encrypted = boxEncrypt(noteJson, invoice.recipientPubkey);
        await fetch(`${API_URL}/api/invoices/v2/${invoice.invoiceId}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ciphertext: encrypted.ciphertext,
            nonce: encrypted.nonce,
            ephemeralPubkey: encrypted.ephemeralPubkey,
          }),
        });
      }

      // Mark invoice as funded
      await fetch(`${API_URL}/api/invoices/v2/${invoice.invoiceId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'funded' }),
      });

      setStep('complete');
      toast.success('Invoice paid!');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast.error(error instanceof Error ? error.message : 'Payment failed');
      setStep('review');
    }
  }, [invoice, buildQueue, executeDeposit]);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1
          className="text-3xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-2"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Pay Invoice
        </h1>
        <p className="text-[var(--color-text-secondary)] text-sm">
          Fund this invoice via shielded pool deposits.
        </p>
      </div>

      {/* Loading */}
      {step === 'loading' && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-xl text-center">
          <div className="w-12 h-12 border-4 border-[var(--color-border)] border-t-[var(--color-button)] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--color-text-secondary)]">Loading invoice...</p>
        </div>
      )}

      {/* Error */}
      {step === 'error' && (
        <div className="bg-[var(--color-surface)] border border-red-500/30 p-8 rounded-xl text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2
            className="text-xl font-bold text-[var(--color-text)] mb-2"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {errorMessage}
          </h2>
        </div>
      )}

      {/* Review Invoice */}
      {step === 'review' && invoice && (
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-xl space-y-4">
            <div className="text-center mb-4">
              <h2
                className="text-2xl font-bold text-[var(--color-text)] uppercase tracking-wide"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {invoice.totalLabel}
              </h2>
              {invoice.memo && (
                <p className="text-[var(--color-text-secondary)] text-sm mt-1">
                  {invoice.memo}
                </p>
              )}
            </div>

            {/* Denomination breakdown */}
            <div className="space-y-2">
              {invoice.denominations.map((d, i) => (
                <div
                  key={i}
                  className="flex justify-between bg-[var(--color-bg)] border border-[var(--color-border)] p-3 rounded text-sm"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  <span className="text-[var(--color-text)]">{d.label}</span>
                  <span className="text-[var(--color-text-secondary)]">× {d.count}</span>
                </div>
              ))}
            </div>

            <div className="text-center text-xs text-[var(--color-text-secondary)]">
              Network: {invoice.chain.toUpperCase()} · Token: {invoice.token.toUpperCase()}
            </div>
          </div>

          <button
            onClick={startPayFlow}
            className="w-full px-6 py-4 bg-[var(--color-button)] text-[var(--color-bg)] hover:bg-[var(--color-button-hover)] font-bold transition-colors btn-press"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            PAY {invoice.totalLabel} →
          </button>
        </div>
      )}

      {/* Depositing */}
      {step === 'depositing' && (
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-xl">
            <div className="text-center mb-6">
              <h2
                className="text-2xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-2"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Deposit {currentDepositIndex + 1} of {totalDeposits}
              </h2>
              <p className="text-[var(--color-text-secondary)] text-sm">
                {depositStatus === 'waiting' && 'Preparing...'}
                {depositStatus === 'funding' && 'Send funds to the address below'}
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

            {/* QR Code */}
            {(depositStatus === 'waiting' || depositStatus === 'funding') && address && (
              <div className="text-center space-y-4">
                <div className="inline-block p-4 bg-white rounded-xl">
                  <QRCodeSVG value={address} size={180} />
                </div>
                <div className="bg-[var(--color-hover)] border border-[var(--color-border)] p-3 rounded font-mono text-sm text-[var(--color-text)] break-all">
                  {address}
                </div>
              </div>
            )}

            {(depositStatus === 'approving' || depositStatus === 'depositing') && (
              <div className="flex justify-center">
                <div className="w-16 h-16 border-4 border-[var(--color-border)] border-t-[var(--color-button)] rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div className="bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="text-sm text-[var(--color-warning-text)]">
                <strong>DO NOT CLOSE THIS TAB</strong> — deposits are in progress.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete */}
      {step === 'complete' && (
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-xl text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2
              className="text-2xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-2"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Invoice Paid!
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm">
              {collectedNotes.length} deposit{collectedNotes.length !== 1 ? 's' : ''} completed.
              The requester will be notified.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
