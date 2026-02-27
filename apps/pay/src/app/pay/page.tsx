'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PayInvoice } from '@/components/PayInvoice';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import Link from 'next/link';

function PayContent() {
  const searchParams = useSearchParams();
  const amount = searchParams.get('amount');
  const to = searchParams.get('to');
  const hash = searchParams.get('hash');
  const expiry = searchParams.get('expiry');

  if (!amount || !to || !hash) {
    return (
      <EmptyState
        title="Missing Invoice Info"
        description="This page requires a valid invoice link with amount, recipient address, and claim hash."
        actionLabel="Back to Dashboard"
        actionHref="/"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        }
      />
    );
  }

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4 md:p-6 animate-entrance">
      <PayInvoice amount={amount} recipientMetaAddress={to} claimHashHex={hash} expiryDays={expiry || '7'} />
    </div>
  );
}

function PayLoading() {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4 md:p-6">
      <div className="space-y-4">
        <div className="h-6 w-48 skeleton-shimmer" />
        <div className="h-12 w-32 skeleton-shimmer" />
        <div className="h-4 w-64 skeleton-shimmer" />
        <div className="h-4 w-40 skeleton-shimmer" />
        <div className="mt-6 h-12 w-full skeleton-shimmer" />
      </div>
    </div>
  );
}

export default function PayPage() {
  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-2xl mx-auto animate-fade-in">
      <PageHeader title="Pay Invoice" description="Complete payment to the invoice requester" />
      <Suspense fallback={<PayLoading />}>
        <PayContent />
      </Suspense>
    </div>
  );
}
