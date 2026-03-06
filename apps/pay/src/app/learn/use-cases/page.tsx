'use client';

import { useTranslations } from 'next-intl';

import { PageHeader } from '@/components/PageHeader';

export default function UseCasesPage() {
  const t = useTranslations('omnipayUseCasesPage');
  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-4xl mx-auto animate-fade-in">
      <PageHeader
        title={t('title')}
        description={t('description')}
      />

      {/* Use Case 1: Casino & iGaming Settlements */}
      <div id="casino" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6 animate-entrance" style={{ animationDelay: '100ms' }}>
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFFFFF] font-[family-name:var(--font-mono)]">{t('casino_tag')}</span>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mt-2 mb-3">{t('casino_title')}</h2>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
          {t('casino_desc')}
        </p>

        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">{t('howItWorks')}</h3>
        <div className="mb-6">
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">01</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('casino_step1')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">02</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('casino_step2')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">03</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('casino_step3')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">04</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('casino_step4')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">05</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('casino_step5')}</p>
          </div>
        </div>

      </div>

      {/* Use Case 2: Sportsbook & Betting Payouts */}
      <div id="sportsbook" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6 animate-entrance" style={{ animationDelay: '200ms' }}>
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFFFFF] font-[family-name:var(--font-mono)]">{t('sportsbook_tag')}</span>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mt-2 mb-3">{t('sportsbook_title')}</h2>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
          {t('sportsbook_desc')}
        </p>

        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">{t('howItWorks')}</h3>
        <div className="mb-6">
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">01</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('sportsbook_step1')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">02</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('sportsbook_step2')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">03</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('sportsbook_step3')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">04</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('sportsbook_step4')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">05</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('sportsbook_step5')}</p>
          </div>
        </div>

      </div>

      {/* Use Case 3: High-Volume Payment Processing */}
      <div id="enterprise" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6 animate-entrance" style={{ animationDelay: '300ms' }}>
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFFFFF] font-[family-name:var(--font-mono)]">{t('enterprise_tag')}</span>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mt-2 mb-3">{t('enterprise_title')}</h2>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
          {t('enterprise_desc')}
        </p>

        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">{t('howItWorks')}</h3>
        <div className="mb-6">
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">01</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('enterprise_step1')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">02</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('enterprise_step2')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">03</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('enterprise_step3')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">04</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('enterprise_step4')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">05</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('enterprise_step5')}</p>
          </div>
        </div>

      </div>
    </div>
  );
}