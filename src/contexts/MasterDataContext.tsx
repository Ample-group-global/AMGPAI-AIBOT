'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { locales, defaultLocale, localeLabels, type Locale } from '@/i18n/config';

// =============================================================================
// NEW IMPLEMENTATION: Using next-intl for translations (cookie-based)
// The old database-based translation system is commented out below but preserved
// =============================================================================

interface LanguageDto {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  isDefault: boolean;
  sortOrder: number;
}

interface MasterDataContextType {
  masterData: null; // Simplified - no longer fetching from API
  language: string;
  setLanguage: (lang: string) => void;
  languages: LanguageDto[];
  isLoading: boolean;
  error: string | null;
  t: (key: string) => string;
  reload: () => Promise<void>;
  config: null; // Simplified
  stages: Record<string, { name: string }>;
  getAppTitle: () => string;
}

const MasterDataContext = createContext<MasterDataContextType | undefined>(undefined);

interface MasterDataProviderProps {
  children: ReactNode;
}

// Helper to get locale from cookie (client-side)
function getLocaleFromCookie(): Locale {
  if (typeof document === 'undefined') return defaultLocale;
  const match = document.cookie.match(/(?:^|; )locale=([^;]*)/);
  const cookieValue = match ? decodeURIComponent(match[1]) : null;
  return locales.includes(cookieValue as Locale) ? (cookieValue as Locale) : defaultLocale;
}

// Helper to set locale cookie
function setLocaleCookie(locale: Locale) {
  document.cookie = `locale=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}

export function MasterDataProvider({ children }: MasterDataProviderProps) {
  const [language, setLanguageState] = useState<string>(defaultLocale);
  const [isLoading, setIsLoading] = useState(true);

  // Get translations from next-intl
  const tIntl = useTranslations();

  // Initialize language from cookie on mount
  useEffect(() => {
    const locale = getLocaleFromCookie();
    setLanguageState(locale);
    setIsLoading(false);
  }, []);

  // Language switching - sets cookie and reloads page
  const setLanguage = useCallback((lang: string) => {
    if (!locales.includes(lang as Locale)) return;
    setLocaleCookie(lang as Locale);
    setLanguageState(lang);
    // Reload to get new translations from server
    window.location.reload();
  }, []);

  // Translation function using next-intl
  const t = useCallback((key: string): string => {
    try {
      // next-intl uses dot notation, so we can pass the key directly
      return tIntl(key as any);
    } catch {
      // Fallback: return the key itself if translation not found
      return key;
    }
  }, [tIntl]);

  const reload = useCallback(async () => {
    // No-op for new implementation - translations come from JSON files
  }, []);

  const getAppTitle = useCallback((): string => {
    return language === 'zh' ? '投資性向評估' : 'Investment Propensity Assessment';
  }, [language]);

  // Build languages array from config
  const languages: LanguageDto[] = locales.map((code, index) => ({
    code,
    name: localeLabels[code].name,
    nativeName: localeLabels[code].nativeName,
    flag: localeLabels[code].flag,
    isDefault: code === defaultLocale,
    sortOrder: index + 1,
  }));

  // Stage names (can be extended or fetched if needed)
  const stages: Record<string, { name: string }> = {};

  const value: MasterDataContextType = {
    masterData: null,
    language,
    setLanguage,
    languages,
    isLoading,
    error: null,
    t,
    reload,
    config: null,
    stages,
    getAppTitle,
  };

  return (
    <MasterDataContext.Provider value={value}>
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

// =============================================================================
// OLD IMPLEMENTATION (PRESERVED BUT UNPLUGGED)
// This was the database-based translation system. Keeping for reference.
// =============================================================================
/*
import { paibotApi, MasterDataDto, LanguageDto, AssessmentStageDto, AppConfigDto } from '@/services/paibot-api';

interface MasterDataContextTypeOld {
  masterData: MasterDataDto | null;
  language: string;
  setLanguage: (lang: string) => void;
  languages: LanguageDto[];
  isLoading: boolean;
  error: string | null;
  t: (key: string) => string;
  reload: () => Promise<void>;
  config: AppConfigDto | null;
  stages: Record<string, AssessmentStageDto>;
  getAppTitle: () => string;
}

export function MasterDataProviderOld({ children }: MasterDataProviderProps) {
  const [masterData, setMasterData] = useState<MasterDataDto | null>(null);
  const [language, setLanguageState] = useState<string>('zh');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMasterData = useCallback(async (lang: string) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('[MasterData] Loading data for language:', lang);
      const data = await paibotApi.getMasterData(lang);
      if (data) {
        console.log('[MasterData] Data loaded successfully');
        setMasterData(data);
        if (data.config?.defaultLanguage && lang === 'zh') {
          setLanguageState(data.config.defaultLanguage);
        }
      } else {
        console.warn('[MasterData] API returned no data');
        setError('Failed to load data from API');
      }
    } catch (err) {
      console.error('[MasterData] Error loading data:', err);
      setError('Failed to connect to API');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMasterData(language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLanguage = useCallback((lang: string) => {
    setLanguageState(lang);
    loadMasterData(lang);
  }, [loadMasterData]);

  const reload = useCallback(async () => {
    paibotApi.clearCache();
    await loadMasterData(language);
  }, [language, loadMasterData]);


  const t = useCallback((key: string): string => {
    const parts = key.split('.');
    if (masterData?.translations) {
      let value: any = masterData.translations;
      for (const part of parts) {
        value = value?.[part];
        if (value === undefined) break;
      }
      if (typeof value === 'string') return value;
    }
    return key;
  }, [masterData]);

  const getAppTitle = useCallback((): string => {
    if (masterData?.config?.title) {
      return language === 'zh' ? masterData.config.title.zh : masterData.config.title.en;
    }
    return language === 'zh' ? '投資性向評估' : 'Investment Propensity Assessment';
  }, [masterData, language]);

  // Get available languages
  const languages = masterData?.languages || [
    { code: 'zh', name: '繁體中文', nativeName: '繁體中文', flag: '', isDefault: true, sortOrder: 1 },
    { code: 'en', name: 'English', nativeName: 'English', flag: '', isDefault: false, sortOrder: 2 },
  ];

  // Convenience getters
  const config = masterData?.config || null;
  const stages = masterData?.stages || {};

  const value: MasterDataContextTypeOld = {
    masterData,
    language,
    setLanguage,
    languages,
    isLoading,
    error,
    t,
    reload,
    config,
    stages,
    getAppTitle,
  };

  return (
    <MasterDataContext.Provider value={value}>
      {children}
    </MasterDataContext.Provider>
  );
}
*/
