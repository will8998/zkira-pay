'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const ClaimWithCode = dynamic(
  () => import('@/components/ClaimWithCode').then((m) => ({ default: m.ClaimWithCode })),
  {
    ssr: false,
    loading: () => (
      <div className="px-4 md:px-6 py-6 md:py-10 space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-[var(--color-surface)] rounded" />
        <div className="h-4 w-72 bg-[var(--color-surface)] rounded" />
        <div className="h-48 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg" />
      </div>
    ),
  }
);

function ClaimContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') ?? undefined;

  return (
    <div className="px-4 md:px-6 py-6 md:py-10">
      <ClaimWithCode initialCode={code} />
    </div>
  );
}

export default function ClaimPage() {
  return (
    <Suspense fallback={<div className="px-4 py-10 text-center text-[var(--color-text-secondary)]">Loading...</div>}>
      <ClaimContent />
    </Suspense>
  );
}
