'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ClaimPayment } from '@/components/ClaimPayment';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import Link from 'next/link';

function ClaimContent() {
  const searchParams = useSearchParams();
  const escrow = searchParams.get('escrow');
  
  // Read secret from URL hash fragment (preferred) or query param (backwards compat)
  const [secret, setSecret] = useState<string | null>(null);
  
  useEffect(() => {
    // Try hash fragment first: #secret=abc123
    const hash = window.location.hash;
    if (hash) {
      const hashParams = new URLSearchParams(hash.slice(1));
      const hashSecret = hashParams.get('secret');
      if (hashSecret) {
        setSecret(hashSecret);
        return;
      }
    }
    // Fall back to query param for old links: ?secret=abc123
    const querySecret = searchParams.get('secret');
    if (querySecret) {
      setSecret(querySecret);
    }
  }, [searchParams]);

  // Store referral code from ?ref= param in localStorage
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      localStorage.setItem('zkira_referral_code', refCode);
    }
  }, [searchParams]);

  if (!escrow || !secret) {
    return (
      <EmptyState
        title="Missing Payment Info"
        description="This page requires a valid payment link with an escrow address and claim secret."
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
      <ClaimPayment escrowAddress={escrow} claimSecret={secret} />
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
  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-2xl mx-auto animate-fade-in">
      <PageHeader title="Claim Payment" description="Claim a confidential payment to your wallet" />
      <Suspense fallback={<ClaimLoading />}>
        <ClaimContent />
      </Suspense>
    </div>
  );
}
