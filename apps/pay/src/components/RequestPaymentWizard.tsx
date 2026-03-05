'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { generateX25519Keypair, boxDecrypt } from '@/lib/dead-drop-crypto';
import type {
  DenominationSet,
  DenominationSelection,
  InvoiceRequest,
  InvoiceNoteEntry,
  DepositNoteRecord,
} from '@/types/payment';
import type { Chain, TokenId } from '@/config/pool-registry';
import { getChainConfig, getPoolsForChainAndToken, getAvailableChains, getAvailableTokensForChain } from '@/config/pool-registry';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3012';
const POLL_INTERVAL_MS = 8000;

type WizardStep = 'select' | 'created' | 'waiting' | 'withdrawing' | 'complete';

// Calculate optimal denomination split using greedy algorithm
function calculateDenominationSplit(amount: number, chain: Chain, token: TokenId): DenominationSet | null {
  // Get available pools for this chain/token
  const pools = getPoolsForChainAndToken(chain, token);
  if (pools.length === 0) return null;

  // Round amount to nearest multiple of 10
  const roundedAmount = Math.round(amount / 10) * 10;
  if (roundedAmount <= 0) return null;

  // Sort pools by denomination (largest first for greedy algorithm)
  const sortedPools = [...pools].sort((a, b) => Number(BigInt(b.denomination) - BigInt(a.denomination)));

  // Greedy algorithm: use as many large denominations as possible
  const selections: DenominationSelection[] = [];
  let remainingAmount = roundedAmount;

  for (const pool of sortedPools) {
    // Convert denomination to token units (remove decimals)
    const chainConfig = getChainConfig(chain);
    const tokenInfo = chainConfig.tokens.find(t => t.id === token);
    if (!tokenInfo) continue;

    const denomValue = Number(BigInt(pool.denomination)) / Math.pow(10, tokenInfo.decimals);
    const count = Math.floor(remainingAmount / denomValue);

    if (count > 0) {
      selections.push({ pool, count });
      remainingAmount -= count * denomValue;
    }
  }

  // Calculate totals
  const chainConfig = getChainConfig(chain);
  const tokenInfo = chainConfig.tokens.find(t => t.id === token);
  if (!tokenInfo) return null;

  const totalRaw = BigInt(Math.round(roundedAmount * Math.pow(10, tokenInfo.decimals)));
  const totalLabel = `${roundedAmount.toLocaleString()} ${tokenInfo.symbol}`;

  return {
    chain,
    token,
    selections,
    totalRaw,
    totalLabel,
  };
}

export function RequestPaymentWizard() {
  // Selection
  const [chain, setChain] = useState<Chain>('arbitrum');
  const [token, setToken] = useState<TokenId>('usdc');
  const [denomSet, setDenomSet] = useState<DenominationSet | null>(null);
  const [memo, setMemo] = useState('');
  const [amount, setAmount] = useState<string>('');  // Amount input as string for easier handling

  // Wizard state
  const [step, setStep] = useState<WizardStep>('select');
  const [invoice, setInvoice] = useState<InvoiceRequest | null>(null);
  const [secretKey, setSecretKey] = useState<string>('');
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Waiting state
  const [receivedNotes, setReceivedNotes] = useState<DepositNoteRecord[]>([]);
  const [withdrawnCount, setWithdrawnCount] = useState(0);
  const [txHashes, setTxHashes] = useState<string[]>([]);

  const abortRef = useRef<AbortController | null>(null);

  // Handle amount change and auto-calculate denomination split
  const handleAmountChange = useCallback((value: string) => {
    setAmount(value);
    const numAmount = parseFloat(value);
    if (!isNaN(numAmount) && numAmount > 0) {
      const split = calculateDenominationSplit(numAmount, chain, token);
      setDenomSet(split);
    } else {
      setDenomSet(null);
    }
  }, [chain, token]);

  // Handle quick select amounts
  const handleQuickSelect = useCallback((quickAmount: number) => {
    handleAmountChange(quickAmount.toString());
  }, [handleAmountChange]);

  // Handle network/token changes
  const handleNetworkChange = useCallback((newChain: Chain) => {
    setChain(newChain);
    // Reset to default token for new chain
    const availableTokens = getAvailableTokensForChain(newChain);
    if (availableTokens.length > 0) {
      setToken(availableTokens[0].id);
    }
    // Recalculate split if we have an amount
    if (amount) {
      const numAmount = parseFloat(amount);
      if (!isNaN(numAmount) && numAmount > 0) {
        const split = calculateDenominationSplit(numAmount, newChain, availableTokens[0]?.id || 'usdc');
        setDenomSet(split);
      }
    }
  }, [amount]);

  const handleTokenChange = useCallback((newToken: TokenId) => {
    setToken(newToken);
    // Recalculate split if we have an amount
    if (amount) {
      const numAmount = parseFloat(amount);
      if (!isNaN(numAmount) && numAmount > 0) {
        const split = calculateDenominationSplit(numAmount, chain, newToken);
        setDenomSet(split);
      }
    }
  }, [amount, chain]);

  // Create invoice
  const createInvoice = useCallback(async () => {
    if (!denomSet || denomSet.selections.length === 0) {
      toast.error('Select at least one denomination');
      return;
    }

    try {
      const keypair = generateX25519Keypair();
      setSecretKey(keypair.secretKey);

      const invoiceId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const denominations = denomSet.selections.map((s) => ({
        pool: s.pool.address,
        denomination: s.pool.denomination,
        label: s.pool.label,
        count: s.count,
      }));

      const response = await fetch(`${API_URL}/api/invoices/v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          chain,
          token,
          denominations,
          totalRaw: denomSet.totalRaw.toString(),
          totalLabel: denomSet.totalLabel,
          recipientPubkey: keypair.publicKey,
          memo: memo || null,
          expiresAt,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const inv: InvoiceRequest = {
        invoiceId,
        chain,
        token,
        denominations: denomSet.selections,
        totalRaw: denomSet.totalRaw.toString(),
        totalLabel: denomSet.totalLabel,
        recipientPubkey: keypair.publicKey,
        memo: memo || undefined,
        createdAt: new Date().toISOString(),
        expiresAt,
        status: 'pending',
      };

      setInvoice(inv);
      const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/pay?invoice=${invoiceId}`;
      setInvoiceUrl(url);
      setStep('created');
      toast.success('Invoice created!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create invoice');
    }
  }, [denomSet, chain, token, memo]);

  // Start polling for notes
  const startWaiting = useCallback(() => {
    setStep('waiting');
    const controller = new AbortController();
    abortRef.current = controller;

    const poll = async () => {
      if (!invoice) return;

      while (!controller.signal.aborted) {
        try {
          const res = await fetch(`${API_URL}/api/invoices/v2/${invoice.invoiceId}/notes`);
          if (res.ok) {
            const data = await res.json();
            const notes: InvoiceNoteEntry[] = data.notes ?? [];

            // Calculate expected total notes
            const expectedCount = invoice.denominations.reduce((sum, s) => sum + s.count, 0);

            if (notes.length >= expectedCount) {
              // Decrypt all notes
              const decryptedNotes: DepositNoteRecord[] = [];
              for (const note of notes) {
                try {
                  const plaintext = boxDecrypt(
                    note.ciphertext,
                    note.nonce,
                    note.ephemeralPubkey,
                    secretKey,
                  );
                  const parsed = JSON.parse(plaintext) as DepositNoteRecord;
                  decryptedNotes.push(parsed);
                } catch {
                  // Skip corrupted notes
                }
              }

              setReceivedNotes(decryptedNotes);
              setStep('withdrawing');
              toast.success(`${decryptedNotes.length} deposit notes received!`);
              return;
            }
          }
        } catch {
          // keep polling
        }

        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(resolve, POLL_INTERVAL_MS);
          controller.signal.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
          }, { once: true });
        });
      }
    };

    poll().catch(() => {
      // aborted
    });
  }, [invoice, secretKey]);

  // Withdraw all notes via relayer
  const withdrawAll = useCallback(async () => {
    // TODO: Implement sequential withdrawal via relayer
    // For now, mark as complete — the actual withdrawal will use the same
    // logic as WithdrawWizard but automated with pre-loaded notes
    setStep('complete');
    toast.success('Funds received! Withdraw from the Pool page using your downloaded receipts.');
  }, [receivedNotes]);

  // Auto-start withdrawal when notes received
  useEffect(() => {
    if (step === 'withdrawing' && receivedNotes.length > 0) {
      withdrawAll();
    }
  }, [step, receivedNotes, withdrawAll]);

  const copyToClipboard = useCallback(async (text: string, setCopied: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1
          className="text-3xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-2"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Request Payment
        </h1>
        <p className="text-[var(--color-text-secondary)] text-sm">
          Create an invoice. Share the link. Funds arrive privately.
        </p>
      </div>

      {/* Step: Select */}
      {step === 'select' && (
        <div className="space-y-6">
          {/* Main amount input card */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-xl">
            {/* Amount Input */}
            <div className="text-center mb-8">
              <div className="flex justify-center items-center space-x-2 mb-6">
                <span
                  className="text-6xl text-[var(--color-text-secondary)]"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  $
                </span>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="1,500"
                  className="text-6xl bg-transparent text-[var(--color-text)] placeholder-[var(--color-text-secondary)] border-none outline-none text-center max-w-md"
                  style={{ fontFamily: 'var(--font-mono)' }}
                  autoFocus
                />
              </div>

              {/* Privacy guidance */}
              {amount && parseFloat(amount) > 0 && parseFloat(amount) % 10 !== 0 && (
                <div className="text-sm mb-4 px-4 py-2 bg-[var(--color-hover)] border border-[var(--color-border)] rounded-lg">
                  <span className="text-[var(--color-text-secondary)]">
                    Adjusted to <span className="text-[var(--color-text)] font-bold">${Math.round(parseFloat(amount) / 10) * 10}</span> to fit shielded pool denominations.
                  </span>
                  <span className="text-[var(--color-text-secondary)] opacity-80">
                    {' '}For stronger privacy, use round amounts ($100, $1K, $5K) — fewer deposits = larger anonymity set.
                  </span>
                </div>
              )}

              {/* Quick select chips */}
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {[100, 500, 1000, 5000, 10000].map((quickAmount) => (
                  <button
                    key={quickAmount}
                    onClick={() => handleQuickSelect(quickAmount)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${ 
                      parseInt(amount) === quickAmount
                        ? 'bg-[var(--color-button)] text-[var(--color-bg)]'
                        : 'bg-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]'
                    }`}
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    ${quickAmount.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Network Selection */}
            <div className="mb-6">
              <h3
                className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wide mb-4"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Network
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {getAvailableChains().map((chainOption) => {
                  const chainConfig = getChainConfig(chainOption);
                  return (
                    <button
                      key={chainOption}
                      onClick={() => handleNetworkChange(chainOption)}
                      className={`p-4 rounded-xl border text-left transition-all ${ 
                        chain === chainOption
                          ? 'border-[var(--color-button)] bg-[var(--color-button)] bg-opacity-10'
                          : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-text-secondary)]'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">
                          {chainOption === 'arbitrum' ? '⬡' : '◈'}
                        </span>
                        <span
                          className="font-bold text-[var(--color-text)]"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          {chainConfig.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Token Selection */}
            <div className="mb-6">
              <h3
                className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wide mb-4"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Token
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {getAvailableTokensForChain(chain).map((tokenInfo) => (
                  <button
                    key={tokenInfo.id}
                    onClick={() => handleTokenChange(tokenInfo.id)}
                    className={`p-3 rounded-lg border text-center transition-all ${ 
                      token === tokenInfo.id
                        ? 'border-[var(--color-button)] bg-[var(--color-button)] bg-opacity-10'
                        : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-text-secondary)]'
                    }`}
                  >
                    <div
                      className="font-bold text-[var(--color-text)]"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {tokenInfo.symbol}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Denomination Split Preview */}
            {denomSet && denomSet.selections.length > 0 && (
              <div className="border-t border-[var(--color-border)] pt-6 mb-6">
                <h3
                  className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wide mb-4"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  Split Breakdown
                </h3>
                <div className="space-y-2 mb-4">
                  {denomSet.selections.map((sel, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span
                        className="text-[var(--color-text)]"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {sel.count}× {sel.pool.label}
                      </span>
                      <span
                        className="text-[var(--color-text-secondary)]"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {(() => {
                          const tokenInfo = getChainConfig(chain).tokens.find(t => t.id === token);
                          const decimals = tokenInfo?.decimals || 6;
                          const value = sel.count * (Number(BigInt(sel.pool.denomination)) / Math.pow(10, decimals));
                          return value.toLocaleString();
                        })()} {getChainConfig(chain).tokens.find(t => t.id === token)?.symbol}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[var(--color-border)]">
                  <span
                    className="text-[var(--color-text)] font-bold"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    Total: {denomSet.totalLabel}
                  </span>
                  <span
                    className="text-[var(--color-text-secondary)]"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {denomSet.selections.reduce((sum, sel) => sum + sel.count, 0)} deposits
                  </span>
                </div>
                {/* Privacy strength indicator */}
                {(() => {
                  const depositCount = denomSet.selections.reduce((sum, sel) => sum + sel.count, 0);
                  const uniqueDenoms = denomSet.selections.length;
                  let icon: string, label: string, color: string, tip: string;
                  if (depositCount === 1) {
                    icon = '\u{1F7E2}'; label = 'Maximum Privacy'; color = 'var(--color-green, #4ade80)';
                    tip = 'Single pool deposit — blends with the largest anonymity set.';
                  } else if (depositCount <= 3 && uniqueDenoms === 1) {
                    icon = '\u{1F7E2}'; label = 'Strong Privacy'; color = 'var(--color-green, #4ade80)';
                    tip = 'Few deposits using one denomination — hard to fingerprint.';
                  } else if (depositCount <= 5) {
                    icon = '\u{1F7E1}'; label = 'Good Privacy'; color = 'var(--color-warning-text, #fbbf24)';
                    tip = 'Consider a rounder amount for fewer deposits and a stronger anonymity set.';
                  } else {
                    icon = '\u{1F7E0}'; label = 'Moderate Privacy'; color = 'var(--color-warning-text, #fbbf24)';
                    tip = 'Many deposits increase on-chain footprint. Consider splitting into separate transactions or using a rounder amount.';
                  }
                  return (
                    <div className="mt-3 flex items-start gap-2 text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
                      <span>{icon}</span>
                      <div>
                        <span style={{ color }} className="font-bold uppercase">{label}</span>
                        <span className="text-[var(--color-text-secondary)] ml-1">— {tip}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Memo Input */}
            <div className="border-t border-[var(--color-border)] pt-6">
              <label
                className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Memo (optional)
              </label>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="What is this payment for?"
                className="w-full px-4 py-3 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-secondary)] focus:border-[var(--color-button)] focus:outline-none transition-colors"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>
          </div>

          <button
            onClick={createInvoice}
            disabled={!denomSet || denomSet.selections.length === 0 || denomSet.totalRaw === 0n}
            className="w-full px-6 py-4 bg-[var(--color-button)] text-[var(--color-bg)] hover:bg-[var(--color-button-hover)] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed btn-press"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            CREATE INVOICE →
          </button>
        </div>
      )}

      {/* Step: Created — show link */}
      {step === 'created' && invoice && (
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-xl text-center">
            <div className="text-6xl mb-4">📩</div>
            <h2
              className="text-2xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-2"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Invoice Created
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm mb-6">
              Share this link with the payer. Amount: {invoice.totalLabel}
            </p>

            <div className="bg-[var(--color-bg)] border border-[var(--color-border)] p-4 rounded-xl mb-4">
              <div
                className="text-sm font-mono text-[var(--color-text)] break-all"
              >
                {invoiceUrl}
              </div>
            </div>

            <button
              onClick={() => copyToClipboard(invoiceUrl, setCopiedUrl)}
              className="px-6 py-3 bg-[var(--color-button)] text-[var(--color-bg)] hover:bg-[var(--color-button-hover)] font-bold transition-colors btn-press"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {copiedUrl ? '✓ Copied' : '📋 Copy Invoice Link'}
            </button>
          </div>

          <button
            onClick={startWaiting}
            className="w-full px-6 py-4 bg-[var(--color-button)] text-[var(--color-bg)] hover:bg-[var(--color-button-hover)] font-bold transition-colors btn-press"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            WAIT FOR PAYMENT →
          </button>
        </div>
      )}

      {/* Step: Waiting */}
      {step === 'waiting' && (
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-xl text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 border-4 border-[var(--color-border)] border-t-[var(--color-button)] rounded-full animate-spin" />
            </div>
            <h2
              className="text-2xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-2"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Waiting for Payment
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm">
              Polling for deposits from the payer... Keep this tab open.
            </p>
          </div>

          <button
            onClick={() => {
              abortRef.current?.abort();
              setStep('created');
            }}
            className="w-full px-4 py-3 bg-[var(--color-hover)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] font-medium transition-colors btn-press"
          >
            ← Back to Invoice
          </button>
        </div>
      )}

      {/* Step: Complete */}
      {(step === 'withdrawing' || step === 'complete') && (
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-xl text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2
              className="text-2xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-2"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Payment Received!
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4">
              {receivedNotes.length} deposit note{receivedNotes.length !== 1 ? 's' : ''} decrypted.
              Use the Pool withdraw page with these receipts.
            </p>

            {/* Download receipts */}
            <div className="space-y-2">
              {receivedNotes.map((note, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-[var(--color-bg)] border border-[var(--color-border)] p-3 rounded"
                >
                  <span className="text-sm text-[var(--color-text)]" style={{ fontFamily: 'var(--font-mono)' }}>
                    Note #{i + 1} — Pool {note.pool.slice(0, 8)}...
                  </span>
                  <span className="text-sm text-[var(--color-green)]">✓</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              setStep('select');
              setInvoice(null);
              setReceivedNotes([]);
              setDenomSet(null);
              setMemo('');
              setAmount('');
            }}
            className="w-full px-6 py-4 bg-[var(--color-hover)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] font-medium transition-colors btn-press"
          >
            Create Another Invoice
          </button>
        </div>
      )}
    </div>
  );
}
