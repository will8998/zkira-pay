'use client';

import { useState } from 'react';
import { useWallet } from './WalletProvider';

interface MilestoneEscrowData {
  id: string;
  creator: string;
  totalAmount: number;
  releasedAmount: number;
  tokenSymbol: string;
  expiry: Date;
  milestoneCount: number;
  milestonesReleased: number;
  milestones: {
    description: string;
    amount: number;
    released: boolean;
  }[];
  refunded: boolean;
  createdAt: Date;
}

interface MilestoneEscrowViewProps {
  escrows: MilestoneEscrowData[];
  onReleaseMilestone: (escrowId: string, milestoneIndex: number) => Promise<void>;
  onRefundUnreleased: (escrowId: string) => Promise<void>;
  isLoading?: boolean;
}

export function MilestoneEscrowView({ 
  escrows, 
  onReleaseMilestone, 
  onRefundUnreleased, 
  isLoading = false 
}: MilestoneEscrowViewProps) {
  const { publicKey } = useWallet();
  const [loadingActions, setLoadingActions] = useState<{ [key: string]: boolean }>({});

  const handleReleaseMilestone = async (escrowId: string, milestoneIndex: number) => {
    const actionKey = `${escrowId}-${milestoneIndex}`;
    setLoadingActions(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      await onReleaseMilestone(escrowId, milestoneIndex);
    } finally {
      setLoadingActions(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleRefundUnreleased = async (escrowId: string) => {
    const actionKey = `refund-${escrowId}`;
    setLoadingActions(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      await onRefundUnreleased(escrowId);
    } finally {
      setLoadingActions(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const isCreator = (escrow: MilestoneEscrowData) => {
    return publicKey?.toString() === escrow.creator;
  };

  const isExpired = (escrow: MilestoneEscrowData) => {
    return new Date() > escrow.expiry;
  };

  const canRefund = (escrow: MilestoneEscrowData) => {
    return isCreator(escrow) && isExpired(escrow) && !escrow.refunded && escrow.releasedAmount < escrow.totalAmount;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6 animate-pulse">
            <div className="h-4 bg-[var(--color-skeleton)] rounded w-1/3 mb-4"></div>
            <div className="h-3 bg-[var(--color-skeleton)] rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-[var(--color-skeleton)] rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (escrows.length === 0) {
    return (
      <div className="border border-[var(--color-border)] bg-[var(--color-hover)] p-8 text-center">
        <svg className="w-12 h-12 text-[var(--color-text-secondary)] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-lg font-medium text-[var(--color-text)] mb-2">No milestone escrows found</h3>
        <p className="text-[var(--color-text-muted)] text-sm mb-4">Create your first milestone escrow to get started</p>
        <a
          href="/escrow/create"
          className="inline-flex items-center px-4 py-2 bg-[var(--color-button)] text-[var(--color-bg)] text-sm font-medium hover:bg-[var(--color-button-hover)] transition-colors"
        >
          Create Milestone Escrow
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {escrows.map((escrow) => (
        <div key={escrow.id} className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-6 space-y-4 animate-entrance">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text)] mb-1">
                Milestone Escrow
              </h3>
              <p className="text-sm text-[var(--color-text-muted)]">
                Created {formatDate(escrow.createdAt)}
              </p>
            </div>
            <div className="text-left md:text-right">
              <div className="text-2xl font-semibold text-[var(--color-text)]">
                ${escrow.totalAmount.toFixed(2)} {escrow.tokenSymbol}
              </div>
              <div className="text-sm text-[var(--color-text-muted)]">
                ${escrow.releasedAmount.toFixed(2)} released
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Progress</span>
              <span className="text-[var(--color-text)] font-medium">
                {escrow.milestonesReleased} of {escrow.milestoneCount} milestones
              </span>
            </div>
            <div className="w-full bg-[var(--color-skeleton)] h-2">
              <div
                className="bg-[var(--color-green)] h-2 transition-all duration-300"
                style={{ width: `${(escrow.milestonesReleased / escrow.milestoneCount) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                escrow.refunded ? 'bg-[var(--color-red)]' :
                isExpired(escrow) ? 'bg-[var(--color-warning)]' :
                'bg-[var(--color-green)]'
              }`}></div>
              <span className="text-[var(--color-text-secondary)]">
                {escrow.refunded ? 'Refunded' : 
                 isExpired(escrow) ? 'Expired' : 
                 'Active'}
              </span>
            </div>
            <div className="text-[var(--color-text-muted)]">
              Expires {formatDate(escrow.expiry)}
            </div>
            {isCreator(escrow) && (
              <div className="text-[var(--color-green)] text-xs font-medium">
                You created this escrow
              </div>
            )}
          </div>

          {/* Milestones */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-[var(--color-text)]">Milestones</h4>
            {escrow.milestones.map((milestone, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 md:p-3 border border-[var(--color-border)] bg-[var(--color-hover)] gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    milestone.released 
                      ? 'bg-[var(--color-green)] text-[var(--color-bg)]'
                      : 'bg-[var(--color-skeleton)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                  }`}>
                    {milestone.released ? '✓' : index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[var(--color-text)] truncate">
                      {milestone.description}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      ${milestone.amount.toFixed(2)} {escrow.tokenSymbol}
                    </div>
                  </div>
                </div>
                
                {isCreator(escrow) && !milestone.released && !escrow.refunded && !isExpired(escrow) && (
                  <button
                    onClick={() => handleReleaseMilestone(escrow.id, index)}
                    disabled={loadingActions[`${escrow.id}-${index}`]}
                    className="w-full sm:w-auto min-h-[48px] px-3 py-1.5 bg-[var(--color-green)] text-[var(--color-bg)] text-xs font-medium hover:bg-[var(--color-green-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 btn-press"
                  >
                    {loadingActions[`${escrow.id}-${index}`] ? (
                      <>
                        <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Releasing...
                      </>
                    ) : (
                      'Release'
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          {isCreator(escrow) && canRefund(escrow) && (
            <div className="pt-4 border-t border-[var(--color-border)]">
              <button
                onClick={() => handleRefundUnreleased(escrow.id)}
                disabled={loadingActions[`refund-${escrow.id}`]}
                className="w-full md:w-auto min-h-[48px] px-4 py-2 bg-[var(--color-red)] text-[var(--color-bg)] text-sm font-medium hover:bg-[var(--color-red-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 btn-press"
              >
                {loadingActions[`refund-${escrow.id}`] ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
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
                    Refund Unreleased Funds
                  </>
                )}
              </button>
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                Refund ${(escrow.totalAmount - escrow.releasedAmount).toFixed(2)} {escrow.tokenSymbol} of unreleased funds
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}