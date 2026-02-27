'use client';

import { BatchPaymentForm } from '@/components/BatchPaymentForm';
import { PageHeader } from '@/components/PageHeader';

export default function BatchPage() {
  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-5xl mx-auto animate-fade-in">
      <PageHeader title="Batch Payments" description="Send multiple confidential payments at once" />
      <a href="/developers/docs" className="text-[11px] text-[var(--color-green)] hover:text-[var(--color-green-hover)] -mt-4 mb-4 inline-block transition-colors">Learn more about batch payments →</a>
      <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4 md:p-6 animate-entrance">
        <BatchPaymentForm />
      </div>
    </div>
  );
}
