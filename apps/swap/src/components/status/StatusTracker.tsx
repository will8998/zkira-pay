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
      className="text-zkira-green hover:text-zkira-green/80 transition-colors"
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
    <div className="bg-zkira-card rounded-xl border border-zkira-border p-6 max-w-md mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-zkira-text mb-2">Swap Status</h2>
        <div className="text-zkira-text-secondary text-sm font-mono flex items-center gap-2 flex-wrap">
          <span>ID: {truncateAddress(swap.requestId)}</span>
          <button
            onClick={() => navigator.clipboard.writeText(swap.requestId)}
            className="text-zkira-blue hover:text-zkira-blue/80 transition-colors"
          >
            Copy ID
          </button>
          <span className="text-zkira-text-muted">·</span>
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
        <div className="text-zkira-text-secondary text-sm">
          Amount: {swap.fromAmount} {fromTokenSymbol} → {swap.toAmount} {toTokenSymbol}
        </div>
      </div>

      {isFinished && (
        <div className="text-center">
          <div className="text-zkira-green font-medium mb-4">
            Swap completed successfully!
          </div>
          <button
            onClick={onNewSwap}
            className="bg-zkira-green hover:bg-zkira-green/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            New Swap
          </button>
        </div>
      )}

      {isFailed && (
        <div className="text-center">
          <div className="text-zkira-red font-medium mb-4">
            Swap failed
          </div>
          <button
            onClick={onNewSwap}
            className="bg-zkira-red hover:bg-zkira-red/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {isRefunded && (
        <div className="text-center">
          <div className="text-zkira-yellow font-medium mb-4">
            Swap refunded
          </div>
          <button
            onClick={onNewSwap}
            className="bg-zkira-yellow hover:bg-zkira-yellow/90 text-black px-4 py-2 rounded-lg font-medium transition-colors"
          >
            New Swap
          </button>
        </div>
      )}
    </div>
  );
}
