'use client';

import { useState } from 'react';
import { useBalance } from './useBalance';
import { useWallet } from './WalletProvider';
import { useNetwork, getUsdcMint } from '@/lib/network-config';
import { PublicKey } from '@solana/web3.js';

interface CreateMultisigEscrowData {
  amount: string;
  tokenMint: string;
  expiry: string;
  requiredApprovals: number;
  approvers: string[];
}

interface CreateMultisigEscrowProps {
  onSubmit: (data: CreateMultisigEscrowData) => void;
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

export function CreateMultisigEscrow({ onSubmit, isLoading, disabled = false }: CreateMultisigEscrowProps) {
  const { connected } = useWallet();
  const { network } = useNetwork();
  const { sol, usdc, loading: balanceLoading } = useBalance();
  const [formData, setFormData] = useState<CreateMultisigEscrowData>({
    amount: '',
    tokenMint: getUsdcMint(network),
    expiry: '7',
    requiredApprovals: 2,
    approvers: ['', ''],
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreateMultisigEscrowData | 'approvers', string>>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const parsedAmount = parseFloat(formData.amount) || 0;
  const claimFee = parsedAmount * 0.003;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Partial<Record<keyof CreateMultisigEscrowData | 'approvers', string>> = {};

    // Validate amount
    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    } else if (usdc !== null && parsedAmount > usdc) {
      newErrors.amount = `Insufficient USDC balance (${usdc.toFixed(2)} available)`;
    }

    // Validate token mint
    if (!formData.tokenMint.trim()) {
      newErrors.tokenMint = 'Token mint is required';
    } else if (formData.tokenMint.length < 32 || formData.tokenMint.length > 44) {
      newErrors.tokenMint = 'Token mint must be a valid base58 address';
    }

    // Validate required approvals
    if (formData.requiredApprovals < 1) {
      newErrors.requiredApprovals = 'At least 1 approval is required';
    } else if (formData.requiredApprovals > formData.approvers.length) {
      newErrors.requiredApprovals = 'Required approvals cannot exceed number of approvers';
    }

    // Validate approvers
    const validApprovers = formData.approvers.filter(addr => addr.trim());
    if (validApprovers.length === 0) {
      newErrors.approvers = 'At least one approver is required';
    } else if (validApprovers.length > 3) {
      newErrors.approvers = 'Maximum 3 approvers allowed';
    } else {
      // Validate each approver address
      for (const approver of validApprovers) {
        try {
          new PublicKey(approver);
        } catch {
          newErrors.approvers = 'All approver addresses must be valid base58 public keys';
          break;
        }
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit({
        ...formData,
        approvers: validApprovers,
      });
    }
  };

  const handleInputChange = (field: keyof CreateMultisigEscrowData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleApproverChange = (index: number, value: string) => {
    const newApprovers = [...formData.approvers];
    newApprovers[index] = value;
    setFormData(prev => ({ ...prev, approvers: newApprovers }));
    if (errors.approvers) {
      setErrors(prev => ({ ...prev, approvers: undefined }));
    }
  };

  const addApprover = () => {
    if (formData.approvers.length < 3) {
      setFormData(prev => ({ ...prev, approvers: [...prev.approvers, ''] }));
    }
  };

  const removeApprover = (index: number) => {
    if (formData.approvers.length > 1) {
      const newApprovers = formData.approvers.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, approvers: newApprovers }));
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
          <span className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] font-medium">Wallet Balance</span>
          <div className="flex items-center gap-4 text-sm">
            {balanceLoading ? (
              <span className="text-[var(--color-section-label)]">Loading...</span>
            ) : (
              <>
                <span className="text-[var(--color-text)] font-medium">{usdc !== null ? usdc.toFixed(2) : '—'} USDC</span>
                <span className="text-[var(--color-muted)]">{sol !== null ? sol.toFixed(4) : '—'} SOL</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Amount Input */}
      <div className="border border-[var(--color-border)] bg-[var(--color-hover)] p-4 md:p-6">
        <label className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] font-medium mb-4 block">Amount</label>
        <div className="flex items-center gap-4">
          <div className="flex items-baseline flex-1">
            <span className="text-[var(--color-muted)] text-3xl md:text-4xl font-light mr-2">$</span>
            <input
              id="amount"
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              className="w-full bg-transparent text-[var(--color-text)] text-3xl md:text-4xl font-semibold focus:outline-none placeholder:text-[#d4d4d4]"
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
        {!errors.amount && <p className="text-[11px] text-[var(--color-section-label)] mt-1.5">Total funds to lock. Released only when enough approvers sign.</p>}
      </div>

      {/* Multi-sig Configuration */}
      <div className="border border-[var(--color-border)] bg-[var(--color-hover)] p-4 md:p-6 space-y-6">
        <div>
          <label className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] font-medium mb-3 block">Required Approvals</label>
          <div className="flex items-center gap-4">
            <input
              type="number"
              min="1"
              max={formData.approvers.length}
              value={formData.requiredApprovals}
              onChange={(e) => handleInputChange('requiredApprovals', parseInt(e.target.value) || 1)}
              className="w-20 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] px-3 py-2 min-h-[44px] focus:border-[var(--color-text)] focus:ring-0 focus:outline-none transition-colors text-center"
              disabled={isLoading || disabled}
            />
            <span className="text-[var(--color-text-secondary)] text-sm">out of {formData.approvers.length} approvers</span>
          </div>
          {errors.requiredApprovals && <p className="text-[var(--color-red)] text-sm mt-2">{errors.requiredApprovals}</p>}
          <p className="text-[11px] text-[var(--color-section-label)] mt-1">Number of approvers needed to authorize fund release.</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] font-medium">Approvers</label>
            {formData.approvers.length < 3 && (
              <button
                type="button"
                onClick={addApprover}
                className="text-xs text-[var(--color-green)] hover:text-[var(--color-green-hover)] transition-colors min-h-[44px] px-2"
                disabled={isLoading || disabled}
              >
                + Add Approver
              </button>
            )}
          </div>
          <div className="space-y-3">
            {formData.approvers.map((approver, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  placeholder="Base58 public key"
                  value={approver}
                  onChange={(e) => handleApproverChange(index, e.target.value)}
                  className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] px-3 py-2 min-h-[44px] focus:border-[var(--color-text)] focus:ring-0 focus:outline-none transition-colors font-[family-name:var(--font-mono)] text-sm"
                  disabled={isLoading || disabled}
                />
                {formData.approvers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeApprover(index)}
                    className="text-[var(--color-red)] hover:text-[var(--color-red-hover)] transition-colors p-1 min-h-[44px] min-w-[44px] shrink-0 flex items-center justify-center"
                    disabled={isLoading || disabled}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[var(--color-section-label)] mt-2">Solana wallet addresses that can approve the release.</p>
          {errors.approvers && <p className="text-[var(--color-red)] text-sm mt-2">{errors.approvers}</p>}
        </div>
      </div>

      {/* Fee Breakdown */}
      {parsedAmount > 0 && (
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">Send amount</span>
            <span className="text-[var(--color-text)] font-medium">${parsedAmount.toFixed(2)} USDC</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">Claim fee (0.3%)</span>
            <span className="text-[var(--color-muted)]">−${claimFee.toFixed(4)} USDC</span>
          </div>
          <div className="border-t border-[var(--color-border)] pt-2 flex justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">Recipient receives</span>
            <span className="text-[var(--color-text)] font-semibold">${(parsedAmount - claimFee).toFixed(4)} USDC</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[var(--color-section-label)]">Network fee</span>
            <span className="text-[var(--color-section-label)]">~0.01 SOL</span>
          </div>
        </div>
      )}

      {/* Expiry */}
      <div>
        <label className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] font-medium mb-3 block">Expires In</label>
        <div className="flex gap-2 flex-wrap">
          {EXPIRY_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleInputChange('expiry', option.value)}
              className={`px-4 py-2.5 min-h-[44px] text-sm font-medium transition-colors flex items-center ${
                formData.expiry === option.value
                  ? 'bg-[var(--color-button)] text-[var(--color-button-text)] border border-[var(--color-button)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-text)] hover:text-[var(--color-text)]'
              }`}
              disabled={isLoading || disabled}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
        <p className="text-[11px] text-[var(--color-section-label)] mt-2">Creator can reclaim funds after expiry if not yet released.</p>

      {/* Advanced Options */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors flex items-center gap-1"
        >
          <svg className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Advanced options
        </button>
        {showAdvanced && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="tokenMint" className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] font-medium">Token Mint</label>
              <button type="button" onClick={setUSDC} className="text-xs text-[var(--color-green)] hover:text-[var(--color-green-hover)] transition-colors btn-press" disabled={isLoading}>
                Reset to USDC
              </button>
            </div>
            <input
              id="tokenMint"
              type="text"
              placeholder="Base58 mint address"
              value={formData.tokenMint}
              onChange={(e) => handleInputChange('tokenMint', e.target.value)}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-3 min-h-[44px] focus:border-[var(--color-text)] focus:ring-0 focus:outline-none transition-colors font-[family-name:var(--font-mono)] text-sm"
              disabled={isLoading || disabled}
            />
          </div>
        )}
      </div>

      {/* Multi-sig Callout */}
      <div className="border border-[var(--color-border)] bg-[var(--color-hover)] p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-[var(--color-green)] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.25-4.5l-.02.02m0 0a17.5 17.5 0 103.15 2.26m-3.13-2.28c.92-.92 2.24-.92 3.16 0l.02.02M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-[var(--color-text)]">Multi-signature security</p>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">Funds can only be released when the required number of approvers have signed off.</p>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || disabled}
        className="w-full px-6 py-4 min-h-[48px] bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 btn-press"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-[var(--color-button-text)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Creating Multi-sig Escrow...</span>
          </>
        ) : (
          <span>Create Multi-sig Escrow</span>
        )}
      </button>
    </form>
  );
}