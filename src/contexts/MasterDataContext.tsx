'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { locales, defaultLocale, localeLabels, type Locale } from '@/i18n/config';

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

export function MasterDataProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<string>(defaultLocale);
  const [isLoading, setIsLoading] = useState(true);
  const tIntl = useTranslations();

  useEffect(() => {
    const locale = getLocaleFromCookie();
    setLanguageState(locale);
    setIsLoading(false);
  }, []);

  const setLanguage = useCallback((lang: string) => {
    if (!locales.includes(lang as Locale)) return;
    setLocaleCookie(lang as Locale);
    setLanguageState(lang);
    window.location.reload();
  }, []);

  const t = useCallback((key: string): string => {
    try {
      return tIntl(key as any);
    } catch {
      return key;
    }
  }, [tIntl]);

  const getAppTitle = useCallback((): string => {
    return language === 'zh' ? '投資性向評估' : 'Investment Propensity Assessment';
  }, [language]);

  const languages: LanguageDto[] = locales.map((code, index) => ({
    code,
    name: localeLabels[code].name,
    nativeName: localeLabels[code].nativeName,
    flag: localeLabels[code].flag,
    isDefault: code === defaultLocale,
    sortOrder: index + 1,
  }));

  return (
    <MasterDataContext.Provider value={{ language, setLanguage, languages, isLoading, t, getAppTitle }}>
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
