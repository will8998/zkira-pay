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
import PrivacyCallout from '@/components/PrivacyCallout';
import InfoTooltip from '@/components/InfoTooltip';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
const POLL_INTERVAL_MS = 8000;

type WizardStep = 'select' | 'created' | 'waiting' | 'withdrawing' | 'complete';

// Calculate optimal denomination split for maximum privacy.
// Strategy: use the LARGEST denomination that fits, max 2 denomination types.
// This prevents denomination-fingerprinting attacks.
function calculateDenominationSplit(amount: number, chain: Chain, token: TokenId): DenominationSet | null {
  const pools = getPoolsForChainAndToken(chain, token);
  if (pools.length === 0) return null;

  const chainConfig = getChainConfig(chain);
  const tokenInfo = chainConfig.tokens.find(t => t.id === token);
  if (!tokenInfo) return null;

  // Round amount to nearest whole dollar
  const roundedAmount = Math.round(amount);
  if (roundedAmount <= 0) return null;

  // Sort pools by denomination (largest first)
  const sortedPools = [...pools].sort((a, b) => Number(BigInt(b.denomination) - BigInt(a.denomination)));

  // Convert pool denominations to human-readable values
  const poolValues = sortedPools.map(pool => ({
    pool,
    value: Number(BigInt(pool.denomination)) / Math.pow(10, tokenInfo.decimals),
  }));

  // Find the largest denomination that fits into the amount
  const primary = poolValues.find(p => p.value <= roundedAmount);
  if (!primary) return null; // amount too small for any pool

  const selections: DenominationSelection[] = [];
  const primaryCount = Math.floor(roundedAmount / primary.value);
  selections.push({ pool: primary.pool, count: primaryCount });
  let covered = primaryCount * primary.value;
  let remainder = roundedAmount - covered;

  // If there's a remainder, try ONE smaller denomination (max 2 types total)
  if (remainder > 0) {
    // Find the largest denomination that fits the remainder
    const secondary = poolValues.find(p => p.value <= remainder && p.pool.address !== primary.pool.address);
    if (secondary) {
      const secondaryCount = Math.floor(remainder / secondary.value);
      if (secondaryCount > 0) {
        selections.push({ pool: secondary.pool, count: secondaryCount });
        covered += secondaryCount * secondary.value;
        remainder = roundedAmount - covered;
      }
    }
  }

  // Round remainder to avoid floating point artifacts
  remainder = Math.round(remainder * 100) / 100;

  const totalRaw = BigInt(Math.round(covered * Math.pow(10, tokenInfo.decimals)));
  const totalLabel = `${covered.toLocaleString()} ${tokenInfo.symbol}`;
  const remainderLabel = remainder > 0 ? `${remainder.toLocaleString()} ${tokenInfo.symbol}` : '';

  return {
    chain,
    token,
    selections,
    totalRaw,
    totalLabel,
    remainder,
    remainderLabel,
  };
}

export function RequestPaymentWizard() {
  // Selection
  const [chain, setChain] = useState<Chain>('arbitrum');
  const [token, setToken] = useState<TokenId>('usdc');
  const [denomSet, setDenomSet] = useState<DenominationSet | null>(null);
  const [memo, setMemo] = useState('');
  const [amount, setAmount] = useState<string>('');  // Amount input as string for easier handling

  // New state for UI enhancements
  const [expiryDays, setExpiryDays] = useState<number>(7);
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(false);

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

      const invoiceId = (typeof crypto.randomUUID === 'function') ? crypto.randomUUID() : ([1e7]+-1e3+-4e3+-8e3+-1e11).toString().replace(/[018]/g, c => (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16));
      const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString();

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
  }, [denomSet, chain, token, memo, expiryDays]);

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

  // Get token symbol for current selection
  const getCurrentTokenInfo = () => {
    const chainConfig = getChainConfig(chain);
    return chainConfig.tokens.find(t => t.id === token);
  };

  return (
    <div className="max-w-2xl mx-auto animate-entrance">
      {/* Header */}
      <div className="text-left mb-8">
        <h1
          className="text-2xl md:text-3xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-1"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          REQUEST PAYMENT
        </h1>
        <p 
          className="text-xs md:text-sm uppercase tracking-wider text-[var(--color-muted)] mb-4"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          GENERATE A CONFIDENTIAL INVOICE LINK
        </p>
        {/* Accent line */}
        <div className="w-full h-0.5 bg-[var(--color-button)]"></div>
      </div>

      {/* Step: Select - New PRIV.fi Layout */}
      {step === 'select' && (
        <div className="space-y-6">
          {/* Main card container */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 md:p-8">
            
            {/* Amount Input Section */}
            <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-6 mb-3">
              <div 
                className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-4"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                AMOUNT
              </div>
              
              <div className="flex items-center justify-between">
                {/* Large amount input with $ prefix */}
                <div className="flex items-center flex-1">
                  <span
                    className="text-5xl md:text-6xl text-[var(--color-text-secondary)] mr-2"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    $
                  </span>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.00"
                    className="text-5xl md:text-6xl bg-transparent text-[var(--color-text)] placeholder-[var(--color-text-secondary)] border-none outline-none focus:outline-none flex-1 no-focus-ring"
                    style={{ fontFamily: 'var(--font-mono)' }}
                    autoFocus
                  />
                </div>

                {/* Token badge/selector */}
                <button
                  onClick={() => {
                    const tokens = getAvailableTokensForChain(chain);
                    const currentIndex = tokens.findIndex(t => t.id === token);
                    const nextIndex = (currentIndex + 1) % tokens.length;
                    handleTokenChange(tokens[nextIndex].id);
                  }}
                  className="flex items-center gap-1 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full hover:bg-[var(--color-hover)] transition-colors"
                >
                  <span className="text-xs">$</span>
                  <span 
                    className="text-sm font-bold"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {getCurrentTokenInfo()?.symbol || 'USDC'}
                  </span>
                  <span className="text-xs">▾</span>
                </button>
              </div>
            </div>

            {/* Helper text */}
            <p className="text-xs md:text-sm text-[var(--color-text-secondary)] mb-6">
              Enter the amount you want to receive in {getCurrentTokenInfo()?.symbol || 'USDC'}.
            </p>

            {/* Denomination Split Preview - animated reveal */}
            {denomSet && denomSet.selections.length > 0 && (
              <div className="border border-[var(--color-border)] rounded-lg p-4 mb-6 animate-slide-up">
                <h3 
                  className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-3"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  ┌─ Denomination Split ──────────────┐
                </h3>
                
                <div className="space-y-2 mb-4">
                  {denomSet.selections.map((sel, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span 
                        className="text-[var(--color-text)]"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {sel.count}× {(() => {
                          const tokenInfo = getChainConfig(chain).tokens.find(t => t.id === token);
                          const decimals = tokenInfo?.decimals || 6;
                          const value = Number(BigInt(sel.pool.denomination)) / Math.pow(10, decimals);
                          return `${value.toLocaleString()} ${tokenInfo?.symbol}`;
                        })()}
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
                        })()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-[var(--color-border)] mb-3">
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

                {/* Remainder warning */}
                {denomSet.remainder > 0 && (
                  <div className="flex items-start gap-2 text-xs mb-3 p-2 rounded bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)]" style={{ fontFamily: 'var(--font-mono)' }}>
                    <span>⚠️</span>
                    <div>
                      <span className="font-bold text-[var(--color-warning-text)]">{denomSet.remainderLabel}</span>
                      <span className="text-[var(--color-text-secondary)] ml-1">
                        cannot be covered by pool denominations. Consider rounding to ${(parseFloat(amount) - denomSet.remainder).toLocaleString()} or adding ${((() => {
                          const nextUp = denomSet.selections[denomSet.selections.length - 1];
                          const tokenInfo = getChainConfig(chain).tokens.find(t => t.id === token);
                          const denomValue = Number(BigInt(nextUp.pool.denomination)) / Math.pow(10, tokenInfo?.decimals || 6);
                          return denomValue.toLocaleString();
                        })())} to reach the next clean amount.
                      </span>
                    </div>
                  </div>
                )}

                {/* Privacy strength indicator */}
                {(() => {
                  const depositCount = denomSet.selections.reduce((sum, sel) => sum + sel.count, 0);
                  const uniqueDenoms = denomSet.selections.length;
                  let icon: string, label: string, color: string, tip: string;
                  if (depositCount === 1) {
                    icon = '🟢'; label = 'Maximum Privacy'; color = 'var(--color-green)';
                    tip = 'Single pool deposit — blends with the largest anonymity set.';
                  } else if (uniqueDenoms === 1) {
                    icon = '🟢'; label = 'Strong Privacy'; color = 'var(--color-green)';
                    tip = `${depositCount} deposits of the same denomination — each blends into its own anonymity set.`;
                  } else if (uniqueDenoms <= 2) {
                    icon = '🟡'; label = 'Good Privacy'; color = 'var(--color-warning-text)';
                    tip = 'Mixed denominations slightly reduce privacy. Consider rounding to a cleaner amount.';
                  } else {
                    icon = '🟠'; label = 'Moderate Privacy'; color = 'var(--color-warning-text)';
                    tip = `${uniqueDenoms} different denominations create a unique fingerprint.`;
                  }
                  return (
                    <div className="flex items-start gap-2 text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
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

            {/* Expires In */}
            <div className="mb-6">
              <h3 
                className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-3"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                EXPIRES IN
              </h3>
              <div className="flex flex-wrap gap-2 mb-2">
                {[
                  { days: 1, label: '1 day' },
                  { days: 3, label: '3 days' },
                  { days: 7, label: '7 days' },
                  { days: 14, label: '14d' },
                  { days: 30, label: '30d' },
                ].map(({ days, label }) => (
                  <button
                    key={days}
                    onClick={() => setExpiryDays(days)}
                    className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                      expiryDays === days
                        ? 'bg-[var(--color-button)] text-white'
                        : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:border-[var(--color-text-secondary)]'
                    }`}
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                The invoice link expires after this period. Choose a longer window if your payer needs more time.
              </p>
            </div>

            {/* Advanced Options - Collapsible */}
            <div className="mb-6">
              <button
                onClick={() => setAdvancedOpen(!advancedOpen)}
                className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors mb-3"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                <span className={`transform transition-transform ${advancedOpen ? 'rotate-90' : ''}`}>›</span>
                Advanced options
              </button>
              
              <div 
                className={`overflow-hidden transition-all duration-300 ${
                  advancedOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="border border-[var(--color-border)] rounded-lg p-4 space-y-4">
                  {/* Network Selection */}
                  <div>
                    <h4 
                      className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-3"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      Network:
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {getAvailableChains().map((chainOption) => {
                        const chainConfig = getChainConfig(chainOption);
                        return (
                          <button
                            key={chainOption}
                            onClick={() => handleNetworkChange(chainOption)}
                            className={`p-3 rounded-lg border text-left transition-all ${
                              chain === chainOption
                                ? 'border-[var(--color-button)] bg-[var(--color-button)] bg-opacity-10'
                                : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-text-secondary)]'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">
                                {chainOption === 'arbitrum' ? '⬡' : '◈'}
                              </span>
                              <span
                                className="font-bold text-[var(--color-text)] text-sm"
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
                  <div>
                    <h4 
                      className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-3"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      Token:
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
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
                            className="font-bold text-[var(--color-text)] text-sm"
                            style={{ fontFamily: 'var(--font-mono)' }}
                          >
                            {tokenInfo.symbol}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Memo Input - Moved to Advanced Options */}
                  <div>
                    <label
                      className="block text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-2"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      Memo:
                    </label>
                    <input
                      type="text"
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                      placeholder="What is this payment for?"
                      className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-secondary)] focus:border-[var(--color-button)] focus:outline-none transition-colors rounded-lg"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy Callout */}
            <div className="mb-6">
              <PrivacyCallout variant="full" />
            </div>

            {/* Fee Info Line */}
            <div className="flex items-center justify-center gap-1 text-xs text-[var(--color-text-secondary)] mb-6">
              <span>0.25% fee</span>
              <InfoTooltip text="A small fee is charged when the payer claims their funds back from expired invoices. This covers gas costs for processing withdrawals." />
              <span>charged on claim</span>
            </div>

            {/* Action Button */}
            <button
              onClick={createInvoice}
              disabled={!denomSet || denomSet.selections.length === 0 || denomSet.totalRaw === 0n}
              className="w-full py-4 bg-[var(--color-button)] text-white hover:bg-[var(--color-button-hover)] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed btn-press rounded-lg"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <span className="uppercase tracking-wide">Generate Invoice Link</span>
            </button>
          </div>
        </div>
      )}

      {/* Step: Created — show link */}
      {step === 'created' && invoice && (
        <div className="space-y-6 animate-entrance">
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
              className="px-6 py-3 bg-[var(--color-button)] text-white hover:bg-[var(--color-button-hover)] font-bold transition-colors btn-press rounded"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {copiedUrl ? '✓ Copied' : '📋 Copy Invoice Link'}
            </button>
          </div>

          <button
            onClick={startWaiting}
            className="w-full px-6 py-4 bg-[var(--color-button)] text-white hover:bg-[var(--color-button-hover)] font-bold transition-colors btn-press rounded"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            WAIT FOR PAYMENT →
          </button>
        </div>
      )}

      {/* Step: Waiting */}
      {step === 'waiting' && (
        <div className="space-y-6 animate-entrance">
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
            className="w-full px-4 py-3 bg-[var(--color-hover)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] font-medium transition-colors btn-press rounded"
          >
            ← Back to Invoice
          </button>
        </div>
      )}

      {/* Step: Complete */}
      {(step === 'withdrawing' || step === 'complete') && (
        <div className="space-y-6 animate-entrance">
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
              setExpiryDays(7);
              setAdvancedOpen(false);
            }}
            className="w-full px-6 py-4 bg-[var(--color-hover)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] font-medium transition-colors btn-press rounded"
          >
            Create Another Invoice
          </button>
        </div>
      )}
    </div>
  );
}
