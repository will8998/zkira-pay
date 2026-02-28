'use client';

import { useState } from 'react';

interface PaymentSuccessProps {
  type: 'created' | 'claimed' | 'invoice_created' | 'invoice_paid';
  paymentUrl?: string;
  txSignature?: string;
  invoiceUrl?: string;
  amount?: string;
  senderAddress?: string; // NEW — the sender's wallet public key as base58 string
}


export function PaymentSuccess({ type, paymentUrl, txSignature, invoiceUrl, amount, senderAddress }: PaymentSuccessProps) {
  const [copied, setCopied] = useState(false);

  // Address truncation helper function
  function truncateAddress(address: string): string {
    if (address.length <= 10) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }

  const copyableUrl = type === 'invoice_created' ? invoiceUrl : paymentUrl;

  const handleCopy = async () => {
    if (!copyableUrl) return;
    try {
      await navigator.clipboard.writeText(copyableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = copyableUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const explorerUrl = txSignature
    ? `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`
    : undefined;

  return (
    <div className="max-w-2xl mx-auto py-4 md:py-8 px-4 md:px-0">
      {/* Voucher Card Layout for created and invoice_created */}
      {(type === 'created' || type === 'invoice_created') && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] p-4 md:p-8 mb-4 md:mb-6">
          {/* Top Section */}
          <div className="flex items-center justify-between mb-8">
            <div className="font-[family-name:var(--font-mono)] text-lg font-bold text-[var(--color-text)] tracking-wide">
              ZKIRA
            </div>
            <div className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-text-muted)] font-medium">
              CONFIDENTIAL PAYMENT
            </div>
          </div>

          {/* Hero Amount */}
          <div className="mb-8">
            {amount && (
              <div className="flex flex-col sm:flex-row items-start sm:items-baseline gap-2 sm:gap-4">
                <span className="text-3xl md:text-6xl font-bold font-[family-name:var(--font-mono)] text-[var(--color-text)]">
                  ${amount}
                </span>
                <span className="bg-[var(--color-hover)] border border-[var(--color-border)] px-3 py-1 text-sm font-[family-name:var(--font-mono)] text-[var(--color-text-secondary)] rounded-none">
                  USDC
                </span>
              </div>
            )}
            {!amount && (
              <div className="flex flex-col sm:flex-row items-start sm:items-baseline gap-2 sm:gap-4">
                <span className="text-3xl md:text-6xl font-bold font-[family-name:var(--font-mono)] text-[var(--color-text)]">
                  Payment
                </span>
                <span className="bg-[var(--color-hover)] border border-[var(--color-border)] px-3 py-1 text-sm font-[family-name:var(--font-mono)] text-[var(--color-text-secondary)] rounded-none">
                  LINK
                </span>
              </div>
            )}
          </div>

          {/* Sender/Recipient Row */}
          {senderAddress && (
            <div className="mb-6">
              <span className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-text-muted)] font-medium mr-4">
                {type === 'invoice_created' ? 'TO' : 'FROM'}
              </span>
              <span className="font-[family-name:var(--font-mono)] text-[var(--color-text)] text-lg">
                @{truncateAddress(senderAddress)}
              </span>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-[var(--color-border-subtle)] my-6"></div>

          {/* Link Section */}
          {copyableUrl && (
            <div className="mb-6">
              <label className="block text-[11px] uppercase tracking-[0.15em] text-[var(--color-text-muted)] font-medium mb-3">
                {type === 'invoice_created' ? 'INVOICE LINK' : 'PAYMENT LINK'}
              </label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <input
                  readOnly
                  value={copyableUrl}
                  className="flex-1 px-4 py-3 bg-[var(--color-hover)] border border-[var(--color-border-subtle)] text-[var(--color-text)] font-[family-name:var(--font-mono)] text-[16px] truncate rounded-none min-h-[48px]"
                />
                <button
                  onClick={handleCopy}
                  className="px-6 py-3 bg-[var(--color-green)] hover:bg-[var(--color-green-hover)] text-[var(--color-bg)] border border-[var(--color-green)] hover:border-[var(--color-green-hover)] transition-colors font-medium rounded-none btn-press w-full sm:w-auto min-h-[48px]"
                >
                  {copied ? '✓ COPIED' : 'COPY'}
                </button>
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className="flex items-center justify-between mb-6">
            <div className="bg-[var(--color-hover)] border border-[var(--color-border-subtle)] px-4 py-2 rounded-none">
              <span className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-text-muted)] font-medium">
                {type === 'invoice_created' ? 'READY TO CLAIM' : 'PENDING'}
              </span>
            </div>
          </div>

          {/* What Happens Next - Compact */}
          <div className="border-t border-[var(--color-border-subtle)] pt-6">
            <h3 className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-text-muted)] font-medium mb-4">WHAT HAPPENS NEXT</h3>
            <div className="space-y-3">
              {(type === 'created' ? [
                { step: '1', text: 'Share the payment link with the recipient' },
                { step: '2', text: 'Recipient connects wallet and claims funds' },
                { step: '3', text: 'Confidential transfer via stealth address' },
              ] : [
                { step: '1', text: 'Share the invoice link with the payer' },
                { step: '2', text: 'Payer sends USDC to stealth address' },
                { step: '3', text: 'Claim funds once payment is confirmed' },
              ]).map(({ step, text }) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[var(--color-hover)] border border-[var(--color-border-subtle)] flex items-center justify-center shrink-0 rounded-none">
                    <span className="text-[10px] font-bold font-[family-name:var(--font-mono)] text-[var(--color-text-muted)]">{step}</span>
                  </div>
                  <p className="text-[13px] text-[var(--color-text-secondary)] pt-0.5 font-[family-name:var(--font-sans)]">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Success Display for claimed and invoice_paid */}
      {(type === 'claimed' || type === 'invoice_paid') && (
        <div className="text-center">
          {/* Large Success Checkmark */}
          <div className="mb-8 flex justify-center">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-[var(--color-green)] border border-[var(--color-green)] flex items-center justify-center rounded-none">
              <svg className="w-8 h-8 md:w-12 md:h-12 text-[var(--color-bg)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl md:text-4xl font-bold mb-4 text-[var(--color-text)] font-[family-name:var(--font-sans)]">
            {type === 'claimed' ? 'Payment Claimed!' : 'Invoice Paid!'}
          </h2>

          <p className="text-[var(--color-text-secondary)] mb-8 text-base md:text-lg font-[family-name:var(--font-sans)]">
            {type === 'claimed' ? 'Tokens have been transferred to your wallet.' : 'Payment has been sent to the requester.'}
          </p>

          {/* Amount display if available */}
          {amount && (
            <div className="mb-8">
              <span className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-text-muted)] font-medium">AMOUNT</span>
              <p className="text-3xl font-bold text-[var(--color-text)] mt-2 font-[family-name:var(--font-mono)]">${amount} USDC</p>
            </div>
          )}

          {/* Transaction signature display */}
          {txSignature && (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] p-6 mb-8 max-w-lg mx-auto rounded-none">
              <label className="block text-[11px] uppercase tracking-[0.15em] text-[var(--color-text-muted)] font-medium mb-3 text-left">
                TRANSACTION SIGNATURE
              </label>
              <p className="px-4 py-3 bg-[var(--color-hover)] border border-[var(--color-border-subtle)] text-[var(--color-text)] font-[family-name:var(--font-mono)] text-xs break-all text-left rounded-none">
                {txSignature}
              </p>
              {explorerUrl && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[var(--color-green)] hover:bg-[var(--color-green-hover)] text-[var(--color-bg)] border border-[var(--color-green)] hover:border-[var(--color-green-hover)] transition-colors font-medium text-sm rounded-none min-h-[44px]"
                >
                  View on Solana Explorer
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Back button */}
      <div className="text-center mt-8">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-button)] transition-colors font-[family-name:var(--font-sans)] min-h-[44px]"
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
