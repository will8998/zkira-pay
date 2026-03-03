'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import type { SwapStatusValue } from '@zkira/swap-types';
import { useStatus } from '@/hooks/useStatus';
import { StatusProgress } from '@/components/status/StatusProgress';
import { StatusBadge } from '@/components/status/StatusBadge';
import { STATUS_LABELS } from '@/lib/constants';
import { truncateAddress } from '@/lib/utils';

function TrackContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { status, loading, error } = useStatus(id);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (id) {
      navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!id) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-zkira-card rounded-xl border border-zkira-border p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-semibold mb-2">Track Your Swap</h1>
          <p className="text-zkira-text-secondary text-sm">
            Add your swap ID as a URL parameter: /track?id=YOUR_SWAP_ID
          </p>
        </div>
      </div>
    );
  }

  if (loading && !status) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-zkira-card rounded-xl border border-zkira-border p-8 max-w-md w-full">
          <div className="skeleton h-6 w-48 rounded mb-4" />
          <div className="skeleton h-4 w-full rounded mb-2" />
          <div className="skeleton h-4 w-3/4 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-zkira-card rounded-xl border border-zkira-border p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-semibold mb-2 text-zkira-red">Error</h1>
          <p className="text-zkira-text-secondary text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!status) return null;

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="bg-zkira-card rounded-xl border border-zkira-border p-6 max-w-md w-full animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold">Swap Status</h1>
          <StatusBadge status={status.status} />
        </div>

        <div className="flex items-center gap-2 mb-4 text-sm">
          <span className="text-zkira-text-secondary">ID:</span>
          <span className="font-mono text-xs">{truncateAddress(id, 8, 6)}</span>
          <button
            onClick={handleCopy}
            className="text-zkira-text-muted hover:text-white transition-colors text-xs"
          >
            {copied ? '✓' : 'Copy'}
          </button>
        </div>

        <div className="mb-6">
          <StatusProgress
            currentStatus={status.status}
          />
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-zkira-text-secondary">Status</span>
            <span>{STATUS_LABELS[status.status as SwapStatusValue] || 'Unknown'}</span>
          </div>
          {status.fromToken && status.toToken && (
            <div className="flex justify-between">
              <span className="text-zkira-text-secondary">Swap</span>
              <span>{status.fromAmount} {status.fromToken} → {status.toAmount} {status.toToken}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TrackPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-zkira-card rounded-xl border border-zkira-border p-8 max-w-md w-full">
          <div className="skeleton h-6 w-48 rounded mb-4" />
          <div className="skeleton h-4 w-full rounded mb-2" />
        </div>
      </div>
    }>
      <TrackContent />
    </Suspense>
  );
}
