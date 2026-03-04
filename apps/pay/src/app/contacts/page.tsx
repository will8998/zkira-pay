'use client';

import { useTranslations } from 'next-intl';
import InfoTooltip from '@/components/InfoTooltip';
import { ContactsManager } from '@/components/ContactsManager';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
export default function ContactsPage() {
  const t = useTranslations('contactsPage');
  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-5xl mx-auto animate-fade-in">
      <PageHeader title={t('title')} description={t('description')} />
      <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none overflow-hidden animate-entrance">
        <ContactsManager />
      </div>
    </div>
  );
}
