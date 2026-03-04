'use client';

import { useTranslations } from 'next-intl';
import { PaymentHistory } from '@/components/PaymentHistory';
import { PageHeader } from '@/components/PageHeader';
export default function HistoryPage() {
  const t = useTranslations('historyPage');
  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-6xl mx-auto animate-fade-in">
      <PageHeader title={t('title')} description={t('description')} />
      <PaymentHistory />
    </div>
  );
}
