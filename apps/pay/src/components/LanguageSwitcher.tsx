'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config';

export function LanguageSwitcher() {
  const currentLocale = useLocale() as Locale;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const switchLocale = (locale: Locale) => {
    document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=${60 * 60 * 24 * 365}`;
    setOpen(false);
    window.location.reload();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1.5 bg-[var(--color-hover)] border border-[var(--color-border)] hover:bg-[var(--color-skeleton)] hover:border-[#FF2828] transition-all duration-200 text-[12px]"
        aria-label="Switch language"
      >
        <span className="text-[13px]">{localeFlags[currentLocale]}</span>
        <span className="hidden sm:inline text-[var(--color-text)] font-medium uppercase tracking-wider">
          {currentLocale}
        </span>
        <svg
          className={`w-3 h-3 text-[var(--color-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-50 w-48 bg-[#111111] border border-[#282828] rounded-lg shadow-2xl overflow-hidden">
            <div className="py-1 max-h-[320px] overflow-y-auto">
              {locales.map((locale) => {
                const active = locale === currentLocale;
                return (
                  <button
                    key={locale}
                    onClick={() => switchLocale(locale)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      active
                        ? 'text-[#FF2828] bg-[var(--color-hover)]'
                        : 'text-[var(--color-text)] hover:bg-[var(--color-hover)]'
                    }`}
                  >
                    <span className="text-base">{localeFlags[locale]}</span>
                    <span className="flex-1 text-left">{localeNames[locale]}</span>
                    {active && (
                      <svg className="w-4 h-4 text-[#FF2828]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
