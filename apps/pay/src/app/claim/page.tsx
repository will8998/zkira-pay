'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ClaimWithCode } from '@/components/ClaimWithCode';

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
