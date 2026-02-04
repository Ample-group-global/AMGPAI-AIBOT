'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { paibotApi, MasterDataDto, LanguageDto, AssessmentStageDto, AppConfigDto } from '@/services/paibot-api';

interface MasterDataContextType {
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

const MasterDataContext = createContext<MasterDataContextType | undefined>(undefined);

interface MasterDataProviderProps {
  children: ReactNode;
}

export function MasterDataProvider({ children }: MasterDataProviderProps) {
  const [masterData, setMasterData] = useState<MasterDataDto | null>(null);
  const [language, setLanguageState] = useState<string>('zh');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMasterData = useCallback(async (lang: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await paibotApi.getMasterData(lang);
      if (data) {
        setMasterData(data);
        if (data.config?.defaultLanguage && lang === 'zh') {
          setLanguageState(data.config.defaultLanguage);
        }
      } else {
        setError('Failed to load data from API');
      }
    } catch (err) {
      setError('Failed to connect to API');
      console.error('MasterData load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMasterData(language);
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

  const value: MasterDataContextType = {
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

export function useMasterData() {
  const context = useContext(MasterDataContext);
  if (context === undefined) {
    throw new Error('useMasterData must be used within a MasterDataProvider');
  }
  return context;
}
