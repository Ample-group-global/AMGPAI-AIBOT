'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { locales, defaultLocale, localeLabels, type Locale } from '@/i18n/config';
import { fetchTranslations, clearTranslationCache } from '@/services/translation-service';

interface LanguageDto {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  isDefault: boolean;
  sortOrder: number;
}

interface MasterDataContextType {
  language: string;
  setLanguage: (lang: string) => void;
  languages: LanguageDto[];
  isLoading: boolean;
  t: (key: string) => string;
  getAppTitle: () => string;
  refreshTranslations: () => Promise<void>;
}

const MasterDataContext = createContext<MasterDataContextType | undefined>(undefined);

function getLocaleFromCookie(): Locale {
  if (typeof document === 'undefined') return defaultLocale;
  const match = document.cookie.match(/(?:^|; )locale=([^;]*)/);
  const cookieValue = match ? decodeURIComponent(match[1]) : null;
  return locales.includes(cookieValue as Locale) ? (cookieValue as Locale) : defaultLocale;
}

function setLocaleCookie(locale: Locale) {
  document.cookie = `locale=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return typeof current === 'string' ? current : undefined;
}

export function MasterDataProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<string>(defaultLocale);
  const [isLoading, setIsLoading] = useState(true);
  const [dbTranslations, setDbTranslations] = useState<Record<string, unknown> | null>(null);

  const loadTranslations = useCallback(async (locale: string) => {
    try {
      const translations = await fetchTranslations(locale);
      if (translations) {
        setDbTranslations(translations);
      }
    } catch (error) {
      console.warn('Failed to load translations from API', error);
    }
  }, []);

  useEffect(() => {
    const locale = getLocaleFromCookie();
    setLanguageState(locale);
    loadTranslations(locale).finally(() => {
      setIsLoading(false);
    });
  }, [loadTranslations]);

  const setLanguage = useCallback(async (lang: string) => {
    if (!locales.includes(lang as Locale)) return;
    if (lang === language) return;

    setLocaleCookie(lang as Locale);
    setLanguageState(lang);

    // Load new translations without page reload
    clearTranslationCache(lang);
    await loadTranslations(lang);
  }, [language, loadTranslations]);

  const t = useCallback((key: string): string => {
    if (dbTranslations) {
      const dbValue = getNestedValue(dbTranslations, key);
      if (dbValue) return dbValue;
    }
    return key;
  }, [dbTranslations]);

  const getAppTitle = useCallback((): string => {
    return t('home.header.title');
  }, [t]);

  const refreshTranslations = useCallback(async () => {
    clearTranslationCache(language);
    await loadTranslations(language);
  }, [language, loadTranslations]);

  const languages: LanguageDto[] = locales.map((code, index) => ({
    code,
    name: localeLabels[code].name,
    nativeName: localeLabels[code].nativeName,
    flag: localeLabels[code].flag,
    isDefault: code === defaultLocale,
    sortOrder: index + 1,
  }));

  return (
    <MasterDataContext.Provider value={{
      language,
      setLanguage,
      languages,
      isLoading,
      t,
      getAppTitle,
      refreshTranslations
    }}>
      {children}
    </MasterDataContext.Provider>
  );
}

export function useMasterData() {
  const context = useContext(MasterDataContext);
  if (context === undefined) {
    throw new Error('useMasterData must be used within a MasterDataProvider');
  }
  return context;
}
