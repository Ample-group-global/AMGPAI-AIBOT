'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { defaultConfig } from '@/config';
import { useMasterData } from '@/contexts/MasterDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { DynamicIcon } from '@/components/DynamicIcon';
import Image from 'next/image';
import { ApiResponse, AssessmentResult, MBTI_DIMENSIONS, getResult } from '@/types/assessment';

const SparklesIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const CheckIcon = ({ className = "h-3 w-3" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);

interface Message {
  role: 'user' | 'assistant';
  content: string;
  questionLabel?: string;
}

interface StartSessionResponse {
  sessionId: string;
  question: string;
  stage: string;
  progress: number;
  options?: string[];
}

interface ChatResponse {
  reply: string;
  stage: string;
  progress: number;
  isComplete: boolean;
  options?: string[];
  investorMbti?: {
    typeCode: string;
    typeName: string;
    coreTraits?: string;
    investmentStyle?: string;
    strengths?: string;
    blindSpots?: string;
  };
  isRejected?: boolean;
  rejectionReason?: string;
}

async function apiCall<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      credentials: 'include',
    });
    return await response.json() as ApiResponse<T>;
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function startSession(apiUrl: string, userId: string, language: string): Promise<ApiResponse<StartSessionResponse>> {
  return apiCall<StartSessionResponse>(`${apiUrl}/StartSession`, {
    method: 'POST',
    body: JSON.stringify({ userId, language }),
  });
}

async function sendChat(apiUrl: string, sessionId: string, message: string, language: string): Promise<ApiResponse<ChatResponse>> {
  return apiCall<ChatResponse>(`${apiUrl}/Chat`, {
    method: 'POST',
    body: JSON.stringify({ sessionId, message, language }),
  });
}


// MBTI Assessment Stages
const ASSESSMENT_STAGES = [
  { key: 'welcome', icon: '1', label: { en: 'Start', zh: '开始' } },
  { key: 'compliance', icon: '2', label: { en: 'Verify', zh: '验证' } },
  { key: 'dimension_gs', icon: 'G', label: { en: 'G/S', zh: 'G/S' } },
  { key: 'dimension_di', icon: 'D', label: { en: 'D/I', zh: 'D/I' } },
  { key: 'dimension_lv', icon: 'L', label: { en: 'L/V', zh: 'L/V' } },
  { key: 'dimension_pa', icon: 'P', label: { en: 'P/A', zh: 'P/A' } },
  { key: 'complete', icon: '★', label: { en: 'Result', zh: '结果' } },
];

function getStageIndex(currentStage: string): number {
  if (currentStage === 'welcome') return 0;
  if (currentStage.includes('compliance')) return 1;
  if (currentStage === 'dimension_gs') return 2;
  if (currentStage === 'dimension_di') return 3;
  if (currentStage === 'dimension_lv') return 4;
  if (currentStage === 'dimension_pa') return 5;
  if (currentStage === 'summary' || currentStage === 'complete') return 6;
  if (currentStage === 'rejected') return -1;
  return 0;
}


export default function AssessmentPage() {
  const router = useRouter();
  const config = defaultConfig;
  const { language, setLanguage, languages, t, stages, isLoading: isMasterDataLoading } = useMasterData();

  const getStageName = (stageKey: string): string => {
    const mbtiStageNames: Record<string, { en: string; zh: string }> = {
      welcome: { en: 'Welcome', zh: '欢迎' },
      compliance_nationality: { en: 'Nationality Check', zh: '国籍确认' },
      compliance_qualification: { en: 'Qualification Check', zh: '资格确认' },
      dimension_gs: { en: 'Risk Orientation', zh: '风险取向' },
      dimension_di: { en: 'Analysis Method', zh: '分析方式' },
      dimension_lv: { en: 'Decision Style', zh: '决策风格' },
      dimension_pa: { en: 'Action Mode', zh: '行动模式' },
      summary: { en: 'Personality Report', zh: '性格报告' },
      complete: { en: 'Complete', zh: '完成' },
      rejected: { en: 'Assessment Ended', zh: '评估结束' },
    };

    if (stages[stageKey]?.name) {
      return stages[stageKey].name;
    }

    const fallback = mbtiStageNames[stageKey];
    if (fallback) {
      return language === 'zh' ? fallback.zh : fallback.en;
    }

    return stageKey;
  };

  const { user, isAuthenticated, isLoading: isAuthLoading, logout: authLogout } = useAuth();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [isLoadingResult, setIsLoadingResult] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const personalityQuestionCount = useRef(0);

  const currentStageIndex = getStageIndex(stage);

  const handleScroll = useCallback(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthLoading, isAuthenticated, router]);

  // Track the language used to start the session
  const sessionLanguageRef = useRef<string | null>(null);

  // Reset session when language changes
  useEffect(() => {
    if (sessionId && sessionLanguageRef.current && sessionLanguageRef.current !== language) {
      // Language changed, reset session to restart with new language
      setSessionId(null);
      setMessages([]);
      setProgress(0);
      setStage('');
      setIsComplete(false);
      setAssessmentResult(null);
      setOptions([]);
      setIsStarting(false);
      personalityQuestionCount.current = 0;
      sessionLanguageRef.current = null;
    }
  }, [language, sessionId]);

  useEffect(() => {
    if (!sessionId && isAuthenticated && !isAuthLoading && !isStarting) {
      setIsStarting(true);

      startSession(config.assessmentApiUrl, user?.id || '', language)
        .then((response) => {
          if (response.success && response.data) {
            setSessionId(response.data.sessionId);
            sessionLanguageRef.current = language; // Track the language used for this session
            setMessages([{ role: 'assistant', content: response.data.question }]);
            setProgress(response.data.progress);
            setStage(response.data.stage);
            setOptions(response.data.options || []);
          } else {
            setMessages([{ role: 'assistant', content: t('assessment.chat.error') }]);
            setStage('opening');
            setOptions([]);
          }
        })
        .catch(() => {
          setMessages([{ role: 'assistant', content: t('assessment.chat.error') }]);
          setStage('opening');
        })
        .finally(() => {
          setIsStarting(false);
        });
    }
  }, [isAuthenticated, user?.id, isAuthLoading, config.assessmentApiUrl, language, t, sessionId, isStarting]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch result when assessment is complete
  useEffect(() => {
    if (isComplete && sessionId && !assessmentResult && !isLoadingResult) {
      setIsLoadingResult(true);
      getResult(config.assessmentApiUrl, sessionId)
        .then((response) => {
          if (response.success && response.data) {
            setAssessmentResult(response.data);
          }
        })
        .catch(() => {})
        .finally(() => {
          setIsLoadingResult(false);
        });
    }
  }, [isComplete, sessionId, assessmentResult, isLoadingResult, config.assessmentApiUrl]);

  const logout = async () => {
    await authLogout();
    config.onLogout?.();
  };

  const handleOptionClick = async (option: string) => {
    if (!sessionId || isSending) return;

    setMessages((prev) => [...prev, { role: 'user', content: option }]);
    setIsSending(true);
    setOptions([]);

    try {
      const response = await sendChat(config.assessmentApiUrl, sessionId, option, language);

      if (response.success && response.data) {
        // Track question numbering for personality dimension stages
        const isDimensionStage = response.data.stage.startsWith('dimension_');
        const hasOptions = response.data.options && response.data.options.length > 0;
        let questionLabel: string | undefined;

        if (isDimensionStage && hasOptions && !response.data.isComplete) {
          personalityQuestionCount.current += 1;
          questionLabel = `Q${personalityQuestionCount.current}/8`;
        }

        setMessages((prev) => [...prev, { role: 'assistant', content: response.data!.reply, questionLabel }]);
        setProgress(response.data.progress);
        setStage(response.data.stage);
        setOptions(response.data.options || []);

        if (response.data.isComplete) {
          setIsComplete(true);
          setOptions([]);
          config.onComplete?.(sessionId, response.data);
        }
      } else {
        const isRateLimit = response.error?.toLowerCase().includes('rate') || response.error?.includes('TooManyRequests');
        const errorMessage = isRateLimit ? t('assessment.chat.rateLimit') : t('assessment.chat.error');
        setMessages((prev) => [...prev, { role: 'assistant', content: errorMessage }]);
        setOptions([]);
      }
    } catch (error) {
      const errorStr = error instanceof Error ? error.message : String(error);
      const isRateLimit = errorStr.toLowerCase().includes('rate') || errorStr.includes('TooManyRequests');
      const errorMessage = isRateLimit ? t('assessment.chat.rateLimit') : t('assessment.chat.error');
      setMessages((prev) => [...prev, { role: 'assistant', content: errorMessage }]);
      setOptions([]);
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => setShowCloseDialog(true);
  const handleConfirmClose = async () => {
    await logout();
    setShowCloseDialog(false);
    config.onClose?.();
    router.push('/');
  };

  const handleRetakeAssessment = () => {
    setSessionId(null);
    setMessages([]);
    setProgress(0);
    setStage('');
    setIsComplete(false);
    setAssessmentResult(null);
    setOptions([]);
    setIsStarting(false);
    personalityQuestionCount.current = 0;
    // The useEffect will automatically start a new session
  };

  if (isAuthLoading || isMasterDataLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-2xl bg-gradient-to-br from-[#c9a962] to-[#d4b87a] flex items-center justify-center shadow-2xl shadow-[#c9a962]/30">
            <span className="text-[#0a1628] font-black text-xl sm:text-2xl tracking-tight">PAI</span>
          </div>
          <div className="flex justify-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            <span className="w-2 h-2 sm:w-3 sm:h-3 bg-[#c9a962] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 sm:w-3 sm:h-3 bg-[#c9a962] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 sm:w-3 sm:h-3 bg-[#c9a962] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-gray-400 font-medium text-sm sm:text-base">Loading Assessment...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const investorMBTI = assessmentResult?.scores?.investor_mbti;

  // Render Result View
  if (isComplete && assessmentResult) {
    return (
      <div key="result" className="min-h-screen bg-[#0a1628]">
        {/* Alert Dialog for Close */}
        <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
          <AlertDialogContent className="bg-gradient-to-br from-[#1a2744] to-[#0a1628] border-[#334155] text-white max-w-[90vw] sm:max-w-sm rounded-2xl mx-4">
            <AlertDialogHeader>
              <div className="flex justify-center mb-3 sm:mb-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <AlertDialogTitle className="text-white text-lg sm:text-xl text-center">{t('assessment.close.title')}</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400 text-center text-sm sm:text-base">{t('assessment.close.description')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-3 sm:justify-center flex-col sm:flex-row">
              <AlertDialogCancel className="border-[#334155] text-gray-300 hover:bg-[#1a2744] hover:text-white hover:border-[#c9a962]/50 rounded-xl h-10 sm:h-11 text-sm sm:text-base">
                {t('assessment.close.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmClose} className="bg-red-600 hover:bg-red-700 text-white border-0 rounded-xl h-10 sm:h-11 text-sm sm:text-base">
                {t('assessment.close.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Header with Stage Progress */}
        <header className="border-b border-white/5 bg-[#0a1628]/95 backdrop-blur-xl sticky top-0 z-20">
          <div className="container px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            {/* Top Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <Image
                  src="/logo.png"
                  alt="Ample Group Global"
                  width={100}
                  height={25}
                  className="object-contain w-[80px] sm:w-[100px] md:w-[120px] h-auto"
                />
              </div>

              {/* Center Title - Hidden on mobile */}
              <div className="hidden lg:flex items-center gap-3">
                <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-xl bg-gradient-to-br from-[#c9a962] to-[#d4b87a] flex items-center justify-center shadow-lg shadow-[#c9a962]/20">
                  <span className="text-[#0a1628] font-black text-[10px] xl:text-xs">PAI</span>
                </div>
                <h1 className="text-white font-semibold text-sm xl:text-base">Investor Personality Assessment</h1>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex rounded-lg sm:rounded-xl overflow-hidden border border-[#334155] bg-[#1a2744]/50 h-8 sm:h-10">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`px-2 sm:px-3 md:px-4 text-xs sm:text-sm font-medium transition-all duration-300 ${language === lang.code
                        ? 'bg-gradient-to-r from-[#c9a962] to-[#d4b87a] text-[#0a1628]'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      {lang.code === 'zh' ? '中文' : lang.code.toUpperCase()}
                    </button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="h-8 sm:h-10 px-2 sm:px-4 border-[#334155] text-gray-300 hover:bg-[#1a2744] hover:text-white hover:border-[#c9a962]/50 rounded-lg sm:rounded-xl text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">{t('assessment.back')}</span>
                  <svg className="sm:hidden w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            </div>

            {/* Stage Progress - Completed State */}
            <div className="mt-4 sm:mt-5">
              <div className="bg-[#1a2744]/40 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-[#334155]/30">
                <div className="relative px-2 sm:px-4">
                  {/* Progress Line Background */}
                  <div className="absolute top-[16px] sm:top-[20px] left-6 sm:left-10 right-6 sm:right-10 h-1 bg-[#0a1628] rounded-full" />
                  {/* Progress Line Active - Full width for completed */}
                  <div
                    className="absolute top-[16px] sm:top-[20px] left-6 sm:left-10 h-1 bg-gradient-to-r from-[#c9a962] to-[#d4b87a] rounded-full transition-all duration-700 ease-out"
                    style={{ width: 'calc(100% - 48px)' }}
                  />

                  {/* Stage Indicators */}
                  <div className="relative flex justify-between">
                    {ASSESSMENT_STAGES.map((stageItem, index) => (
                      <div key={stageItem.key} className="flex flex-col items-center relative z-10">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all duration-500 bg-gradient-to-br from-[#c9a962] to-[#d4b87a] text-[#0a1628] shadow-md shadow-[#c9a962]/40">
                          <CheckIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                        <span className="mt-1.5 sm:mt-2 text-[9px] sm:text-[11px] font-medium text-[#c9a962]">
                          {language === 'zh' ? stageItem.label.zh : stageItem.label.en}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Current Stage Indicator + Progress Bar */}
                <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-[#334155]/30">
                  {/* Left Side - Current Stage Name */}
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#c9a962] shadow-lg shadow-[#c9a962]/50"></span>
                    <span className="text-xs sm:text-sm font-semibold text-white">
                      {getStageName('complete')}
                    </span>
                  </div>

                  {/* Right Side - Progress Bar */}
                  <div className="flex items-center gap-3">
                    <div className="w-[100px] sm:w-[180px] h-1.5 bg-[#0a1628] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#c9a962] to-[#d4b87a] rounded-full w-full" />
                    </div>
                    <span className="text-sm font-bold text-[#c9a962] min-w-[45px] text-right">100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Result Content */}
        <main className="container px-3 sm:px-4 lg:px-6 max-w-5xl py-4 sm:py-6 md:py-8 lg:py-10">
          {investorMBTI?.type_code ? (
            <div className="space-y-4 sm:space-y-6">
              {/* MBTI Result Card */}
              <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#c9a962] via-[#d4b87a] to-[#c9a962] p-0.5 sm:p-1 shadow-2xl shadow-[#c9a962]/20">
                <div className="rounded-[14px] sm:rounded-[22px] bg-gradient-to-br from-[#c9a962] to-[#d4b87a] p-4 sm:p-6 md:p-8">
                  {/* Type Header */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-6 sm:mb-8 text-center sm:text-left">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl sm:rounded-3xl bg-[#0a1628] flex items-center justify-center shadow-2xl flex-shrink-0 ring-4 ring-[#0a1628]/20">
                      <span className="text-3xl sm:text-4xl md:text-5xl font-black text-[#c9a962] tracking-wider">{investorMBTI.type_code}</span>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0a1628] leading-tight">
                        {language === 'zh' ? investorMBTI.type_name : (investorMBTI.type_name_en || investorMBTI.type_name)}
                      </h2>
                      <p className="text-base sm:text-lg md:text-xl text-[#0a1628]/60 mt-1 sm:mt-2 font-medium">
                        {language === 'zh' ? (investorMBTI.type_name_en || '') : investorMBTI.type_name}
                      </p>
                    </div>
                  </div>

                  {/* Four Dimensions - Horizontal 2x2 Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    {(['gs', 'di', 'lv', 'pa'] as const).map((dim) => {
                      const dimension = MBTI_DIMENSIONS[dim];
                      const data = investorMBTI[dim];
                      if (!data) return null;

                      const isRight = data.letter === dimension.rightLetter;
                      const rawScore = data.score ?? 0;
                      // API returns score as 0, 1, or 2 (count of right-side answers out of 2 questions per dimension)
                      // 0 = both answers left, 1 = mixed, 2 = both answers right
                      // Normalize to percentage: (score / 2) * 100
                      const normalizedPercent = (rawScore / 2) * 100;
                      // Tendency strength: how strongly user leans towards their result letter
                      const tendencyStrength = isRight ? normalizedPercent : (100 - normalizedPercent);
                      // Bar fill from dominant side
                      const barFillPercent = isRight ? normalizedPercent : (100 - normalizedPercent);
                      // Minimum visible fill
                      const displayFill = Math.max(barFillPercent, 15);

                      return (
                        <div key={dim} className="bg-[#0a1628]/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3.5 sm:p-5 relative overflow-hidden">
                          {/* Subtle accent line on dominant side */}
                          <div className={`absolute top-0 ${isRight ? 'right-0' : 'left-0'} w-1 h-full bg-[#0a1628]/30 rounded-full`} />

                          {/* Header: Label + Letter Badge */}
                          <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <h4 className="text-xs sm:text-sm font-bold text-[#0a1628]">
                              {language === 'zh' ? dimension.labelZh : dimension.labelEn}
                            </h4>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <span className="text-sm sm:text-base font-black text-[#c9a962] bg-[#0a1628] w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-lg">
                                {data.letter}
                              </span>
                            </div>
                          </div>

                          {/* Bipolar Scale Bar */}
                          <div className="mb-2">
                            <div className="relative h-2.5 sm:h-3 bg-[#0a1628]/15 rounded-full overflow-hidden">
                              {/* Center marker */}
                              <div className="absolute left-1/2 top-0 w-px h-full bg-[#0a1628]/20 z-10" />
                              {/* Fill bar - direction based on dominant side */}
                              {isRight ? (
                                <div
                                  className="absolute right-0 top-0 h-full bg-gradient-to-l from-[#0a1628]/70 to-[#0a1628]/30 rounded-full transition-all duration-700"
                                  style={{ width: `${displayFill}%` }}
                                />
                              ) : (
                                <div
                                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#0a1628]/70 to-[#0a1628]/30 rounded-full transition-all duration-700"
                                  style={{ width: `${displayFill}%` }}
                                />
                              )}
                            </div>
                          </div>

                          {/* Scale Labels - Left & Right */}
                          <div className="flex justify-between items-center">
                            <div className={`flex items-center gap-1 sm:gap-1.5 ${!isRight ? '' : 'opacity-40'}`}>
                              <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center text-[10px] sm:text-xs font-bold ${!isRight ? 'bg-[#0a1628] text-[#c9a962]' : 'bg-[#0a1628]/15 text-[#0a1628]/50'}`}>
                                {dimension.leftLetter}
                              </span>
                              <span className={`text-[10px] sm:text-xs font-medium ${!isRight ? 'text-[#0a1628]' : 'text-[#0a1628]/40'}`}>
                                {language === 'zh' ? dimension.leftZh : dimension.leftEn}
                              </span>
                            </div>

                            {/* Tendency Percentage */}
                            <span className="text-xs sm:text-sm font-bold text-[#0a1628]/70">
                              {tendencyStrength}%
                            </span>

                            <div className={`flex items-center gap-1 sm:gap-1.5 ${isRight ? '' : 'opacity-40'}`}>
                              <span className={`text-[10px] sm:text-xs font-medium ${isRight ? 'text-[#0a1628]' : 'text-[#0a1628]/40'}`}>
                                {language === 'zh' ? dimension.rightZh : dimension.rightEn}
                              </span>
                              <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center text-[10px] sm:text-xs font-bold ${isRight ? 'bg-[#0a1628] text-[#c9a962]' : 'bg-[#0a1628]/15 text-[#0a1628]/50'}`}>
                                {dimension.rightLetter}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Strengths & Blind Spots */}
                  {((investorMBTI.strengths && investorMBTI.strengths.length > 0) ||
                    (investorMBTI.blind_spots && investorMBTI.blind_spots.length > 0)) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {investorMBTI.strengths && investorMBTI.strengths.length > 0 && (
                          <div className="bg-[#0a1628]/8 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-[#0a1628]/10">
                            <h4 className="text-sm sm:text-base font-bold text-[#0a1628] mb-3 sm:mb-4 flex items-center gap-2">
                              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-800/25 flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </span>
                              {language === 'zh' ? '優勢' : 'Strengths'}
                            </h4>
                            <ul className="space-y-1.5 sm:space-y-2">
                              {(language === 'zh' ? investorMBTI.strengths : (investorMBTI.strengths_en || investorMBTI.strengths))?.map((item, idx) => (
                                <li key={idx} className="text-xs sm:text-sm text-[#0a1628]/75 flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-700/70 mt-1.5 flex-shrink-0" />
                                  <span className="flex-1 leading-relaxed">{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {investorMBTI.blind_spots && investorMBTI.blind_spots.length > 0 && (
                          <div className="bg-[#0a1628]/8 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-[#0a1628]/10">
                            <h4 className="text-sm sm:text-base font-bold text-[#0a1628] mb-3 sm:mb-4 flex items-center gap-2">
                              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-800/25 flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                </svg>
                              </span>
                              {language === 'zh' ? '盲點' : 'Blind Spots'}
                            </h4>
                            <ul className="space-y-1.5 sm:space-y-2">
                              {(language === 'zh' ? investorMBTI.blind_spots : (investorMBTI.blind_spots_en || investorMBTI.blind_spots))?.map((item, idx) => (
                                <li key={idx} className="text-xs sm:text-sm text-[#0a1628]/75 flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-700/70 mt-1.5 flex-shrink-0" />
                                  <span className="flex-1 leading-relaxed">{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-2 sm:pt-4 pb-4 sm:pb-6">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="h-11 sm:h-12 px-6 sm:px-10 border-2 border-[#c9a962]/50 text-[#c9a962] bg-transparent hover:bg-[#c9a962]/10 hover:border-[#c9a962] rounded-full text-sm sm:text-base font-semibold transition-all duration-300 w-full sm:w-auto"
                >
                  {t('assessment.back')}
                </Button>
                <Button
                  onClick={handleRetakeAssessment}
                  className="h-11 sm:h-12 px-6 sm:px-10 bg-gradient-to-r from-[#c9a962] to-[#d4b87a] text-[#0a1628] hover:shadow-xl hover:shadow-[#c9a962]/30 hover:scale-[1.02] rounded-full text-sm sm:text-base font-bold shadow-lg shadow-[#c9a962]/20 transition-all duration-300 w-full sm:w-auto"
                >
                  {t('result.button.retake')}
                </Button>
              </div>
            </div>
          ) : (
            // Loading result
            <div className="flex items-center justify-center py-16 sm:py-20">
              <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto border-4 border-[#1a2744] border-t-[#c9a962] rounded-full animate-spin mb-3 sm:mb-4"></div>
                <p className="text-gray-400 text-sm sm:text-base">{t('result.loading')}</p>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div key="chat" className="min-h-screen bg-[#0a1628] flex flex-col relative">
      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent className="bg-gradient-to-br from-[#1a2744] to-[#0a1628] border-[#334155] text-white max-w-[90vw] sm:max-w-sm rounded-2xl mx-4">
          <AlertDialogHeader>
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <AlertDialogTitle className="text-white text-lg sm:text-xl text-center">{t('assessment.close.title')}</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 text-center text-sm sm:text-base">{t('assessment.close.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-3 sm:justify-center flex-col sm:flex-row">
            <AlertDialogCancel className="border-[#334155] text-gray-300 hover:bg-[#1a2744] hover:text-white hover:border-[#c9a962]/50 rounded-xl h-10 sm:h-11 text-sm sm:text-base">
              {t('assessment.close.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose} className="bg-red-600 hover:bg-red-700 text-white border-0 rounded-xl h-10 sm:h-11 text-sm sm:text-base">
              {t('assessment.close.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <header className="border-b border-white/5 bg-[#0a1628]/95 backdrop-blur-xl sticky top-0 z-20">
        <div className="container px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          {/* Top Row - Logo, Title, Language */}
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Image
                src="/logo.png"
                alt="Ample Group Global"
                width={100}
                height={25}
                className="object-contain w-[80px] sm:w-[100px] md:w-[120px] h-auto"
              />
            </div>

            {/* Center Title - Hidden on mobile/tablet */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-xl bg-gradient-to-br from-[#c9a962] to-[#d4b87a] flex items-center justify-center shadow-lg shadow-[#c9a962]/20">
                <span className="text-[#0a1628] font-black text-[10px] xl:text-xs">PAI</span>
              </div>
              <h1 className="text-white font-semibold text-sm xl:text-base">Investor Personality Assessment</h1>
            </div>

            {/* Language & Exit */}
            <div className="flex items-center gap-2 sm:gap-3">
              {config.showLanguageSwitcher && (
                <div className="flex rounded-lg sm:rounded-xl overflow-hidden border border-[#334155] bg-[#1a2744]/50 h-8 sm:h-10">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`px-2 sm:px-3 md:px-4 text-xs sm:text-sm font-medium transition-all duration-300 ${language === lang.code
                        ? 'bg-gradient-to-r from-[#c9a962] to-[#d4b87a] text-[#0a1628]'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      {lang.code === 'zh' ? '中文' : lang.code.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSending}
                className="h-8 sm:h-10 px-2 sm:px-4 border-[#334155] text-gray-300 hover:bg-[#1a2744] hover:text-white hover:border-[#c9a962]/50 rounded-lg sm:rounded-xl text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">{t('assessment.back')}</span>
                <svg className="sm:hidden w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </div>

          {/* Progress Section - Improved Design */}
          <div className="mt-4 sm:mt-5">
            <div className="bg-[#1a2744]/40 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-[#334155]/30">
              {/* Stage Progress Track */}
              <div className="relative px-2 sm:px-4">
                {/* Progress Line Background */}
                <div className="absolute top-[16px] sm:top-[20px] left-6 sm:left-10 right-6 sm:right-10 h-1 bg-[#0a1628] rounded-full" />
                {/* Progress Line Active */}
                <div
                  className="absolute top-[16px] sm:top-[20px] left-6 sm:left-10 h-1 bg-gradient-to-r from-[#c9a962] to-[#d4b87a] rounded-full transition-all duration-700 ease-out"
                  style={{ width: `calc(${Math.max(0, (currentStageIndex / (ASSESSMENT_STAGES.length - 1)) * 100)}% - 24px)` }}
                />

                {/* Stage Indicators */}
                <div className="relative flex justify-between">
                  {ASSESSMENT_STAGES.map((stageItem, index) => {
                    const isCompleted = currentStageIndex > index;
                    const isCurrent = currentStageIndex === index;
                    const isRejected = stage === 'rejected';

                    return (
                      <div key={stageItem.key} className="flex flex-col items-center relative z-10">
                        {/* Stage Circle */}
                        <div
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all duration-500 ${isRejected && index > 1
                            ? 'bg-[#1a2744] text-gray-600 border-2 border-[#334155]'
                            : isCompleted
                              ? 'bg-gradient-to-br from-[#c9a962] to-[#d4b87a] text-[#0a1628] shadow-md shadow-[#c9a962]/40'
                              : isCurrent
                                ? 'bg-[#0a1628] text-[#c9a962] border-2 border-[#c9a962] shadow-md shadow-[#c9a962]/30 ring-4 ring-[#c9a962]/10'
                                : 'bg-[#0a1628] text-gray-500 border-2 border-[#334155]'
                            }`}
                        >
                          {isCompleted ? <CheckIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : stageItem.icon}
                        </div>
                        {/* Stage Label */}
                        <span
                          className={`mt-1.5 sm:mt-2 text-[9px] sm:text-[11px] font-medium transition-all duration-300 ${isRejected && index > 1
                            ? 'text-gray-600'
                            : isCompleted
                              ? 'text-[#c9a962]'
                              : isCurrent
                                ? 'text-[#c9a962] font-semibold'
                                : 'text-gray-500'
                            }`}
                        >
                          {language === 'zh' ? stageItem.label.zh : stageItem.label.en}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Current Stage Name + Progress Bar */}
              <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-[#334155]/30">
                {/* Left Side - Current Stage Name */}
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#c9a962] shadow-lg shadow-[#c9a962]/50 animate-pulse"></span>
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    {getStageName(stage) || (language === 'zh' ? '欢迎' : 'Welcome')}
                  </span>
                </div>

                {/* Right Side - Progress Bar */}
                <div className="flex items-center gap-3">
                  <div className="w-[100px] sm:w-[180px] h-1.5 bg-[#0a1628] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#c9a962] to-[#d4b87a] rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-[#c9a962] min-w-[45px] text-right">{progress}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto relative z-10"
      >
        <div className="container max-w-3xl py-4 sm:py-6 px-3 sm:px-4 lg:px-6">
          <div className="space-y-3 sm:space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 sm:gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className="flex-shrink-0">
                  {msg.role === 'assistant' ? (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#c9a962] to-[#d4b87a] flex items-center justify-center shadow-lg shadow-[#c9a962]/20">
                      <SparklesIcon className="h-4 w-4 sm:h-5 sm:w-5 text-[#0a1628]" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#1a2744] border border-[#334155] flex items-center justify-center">
                      <DynamicIcon name={t('ui.icon.user')} size={14} className="text-gray-400 sm:w-4 sm:h-4" />
                    </div>
                  )}
                </div>
                <div className={`max-w-[85%] sm:max-w-[80%] md:max-w-[75%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                  {/* Question Number Badge */}
                  {msg.questionLabel && (
                    <div className="mb-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#c9a962]/15 border border-[#c9a962]/30 text-[#c9a962] text-[10px] sm:text-xs font-bold">
                        {msg.questionLabel}
                      </span>
                    </div>
                  )}
                  <div
                    className={`inline-block px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-4 rounded-xl sm:rounded-2xl ${msg.role === 'user'
                      ? 'bg-gradient-to-br from-[#c9a962] to-[#d4b87a] text-[#0a1628] rounded-br-md shadow-lg shadow-[#c9a962]/10'
                      : 'bg-[#1a2744] text-gray-100 border border-[#334155]/50 rounded-bl-md'
                      }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed text-sm sm:text-[15px]">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Option Buttons */}
            {options.length > 0 && !isSending && (
              <div className="flex flex-col gap-2 sm:gap-3 pl-10 sm:pl-13 pt-2 sm:pt-3">
                {options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(option)}
                    disabled={isSending}
                    className="group text-left px-3 sm:px-4 md:px-5 py-3 sm:py-4 rounded-lg sm:rounded-xl border border-[#c9a962]/20 bg-[#1a2744]/80 text-gray-200 hover:bg-[#c9a962]/10 hover:border-[#c9a962]/40 hover:text-white transition-all duration-300 text-sm sm:text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="flex items-center gap-2 sm:gap-3 md:gap-4">
                      <span className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md sm:rounded-lg bg-[#0a1628] border border-[#334155] group-hover:border-[#c9a962]/50 group-hover:bg-[#c9a962]/10 flex items-center justify-center text-xs sm:text-sm font-semibold text-gray-500 group-hover:text-[#c9a962] transition-all flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="flex-1">{option}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Loading Indicator */}
            {isSending && (
              <div className="flex gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#c9a962] to-[#d4b87a] flex items-center justify-center shadow-lg shadow-[#c9a962]/20">
                  <SparklesIcon className="h-4 w-4 sm:h-5 sm:w-5 text-[#0a1628]" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 md:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl rounded-bl-md bg-[#1a2744] border border-[#334155]/50">
                  <div className="flex gap-1 sm:gap-1.5">
                    <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#c9a962] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#c9a962] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#c9a962] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Loading Result State */}
            {isComplete && isLoadingResult && (
              <div className="text-center py-8 sm:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 border-4 border-[#1a2744] border-t-[#c9a962] rounded-full animate-spin"></div>
                <p className="text-gray-400 font-medium text-sm sm:text-base">Analyzing your personality...</p>
              </div>
            )}

            <div ref={messagesEndRef} className="h-6 sm:h-8" />
          </div>
        </div>

        {/* Scroll to Bottom Button */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-4 sm:bottom-8 right-3 sm:right-6 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[#1a2744] border border-[#334155] shadow-xl flex items-center justify-center text-gray-400 hover:text-white hover:border-[#c9a962]/50 hover:bg-[#1a2744]/80 transition-all z-20"
          >
            <ChevronDownIcon />
          </button>
        )}
      </main>
    </div>
  );
}
