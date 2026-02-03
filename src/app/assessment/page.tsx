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
import { DynamicIcon } from '@/components/DynamicIcon';


const ArrowLeftIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const SendIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

const SparklesIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);


interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AuthUser {
  userId: string;
  role: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

interface StartSessionResponse {
  sessionId: string;
  question: string;
  stage: string;
  progress: number;
}

interface ChatResponse {
  reply: string;
  stage: string;
  progress: number;
  isComplete: boolean;
}

async function apiCall<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
    return await response.json() as ApiResponse<T>;
  } catch (error) {
    console.error('[API Error]', error);
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



const AUTH_TOKEN_KEY = 'paibot_jwt_token';
const AUTH_USER_KEY = 'paibot_user';

function parseJWT(token: string): { user_id: string; role: string; exp: number } | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = parseJWT(token);
  if (!payload) return true;
  return Date.now() >= payload.exp * 1000;
}


export default function AssessmentPage() {
  const router = useRouter();
  const config = defaultConfig;
  const { language, setLanguage, languages, t, stages, isLoading: isMasterDataLoading } = useMasterData();

  const getStageName = (stageKey: string): string => {
    return stages[stageKey]?.name || stageKey;
  };


  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isAuthenticated = !!user && !!token;

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
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const storedUser = localStorage.getItem(AUTH_USER_KEY);

    if (storedToken && storedUser && !isTokenExpired(storedToken)) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsLoading(false);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    if (!sessionId && isAuthenticated && !isLoading && !isStarting) {
      setIsStarting(true);

      startSession(config.assessmentApiUrl, user?.userId || '', language)
        .then((response) => {
          if (response.success && response.data) {
            setSessionId(response.data.sessionId);
            setMessages([{ role: 'assistant', content: response.data.question }]);
            setProgress(response.data.progress);
            setStage(response.data.stage);
          } else {
            setMessages([{ role: 'assistant', content: t('assessment.chat.error') }]);
            setStage('opening');
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
  }, [isAuthenticated, user?.userId, isLoading, config.assessmentApiUrl, language, t, sessionId, isStarting]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    config.onLogout?.();
  };
  const handleSend = async () => {
    if (!input.trim() || !sessionId || isSending) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsSending(true);

    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      const response = await sendChat(config.assessmentApiUrl, sessionId, userMessage, language);

      if (response.success && response.data) {
        setMessages((prev) => [...prev, { role: 'assistant', content: response.data!.reply }]);
        setProgress(response.data.progress);
        setStage(response.data.stage);

        if (response.data.isComplete) {
          setIsComplete(true);
          config.onComplete?.(sessionId, response.data);
          setTimeout(() => router.push(`/result/${sessionId}`), 3000);
        }
      } else {
        const isRateLimit = response.error?.toLowerCase().includes('rate') || response.error?.includes('TooManyRequests');
        const errorMessage = isRateLimit ? t('assessment.chat.rateLimit') : t('assessment.chat.error');
        setMessages((prev) => [...prev, { role: 'assistant', content: errorMessage }]);
      }
    } catch (error) {
      const errorStr = error instanceof Error ? error.message : String(error);
      const isRateLimit = errorStr.toLowerCase().includes('rate') || errorStr.includes('TooManyRequests');
      const errorMessage = isRateLimit ? t('assessment.chat.rateLimit') : t('assessment.chat.error');
      setMessages((prev) => [...prev, { role: 'assistant', content: errorMessage }]);
    } finally {
      setIsSending(false);
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
  };
  const handleClose = () => setShowCloseDialog(true);
  const handleConfirmClose = () => {
    logout();
    setShowCloseDialog(false);
    config.onClose?.();
    router.push('/');
  };
  if (isLoading || isMasterDataLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#c9a962] to-[#d4b87a] flex items-center justify-center">
            <span className="text-[#0a1628] font-bold text-lg">A</span>
          </div>
          <div className="flex justify-center gap-1 mb-3">
            <span className="w-2 h-2 bg-[#c9a962] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-[#c9a962] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-[#c9a962] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return null;
  }
  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col relative">
      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent className="bg-gradient-to-br from-[#1a2744] to-[#0a1628] border-[#334155] text-white max-w-sm">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <AlertDialogTitle className="text-white text-xl text-center">{t('assessment.close.title')}</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 text-center">{t('assessment.close.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:justify-center">
            <AlertDialogCancel className="border-[#334155] text-gray-300 hover:bg-[#1a2744] hover:text-white hover:border-[#c9a962]/50 rounded-xl">
              {t('assessment.close.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose} className="bg-red-600 hover:bg-red-700 text-white border-0 rounded-xl">
              {t('assessment.close.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <header className="border-b border-white/5 bg-[#0a1628]/90 backdrop-blur-2xl sticky top-0 z-20">
        <div className="container py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={isSending}
              className="gap-1 sm:gap-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg sm:rounded-xl h-8 sm:h-10 px-2 sm:px-3"
            >
              <ArrowLeftIcon />
              <span className="hidden sm:inline text-xs sm:text-sm">{t('assessment.back')}</span>
            </Button>

            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-[#c9a962] to-[#d4b87a] flex items-center justify-center">
                <span className="text-[#0a1628] font-bold text-xs sm:text-sm">A</span>
              </div>
              <h1 className="text-white font-semibold text-xs sm:text-sm hidden xs:block">AMG AI Assistance</h1>
            </div>

            {config.showLanguageSwitcher && (
              <div className="flex rounded-lg sm:rounded-xl overflow-hidden border border-[#334155] bg-[#1a2744]/50 h-8 sm:h-10">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`px-2 sm:px-3 text-xs sm:text-sm font-medium transition-all duration-300 ${language === lang.code
                      ? 'bg-gradient-to-r from-[#c9a962] to-[#d4b87a] text-[#0a1628]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {lang.code === 'zh' ? '中文' : lang.code.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mt-2 sm:mt-3 flex items-center gap-2 sm:gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                <span className="text-[10px] sm:text-xs text-gray-400 truncate max-w-[150px] sm:max-w-none">{getStageName(stage) || 'Getting Started'}</span>
                <span className="text-[10px] sm:text-xs font-medium text-[#c9a962]">{progress}%</span>
              </div>
              <div className="h-1 sm:h-1.5 bg-[#1a2744] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-[#c9a962] to-[#d4b87a]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>
      <main
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto relative z-10"
      >
        <div className="container max-w-3xl py-3 sm:py-4 px-3 sm:px-4">
          <div className="space-y-3 sm:space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 sm:gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className="flex-shrink-0">
                  {msg.role === 'assistant' ? (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#c9a962] to-[#d4b87a] flex items-center justify-center shadow-md">
                      <SparklesIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#0a1628]" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#243352] border border-[#334155] flex items-center justify-center">
                      <DynamicIcon name={t('ui.icon.user')} size={12} className="text-gray-400 sm:w-3.5 sm:h-3.5" />
                    </div>
                  )}
                </div>
                <div className={`max-w-[85%] sm:max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div
                    className={`inline-block px-3 py-2 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl ${msg.role === 'user'
                      ? 'bg-gradient-to-br from-[#c9a962] to-[#d4b87a] text-[#0a1628] rounded-br-md'
                      : 'bg-[#1a2744] text-gray-100 border border-[#334155]/50 rounded-bl-md'
                      }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed text-sm sm:text-[15px]">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9a962] to-[#d4b87a] flex items-center justify-center shadow-md">
                  <SparklesIcon className="h-4 w-4 text-[#0a1628]" />
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl rounded-bl-md bg-[#1a2744] border border-[#334155]/50">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-[#c9a962] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-[#c9a962] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-[#c9a962] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            {isComplete && (
              <div className="text-center py-10">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#c9a962] to-[#d4b87a] flex items-center justify-center">
                  <DynamicIcon name={t('ui.icon.complete')} size={32} className="text-[#0a1628]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-1">{t('assessment.complete.title')}</h3>
                <p className="text-gray-400 text-sm">{t('assessment.complete.subtitle')}</p>
              </div>
            )}

            <div ref={messagesEndRef} className="h-32" />
          </div>
        </div>
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-32 right-6 w-10 h-10 rounded-full bg-[#1a2744] border border-[#334155] shadow-lg flex items-center justify-center text-gray-400 hover:text-white hover:border-[#c9a962]/50 transition-all z-20"
          >
            <ChevronDownIcon />
          </button>
        )}
      </main>
      {!isComplete && (
        <div className="sticky bottom-0 z-20 border-t border-[#1a2744] bg-[#0a1628]">
          <div className="container max-w-3xl py-2 sm:py-3 px-3 sm:px-4">
            <div className="flex items-end gap-2 p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-[#1a2744] border border-[#334155] focus-within:border-[#c9a962]/50 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={t('assessment.chat.placeholder')}
                disabled={isSending || !sessionId}
                rows={1}
                className="flex-1 bg-transparent text-white placeholder:text-gray-500 resize-none outline-none py-2 sm:py-2.5 px-2 sm:px-3 max-h-[100px] sm:max-h-[120px] text-sm sm:text-[15px]"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isSending || !sessionId}
                className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#c9a962] to-[#d4b87a] text-[#0a1628] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
              >
                <SendIcon />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
