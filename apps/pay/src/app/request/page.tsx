'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { RequestPaymentForm } from '@/components/RequestPaymentForm';
import { toast } from 'sonner';
import { PaymentSuccess } from '@/components/PaymentSuccess';
import { PageHeader } from '@/components/PageHeader';

export default function RequestPage() {
  const t = useTranslations('requestPage');
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>('');

  if (invoiceUrl) {
    return (
      <div className="px-4 py-4 md:px-6 md:py-6 max-w-2xl mx-auto animate-fade-in">
        <PageHeader title={t('title')} description={t('successDescription')} />
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4 md:p-6">
          <PaymentSuccess type="invoice_created" invoiceUrl={invoiceUrl} amount={amount} />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-2xl mx-auto animate-fade-in">
      <PageHeader title={t('title')} description={t('description')} />
      <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4 md:p-6">
        <RequestPaymentForm onSuccess={(url, amt) => { setInvoiceUrl(url); setAmount(amt); toast.success(t('invoiceGenerated')); }} />
      </div>
    </div>
  );
}
