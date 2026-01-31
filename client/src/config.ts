// PAIBot Configuration
// Customize these values when integrating into your project

export interface PAIBotConfig {
  // API URLs
  authApiUrl: string;
  assessmentApiUrl: string;

  // Callbacks
  onClose?: () => void;
  onComplete?: (sessionId: string, result: any) => void;
  onLogin?: (userId: string) => void;
  onLogout?: () => void;

  // UI Options
  defaultLanguage?: 'zh' | 'en';
  showLanguageSwitcher?: boolean;
  title?: {
    zh: string;
    en: string;
  };
}

// Default configuration
const isDevelopment = import.meta.env.DEV;

export const defaultConfig: PAIBotConfig = {
  authApiUrl: isDevelopment
    ? 'http://localhost:5164/api'
    : 'https://amgweb3webapp-it-eseqcmg7awggf6hr.southeastasia-01.azurewebsites.net/api',
  assessmentApiUrl: isDevelopment
    ? 'http://localhost:5164/api/AmgPAIAssessment'
    : 'https://amgweb3webapp-it-eseqcmg7awggf6hr.southeastasia-01.azurewebsites.net/api/AmgPAIAssessment',
  defaultLanguage: 'zh',
  showLanguageSwitcher: true,
  title: {
    zh: '投資性向評估',
    en: 'Investment Propensity Assessment',
  },
};

// Global config instance
let globalConfig: PAIBotConfig = { ...defaultConfig };

export function setConfig(config: Partial<PAIBotConfig>) {
  globalConfig = { ...defaultConfig, ...config };
}

export function getConfig(): PAIBotConfig {
  return globalConfig;
}
