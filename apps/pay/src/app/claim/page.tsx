'use client';

import { Suspense, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { ClaimPayment } from '@/components/ClaimPayment';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import Link from 'next/link';

function ClaimContent() {
  const t = useTranslations('claimPage');
  const tCommon = useTranslations('common');
  const searchParams = useSearchParams();
  const escrow = searchParams.get('escrow');
  

  // Store referral code from ?ref= param in localStorage
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      localStorage.setItem('zkira_referral_code', refCode);
    }
  }, [searchParams]);

  if (!escrow) {
    return (
      <EmptyState
        title={t('missingInfo')}
        description={t('missingInfoDesc')}
        actionLabel={t('backToDashboard')}
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
      <ClaimPayment escrowAddress={escrow} />
    </div>
  );
}

function ClaimLoading() {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4 md:p-6">
      <div className="space-y-4">
        <div className="h-6 w-48 skeleton-shimmer" />
        <div className="h-12 w-32 skeleton-shimmer" />
        <div className="h-4 w-64 skeleton-shimmer" />
        <div className="mt-6 h-12 w-full skeleton-shimmer" />
      </div>
    </div>
  );
}

export default function ClaimPage() {
  const t = useTranslations('claimPage');
  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-2xl mx-auto animate-fade-in">
      <PageHeader title={t('title')} description={t('description')} />
      <Suspense fallback={<ClaimLoading />}>
        <ClaimContent />
      </Suspense>
    </div>
  );
}
