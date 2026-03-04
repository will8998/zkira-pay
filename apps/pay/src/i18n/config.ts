export const locales = ['en', 'zh', 'es', 'hi', 'ar', 'pt', 'fr', 'ja', 'ko', 'ru'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

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

export const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  zh: '🇨🇳',
  es: '🇪🇸',
  hi: '🇮🇳',
  ar: '🇸🇦',
  pt: '🇧🇷',
  fr: '🇫🇷',
  ja: '🇯🇵',
  ko: '🇰🇷',
  ru: '🇷🇺',
};

export const rtlLocales: Locale[] = ['ar'];

export function isRtl(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}
