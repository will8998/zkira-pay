'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/PageHeader';
import { CodeBlock } from '@/components/learn/CodeBlock';

export default function LearnPage() {
  const t = useTranslations('learnHub');
  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-5xl mx-auto animate-fade-in">
      <PageHeader 
        title={t('title')} 
        description={t('description')} 
      />

      {/* Hero Section */}
      <section className="mb-12">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--color-text)] mb-4 font-[family-name:var(--font-sans)]">
          {t('heroTitle')}
        </h1>
        <p className="text-lg text-[var(--color-muted)] font-[family-name:var(--font-sans)]">
          {t('heroSubtitle')}
        </p>
      </section>

      {/* Main Cards Grid */}
      <section className="mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Documentation Card */}
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
                  {t('documentationTitle')}
                </h3>
                <p className="text-[var(--color-muted)] font-[family-name:var(--font-sans)]">
                  {t('documentationDesc')}
                </p>
              </div>
            </div>
          </Link>

          {/* API Reference Card */}
          <Link 
            href="/learn/api"
            className="card-interactive bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none hover:border-[var(--border-subtle-hover)] transition-all p-6 block animate-entrance"
            style={{ animationDelay: '100ms' }}
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

          {/* Use Cases Card */}
          <Link 
            href="/learn/use-cases"
            className="card-interactive bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none hover:border-[var(--border-subtle-hover)] transition-all p-6 block animate-entrance"
            style={{ animationDelay: '200ms' }}
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

          {/* Blog Card */}
          <Link 
            href="/learn/blog"
            className="card-interactive bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none hover:border-[var(--border-subtle-hover)] transition-all p-6 block animate-entrance"
            style={{ animationDelay: '300ms' }}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-6 h-6">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 1h12v16H3V1zm2 2v12h8V3H5zm1 2h6v1H6V5zm0 2h6v1H6V7zm0 2h6v1H6V9zm0 2h4v1H6v-1z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2 font-[family-name:var(--font-sans)]">
                  {t('blogTitle')}
                </h3>
                <p className="text-[var(--color-muted)] font-[family-name:var(--font-sans)]">
                  {t('blogDesc')}
                </p>
              </div>
            </div>
          </Link>

          {/* Gateway Integration Card */}
          <Link 
            href="/learn/docs#casino-gateway"
            className="card-interactive bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none hover:border-[var(--border-subtle-hover)] transition-all p-6 block animate-entrance"
            style={{ animationDelay: '400ms' }}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-6 h-6">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 2L7 7H2l4 3-1.5 5L9 12l4.5 3L12 10l4-3h-5l-2-5z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2 font-[family-name:var(--font-sans)]">
                  {t('gatewayIntegrationTitle')}
                </h3>
                <p className="text-[var(--color-muted)] font-[family-name:var(--font-sans)]">
                  {t('gatewayIntegrationDesc')}
                </p>
              </div>
            </div>
          </Link>

          {/* Merchant Guide Card */}
          <Link 
            href="/learn/docs#merchant-dashboard"
            className="card-interactive bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none hover:border-[var(--border-subtle-hover)] transition-all p-6 block animate-entrance"
            style={{ animationDelay: '500ms' }}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-6 h-6">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 3h12v12H3V3zm2 2v8h8V5H5zm1 1h6v1H6V6zm0 2h6v1H6V8zm0 2h4v1H6v-1z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2 font-[family-name:var(--font-sans)]">
                  {t('merchantGuideTitle')}
                </h3>
                <p className="text-[var(--color-muted)] font-[family-name:var(--font-sans)]">
                  {t('merchantGuideDesc')}
                </p>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-[var(--color-text)] mb-6 font-[family-name:var(--font-sans)]">
          {t('quickLinksTitle')}
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link 
            href="/learn/docs#getting-started"
            className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none text-[var(--color-text)] hover:border-[var(--border-subtle-hover)] transition-all font-[family-name:var(--font-sans)]"
          >
            {t('quickLinkGettingStarted')}
          </Link>
          <Link 
            href="/learn/docs#casino-gateway"
            className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none text-[var(--color-text)] hover:border-[var(--border-subtle-hover)] transition-all font-[family-name:var(--font-sans)]"
          >
            {t('quickLinkCasinoGateway')}
          </Link>
          <Link 
            href="/learn/docs#stealth-addresses"
            className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none text-[var(--color-text)] hover:border-[var(--border-subtle-hover)] transition-all font-[family-name:var(--font-sans)]"
          >
            {t('quickLinkStealthAddresses')}
          </Link>
          <Link 
            href="/learn/docs#shielded-pool"
            className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none text-[var(--color-text)] hover:border-[var(--border-subtle-hover)] transition-all font-[family-name:var(--font-sans)]"
          >
            {t('quickLinkShieldedPool')}
          </Link>
          <Link 
            href="/learn/docs#merchant-dashboard"
            className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none text-[var(--color-text)] hover:border-[var(--border-subtle-hover)] transition-all font-[family-name:var(--font-sans)]"
          >
            {t('quickLinkMerchantDashboard')}
          </Link>
          <Link 
            href="/learn/docs#sdk-reference"
            className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none text-[var(--color-text)] hover:border-[var(--border-subtle-hover)] transition-all font-[family-name:var(--font-sans)]"
          >
            {t('quickLinkSdkReference')}
          </Link>
          <Link 
            href="/learn/api"
            className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none text-[var(--color-text)] hover:border-[var(--border-subtle-hover)] transition-all font-[family-name:var(--font-sans)]"
          >
            {t('quickLinkOpenApiSpec')}
          </Link>
        </div>
      </section>

      {/* Developer Quick Start */}
      <section>
        <h2 className="text-2xl font-semibold text-[var(--color-text)] mb-6 font-[family-name:var(--font-sans)]">
          {t('developerQuickStartTitle')}
        </h2>
        <div className="mb-4">
          <CodeBlock 
            code={`import { GatewayClient } from '@zkira/gateway-client';

// Initialize casino gateway client
const client = new GatewayClient({
  baseUrl: 'https://api.zkira.xyz',
  apiKey: 'YOUR_API_KEY'
});

// Create deposit session for player
const session = await client.createSession({
  playerId: 'player_123',
  amount: '100',
  token: 'USDC'
});

console.log('Deposit URL:', session.depositUrl);
console.log('Session ID:', session.sessionId);`}
            language="typescript"
            title="Gateway Client Quick Start"
          />
        </div>
        <p className="text-[var(--color-muted)] font-[family-name:var(--font-sans)]">
          {t('developerQuickStartDesc')}{' '}
          <Link 
            href="/developers" 
            className="text-[#FFFFFF] hover:underline"
          >
            {t('developerDashboardLink')}
          </Link>{' '}
          {t('developerQuickStartDesc2')}
        </p>
      </section>
    </div>
  );
}