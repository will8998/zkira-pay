'use client';

import { useState, useCallback } from 'react';
import { getExplorerTxUrl, CHAIN_CONFIGS, type Chain } from '@/config/pool-registry';

interface PaymentSuccessProps {
  type: 'send_complete' | 'claim_complete' | 'invoice_created' | 'invoice_paid';
  /** Claim code for send_complete. */
  claimCode?: string;
  /** Encryption key for send_complete. */
  encryptionKey?: string;
  /** Invoice URL for invoice_created. */
  invoiceUrl?: string;
  /** Transaction hashes (for claim_complete / invoice_paid). */
  txHashes?: string[];
  /** Chain for explorer links. */
  chain?: Chain;
  /** Human-readable amount. */
  amount?: string;
}

export function PaymentSuccess({
  type,
  claimCode,
  encryptionKey,
  invoiceUrl,
  txHashes,
  chain = 'arbitrum',
  amount,
}: PaymentSuccessProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const copyToClipboard = useCallback(async (text: string, setCopied: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  const chainName = CHAIN_CONFIGS[chain]?.name ?? 'Arbitrum';

  return (
    <div className="max-w-2xl mx-auto py-4 md:py-8 px-4 md:px-0">
      {/* Send Complete — show claim code + encryption key */}
      {type === 'send_complete' && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 md:p-8 rounded-xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div
              className="text-lg font-bold text-[var(--color-text)] tracking-wide"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              ZKIRA
            </div>
            <div className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-text-secondary)] font-medium">
              PRIVATE PAYMENT
            </div>
          </div>

          {/* Amount */}
          {amount && (
            <div className="mb-8">
              <span
                className="text-3xl md:text-6xl font-bold text-[var(--color-text)]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {amount}
              </span>
            </div>
          )}

          <div className="border-t border-[var(--color-border)] my-6" />

          {/* Claim Code */}
          {claimCode && (
            <div className="mb-6">
              <label
                className="block text-[11px] uppercase tracking-[0.15em] text-[var(--color-text-secondary)] font-medium mb-3"
              >
                CLAIM CODE
              </label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <input
                  readOnly
                  value={claimCode}
                  className="flex-1 px-4 py-3 bg-[var(--color-hover)] border border-[var(--color-border)] text-[var(--color-text)] text-xl tracking-widest min-h-[48px]"
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
                <button
                  onClick={() => copyToClipboard(claimCode, setCopiedCode)}
                  className="px-6 py-3 bg-[var(--color-button)] hover:bg-[var(--color-button-hover)] text-[var(--color-bg)] font-medium transition-colors btn-press min-h-[48px]"
                >
                  {copiedCode ? '✓ COPIED' : 'COPY'}
                </button>
              </div>
            </div>
          )}

          {/* Encryption Key */}
          {encryptionKey && (
            <div className="mb-6">
              <label
                className="block text-[11px] uppercase tracking-[0.15em] text-[var(--color-text-secondary)] font-medium mb-3"
              >
                ENCRYPTION PASSWORD
              </label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <input
                  readOnly
                  value={encryptionKey}
                  className="flex-1 px-4 py-3 bg-[var(--color-hover)] border border-[var(--color-border)] text-[var(--color-text)] text-sm break-all min-h-[48px]"
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
                <button
                  onClick={() => copyToClipboard(encryptionKey, setCopiedKey)}
                  className="px-6 py-3 bg-[var(--color-button)] hover:bg-[var(--color-button-hover)] text-[var(--color-bg)] font-medium transition-colors btn-press min-h-[48px]"
                >
                  {copiedKey ? '✓ COPIED' : 'COPY'}
                </button>
              </div>
            </div>
          )}

          {/* What Happens Next */}
          <div className="border-t border-[var(--color-border)] pt-6">
            <h3 className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-text-secondary)] font-medium mb-4">
              WHAT HAPPENS NEXT
            </h3>
            <div className="space-y-3">
              {[
                { step: '1', text: 'Share the claim code and password with the recipient' },
                { step: '2', text: 'Recipient enters both on the Claim page' },
                { step: '3', text: 'Funds are withdrawn from the shielded pool — fully private' },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[var(--color-hover)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                    <span
                      className="text-[10px] font-bold text-[var(--color-text-secondary)]"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {step}
                    </span>
                  </div>
                  <p className="text-[13px] text-[var(--color-text-secondary)] pt-0.5">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Invoice Created — show invoice URL */}
      {type === 'invoice_created' && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 md:p-8 rounded-xl">
          <div className="flex items-center justify-between mb-8">
            <div
              className="text-lg font-bold text-[var(--color-text)] tracking-wide"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              ZKIRA
            </div>
            <div className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-text-secondary)] font-medium">
              INVOICE
            </div>
          </div>

          {amount && (
            <div className="mb-8">
              <span
                className="text-3xl md:text-6xl font-bold text-[var(--color-text)]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {amount}
              </span>
            </div>
          )}

          <div className="border-t border-[var(--color-border)] my-6" />

          {invoiceUrl && (
            <div className="mb-6">
              <label className="block text-[11px] uppercase tracking-[0.15em] text-[var(--color-text-secondary)] font-medium mb-3">
                INVOICE LINK
              </label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <input
                  readOnly
                  value={invoiceUrl}
                  className="flex-1 px-4 py-3 bg-[var(--color-hover)] border border-[var(--color-border)] text-[var(--color-text)] text-sm truncate min-h-[48px]"
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
                <button
                  onClick={() => copyToClipboard(invoiceUrl, setCopiedUrl)}
                  className="px-6 py-3 bg-[var(--color-green)] hover:bg-[var(--color-green-hover)] text-[var(--color-bg)] font-medium transition-colors btn-press min-h-[48px]"
                >
                  {copiedUrl ? '✓ COPIED' : 'COPY'}
                </button>
              </div>
            </div>
          )}

          <div className="border-t border-[var(--color-border)] pt-6">
            <h3 className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-text-secondary)] font-medium mb-4">
              WHAT HAPPENS NEXT
            </h3>
            <div className="space-y-3">
              {[
                { step: '1', text: 'Share the invoice link with the payer' },
                { step: '2', text: 'Payer deposits into the shielded pool' },
                { step: '3', text: 'Claim funds once payment is confirmed' },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[var(--color-hover)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                    <span
                      className="text-[10px] font-bold text-[var(--color-text-secondary)]"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {step}
                    </span>
                  </div>
                  <p className="text-[13px] text-[var(--color-text-secondary)] pt-0.5">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Claim Complete / Invoice Paid — show tx links */}
      {(type === 'claim_complete' || type === 'invoice_paid') && (
        <div className="text-center">
          {/* Success checkmark */}
          <div className="mb-8 flex justify-center">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-[var(--color-green)] flex items-center justify-center rounded-xl">
              <svg className="w-8 h-8 md:w-12 md:h-12 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h2
            className="text-2xl md:text-4xl font-bold mb-4 text-[var(--color-text)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {type === 'claim_complete' ? 'Payment Claimed!' : 'Invoice Paid!'}
          </h2>

          <p className="text-[var(--color-text-secondary)] mb-8 text-base md:text-lg">
            {type === 'claim_complete'
              ? 'Funds have been withdrawn from the shielded pool to your address.'
              : 'Deposits have been submitted to the shielded pool.'}
          </p>

          {amount && (
            <div className="mb-8">
              <span className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-text-secondary)] font-medium">
                AMOUNT
              </span>
              <p
                className="text-3xl font-bold text-[var(--color-text)] mt-2"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {amount}
              </p>
            </div>
          )}

          {/* Transaction hashes */}
          {txHashes && txHashes.length > 0 && (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 mb-8 max-w-lg mx-auto rounded-xl text-left">
              <label className="block text-[11px] uppercase tracking-[0.15em] text-[var(--color-text-secondary)] font-medium mb-3">
                TRANSACTIONS
              </label>
              <div className="space-y-2">
                {txHashes.map((hash, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span
                      className="text-xs text-[var(--color-text)] break-all flex-1"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {hash.slice(0, 10)}...{hash.slice(-8)}
                    </span>
                    <a
                      href={getExplorerTxUrl(chain, hash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--color-button)] hover:text-[var(--color-button-hover)] underline shrink-0"
                    >
                      View on {chainName} →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Back button */}
      <div className="text-center mt-8">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-button)] transition-colors min-h-[44px]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </a>
      </div>
    </div>
  );
}
