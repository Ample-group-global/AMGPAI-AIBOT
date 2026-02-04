import { getConfig } from '@/config';

export interface LanguageDto {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  isDefault: boolean;
  sortOrder: number;
}

export interface TitleDto {
  zh: string;
  en: string;
}

export interface AppConfigDto {
  defaultLanguage: string;
  showLanguageSwitcher: boolean;
  title: TitleDto;
  maxConversationRounds: number;
  confidenceThreshold: number;
  sessionTimeoutMinutes: number;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
}

export interface AssessmentStageDto {
  key: string;
  name: string;
  nameEn: string;
  description: string | null;
  minRounds: number;
  maxRounds: number;
}

export interface MasterDataDto {
  languages: LanguageDto[];
  config: AppConfigDto;
  stages: Record<string, AssessmentStageDto>;
  translations: Record<string, Record<string, Record<string, string>>>;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class PAIBotApiService {
  private baseUrl: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000;

  constructor() {
    const config = getConfig();
    this.baseUrl = config.assessmentApiUrl;
  }

  private async fetchWithCache<T>(endpoint: string, cacheKey: string): Promise<T | null> {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data as T;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      const result: ApiResponse<T> = await response.json();

      if (result.success && result.data) {
        this.cache.set(cacheKey, { data: result.data, timestamp: Date.now() });
        return result.data;
      }
      return null;
    } catch {
      return null;
    }
  }

  // ============ Master Data (All in One) ============
  async getMasterData(language: string = 'en'): Promise<MasterDataDto | null> {
    return this.fetchWithCache<MasterDataDto>(
      `/PAIBotMasterData?language=${language}`,
      `masterData_${language}`
    );
  }

  // ============ Cache Management ============
  clearCache(): void {
    this.cache.clear();
  }

  async clearServerCache(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/PAIBotClearCache`, {
        method: 'POST',
      });
      const result = await response.json();
      return result.success === true;
    } catch {
      return false;
    }
  }
}

export const paibotApi = new PAIBotApiService();
