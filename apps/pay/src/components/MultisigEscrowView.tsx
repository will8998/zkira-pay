'use client';

import { useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { toast } from 'sonner';

interface MultisigEscrow {
  address: PublicKey;
  creator: PublicKey;
  tokenMint: PublicKey;
  amount: bigint;
  recipientSpendPubkey: Uint8Array;
  recipientViewPubkey: Uint8Array;
  stealthAddress: Uint8Array;
  expiry: number;
  approverCount: number;
  requiredApprovals: number;
  currentApprovals: number;
  approvers: PublicKey[];
  approvalBitmap: number;
  released: boolean;
  refunded: boolean;
  nonce: bigint;
  feeBps: number;
  createdAt: number;
}

interface MultisigEscrowViewProps {
  escrow: MultisigEscrow;
  currentUser: PublicKey | null;
  onApprove: (escrowAddress: PublicKey) => Promise<void>;
  onExecute: (escrowAddress: PublicKey) => Promise<void>;
  onRefund: (escrowAddress: PublicKey) => Promise<void>;
}

export function MultisigEscrowView({ 
  escrow, 
  currentUser, 
  onApprove, 
  onExecute, 
  onRefund 
}: MultisigEscrowViewProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);

  const amount = Number(escrow.amount) / 1_000_000; // Convert from lamports to USDC
  const isExpired = Date.now() / 1000 > escrow.expiry;
  const isCreator = currentUser?.equals(escrow.creator) ?? false;
  const isApprover = currentUser ? escrow.approvers.some(approver => approver.equals(currentUser)) : false;
  const approverIndex = currentUser ? escrow.approvers.findIndex(approver => approver.equals(currentUser)) : -1;
  const hasApproved = approverIndex >= 0 && (escrow.approvalBitmap & (1 << approverIndex)) !== 0;
  const canExecute = escrow.currentApprovals >= escrow.requiredApprovals && !escrow.released && !escrow.refunded && !isExpired;
  const canRefund = isCreator && isExpired && !escrow.released && !escrow.refunded;
  const canApprove = isApprover && !hasApproved && !escrow.released && !escrow.refunded && !isExpired;

  const handleApprove = async () => {
    if (!canApprove) return;
    
    setIsApproving(true);
    try {
      await onApprove(escrow.address);
    } finally {
      setIsApproving(false);
    }
  };

  const handleExecute = async () => {
    if (!canExecute) return;
    
    setIsExecuting(true);
    try {
      // Stealth claiming doesn't need a secret - claimer signs with stealth key
      await onExecute(escrow.address);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleRefund = async () => {
    if (!canRefund) return;
    
    setIsRefunding(true);
    try {
      await onRefund(escrow.address);
    } finally {
      setIsRefunding(false);
    }
  };

  const getStatusBadge = () => {
    if (escrow.released) {
      return <span className="px-2 py-1 text-xs font-medium bg-[var(--color-green)] text-[var(--color-bg)] rounded-full">Released</span>;
    }
    if (escrow.refunded) {
      return <span className="px-2 py-1 text-xs font-medium bg-[var(--color-text-muted)] text-[var(--color-bg)] rounded-full">Refunded</span>;
    }
    if (isExpired) {
      return <span className="px-2 py-1 text-xs font-medium bg-[var(--color-red)] text-[var(--color-bg)] rounded-full">Expired</span>;
    }
    if (canExecute) {
      return <span className="px-2 py-1 text-xs font-medium bg-[var(--color-green)] text-[var(--color-bg)] rounded-full">Ready to Execute</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium bg-[var(--color-warning)] text-[var(--color-bg)] rounded-full">Pending Approvals</span>;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAddress = (address: PublicKey) => {
    const str = address.toString();
    return `${str.slice(0, 4)}...${str.slice(-4)}`;
  };

  return (
    <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-6 space-y-6 animate-entrance">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-0">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-[var(--color-text)]">
              ${amount.toFixed(2)} USDC
            </h3>
            {getStatusBadge()}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-[var(--color-text-muted)]">
              Escrow: {formatAddress(escrow.address)}
            </p>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(escrow.address.toString());
                  toast.success('Address copied');
                } catch (err) {
                  console.error('Failed to copy:', err);
                }
              }}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-button)] transition-colors inline-flex shrink-0"
              title="Copy address"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            </button>
          </div>
        </div>
        <div className="text-left md:text-right text-sm text-[var(--color-text-muted)]">
          <p>Created: {formatDate(escrow.createdAt)}</p>
          <p>Expires: {formatDate(escrow.expiry)}</p>
        </div>
      </div>

      {/* Approval Progress */}
      <div className="border border-[var(--color-border)] bg-[var(--color-hover)] p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
          <span className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-text-muted)] font-medium">
            Approval Progress
          </span>
          <span className="text-sm font-medium text-[var(--color-text)]">
            {escrow.currentApprovals} of {escrow.requiredApprovals} required
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-[var(--color-border)] h-2 mb-4">
          <div 
            className="bg-[var(--color-green)] h-2 transition-all duration-300"
            style={{ width: `${(escrow.currentApprovals / escrow.requiredApprovals) * 100}%` }}
          />
        </div>

        {/* Approvers List */}
        <div className="space-y-2">
          {escrow.approvers.map((approver, index) => {
            const hasApprovedBit = (escrow.approvalBitmap & (1 << index)) !== 0;
            const isCurrentUser = currentUser?.equals(approver) ?? false;
            
            return (
              <div key={approver.toString()} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-3 sm:p-2 border border-[var(--color-border)] sm:border-none bg-[var(--color-surface)] sm:bg-transparent text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${hasApprovedBit ? 'bg-[var(--color-green)]' : 'bg-[var(--color-border)]'}`} />
                  <span className={`font-[family-name:var(--font-mono)] text-xs sm:text-sm break-all sm:break-normal ${isCurrentUser ? 'font-medium text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`}>
                    {isCurrentUser ? `${formatAddress(approver)} (You)` : approver.toString()}
                  </span>
                </div>
                <span className={`text-xs self-start sm:self-auto ${hasApprovedBit ? 'text-[var(--color-green)] font-medium' : 'text-[var(--color-text-secondary)]'}`}>
                  {hasApprovedBit ? 'Approved' : 'Pending'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
        {/* Approve Button */}
        {canApprove && (
          <button
            onClick={handleApprove}
            disabled={isApproving}
            className="w-full sm:w-auto min-h-[48px] px-4 py-2 bg-[var(--color-green)] text-[var(--color-bg)] hover:bg-[var(--color-green-hover)] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 btn-press"
          >
            {isApproving ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Approving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Approve Release
              </>
            )}
          </button>
        )}

        {/* Execute Button */}
        {canExecute && (
          <button
            onClick={handleExecute}
            disabled={isExecuting}
            className="w-full sm:w-auto min-h-[48px] px-4 py-2 bg-[var(--color-button)] text-[var(--color-bg)] hover:bg-[var(--color-button-hover)] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 btn-press"
          >
            {isExecuting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Executing...
              </>
            ) : (
              'Execute Release'
            )}
          </button>
        )}

        {/* Refund Button */}
        {canRefund && (
          <button
            onClick={handleRefund}
            disabled={isRefunding}
            className="w-full sm:w-auto min-h-[48px] px-4 py-2 bg-[var(--color-red)] text-[var(--color-bg)] hover:bg-[var(--color-red-hover)] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 btn-press"
          >
            {isRefunding ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refunding...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Refund
              </>
            )}
          </button>
        )}
      </div>

      {/* Info */}
      <div className="border-t border-[var(--color-border)] pt-4 text-xs text-[var(--color-text-muted)] space-y-1">
        <p className="break-all">Creator: {formatAddress(escrow.creator)} {isCreator && '(You)'}</p>
        <p className="break-all">Token: {formatAddress(escrow.tokenMint)}</p>
        <p>Fee: {escrow.feeBps / 100}%</p>
      </div>
    </div>
  );
}