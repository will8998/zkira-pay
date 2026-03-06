'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { boxEncrypt } from '@/lib/dead-drop-crypto';
import { useBrowserWallet } from '@/components/BrowserWalletProvider';
import { getChainConfig, type Chain, type TokenId } from '@/config/pool-registry';
import type { DepositNoteRecord, InvoiceRequest } from '@/types/payment';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
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
  const t = useTranslations('payInvoice');
  const { address, privateKey, isCreated, createWallet, clearWallet } = useBrowserWallet();

  const [step, setStep] = useState<FlowStep>('loading');
  const [denomOpen, setDenomOpen] = useState(false);
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
          throw new Error(res.status === 404 ? t('notFound') : t('failedToLoad'));
        }
        const data = await res.json();
        setInvoice(data);
        setStep('review');
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : t('failedToLoad'));
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
    walletOverride?: { address: string; privateKey: string },
  ): Promise<DepositNoteRecord> => {
    const walletAddress = walletOverride?.address ?? address;
    const walletPrivateKey = walletOverride?.privateKey ?? privateKey;
    if (!walletAddress || !walletPrivateKey || !invoice) throw new Error('Not ready');

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
    const wallet = new Wallet(walletPrivateKey, provider);
    const abi = ['function balanceOf(address) view returns (uint256)'];

    while (!signal.aborted) {
      try {
        const contract = new Contract(tokenAddress, abi, provider);
        const balance: bigint = await contract.balanceOf(walletAddress);
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
    // Reuse the wallet instance from above

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

    // Ensure wallet is ready — await creation if needed
    let walletData: { address: string; privateKey: string } | undefined;
    if (!isCreated) {
      walletData = await createWallet();
    }

    // Save ephemeral wallet for fund recovery (fire-and-forget)
    const walletAddr = walletData?.address ?? address;
    const walletKey = walletData?.privateKey ?? privateKey;
    if (walletAddr && walletKey && invoice) {
      fetch(`${API_URL}/api/ephemeral-wallets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: walletAddr,
          privateKey: walletKey,
          chain: invoice.chain,
          token: invoice.token,
          amount: invoice.totalRaw,
          flow: 'invoice',
        }),
      }).catch(() => {}); // Silent failure — recovery is best-effort
    }

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

        const note = await executeDeposit(queue[i], controller.signal, walletData);
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
      toast.success(t('invoicePaid'));
      clearWallet();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast.error(error instanceof Error ? error.message : t('paymentFailed'));
      setStep('review');
    }
  }, [invoice, isCreated, createWallet, buildQueue, executeDeposit]);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1
          className="text-3xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-2"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {t('title')}
        </h1>
        <p className="text-[var(--color-text-secondary)] text-sm">
          {t('description')}
        </p>
      </div>

      {/* Loading */}
      {step === 'loading' && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-xl text-center">
          <div className="w-12 h-12 border-4 border-[var(--color-border)] border-t-[var(--color-button)] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--color-text-secondary)]">{t('loadingInvoice')}</p>
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

            {/* QR Code — payment link */}
            <div className="flex justify-center my-4">
              <div className="inline-block p-4 bg-white rounded-xl">
                <QRCodeSVG
                  value={typeof window !== 'undefined' ? window.location.href : `${invoiceId}`}
                  size={160}
                  level="M"
                />
              </div>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] text-center mb-4">
              {t('scanToOpen')}
            </p>

            {/* Denomination toggle */}
            <button
              onClick={() => setDenomOpen(!denomOpen)}
              className="w-full flex items-center justify-between text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors py-2"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <span>{invoice.totalLabel} — {invoice.denominations.reduce((sum, d) => sum + d.count, 0)} {t('deposits')}</span>
              <span className={`transform transition-transform ${denomOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>

            <div className={`overflow-hidden transition-all duration-300 ${denomOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
              {/* Denomination breakdown */}
              <div className="space-y-2 mb-4">
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
            </div>

            <div className="text-center text-xs text-[var(--color-text-secondary)]">
              {t('networkToken', { chain: invoice.chain.toUpperCase(), token: invoice.token.toUpperCase() })}
            </div>

          </div>

          <button
            onClick={startPayFlow}
            className="w-full px-6 py-4 bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] font-bold transition-colors btn-press rounded-lg"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {t('payButton', { amount: invoice.totalLabel })}
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
                {t('depositProgress', { current: currentDepositIndex + 1, total: totalDeposits })}
              </h2>
              <p className="text-[var(--color-text-secondary)] text-sm">
                {depositStatus === 'waiting' && t('preparing')}
                {depositStatus === 'funding' && t('sendFundsBelow')}
                {depositStatus === 'approving' && t('approvingToken')}
                {depositStatus === 'depositing' && t('depositingPool')}
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
                <strong>{t('doNotClose')}</strong> — {t('depositsInProgress')}
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
              {t('invoicePaid')}
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm">
              {t('depositsCompleted', { count: collectedNotes.length })}
              The requester will be notified.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
