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
import { logRequest } from '@/lib/history-store';
import { executeBatchWithdrawal, type BatchWithdrawProgress, type WithdrawResult } from '@/lib/withdraw-engine';
import { getExplorerTxUrl } from '@/config/pool-registry';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
const POLL_INTERVAL_MS = 8000;

type WizardStep = 'select' | 'created' | 'waiting' | 'address' | 'withdrawing' | 'complete';

// Calculate optimal denomination split using greedy algorithm.
// Uses ALL available denominations to cover the exact amount.
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

  // Greedy: go through each denomination largest-to-smallest
  const selections: DenominationSelection[] = [];
  let remaining = roundedAmount;

  for (const pv of poolValues) {
    if (remaining <= 0) break;
    if (pv.value > remaining) continue;

    const count = Math.floor(remaining / pv.value);
    if (count > 0) {
      selections.push({ pool: pv.pool, count });
      remaining -= count * pv.value;
    }
  }

  if (selections.length === 0) return null;

  // Round remainder to avoid floating point artifacts
  const remainder = Math.round(remaining * 100) / 100;
  const covered = roundedAmount - remainder;

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
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(false);

  // Wizard state
  const [step, setStep] = useState<WizardStep>('select');
  const [invoice, setInvoice] = useState<InvoiceRequest | null>(null);
  const [secretKey, setSecretKey] = useState<string>('');
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Waiting + withdrawal state
  const [receivedNotes, setReceivedNotes] = useState<DepositNoteRecord[]>([]);
  const [withdrawnCount, setWithdrawnCount] = useState(0);
  const [txHashes, setTxHashes] = useState<string[]>([]);
  const [destinationAddress, setDestinationAddress] = useState('');
  const [isValidAddress, setIsValidAddress] = useState(false);
  const [withdrawProgress, setWithdrawProgress] = useState<BatchWithdrawProgress | null>(null);
  const [withdrawResults, setWithdrawResults] = useState<WithdrawResult[]>([]);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

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
        status: 'pending',
      };

      setInvoice(inv);
      const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/pay?invoice=${invoiceId}`;
      setInvoiceUrl(url);
      setStep('created');
      toast.success('Invoice created!');

      // Log to local history
      logRequest({
        chain,
        token,
        amountRaw: denomSet.totalRaw.toString(),
        amountLabel: denomSet.totalLabel,
        invoiceId,
      });
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
              setStep('address');
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

  // Address validation
  const handleAddressChange = (value: string) => {
    setDestinationAddress(value);
    setIsValidAddress(/^0x[a-fA-F0-9]{40}$/.test(value));
  };

  // Withdraw all notes via relayer using withdraw engine
  const withdrawAll = useCallback(async () => {
    if (receivedNotes.length === 0 || !isValidAddress) return;

    setStep('withdrawing');
    setWithdrawError(null);
    setWithdrawResults([]);

    try {
      const results = await executeBatchWithdrawal(
        receivedNotes,
        destinationAddress,
        (progress) => setWithdrawProgress(progress),
      );

      setWithdrawResults(results);
      setTxHashes(results.map((r) => r.txHash));
      setStep('complete');
      toast.success('All withdrawals complete! Funds are on the way.');
    } catch (error) {
      setWithdrawError(error instanceof Error ? error.message : 'Withdrawal failed');
      toast.error(error instanceof Error ? error.message : 'Withdrawal failed');
    }
  }, [receivedNotes, destinationAddress, isValidAddress]);

  // Get denomination label from a note
  const getDenomLabel = (note: DepositNoteRecord): string => {
    const decimals = note.token === 'dai' ? 18 : 6;
    const value = Number(BigInt(note.denomination)) / Math.pow(10, decimals);
    return `${value.toLocaleString()} ${note.token.toUpperCase()}`;
  };

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
              className="w-full py-4 bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed btn-press rounded-lg"
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
              className="px-6 py-3 bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] font-bold transition-colors btn-press rounded"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {copiedUrl ? '✓ Copied' : '📋 Copy Invoice Link'}
            </button>
          </div>

          <button
            onClick={startWaiting}
            className="w-full px-6 py-4 bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] font-bold transition-colors btn-press rounded"
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

      {/* Step: Enter Address (after payer deposits received) */}
      {step === 'address' && receivedNotes.length > 0 && (
        <div className="space-y-6 animate-entrance">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-xl">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🔓</div>
              <h2
                className="text-2xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-2"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Payment Received!
              </h2>
              <p className="text-[var(--color-text-secondary)] text-sm">
                {receivedNotes.length} deposit{receivedNotes.length !== 1 ? 's' : ''} decrypted.
                Enter your wallet address to withdraw.
              </p>
            </div>

            <div className="space-y-2 mb-6">
              {receivedNotes.map((note, i) => (
                <div key={i} className="flex items-center justify-between bg-[var(--color-bg)] border border-[var(--color-border)] p-3 rounded">
                  <span className="text-sm text-[var(--color-text)]" style={{ fontFamily: 'var(--font-mono)' }}>
                    #{i + 1} — {getDenomLabel(note)}
                  </span>
                  <span className="text-sm text-[var(--color-green)]">✓ Ready</span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] uppercase tracking-wide" style={{ fontFamily: 'var(--font-mono)' }}>
                Withdraw To
              </label>
              <input
                type="text"
                value={destinationAddress}
                onChange={(e) => handleAddressChange(e.target.value)}
                placeholder="0x... your Ethereum / Arbitrum address"
                className={`w-full px-4 py-3 bg-[var(--color-bg)] border text-[var(--color-text)] placeholder-[var(--color-text-secondary)] focus:outline-none transition-colors ${
                  isValidAddress ? 'border-[var(--color-green)]' : destinationAddress && !isValidAddress ? 'border-red-500' : 'border-[var(--color-border)] focus:border-[var(--color-button)]'
                }`}
                style={{ fontFamily: 'var(--font-mono)' }}
                autoFocus
              />
              {destinationAddress && !isValidAddress && (
                <p className="text-sm text-red-500">Invalid Ethereum address</p>
              )}
            </div>
          </div>

          <button
            onClick={withdrawAll}
            disabled={!isValidAddress}
            className="w-full px-6 py-4 bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed btn-press rounded"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            WITHDRAW ALL {receivedNotes.length} NOTE{receivedNotes.length !== 1 ? 'S' : ''} →
          </button>
        </div>
      )}

      {/* Step: Withdrawing */}
      {step === 'withdrawing' && (
        <div className="space-y-6 animate-entrance">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
                {withdrawError ? 'Withdrawal Error' : `Withdrawing ${(withdrawProgress?.noteIndex ?? 0) + 1} of ${receivedNotes.length}`}
              </h2>
              <p className="text-[var(--color-text-secondary)] text-sm">
                {withdrawError ?? withdrawProgress?.message ?? 'Preparing...'}
              </p>
            </div>

            {!withdrawError && (
              <div className="w-full bg-[var(--color-border)] rounded-full h-2 mb-6">
                <div
                  className="bg-[var(--color-button)] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(((withdrawProgress?.noteIndex ?? 0) + (withdrawProgress?.stage === 'submit' ? 0.8 : withdrawProgress?.stage === 'proof' ? 0.5 : 0.2)) / receivedNotes.length) * 100}%` }}
                />
              </div>
            )}

            <div className="space-y-2">
              {receivedNotes.map((note, i) => {
                const completed = withdrawResults.some((r) => r.noteIndex === i);
                const isActive = !withdrawError && (withdrawProgress?.noteIndex ?? -1) === i;
                return (
                  <div key={i} className="flex items-center justify-between bg-[var(--color-bg)] border border-[var(--color-border)] p-3 rounded">
                    <span className="text-sm text-[var(--color-text)]" style={{ fontFamily: 'var(--font-mono)' }}>
                      #{i + 1} — {getDenomLabel(note)}
                    </span>
                    <span className="text-sm">
                      {completed && <span className="text-[var(--color-green)]">✓ Done</span>}
                      {isActive && (
                        <span className="text-[var(--color-button)] flex items-center gap-1">
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                          {withdrawProgress?.stage === 'tree' ? 'Tree...' : withdrawProgress?.stage === 'proof' ? 'ZK Proof...' : 'Submitting...'}
                        </span>
                      )}
                      {!completed && !isActive && <span className="text-[var(--color-text-secondary)]">Pending</span>}
                    </span>
                  </div>
                );
              })}
            </div>

            {withdrawError && (
              <button onClick={withdrawAll} className="w-full mt-6 px-6 py-4 bg-[var(--color-button)] text-[var(--color-bg)] hover:bg-[var(--color-button-hover)] font-bold transition-colors btn-press rounded" style={{ fontFamily: 'var(--font-mono)' }}>
                RETRY WITHDRAWAL
              </button>
            )}
          </div>

          {!withdrawError && (
            <div className="bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="text-sm text-[var(--color-warning-text)]"><strong>DO NOT CLOSE THIS TAB</strong> — withdrawals are in progress.</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step: Complete */}
      {step === 'complete' && (
        <div className="space-y-6 animate-entrance">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-xl text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
              Funds Withdrawn!
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4">
              {withdrawResults.length} withdrawal{withdrawResults.length !== 1 ? 's' : ''} complete. Funds will arrive within ~1 minute.
            </p>

            {withdrawResults.length > 0 && (
              <div className="space-y-2 text-left">
                {withdrawResults.map((result, i) => {
                  const note = receivedNotes[result.noteIndex];
                  const chain = note?.chain ?? 'arbitrum';
                  return (
                    <div key={i} className="flex items-center justify-between bg-[var(--color-bg)] border border-[var(--color-border)] p-3 rounded">
                      <span className="text-sm text-[var(--color-text)]" style={{ fontFamily: 'var(--font-mono)' }}>
                        {note ? getDenomLabel(note) : `Note #${result.noteIndex + 1}`}
                      </span>
                      {result.txHash ? (
                        <a href={getExplorerTxUrl(chain, result.txHash)} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--color-button)] hover:text-[var(--color-button-hover)] underline">
                          {result.txHash.slice(0, 10)}... →
                        </a>
                      ) : (
                        <span className="text-sm text-[var(--color-green)]">✓</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setStep('select');
              setInvoice(null);
              setReceivedNotes([]);
              setDenomSet(null);
              setMemo('');
              setAmount('');
              setAdvancedOpen(false);
              setWithdrawResults([]);
              setWithdrawProgress(null);
              setWithdrawError(null);
              setDestinationAddress('');
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
