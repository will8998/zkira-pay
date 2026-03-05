'use client';

import dynamic from 'next/dynamic';

const RequestPaymentWizard = dynamic(
  () => import('@/components/RequestPaymentWizard').then((m) => ({ default: m.RequestPaymentWizard })),
  {
    ssr: false,
    loading: () => (
      <div className="px-4 md:px-6 py-6 md:py-10 space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-[var(--color-surface)] rounded" />
        <div className="h-4 w-72 bg-[var(--color-surface)] rounded" />
        <div className="h-64 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg" />
      </div>
    ),
  }
);

export default function RequestPage() {
  return (
    <div className="px-4 md:px-6 py-6 md:py-10">
      <RequestPaymentWizard />
    </div>
  );
}
