import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'zh', 'es', 'hi', 'ar', 'pt', 'fr', 'ja', 'ko', 'ru'] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
  es: 'Español',
  hi: 'हिन्दी',
  ar: 'العربية',
  pt: 'Português',
  fr: 'Français',
  ja: '日本語',
  ko: '한국어',
  ru: 'Русский',
};

export const rtlLocales: Locale[] = ['ar'];

export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get('NEXT_LOCALE')?.value;
  const locale: Locale = locales.includes(cookieLocale as Locale)
    ? (cookieLocale as Locale)
    : 'en';

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
