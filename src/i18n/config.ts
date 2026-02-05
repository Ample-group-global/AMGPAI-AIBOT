// Supported locales
export const locales = ['en', 'zh'] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = 'zh';

// Locale labels for UI
export const localeLabels: Record<Locale, { name: string; nativeName: string; flag: string }> = {
  en: { name: 'English', nativeName: 'English', flag: 'us' },
  zh: { name: 'Chinese', nativeName: '繁體中文', flag: 'tw' },
};
