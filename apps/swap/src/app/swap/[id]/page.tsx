'use client';

import { use, useState, useEffect } from 'react';
import { StatusTracker } from '@/components/status/StatusTracker';
import { getStatus } from '@/lib/api';
import type { SwapResponse, StatusResponse } from '@zkira/swap-types';

interface SwapPageProps {
  params: Promise<{ id: string }>;
}

export default function SwapDetailPage({ params }: SwapPageProps) {
  const { id } = use(params);
  const [swap, setSwap] = useState<SwapResponse | null>(null);
  const [statusData, setStatusData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);
        const status: StatusResponse = await getStatus(id);
        setStatusData(status);

        setSwap({
          requestId: status.requestId || id,
          depositAddress: '', // Not available from status endpoint
          status: status.status,
          fromAmount: status.fromAmount,
          toAmount: status.toAmount,
        });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load swap');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-zkira-green mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-zkira-text-secondary text-sm">Loading swap details...</p>
        </div>
      </div>
    );
  }

  if (error || !swap) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="bg-zkira-card rounded-xl border border-zkira-border p-8 max-w-md w-full text-center">
          <div className="text-zkira-red text-4xl mb-4">⚠</div>
          <h1 className="text-xl font-semibold mb-2 text-white">Swap Not Found</h1>
          <p className="text-zkira-text-secondary text-sm mb-6">
            {error || 'Unable to load swap details. The swap ID may be invalid or expired.'}
          </p>
          <a
            href="/"
            className="inline-block bg-zkira-green hover:bg-zkira-green/90 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            New Swap
          </a>
        </div>
      </div>
    );
  }

  const handleNewSwap = () => {
    window.location.href = '/';
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4 pt-12 md:pt-16">
      <StatusTracker
        swap={swap}
        fromTokenSymbol={statusData?.fromToken || ''}
        toTokenSymbol={statusData?.toToken || ''}
        isPrivate={false}
        onNewSwap={handleNewSwap}
      />
    </div>
  );
}
