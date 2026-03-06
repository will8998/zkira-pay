'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/PageHeader';

export default function DocsPage() {
  const t = useTranslations('omnipayDocsPage');
  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-4xl mx-auto animate-fade-in">
      <PageHeader 
        title={t('title')} 
        description={t('description')} 
      />

      {/* Section 1: What is OMNIPAY */}
      <section id="what-is-omnipay" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">{t('whatIsOmnipay_title')}</h2>
        
        <div className="space-y-4">
          <div>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('whatIsOmnipay_paragraph1')}
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('whatIsOmnipay_paragraph2')}
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('whatIsOmnipay_keyBenefits_title')}</h3>
            <div className="bg-[var(--color-hover)] p-4 mb-4">
              <ul className="space-y-2">
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>{t('whatIsOmnipay_benefit1_label')}</strong>: {t('whatIsOmnipay_benefit1_desc')}</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>{t('whatIsOmnipay_benefit2_label')}</strong>: {t('whatIsOmnipay_benefit2_desc')}</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>{t('whatIsOmnipay_benefit3_label')}</strong>: {t('whatIsOmnipay_benefit3_desc')}</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>{t('whatIsOmnipay_benefit4_label')}</strong>: {t('whatIsOmnipay_benefit4_desc')}</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>{t('whatIsOmnipay_benefit5_label')}</strong>: {t('whatIsOmnipay_benefit5_desc')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: How Privacy Works */}
      <section id="how-privacy-works" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">{t('howPrivacyWorks_title')}</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('howPrivacyWorks_shieldedPool_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('howPrivacyWorks_shieldedPool_paragraph1')}
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('howPrivacyWorks_shieldedPool_paragraph2')}
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('howPrivacyWorks_zkProofs_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('howPrivacyWorks_zkProofs_paragraph1')}
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('howPrivacyWorks_zkProofs_paragraph2')}
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('howPrivacyWorks_anonymitySet_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('howPrivacyWorks_anonymitySet_paragraph')}
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: The Payment Flow */}
      <section id="payment-flow" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">{t('paymentFlow_title')}</h2>
        
        <div className="space-y-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-[var(--color-accent)] text-black rounded-full flex items-center justify-center text-sm font-semibold">
              01
            </div>
            <div>
              <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('paymentFlow_step1_title')}</h3>
              <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                {t('paymentFlow_step1_desc')}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-[var(--color-accent)] text-black rounded-full flex items-center justify-center text-sm font-semibold">
              02
            </div>
            <div>
              <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('paymentFlow_step2_title')}</h3>
              <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                {t('paymentFlow_step2_desc')}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-[var(--color-accent)] text-black rounded-full flex items-center justify-center text-sm font-semibold">
              03
            </div>
            <div>
              <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('paymentFlow_step3_title')}</h3>
              <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                {t('paymentFlow_step3_desc')}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-[var(--color-accent)] text-black rounded-full flex items-center justify-center text-sm font-semibold">
              04
            </div>
            <div>
              <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('paymentFlow_step4_title')}</h3>
              <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                {t('paymentFlow_step4_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Multi-Chain Support */}
      <section id="multi-chain-support" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">{t('multiChainSupport_title')}</h2>
        
        <div className="space-y-4">
          <div>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('multiChainSupport_paragraph1')}
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('multiChainSupport_paragraph2')}
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('multiChainSupport_supportedAssets_title')}</h3>
            <div className="bg-[var(--color-hover)] p-4 mb-4">
              <ul className="space-y-2">
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>{t('multiChainSupport_asset1_label')}</strong>: {t('multiChainSupport_asset1_desc')}</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>{t('multiChainSupport_asset2_label')}</strong>: {t('multiChainSupport_asset2_desc')}</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>{t('multiChainSupport_asset3_label')}</strong>: {t('multiChainSupport_asset3_desc')}</span>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('multiChainSupport_networkBenefits_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('multiChainSupport_networkBenefits_paragraph')}
            </p>
          </div>
        </div>
      </section>

      {/* Section 5: Settlement Privacy Guarantees */}
      <section id="privacy-guarantees" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">{t('privacyGuarantees_title')}</h2>
        
        <div className="space-y-4">
          <div>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('privacyGuarantees_paragraph')}
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('privacyGuarantees_protectionAgainst_title')}</h3>
            <ul className="space-y-2">
              <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                <span className="text-[var(--color-accent)] mt-1">•</span>
                <span><strong>{t('privacyGuarantees_protection1_label')}</strong>: {t('privacyGuarantees_protection1_desc')}</span>
              </li>
              <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                <span className="text-[var(--color-accent)] mt-1">•</span>
                <span><strong>{t('privacyGuarantees_protection2_label')}</strong>: {t('privacyGuarantees_protection2_desc')}</span>
              </li>
              <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                <span className="text-[var(--color-accent)] mt-1">•</span>
                <span><strong>{t('privacyGuarantees_protection3_label')}</strong>: {t('privacyGuarantees_protection3_desc')}</span>
              </li>
              <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                <span className="text-[var(--color-accent)] mt-1">•</span>
                <span><strong>{t('privacyGuarantees_protection4_label')}</strong>: {t('privacyGuarantees_protection4_desc')}</span>
              </li>
              <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                <span className="text-[var(--color-accent)] mt-1">•</span>
                <span><strong>{t('privacyGuarantees_protection5_label')}</strong>: {t('privacyGuarantees_protection5_desc')}</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('privacyGuarantees_mathematicalGuarantees_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('privacyGuarantees_mathematicalGuarantees_paragraph')}
            </p>
          </div>
        </div>
      </section>

      {/* Section 6: For Businesses */}
      <section id="for-businesses" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">{t('forBusinesses_title')}</h2>
        
        <div className="space-y-4">
          <div>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('forBusinesses_paragraph1')}
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('forBusinesses_paragraph2')}
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('forBusinesses_integrationBenefits_title')}</h3>
            <div className="bg-[var(--color-hover)] p-4 mb-4">
              <ul className="space-y-2">
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>{t('forBusinesses_benefit1_label')}</strong>: {t('forBusinesses_benefit1_desc')}</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>{t('forBusinesses_benefit2_label')}</strong>: {t('forBusinesses_benefit2_desc')}</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>{t('forBusinesses_benefit3_label')}</strong>: {t('forBusinesses_benefit3_desc')}</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>{t('forBusinesses_benefit4_label')}</strong>: {t('forBusinesses_benefit4_desc')}</span>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('forBusinesses_getStarted_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('forBusinesses_getStarted_paragraph')}
            </p>
            <Link 
              href="/learn/api" 
              className="inline-block bg-[var(--color-accent)] text-black px-4 py-2 rounded-none text-sm font-semibold hover:bg-[var(--color-hover)] transition-colors"
            >
              {t('forBusinesses_viewApiReference')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}