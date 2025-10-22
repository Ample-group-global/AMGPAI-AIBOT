import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'zh' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  zh: {
    // Header
    'app.title': '永續投資傾向評估系統',
    'nav.home': '首頁',
    'nav.back': '返回',
    'nav.retake': '重新測驗',
    
    // Home page
    'home.hero.title': '發現你的永續投資方向',
    'home.hero.subtitle': '透過 AI 對話式評估，深入了解你的投資特性，獲得個人化的永續投資建議',
    'home.feature.risk.title': '風險承受度',
    'home.feature.risk.desc': '評估你的投資風險偏好',
    'home.feature.goals.title': '投資目標',
    'home.feature.goals.desc': '了解你的財務規劃與時間偏好',
    'home.feature.behavior.title': '決策習慣',
    'home.feature.behavior.desc': '識別可能的行為偏誤',
    'home.feature.values.title': '永續價值觀',
    'home.feature.values.desc': '探索你關注的 ESG 議題',
    'home.cta.time': '約 10 分鐘完成評估',
    'home.cta.button': '開始評估',
    'home.benefit.personalized': '個人化推薦',
    'home.benefit.personalized.desc': '基於你的特性推薦適合的投資賽道與 SDG 目標',
    'home.benefit.ai': 'AI 對話體驗',
    'home.benefit.ai.desc': '自然流暢的對話，深入了解你的投資動機與價值觀',
    'home.benefit.report': '專業分析報告',
    'home.benefit.report.desc': '獲得完整的投資人格分析與行為建議',
    'home.footer': '永續投資傾向評估系統 © 2025',
    
    // Assessment page
    'assessment.title': '投資傾向評估',
    'assessment.stage.opening': '開場',
    'assessment.stage.risk': '風險評估',
    'assessment.stage.goals': '目標與時間',
    'assessment.stage.behavior': '行為分析',
    'assessment.stage.values': '價值觀探索',
    'assessment.stage.confirmation': '確認',
    'assessment.stage.complete': '完成',
    'assessment.input.placeholder': '輸入你的回答...',
    'assessment.button.send': '發送',
    'assessment.assistant': '助手',
    'assessment.you': '你',
    'assessment.complete.title': '評估完成！',
    'assessment.complete.subtitle': '正在為你生成個人化的投資建議...',
    
    // Result page
    'result.title': '你的投資傾向分析結果',
    'result.profile.title': '投資人類型',
    'result.scores.risk.title': '風險與時間偏好',
    'result.scores.risk.tolerance': '風險承受度',
    'result.scores.risk.horizon': '投資期限',
    'result.scores.esg.title': 'ESG 價值觀',
    'result.scores.esg.environmental': '環境 (E)',
    'result.scores.esg.social': '社會 (S)',
    'result.scores.esg.governance': '治理 (G)',
    'result.tracks.title': '推薦投資賽道',
    'result.tracks.match': '匹配度',
    'result.tracks.reason': '推薦理由',
    'result.tracks.sdg': '對應 SDG',
    'result.tracks.examples': '投資範例',
    'result.sdg.title': '你的 SDG 優先目標',
    'result.button.home': '返回首頁',
    'result.button.retake': '重新測驗',
    'result.error.title': '無法載入結果',
    'result.error.message': '請確認評估已完成，或重新開始評估。',
    
    // Investor types
    'investor.aggressive': '積極型投資人',
    'investor.balanced': '平衡型投資人',
    'investor.moderate': '穩健型投資人',
    'investor.conservative': '保守型投資人',
    
    // Time horizons
    'time.long': '長期',
    'time.medium': '中期',
    'time.short': '短期',
    
    // Investment tracks
    'track.renewable_energy': '再生能源',
    'track.circular_economy': '循環經濟',
    'track.water_ocean': '水資源與海洋',
    'track.sustainable_agriculture': '永續農業與糧食',
    'track.health_wellbeing': '健康與福祉',
    'track.education_inclusion': '教育與數位包容',
    'track.sustainable_transport': '永續交通與移動',
    'track.financial_inclusion': '金融包容與社會影響',
    'track.biodiversity_nature': '生物多樣性與自然資本',
    'track.tech_innovation': '科技與創新',
  },
  en: {
    // Header
    'app.title': 'Sustainable Investment Assessment',
    'nav.home': 'Home',
    'nav.back': 'Back',
    'nav.retake': 'Retake',
    
    // Home page
    'home.hero.title': 'Discover Your Sustainable Investment Path',
    'home.hero.subtitle': 'Through AI-powered conversation, understand your investment profile and receive personalized sustainable investment recommendations',
    'home.feature.risk.title': 'Risk Tolerance',
    'home.feature.risk.desc': 'Assess your investment risk preference',
    'home.feature.goals.title': 'Investment Goals',
    'home.feature.goals.desc': 'Understand your financial planning and time horizon',
    'home.feature.behavior.title': 'Decision Patterns',
    'home.feature.behavior.desc': 'Identify potential behavioral biases',
    'home.feature.values.title': 'Sustainability Values',
    'home.feature.values.desc': 'Explore your ESG priorities',
    'home.cta.time': 'Complete in ~10 minutes',
    'home.cta.button': 'Start Assessment',
    'home.benefit.personalized': 'Personalized Recommendations',
    'home.benefit.personalized.desc': 'Get investment track and SDG recommendations based on your profile',
    'home.benefit.ai': 'AI Conversation',
    'home.benefit.ai.desc': 'Natural dialogue to deeply understand your investment motivations and values',
    'home.benefit.report': 'Professional Analysis',
    'home.benefit.report.desc': 'Receive comprehensive investor personality analysis and behavioral insights',
    'home.footer': 'Sustainable Investment Assessment © 2025',
    
    // Assessment page
    'assessment.title': 'Investment Assessment',
    'assessment.stage.opening': 'Opening',
    'assessment.stage.risk': 'Risk Assessment',
    'assessment.stage.goals': 'Goals & Timeline',
    'assessment.stage.behavior': 'Behavioral Analysis',
    'assessment.stage.values': 'Values Exploration',
    'assessment.stage.confirmation': 'Confirmation',
    'assessment.stage.complete': 'Complete',
    'assessment.input.placeholder': 'Type your response...',
    'assessment.button.send': 'Send',
    'assessment.assistant': 'Assistant',
    'assessment.you': 'You',
    'assessment.complete.title': 'Assessment Complete!',
    'assessment.complete.subtitle': 'Generating your personalized investment recommendations...',
    
    // Result page
    'result.title': 'Your Investment Profile Analysis',
    'result.profile.title': 'Investor Type',
    'result.scores.risk.title': 'Risk & Time Preference',
    'result.scores.risk.tolerance': 'Risk Tolerance',
    'result.scores.risk.horizon': 'Time Horizon',
    'result.scores.esg.title': 'ESG Values',
    'result.scores.esg.environmental': 'Environmental (E)',
    'result.scores.esg.social': 'Social (S)',
    'result.scores.esg.governance': 'Governance (G)',
    'result.tracks.title': 'Recommended Investment Tracks',
    'result.tracks.match': 'Match',
    'result.tracks.reason': 'Recommendation Reason',
    'result.tracks.sdg': 'Related SDGs',
    'result.tracks.examples': 'Investment Examples',
    'result.sdg.title': 'Your Priority SDGs',
    'result.button.home': 'Home',
    'result.button.retake': 'Retake Assessment',
    'result.error.title': 'Unable to Load Results',
    'result.error.message': 'Please ensure the assessment is complete, or start a new assessment.',
    
    // Investor types
    'investor.aggressive': 'Aggressive Investor',
    'investor.balanced': 'Balanced Investor',
    'investor.moderate': 'Moderate Investor',
    'investor.conservative': 'Conservative Investor',
    
    // Time horizons
    'time.long': 'Long-term',
    'time.medium': 'Medium-term',
    'time.short': 'Short-term',
    
    // Investment tracks
    'track.renewable_energy': 'Renewable Energy',
    'track.circular_economy': 'Circular Economy',
    'track.water_ocean': 'Water & Ocean',
    'track.sustainable_agriculture': 'Sustainable Agriculture',
    'track.health_wellbeing': 'Health & Wellbeing',
    'track.education_inclusion': 'Education & Digital Inclusion',
    'track.sustainable_transport': 'Sustainable Transport',
    'track.financial_inclusion': 'Financial Inclusion',
    'track.biodiversity_nature': 'Biodiversity & Nature',
    'track.tech_innovation': 'Technology & Innovation',
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'en' || saved === 'zh') ? saved : 'zh';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['zh']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

