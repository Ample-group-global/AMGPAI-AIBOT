// PAIBot Configuration

export interface PAIBotConfig {
  authApiUrl: string;
  assessmentApiUrl: string;
  onClose?: () => void;
  onComplete?: (sessionId: string, result: unknown) => void;
  onLogin?: (userId: string) => void;
  onLogout?: () => void;
  defaultLanguage?: 'zh' | 'en';
  showLanguageSwitcher?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  || (process.env.NODE_ENV === 'development'
    ? 'http://localhost:5164/api'
    : 'https://amgweb3webapp-it-eseqcmg7awggf6hr.southeastasia-01.azurewebsites.net/api');

export const defaultConfig: PAIBotConfig = {
  authApiUrl: API_BASE_URL,
  assessmentApiUrl: `${API_BASE_URL}/AmgPAIAssessment`,
  defaultLanguage: 'zh',
  showLanguageSwitcher: true,
};

let globalConfig: PAIBotConfig = { ...defaultConfig };

export function setConfig(config: Partial<PAIBotConfig>) {
  globalConfig = { ...defaultConfig, ...config };
}

export function getConfig(): PAIBotConfig {
  return globalConfig;
}
