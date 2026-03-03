'use client';
import { useState } from 'react';
import type { SwapResponse } from '@zkira/swap-types';
import { truncateAddress } from '@/lib/utils';
import { useStatus } from '@/hooks/useStatus';
import { DepositInfo } from './DepositInfo';
import { StatusProgress } from './StatusProgress';

function CopyLinkButton({ requestId }: { requestId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const url = `${window.location.origin}/swap/${requestId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="text-[var(--color-red)] hover:text-[var(--color-red)]/80 transition-colors"
    >
      {copied ? '✓ Copied!' : 'Copy Link'}
    </button>
  );
}

interface StatusTrackerProps {
  swap: SwapResponse;
  fromTokenSymbol: string;
  toTokenSymbol: string;
  isPrivate: boolean;
  onNewSwap: () => void;
}

export function StatusTracker({
  swap,
  fromTokenSymbol,
  toTokenSymbol,
  onNewSwap
}: StatusTrackerProps) {
  const { status } = useStatus(swap.requestId);

  const effectiveStatus = status?.status ?? 'pending';
  const isWaiting = effectiveStatus === 'pending';
  const isFinished = effectiveStatus === 'success';
  const isFailed = effectiveStatus === 'failed';
  const isRefunded = effectiveStatus === 'refunded';

  return (
    <div className="card-base p-6 max-w-md mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">Swap Status</h2>
        <div className="text-[var(--color-text-secondary)] text-sm font-[family-name:var(--font-mono)] flex items-center gap-2 flex-wrap">
          <span>ID: {truncateAddress(swap.requestId)}</span>
          <button
            onClick={() => navigator.clipboard.writeText(swap.requestId)}
            className="text-[var(--color-red)] hover:text-[var(--color-red)]/80 transition-colors"
          >
            Copy ID
          </button>
          <span className="text-[var(--color-muted)]">·</span>
          <CopyLinkButton requestId={swap.requestId} />
        </div>
      </div>

      {isWaiting && swap.depositAddress && (
        <div className="mb-6">
          <DepositInfo
            depositAddress={swap.depositAddress}
            amount={swap.fromAmount}
            tokenSymbol={fromTokenSymbol}
          />
        </div>
      )}

      <div className="mb-6">
        <StatusProgress
          currentStatus={effectiveStatus}
        />
      </div>

      <div className="mb-4">
        <div className="text-[var(--color-text-secondary)] text-sm">
          Amount: {swap.fromAmount} {fromTokenSymbol} → {swap.toAmount} {toTokenSymbol}
        </div>
      </div>

      {isFinished && (
        <div className="text-center">
          <div className="text-[var(--color-green)] font-medium mb-4">
            Swap completed successfully!
          </div>
          <button
            onClick={onNewSwap}
            className="bg-[var(--color-red)] hover:bg-[var(--color-button-hover)] text-white px-4 py-2 font-medium transition-colors"
          >
            New Swap
          </button>
        </div>
      )}

      {isFailed && (
        <div className="text-center">
          <div className="text-[var(--color-red)] font-medium mb-4">
            Swap failed
          </div>
          <button
            onClick={onNewSwap}
            className="bg-[var(--color-red)] hover:bg-[var(--color-button-hover)] text-white px-4 py-2 font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {isRefunded && (
        <div className="text-center">
          <div className="text-[var(--color-warning-text)] font-medium mb-4">
            Swap refunded
          </div>
          <button
            onClick={onNewSwap}
            className="bg-[var(--color-warning-text)] hover:bg-[var(--color-warning-text)]/90 text-black px-4 py-2 font-medium transition-colors"
          >
            New Swap
          </button>
        </div>
      )}
    </div>
  );
}
