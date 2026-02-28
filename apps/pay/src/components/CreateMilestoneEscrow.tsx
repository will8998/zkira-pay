'use client';

import { useState } from 'react';
import { useBalance } from './useBalance';
import { useWallet } from './WalletProvider';
import { useNetwork, getUsdcMint } from '@/lib/network-config';

interface MilestoneData {
  description: string;
  amount: string;
}

interface CreateMilestoneEscrowData {
  totalAmount: string;
  tokenMint: string;
  expiry: string;
  milestones: MilestoneData[];
}

interface CreateMilestoneEscrowFormProps {
  onSubmit: (data: CreateMilestoneEscrowData) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const EXPIRY_OPTIONS = [
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
  { value: '60', label: '60 days' },
  { value: '90', label: '90 days' },
];

export function CreateMilestoneEscrow({ onSubmit, isLoading, disabled = false }: CreateMilestoneEscrowFormProps) {
  const { connected } = useWallet();
  const { network } = useNetwork();
  const { sol, usdc, loading: balanceLoading } = useBalance();
  const [formData, setFormData] = useState<CreateMilestoneEscrowData>({
    totalAmount: '',
    tokenMint: getUsdcMint(network),
    expiry: '30',
    milestones: [
      { description: 'Initial milestone', amount: '' },
      { description: 'Final milestone', amount: '' },
    ],
  });
  const [errors, setErrors] = useState<{
    totalAmount?: string;
    tokenMint?: string;
    expiry?: string;
    milestones?: string[];
    general?: string;
  }>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const parsedTotalAmount = parseFloat(formData.totalAmount) || 0;
  const milestoneSum = formData.milestones.reduce((sum, milestone) => sum + (parseFloat(milestone.amount) || 0), 0);
  const claimFee = parsedTotalAmount * 0.003; // 0.3% fee for milestone escrow

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: typeof errors = { milestones: [] };

    // Validate total amount
    if (!formData.totalAmount.trim()) {
      newErrors.totalAmount = 'Total amount is required';
    } else if (isNaN(Number(formData.totalAmount)) || Number(formData.totalAmount) <= 0) {
      newErrors.totalAmount = 'Total amount must be a positive number';
    } else if (usdc !== null && parsedTotalAmount > usdc) {
      newErrors.totalAmount = `Insufficient USDC balance (${usdc.toFixed(2)} available)`;
    }

    // Validate token mint
    if (!formData.tokenMint.trim()) {
      newErrors.tokenMint = 'Token mint is required';
    } else if (formData.tokenMint.length < 32 || formData.tokenMint.length > 44) {
      newErrors.tokenMint = 'Token mint must be a valid base58 address';
    }

    // Validate milestones
    const milestoneErrors: string[] = [];
    formData.milestones.forEach((milestone, index) => {
      if (!milestone.description.trim()) {
        milestoneErrors[index] = 'Description is required';
      } else if (!milestone.amount.trim()) {
        milestoneErrors[index] = 'Amount is required';
      } else if (isNaN(Number(milestone.amount)) || Number(milestone.amount) <= 0) {
        milestoneErrors[index] = 'Amount must be a positive number';
      }
    });

    if (milestoneErrors.length > 0) {
      newErrors.milestones = milestoneErrors;
    }

    // Validate milestone sum equals total
    if (parsedTotalAmount > 0 && Math.abs(milestoneSum - parsedTotalAmount) > 0.01) {
      newErrors.general = `Milestone amounts (${milestoneSum.toFixed(2)}) must equal total amount (${parsedTotalAmount.toFixed(2)})`;
    }

    // Validate milestone count
    if (formData.milestones.length < 2) {
      newErrors.general = 'At least 2 milestones are required';
    } else if (formData.milestones.length > 10) {
      newErrors.general = 'Maximum 10 milestones allowed';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0 || (Object.keys(newErrors).length === 1 && newErrors.milestones?.length === 0)) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof Omit<CreateMilestoneEscrowData, 'milestones'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleMilestoneChange = (index: number, field: keyof MilestoneData, value: string) => {
    const newMilestones = [...formData.milestones];
    newMilestones[index] = { ...newMilestones[index], [field]: value };
    setFormData(prev => ({ ...prev, milestones: newMilestones }));
    
    // Clear milestone-specific errors
    if (errors.milestones?.[index]) {
      const newMilestoneErrors = [...(errors.milestones || [])];
      newMilestoneErrors[index] = '';
      setErrors(prev => ({ ...prev, milestones: newMilestoneErrors }));
    }
  };

  const addMilestone = () => {
    if (formData.milestones.length < 10) {
      setFormData(prev => ({
        ...prev,
        milestones: [...prev.milestones, { description: '', amount: '' }]
      }));
    }
  };

  const removeMilestone = (index: number) => {
    if (formData.milestones.length > 2) {
      const newMilestones = formData.milestones.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, milestones: newMilestones }));
    }
  };

  const setUSDC = () => {
    handleInputChange('tokenMint', getUsdcMint(network));
  };

  const distributeEvenly = () => {
    if (parsedTotalAmount > 0 && formData.milestones.length > 0) {
      const amountPerMilestone = (parsedTotalAmount / formData.milestones.length).toFixed(2);
      const newMilestones = formData.milestones.map(milestone => ({
        ...milestone,
        amount: amountPerMilestone
      }));
      setFormData(prev => ({ ...prev, milestones: newMilestones }));
    }
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
                <span className="text-[var(--color-text)] font-medium tabular-nums">{usdc !== null ? usdc.toFixed(2) : '—'} USDC</span>
                <span className="text-[var(--color-muted)] tabular-nums">{sol !== null ? sol.toFixed(4) : '—'} SOL</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Total Amount Input — HERO ELEMENT */}
      <div className="border border-[var(--color-border)] bg-[var(--color-hover)] p-4 md:p-6">
        <label className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] font-medium mb-4 block">Total Escrow Amount</label>
        <div className="flex items-center gap-4">
          <div className="flex items-baseline flex-1">
            <span className="text-[var(--color-muted)] text-3xl md:text-4xl font-light mr-2">$</span>
            <input
              id="totalAmount"
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              step="0.01"
              value={formData.totalAmount}
              onChange={(e) => handleInputChange('totalAmount', e.target.value)}
              className="w-full bg-transparent text-[var(--color-text)] text-3xl md:text-4xl font-semibold focus:outline-none placeholder:text-[#d4d4d4] tabular-nums input-focus"
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
        {errors.totalAmount && <p className="text-[var(--color-red)] text-sm mt-2">{errors.totalAmount}</p>}
        {!errors.totalAmount && <p className="text-[11px] text-[var(--color-section-label)] mt-1.5">Total funds to lock in the escrow. Split across milestones below.</p>}
      </div>

      {/* Milestones Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] font-medium">Milestones ({formData.milestones.length}/10)</label>
          <div className="flex gap-2">
            {parsedTotalAmount > 0 && (
              <button
                type="button"
                onClick={distributeEvenly}
                className="min-h-[44px] px-3 text-xs text-[var(--color-green)] hover:text-[var(--color-green-hover)] transition-colors btn-press"
                disabled={isLoading || disabled}
              >
                Distribute evenly
              </button>
            )}
            <button
              type="button"
              onClick={addMilestone}
              className="min-h-[44px] px-3 text-xs text-[var(--color-green)] hover:text-[var(--color-green-hover)] transition-colors disabled:opacity-50 btn-press"
              disabled={isLoading || disabled || formData.milestones.length >= 10}
            >
              + Add milestone
            </button>
          </div>
        </div>

        {formData.milestones.map((milestone, index) => (
          <div key={index} className="border border-[var(--color-border)] bg-[var(--color-surface)] p-3 md:p-4 space-y-3 animate-entrance">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--color-text)]">Milestone {index + 1}</span>
              {formData.milestones.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeMilestone(index)}
                  className="min-h-[44px] px-3 text-xs text-[var(--color-red)] hover:text-[var(--color-red-hover)] transition-colors btn-press"
                  disabled={isLoading || disabled}
                >
                  Remove
                </button>
              )}
            </div>
            
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Milestone description"
                value={milestone.description}
                onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] px-3 py-2 min-h-[44px] focus:border-[var(--color-text)] focus:ring-0 focus:outline-none transition-colors text-sm input-focus"
                disabled={isLoading || disabled}
              />
              <p className="text-[11px] text-[var(--color-section-label)] mt-1">Describe the deliverable for this milestone.</p>
              
              <div className="flex items-center gap-2">
                <span className="text-[var(--color-muted)] text-sm">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  step="0.01"
                  value={milestone.amount}
                  onChange={(e) => handleMilestoneChange(index, 'amount', e.target.value)}
                  className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] px-3 py-2 min-h-[44px] focus:border-[var(--color-text)] focus:ring-0 focus:outline-none transition-colors text-sm tabular-nums input-focus"
                  disabled={isLoading || disabled}
                />
                <span className="text-sm text-[var(--color-muted)]">USDC</span>
              <p className="text-[11px] text-[var(--color-section-label)] mt-1">Amount released when this milestone is approved.</p>
              </div>
            </div>
            
            {errors.milestones?.[index] && (
              <p className="text-[var(--color-red)] text-sm">{errors.milestones[index]}</p>
            )}
          </div>
        ))}

        {/* Milestone Sum Validation */}
        {parsedTotalAmount > 0 && milestoneSum > 0 && (
          <div className="border border-[var(--color-border)] bg-[var(--color-hover)] p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Milestone total:</span>
              <span className={`font-medium tabular-nums ${Math.abs(milestoneSum - parsedTotalAmount) > 0.01 ? 'text-[var(--color-red)]' : 'text-[var(--color-green)]'}`}>
                ${milestoneSum.toFixed(2)} USDC
              </span>
            </div>
            {Math.abs(milestoneSum - parsedTotalAmount) > 0.01 && (
              <p className="text-[var(--color-red)] text-xs mt-1">
                Difference: ${Math.abs(milestoneSum - parsedTotalAmount).toFixed(2)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Fee Breakdown */}
      {parsedTotalAmount > 0 && (
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">Escrow amount</span>
            <span className="text-[var(--color-text)] font-medium tabular-nums">${parsedTotalAmount.toFixed(2)} USDC</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">Release fee (0.3% per milestone)</span>
            <span className="text-[var(--color-muted)] tabular-nums">~${claimFee.toFixed(4)} USDC total</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[var(--color-section-label)]">Network fee</span>
            <span className="text-[var(--color-section-label)] tabular-nums">~0.01 SOL</span>
          </div>
        </div>
      )}

      {/* Expiry — Pill Selector Row */}
      <div>
        <label className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] font-medium mb-3 block">Expires In</label>
        <div className="flex gap-2 flex-wrap">
          {EXPIRY_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleInputChange('expiry', option.value)}
              className={`min-h-[44px] py-2.5 px-4 text-sm font-medium transition-colors ${
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
        <p className="text-[11px] text-[var(--color-section-label)] mt-2">Unreleased funds can be reclaimed after this date.</p>

      {/* Advanced Options (Token Mint — hidden by default) */}
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
                Use USDC
              </button>
            </div>
            <input
              id="tokenMint"
              type="text"
              placeholder="Base58 mint address"
              value={formData.tokenMint}
              onChange={(e) => handleInputChange('tokenMint', e.target.value)}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-3 min-h-[44px] focus:border-[var(--color-text)] focus:ring-0 focus:outline-none transition-colors font-[family-name:var(--font-mono)] text-sm input-focus"
              disabled={isLoading || disabled}
            />
            {errors.tokenMint && <p className="text-[var(--color-red)] text-sm mt-1">{errors.tokenMint}</p>}
          </div>
        )}
      </div>

      {/* General Error */}
      {errors.general && (
        <div className="border-l-2 border-[var(--color-red)] bg-[var(--color-error-bg)] px-4 py-3">
          <p className="text-[var(--color-red)] text-sm">{errors.general}</p>
        </div>
      )}

      {/* Milestone Escrow Info */}
      <div className="border border-[var(--color-border)] bg-[var(--color-hover)] p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-[var(--color-green)] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-[var(--color-text)]">Milestone-based release</p>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">You can release funds to the recipient milestone by milestone. Unreleased funds can be refunded after expiry.</p>
        </div>
      </div>

      {/* Submit Button — DARK CTA */}
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
            <span>Creating Milestone Escrow...</span>
          </>
        ) : (
          <span>Create Milestone Escrow</span>
        )}
      </button>
    </form>
  );
}