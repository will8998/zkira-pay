'use client';

import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/PageHeader';

export default function UseCasesPage() {
  const t = useTranslations('useCasesPage');
  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-4xl mx-auto animate-fade-in">
      <PageHeader
        title={t('title')}
        description={t('description')}
      />

      {/* Use Case 1: Casino/iGaming */}
      <div id="casino" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6 animate-entrance" style={{ animationDelay: '100ms' }}>
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFFFFF] font-[family-name:var(--font-mono)]">{t('casinoTag')}</span>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mt-2 mb-3">{t('casinoTitle')}</h2>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
          {t('casinoDesc')}
        </p>

        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">{t('howItWorksTitle')}</h3>
        <div className="mb-6">
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">01</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('casinoStep1')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">02</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('casinoStep2')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">03</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('casinoStep3')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">04</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('casinoStep4')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">05</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('casinoStep5')}</p>
          </div>
        </div>

      </div>

      {/* Use Case 2: Private Payroll */}
      <div id="payroll" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6 animate-entrance" style={{ animationDelay: '200ms' }}>
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFFFFF] font-[family-name:var(--font-mono)]">{t('payrollTag')}</span>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mt-2 mb-3">{t('payrollTitle')}</h2>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
          {t('payrollDesc')}
        </p>

        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">{t('howItWorksTitle')}</h3>
        <div className="mb-6">
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">01</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('payrollStep1')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">02</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('payrollStep2')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">03</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('payrollStep3')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">04</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('payrollStep4')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">05</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('payrollStep5')}</p>
          </div>
        </div>

      </div>

      {/* Use Case 3: E-commerce Integration */}
      <div id="ecommerce" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6 animate-entrance" style={{ animationDelay: '300ms' }}>
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFFFFF] font-[family-name:var(--font-mono)]">{t('ecommerceTag')}</span>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mt-2 mb-3">{t('ecommerceTitle')}</h2>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
          {t('ecommerceDesc')}
        </p>

        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">{t('howItWorksTitle')}</h3>
        <div className="mb-6">
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">01</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('ecommerceStep1')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">02</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('ecommerceStep2')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">03</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('ecommerceStep3')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">04</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('ecommerceStep4')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">05</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('ecommerceStep5')}</p>
          </div>
        </div>

      </div>

      {/* Use Case 4: Anonymous Transfers */}
      <div id="anonymous-transfers" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6 animate-entrance" style={{ animationDelay: '400ms' }}>
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFFFFF] font-[family-name:var(--font-mono)]">{t('anonymousTransfersTag')}</span>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mt-2 mb-3">{t('anonymousTransfersTitle')}</h2>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
          {t('anonymousTransfersDesc')}
        </p>

        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">{t('howItWorksTitle')}</h3>
        <div className="mb-6">
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">01</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('anonymousTransfersStep1')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">02</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('anonymousTransfersStep2')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">03</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('anonymousTransfersStep3')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">04</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('anonymousTransfersStep4')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">05</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('anonymousTransfersStep5')}</p>
          </div>
        </div>

      </div>

      {/* Use Case 5: Anonymous Donations */}
      <div id="donations" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6 animate-entrance" style={{ animationDelay: '500ms' }}>
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFFFFF] font-[family-name:var(--font-mono)]">{t('donationsTag')}</span>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mt-2 mb-3">{t('donationsTitle')}</h2>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
          {t('donationsDesc')}
        </p>

        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">{t('howItWorksTitle')}</h3>
        <div className="mb-6">
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">01</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('donationsStep1')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">02</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('donationsStep2')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">03</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('donationsStep3')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">04</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('donationsStep4')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">05</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('donationsStep5')}</p>
          </div>
        </div>

      </div>

      {/* Use Case 6: Escrow Services */}
      <div id="escrow" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6 animate-entrance" style={{ animationDelay: '600ms' }}>
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFFFFF] font-[family-name:var(--font-mono)]">{t('escrowTag')}</span>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mt-2 mb-3">{t('escrowTitle')}</h2>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
          {t('escrowDesc')}
        </p>

        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">{t('howItWorksTitle')}</h3>
        <div className="mb-6">
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">01</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('escrowStep1')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">02</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('escrowStep2')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">03</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('escrowStep3')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">04</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('escrowStep4')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">05</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('escrowStep5')}</p>
          </div>
        </div>

      </div>

      {/* Use Case 7: Multi-sig Treasury */}
      <div id="treasury" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6 animate-entrance" style={{ animationDelay: '700ms' }}>
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFFFFF] font-[family-name:var(--font-mono)]">{t('treasuryTag')}</span>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mt-2 mb-3">{t('treasuryTitle')}</h2>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
          {t('treasuryDesc')}
        </p>

        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">{t('howItWorksTitle')}</h3>
        <div className="mb-6">
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">01</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('treasuryStep1')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">02</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('treasuryStep2')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">03</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('treasuryStep3')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">04</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('treasuryStep4')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">05</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('treasuryStep5')}</p>
          </div>
        </div>

      </div>

      {/* Use Case 8: Payment Links */}
      <div id="payment-links" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6 animate-entrance" style={{ animationDelay: '800ms' }}>
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFFFFF] font-[family-name:var(--font-mono)]">{t('paymentLinksTag')}</span>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mt-2 mb-3">{t('paymentLinksTitle')}</h2>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
          {t('paymentLinksDesc')}
        </p>

        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">{t('howItWorksTitle')}</h3>
        <div className="mb-6">
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">01</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('paymentLinksStep1')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">02</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('paymentLinksStep2')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">03</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('paymentLinksStep3')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">04</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('paymentLinksStep4')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">05</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('paymentLinksStep5')}</p>
          </div>
        </div>

      </div>
    </div>
  );
}