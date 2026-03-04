'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/PageHeader';

export default function LearnPage() {
  const t = useTranslations('learnPage');
  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-5xl mx-auto animate-fade-in">
      <PageHeader 
        title={t('title')} 
        description={t('description')} 
      />

      {/* Hero Section */}
      <section className="mb-12">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--color-text)] mb-4 font-[family-name:var(--font-sans)]">
          Everything you need to build with ZKIRA
        </h1>
        <p className="text-lg text-[var(--color-muted)] font-[family-name:var(--font-sans)]">
          From stealth address fundamentals to production API integration — master private payments on Solana.
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
                  Documentation
                </h3>
                <p className="text-[var(--color-muted)] font-[family-name:var(--font-sans)]">
                  Comprehensive guides covering stealth addresses, payment flows, SDK integration, and Solana program architecture.
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
                  Use Cases
                </h3>
                <p className="text-[var(--color-muted)] font-[family-name:var(--font-sans)]">
                  Real-world applications: private payroll, anonymous donations, escrow services, multi-sig treasury, and e-commerce.
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
                  API Reference
                </h3>
                <p className="text-[var(--color-muted)] font-[family-name:var(--font-sans)]">
                  Complete REST API and TypeScript SDK reference with endpoints, parameters, responses, and code examples.
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
                  Blog
                </h3>
                <p className="text-[var(--color-muted)] font-[family-name:var(--font-sans)]">
                  Technical deep-dives, protocol updates, privacy research, and insights from the ZKIRA team.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-[var(--color-text)] mb-6 font-[family-name:var(--font-sans)]">
          Quick Links
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link 
            href="/learn/docs#getting-started"
            className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none text-[var(--color-text)] hover:border-[var(--border-subtle-hover)] transition-all font-[family-name:var(--font-sans)]"
          >
            Getting Started
          </Link>
          <Link 
            href="/learn/docs#stealth-addresses"
            className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none text-[var(--color-text)] hover:border-[var(--border-subtle-hover)] transition-all font-[family-name:var(--font-sans)]"
          >
            Stealth Addresses
          </Link>
          <Link 
            href="/learn/api#create-payment"
            className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none text-[var(--color-text)] hover:border-[var(--border-subtle-hover)] transition-all font-[family-name:var(--font-sans)]"
          >
            Create Payment API
          </Link>
          <Link 
            href="/learn/docs#widget"
            className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none text-[var(--color-text)] hover:border-[var(--border-subtle-hover)] transition-all font-[family-name:var(--font-sans)]"
          >
            Widget Integration
          </Link>
          <Link 
            href="/learn/use-cases#payroll"
            className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none text-[var(--color-text)] hover:border-[var(--border-subtle-hover)] transition-all font-[family-name:var(--font-sans)]"
          >
            Private Payroll
          </Link>
          <Link 
            href="/learn/docs#shielded-pool"
            className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none text-[var(--color-text)] hover:border-[var(--border-subtle-hover)] transition-all font-[family-name:var(--font-sans)]"
          >
            Shielded Pool
          </Link>
          <Link 
            href="/learn/docs#privacy-transport"
            className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none text-[var(--color-text)] hover:border-[var(--border-subtle-hover)] transition-all font-[family-name:var(--font-sans)]"
          >
            Privacy Transport
          </Link>
          <Link 
            href="/learn/docs#timing-defenses"
            className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none text-[var(--color-text)] hover:border-[var(--border-subtle-hover)] transition-all font-[family-name:var(--font-sans)]"
          >
            Timing Defenses
          </Link>
        </div>
      </section>

      {/* Developer Quick Start */}
      <section>
        <h2 className="text-2xl font-semibold text-[var(--color-text)] mb-6 font-[family-name:var(--font-sans)]">
          Developer Quick Start
        </h2>
        <div className="mb-4">
          <pre className="bg-[#0A0A0A] border border-[var(--border-subtle)] p-4 font-[family-name:var(--font-mono)] text-[13px] text-[rgba(255,255,255,0.75)] overflow-x-auto">
{`curl -X POST https://api.zkira.io/v1/payments \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": "1000000",
    "token": "USDC",
    "recipient": "stealth_address_here",
    "metadata": {
      "description": "Private payment"
    }
  }'`}
          </pre>
        </div>
        <p className="text-[var(--color-muted)] font-[family-name:var(--font-sans)]">
          Get your API key from the{' '}
          <Link 
            href="/developers" 
            className="text-[#FF2828] hover:underline"
          >
            Developer Dashboard
          </Link>{' '}
          to start making private payments.
        </p>
      </section>
    </div>
  );
}