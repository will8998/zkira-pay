'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('hero');
  const tDash = useTranslations('dashboard');
  const quickActions = [
    {
      title: tDash('sendPayment'),
      description: tDash('sendPaymentDesc'),
      href: '/create',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
        </svg>
      ),
    },
    {
      title: tDash('requestPayment'),
      description: tDash('requestPaymentDesc'),
      href: '/request',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
        </svg>
      ),
    },
    {
      title: t('claimPayment'),
      description: t('claimPaymentDesc'),
      href: '/claim',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-[calc(100dvh-3.5rem-4rem)] md:min-h-[calc(100dvh-3.5rem)] bg-[#000000] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          style={{ filter: 'brightness(0.8) contrast(1.1)' }}
        >
          <source src="/hero-animation.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 py-12 md:py-20">
        {/* Hero */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-light text-white mb-6 tracking-[-0.02em] leading-[1.05]">
            {t('title')}
            <br />
            <span className="bg-gradient-to-r from-[#FFFFFF] to-[#FF6B6B] bg-clip-text text-transparent">
              {t('titleHighlight')}
            </span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-[rgba(255,255,255,0.6)] max-w-lg mx-auto leading-relaxed">
            {t('subtitle')}
            <br className="hidden sm:block" />
            {t('subtitleLine2')}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full mb-12">
          {quickActions.map((action, index) => (
            <Link
              key={action.href}
              href={action.href}
              className="group bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,40,40,0.3)] hover:bg-[rgba(255,40,40,0.05)] rounded-xl p-6 transition-all duration-300"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg flex items-center justify-center text-[rgba(255,255,255,0.6)] group-hover:text-[#FFFFFF] transition-colors">
                  {action.icon}
                </div>
                <div>
                  <div
                    className="text-sm font-semibold text-white group-hover:text-[#FFFFFF] transition-colors"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {action.title}
                  </div>
                  <div className="text-xs text-[rgba(255,255,255,0.4)]">
                    {action.description}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 text-[rgba(255,255,255,0.5)]">
          <span className="text-[13px] font-light tracking-wide">{t('featureZK')}</span>
          <span className="text-[rgba(255,255,255,0.2)]">•</span>
          <span className="text-[13px] font-light tracking-wide">{t('featureMultiChain')}</span>
          <span className="text-[rgba(255,255,255,0.2)]">•</span>
          <span className="text-[13px] font-light tracking-wide">{t('featureNoWallet')}</span>
          <span className="text-[rgba(255,255,255,0.2)]">•</span>
          <span className="text-[13px] font-light tracking-wide">{t('featureTor')}</span>
        </div>
      </div>
    </div>
  );
}
