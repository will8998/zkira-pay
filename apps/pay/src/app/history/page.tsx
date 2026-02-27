'use client';

import { PaymentHistory } from '@/components/PaymentHistory';
import { PageHeader } from '@/components/PageHeader';

export default function HistoryPage() {
  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-6xl mx-auto animate-fade-in">
      <PageHeader title="Payment History" description="View all your payment activity" />
      <PaymentHistory />
    </div>
  );
}
