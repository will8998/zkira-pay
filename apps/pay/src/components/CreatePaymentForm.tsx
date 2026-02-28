'use client';

import { useState } from 'react';
import InfoTooltip from '@/components/InfoTooltip';
import PrivacyCallout from '@/components/PrivacyCallout';
import { useBalance } from './useBalance';
import { useWallet } from './WalletProvider';
import { useNetwork, getUsdcMint } from '@/lib/network-config';

interface CreatePaymentData {
  amount: string;
  tokenMint: string;
  expiry: string;
}

interface CreatePaymentFormProps {
  onSubmit: (data: CreatePaymentData) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const EXPIRY_OPTIONS = [
  { value: '1', label: '1 day' },
  { value: '3', label: '3 days' },
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
];

export function CreatePaymentForm({ onSubmit, isLoading, disabled = false }: CreatePaymentFormProps) {
  const { connected } = useWallet();
  const { network } = useNetwork();
  const { sol, usdc, loading: balanceLoading } = useBalance();
  const [formData, setFormData] = useState<CreatePaymentData>({
    amount: '',
    tokenMint: getUsdcMint(network),
    expiry: '7',
  });

  const [errors, setErrors] = useState<Partial<CreatePaymentData>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const parsedAmount = parseFloat(formData.amount) || 0;
  const claimFee = parsedAmount * 0.003;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Partial<CreatePaymentData> = {};

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    } else if (usdc !== null && parsedAmount > usdc) {
      newErrors.amount = `Insufficient USDC balance (${usdc.toFixed(2)} available)`;
    }

    if (!formData.tokenMint.trim()) {
      newErrors.tokenMint = 'Token mint is required';
    } else if (formData.tokenMint.length < 32 || formData.tokenMint.length > 44) {
      newErrors.tokenMint = 'Token mint must be a valid base58 address';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof CreatePaymentData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const setUSDC = () => {
    handleInputChange('tokenMint', getUsdcMint(network));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      
      {/* Wallet Balance */}
      {connected && (
        <div className="border border-[var(--color-border)] bg-[var(--color-hover)] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <span className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-text-muted)] font-medium">Wallet Balance</span>
          <div className="flex items-center gap-4 text-sm">
            {balanceLoading ? (
              <span className="text-[var(--color-text-secondary)]">Loading...</span>
            ) : (
              <>
                <span className="text-[var(--color-text)] font-medium tabular-nums">{usdc !== null ? usdc.toFixed(2) : '—'} USDC</span>
                <span className="text-[var(--color-text-muted)] tabular-nums">{sol !== null ? sol.toFixed(4) : '—'} SOL</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Amount Input — HERO ELEMENT */}
      <div className="border border-[var(--color-border)] bg-[var(--color-hover)] p-4 md:p-6">
        <label className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-text-muted)] font-medium mb-4 block">Amount</label>
        <div className="flex items-center gap-4">
          <div className="flex items-baseline flex-1">
            <span className="text-[var(--color-text-muted)] text-3xl md:text-4xl font-light mr-2">$</span>
            <input
              id="amount"
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              className="w-full bg-transparent text-[var(--color-text)] text-3xl md:text-4xl font-semibold focus:outline-none input-focus placeholder:text-[#d4d4d4]"
              disabled={isLoading || disabled}
            />
          </div>
          {/* USDC Badge */}
          <div className="flex items-center gap-2 border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
              <circle cx="12" cy="12" r="12" fill="#2775ca"/>
              <text x="12" y="17" textAnchor="middle" fill="white" fontSize="14" fontWeight="700" fontFamily="system-ui">$</text>
            </svg>
            <span className="text-sm font-medium text-[var(--color-text)]">USDC</span>
          </div>
        </div>
        {errors.amount && <p className="text-[var(--color-red)] text-sm mt-2">{errors.amount}</p>}
      </div>
        {!errors.amount && <p className="text-[11px] text-[var(--color-text-secondary)] mt-1.5">Enter the amount in USDC. Minimum 0.01.</p>}

      {/* Fee Breakdown */}
      {parsedAmount > 0 && (
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-2">
          <div className="flex justify-between text-xs md:text-sm">
            <span className="text-[var(--color-text-secondary)]">Send amount</span>
            <span className="text-[var(--color-text)] font-medium tabular-nums">${parsedAmount.toFixed(2)} USDC</span>
          </div>
          <div className="flex justify-between text-xs md:text-sm">
            <span className="text-[var(--color-text-secondary)]">Claim fee (0.3%)<InfoTooltip text="A small protocol fee deducted when the recipient claims the payment. Covers network gas costs." /></span>
            <span className="text-[var(--color-text-muted)] tabular-nums">−${claimFee.toFixed(4)} USDC</span>
          </div>
          <div className="border-t border-[var(--color-border)] pt-2 flex justify-between text-xs md:text-sm">
            <span className="text-[var(--color-text-secondary)]">Recipient receives</span>
            <span className="text-[var(--color-text)] font-semibold tabular-nums">${(parsedAmount - claimFee).toFixed(4)} USDC</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[var(--color-text-secondary)]">Network fee</span>
            <span className="text-[var(--color-text-secondary)] tabular-nums">~0.01 SOL</span>
          </div>
        </div>
      )}

      {/* Expiry — Pill Selector Row */}
      <div>
        <label className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-text-muted)] font-medium mb-3 block">Expires In</label>
        <div className="flex gap-2 flex-wrap">
          {EXPIRY_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleInputChange('expiry', option.value)}
              className={`px-4 min-h-[44px] py-2.5 text-sm font-medium transition-colors ${
                formData.expiry === option.value
                  ? 'bg-[var(--color-button)] text-[var(--color-bg)] border border-[var(--color-button)] btn-press'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-button)] hover:text-[var(--color-button)]'
              }`}
              disabled={isLoading || disabled}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
        <p className="text-[11px] text-[var(--color-text-secondary)] mt-2">Unclaimed funds are automatically returned to your wallet after the expiry period.</p>

      {/* Advanced Options (Token Mint — hidden by default) */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-button)] transition-colors flex items-center gap-1"
        >
          <svg className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Advanced options
        </button>
        {showAdvanced && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="tokenMint" className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-text-muted)] font-medium">Token Mint</label>
              <button type="button" onClick={setUSDC} className="text-xs text-[var(--color-green)] hover:text-[var(--color-green-hover)] transition-colors" disabled={isLoading}>
                Reset to USDC
              </button>
            </div>
            <input
              id="tokenMint"
              type="text"
              placeholder="Base58 mint address"
              value={formData.tokenMint}
              onChange={(e) => handleInputChange('tokenMint', e.target.value)}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-3 min-h-[44px] focus:border-[var(--color-button)] focus:ring-0 focus:outline-none transition-colors font-[family-name:var(--font-mono)] text-sm"
              disabled={isLoading || disabled}
            />
            {errors.tokenMint && <p className="text-[var(--color-red)] text-sm mt-1">{errors.tokenMint}</p>}
            {!errors.tokenMint && <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">The SPL token mint address. Defaults to USDC on devnet.</p>}
          </div>
        )}
      </div>

      {/* Privacy Callout */}
      <PrivacyCallout variant="full" />

      {/* Submit Button — DARK CTA */}
      <button
        type="submit"
        disabled={isLoading || disabled}
        className="w-full px-6 py-4 min-h-[48px] bg-[var(--color-button)] text-[var(--color-bg)] hover:bg-[var(--color-button-hover)] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 btn-press"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-[var(--color-bg)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Creating Payment Link...</span>
          </>
        ) : (
          <span>Generate Payment Link</span>
        )}
      </button>
    </form>
  );
}
