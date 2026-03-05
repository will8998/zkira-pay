'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const PayInvoiceFlow = dynamic(
  () => import('@/components/PayInvoiceFlow').then((m) => ({ default: m.PayInvoiceFlow })),
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

function PayContent() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('invoice');

  if (!invoiceId) {
    return (
      <div className="px-4 md:px-6 py-10 text-center">
        <div className="text-6xl mb-4">❌</div>
        <h1
          className="text-2xl font-bold text-[var(--color-text)] mb-2"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Missing Invoice ID
        </h1>
        <p className="text-[var(--color-text-secondary)]">
          This page requires an invoice parameter. Use the link provided by the requester.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 py-6 md:py-10">
      <PayInvoiceFlow invoiceId={invoiceId} />
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={<div className="px-4 py-10 text-center text-[var(--color-text-secondary)]">Loading...</div>}>
      <PayContent />
    </Suspense>
  );
}
