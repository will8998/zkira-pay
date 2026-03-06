'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/PageHeader';

export default function LearnPage() {
  const t = useTranslations('learnHubPage');
  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-5xl mx-auto animate-fade-in">
      <PageHeader 
        title={t('title')} 
        description={t('description')} 
      />

      {/* Main Cards Grid */}
      <section className="mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* How It Works Card */}
          <Link 
            href="/learn/docs"
            className="card-interactive bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none hover:border-[var(--border-subtle-hover)] transition-all p-6 block animate-entrance"
            style={{ animationDelay: '0ms' }}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-6 h-6">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 2h14v14H2V2zm2 2v10h10V4H4zm2 2h6v1H6V6zm0 2h6v1H6V8zm0 2h4v1H6v-1z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2 font-[family-name:var(--font-sans)]">
                  {t('howItWorksTitle')}
                </h3>
                <p className="text-[var(--color-muted)] font-[family-name:var(--font-sans)]">
                  {t('howItWorksDesc')}
                </p>
              </div>
            </div>
          </Link>

          {/* Use Cases Card */}
          <Link 
            href="/learn/use-cases"
            className="card-interactive bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none hover:border-[var(--border-subtle-hover)] transition-all p-6 block animate-entrance"
            style={{ animationDelay: '100ms' }}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-6 h-6">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 1l2.5 7h7L13 12.5l2.5 7L9 15l-6.5 4.5L5 12.5 0.5 8h7L9 1z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2 font-[family-name:var(--font-sans)]">
                  {t('useCasesTitle')}
                </h3>
                <p className="text-[var(--color-muted)] font-[family-name:var(--font-sans)]">
                  {t('useCasesDesc')}
                </p>
              </div>
            </div>
          </Link>

          {/* API Reference Card */}
          <Link 
            href="/learn/api"
            className="card-interactive bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none hover:border-[var(--border-subtle-hover)] transition-all p-6 block animate-entrance"
            style={{ animationDelay: '200ms' }}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-6 h-6">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 3h16v2H1V3zm0 4h16v2H1V7zm0 4h16v2H1v-2zm0 4h16v2H1v-2z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2 font-[family-name:var(--font-sans)]">
                  {t('apiReferenceTitle')}
                </h3>
                <p className="text-[var(--color-muted)] font-[family-name:var(--font-sans)]">
                  {t('apiReferenceDesc')}
                </p>
              </div>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}