'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function BlogPage() {
  const t = useTranslations('blogPage');
  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h1 className="text-2xl font-semibold text-[var(--color-text)] mb-4">
          {t('comingSoon')}
        </h1>
        <p className="text-[var(--color-muted)] text-sm mb-6">
          {t('comingSoonDesc')}
        </p>
        <Link
          href="/learn"
          className="px-4 py-2 bg-[#FFFFFF] text-black text-sm font-medium rounded-none hover:bg-[#E0E0E0] transition-colors"
        >
          {t('backToLearnHub')}
        </Link>
      </div>
    </div>
  );
}
