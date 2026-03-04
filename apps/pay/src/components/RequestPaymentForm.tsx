'use client';

import { useState } from 'react';
import PrivacyCallout from '@/components/PrivacyCallout';
import InfoTooltip from '@/components/InfoTooltip';
import { generateMetaAddress, encodeMetaAddress, deriveStealthAddress, bytesToHex } from '@zkira/crypto';
import { useNetwork, getUsdcMint } from '@/lib/network-config';

interface RequestPaymentData {
  amount: string;
  tokenMint: string;
  expiry: string;
}

interface RequestPaymentFormProps {
  onSuccess: (invoiceUrl: string, amount: string) => void;
}

const EXPIRY_OPTIONS = [
  { value: '1', label: '1 day' },
  { value: '3', label: '3 days' },
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
];

export function RequestPaymentForm({ onSuccess }: RequestPaymentFormProps) {
  const { network } = useNetwork();
  const [formData, setFormData] = useState<RequestPaymentData>({
    amount: '',
    tokenMint: getUsdcMint(network),
    expiry: '7',
  });

  const [errors, setErrors] = useState<Partial<RequestPaymentData>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Partial<RequestPaymentData> = {};

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }

    if (!formData.tokenMint.trim()) {
      newErrors.tokenMint = 'Token mint is required';
    } else if (formData.tokenMint.length < 32 || formData.tokenMint.length > 44) {
      newErrors.tokenMint = 'Token mint must be a valid base58 address';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      try {
        // 1. Generate a meta-address
        const meta = generateMetaAddress();
        const metaAddress = encodeMetaAddress(meta.spendPubkey, meta.viewPubkey);
        
        // 2. Derive stealth address for this invoice
        const { stealthPubkey, ephemeralPubkey } = deriveStealthAddress(meta.spendPubkey, meta.viewPubkey);
        
        // 3. Store invoice data in localStorage
        const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const invoiceData = {
          invoiceId,
          stealthAddressHex: bytesToHex(stealthPubkey),
          ephemeralPubkeyHex: bytesToHex(ephemeralPubkey),
          metaAddress,
          amount: String(BigInt(Math.floor(parseFloat(formData.amount) * 1_000_000))),
          tokenMint: formData.tokenMint,
          expiry: formData.expiry,
          createdAt: new Date().toISOString(),
          status: 'pending',
        };
        const existing = JSON.parse(localStorage.getItem('zkira_invoices') || '[]');
        existing.push(invoiceData);
        localStorage.setItem('zkira_invoices', JSON.stringify(existing));
        
        // 4. Build the invoice URL (no hash needed for stealth)
        const invoiceUrl = `${window.location.origin}/pay?amount=${formData.amount}&to=${encodeURIComponent(metaAddress)}&expiry=${formData.expiry}`;
        
        // 5. Call onSuccess
        onSuccess(invoiceUrl, formData.amount);
      } catch (error) {
        console.error('Failed to generate invoice:', error);
        setErrors({ amount: 'Failed to generate invoice. Please try again.' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleInputChange = (field: keyof RequestPaymentData, value: string) => {
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
              disabled={isLoading}
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
        {!errors.amount && <p className="text-[11px] text-[var(--color-text-secondary)] mt-1.5">Enter the amount you want to receive in USDC.</p>}
      </div>

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
              disabled={isLoading}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
        <p className="text-[11px] text-[var(--color-text-secondary)] mt-2">The invoice link expires after this period. Choose a longer window if your payer needs more time.</p>

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
              disabled={isLoading}
            />
            {errors.tokenMint && <p className="text-[var(--color-red)] text-sm mt-1">{errors.tokenMint}</p>}
            {!errors.tokenMint && <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">The SPL token mint address. Defaults to USDC on devnet.</p>}
          </div>
        )}
      </div>

      {/* Privacy Callout */}
      <PrivacyCallout variant="full" />

      {/* Fee info */}
      <p className="text-xs text-[var(--color-text-secondary)] text-center">0.3% fee<InfoTooltip text="A small protocol fee deducted when the recipient claims the payment. Covers network gas costs." /> charged on claim</p>

      {/* Submit Button — DARK CTA */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-6 py-4 min-h-[48px] bg-[var(--color-button)] text-[var(--color-bg)] hover:bg-[var(--color-button-hover)] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 btn-press"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-[var(--color-bg)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Creating Invoice Link...</span>
          </>
        ) : (
          <span>Generate Invoice Link</span>
        )}
      </button>
    </form>
  );
}