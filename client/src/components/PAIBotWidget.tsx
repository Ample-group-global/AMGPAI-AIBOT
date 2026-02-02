/**
 * PAIBot Widget - Investment Assessment Chatbot
 * Login is handled by the Home page before accessing this widget.
 * Uses REST API instead of tRPC
 */

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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
import { X } from 'lucide-react';
import { PAIBotConfig, defaultConfig } from '@/config';

// ============ Types ============

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AuthUser {
  userId: string;
  role: string;
}

// API Response Types
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

// ============ API Functions ============

async function apiCall<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();
    return data as ApiResponse<T>;
  } catch (error) {
    console.error('[API Error]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function startSession(
  apiUrl: string,
  userId: string,
  language: string
): Promise<ApiResponse<StartSessionResponse>> {
  return apiCall<StartSessionResponse>(`${apiUrl}/StartSession`, {
    method: 'POST',
    body: JSON.stringify({ userId, language }),
  });
}

async function sendChat(
  apiUrl: string,
  sessionId: string,
  message: string,
  language: string
): Promise<ApiResponse<ChatResponse>> {
  return apiCall<ChatResponse>(`${apiUrl}/Chat`, {
    method: 'POST',
    body: JSON.stringify({ sessionId, message, language }),
  });
}

// ============ Texts ============

const texts = {
  en: {
    title: 'Investment Propensity Assessment',
    close: {
      title: 'Cancel Assessment?',
      description: 'Are you sure you want to cancel? Your progress will be lost.',
      cancel: 'Continue',
      confirm: 'Yes, Cancel',
    },
    stage: {
      opening: 'Getting Started',
      risk: 'Risk Assessment',
      goals: 'Investment Goals',
      behavior: 'Behavioral Analysis',
      values: 'Value Preferences',
      confirmation: 'Confirmation',
      complete: 'Complete',
    },
    chat: {
      assistant: 'AI Assistant',
      you: 'You',
      placeholder: 'Enter your answer...',
      send: 'Send',
      loading: 'Loading...',
      error: 'Sorry, an error occurred. Please try again.',
    },
    complete: {
      title: 'Assessment Complete!',
      subtitle: 'Redirecting to your results...',
    },
    langSwitch: { zh: 'Chinese', en: 'EN' },
  },
  zh: {
    title: '投資性向評估',
    close: {
      title: '取消評估？',
      description: '確定要取消嗎？您的進度將會遺失。',
      cancel: '繼續',
      confirm: '是的，取消',
    },
    stage: {
      opening: '開始評估',
      risk: '風險評估',
      goals: '投資目標',
      behavior: '行為分析',
      values: '價值偏好',
      confirmation: '確認資訊',
      complete: '評估完成',
    },
    chat: {
      assistant: 'AI 助理',
      you: '您',
      placeholder: '請輸入您的回答...',
      send: '發送',
      loading: '載入中...',
      error: '抱歉，發生了一些錯誤，請稍後再試。',
    },
    complete: {
      title: '評估完成！',
      subtitle: '正在前往您的結果頁面...',
    },
    langSwitch: { zh: '中文', en: 'EN' },
  },
};

// ============ Auth Helpers ============

const AUTH_TOKEN_KEY = 'paibot_jwt_token';
const AUTH_USER_KEY = 'paibot_user';

function parseJWT(token: string): { user_id: string; role: string; exp: number } | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
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

// ============ Component ============

export interface PAIBotWidgetProps extends Partial<PAIBotConfig> { }

export function PAIBotWidget(props: PAIBotWidgetProps) {
  const config = { ...defaultConfig, ...props };
  const [language, setLanguage] = useState<'zh' | 'en'>(config.defaultLanguage || 'zh');
  const t = texts[language];

  // Auth state
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Chat state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // For local testing: skip auth check and use guest mode
  const isAuthenticated = true; // Always authenticated for testing

  // Initialize - auto-set guest user for local testing
  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const storedUser = localStorage.getItem(AUTH_USER_KEY);

    if (storedToken && storedUser && !isTokenExpired(storedToken)) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    } else {
      // Use guest mode for local testing
      setUser({ userId: 'guest-user', role: 'guest' });
      setToken('guest-token');
    }
    setIsLoading(false);
  }, []);

  // Start assessment when authenticated
  useEffect(() => {
    if (!sessionId && isAuthenticated && !isLoading && !isStarting) {
      setIsStarting(true);
      console.log('[PAIBot] Starting assessment for user:', user?.userId);

      startSession(config.assessmentApiUrl, user?.userId || '', language)
        .then((response) => {
          if (response.success && response.data) {
            console.log('[PAIBot] Assessment started:', response.data);
            setSessionId(response.data.sessionId);
            setMessages([{ role: 'assistant', content: response.data.question }]);
            setProgress(response.data.progress);
            setStage(response.data.stage);
          } else {
            console.error('[PAIBot] Failed to start assessment:', response.error);
            setMessages([{ role: 'assistant', content: t.chat.error }]);
            setStage('opening');
          }
        })
        .catch((error) => {
          console.error('[PAIBot] Failed to start assessment:', error);
          setMessages([{ role: 'assistant', content: t.chat.error }]);
          setStage('opening');
        })
        .finally(() => {
          setIsStarting(false);
        });
    }
  }, [isAuthenticated, user?.userId, isLoading, config.assessmentApiUrl, language, t.chat.error]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Logout helper
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    config.onLogout?.();
  };

  // Chat functions
  const handleSend = async () => {
    if (!input.trim() || !sessionId || isSending) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsSending(true);

    try {
      const response = await sendChat(config.assessmentApiUrl, sessionId, userMessage, language);

      if (response.success && response.data) {
        setMessages((prev) => [...prev, { role: 'assistant', content: response.data!.reply }]);
        setProgress(response.data.progress);
        setStage(response.data.stage);

        if (response.data.isComplete) {
          setIsComplete(true);
          config.onComplete?.(sessionId, response.data);
          setTimeout(() => {
            window.location.href = `/result/${sessionId}`;
          }, 3000);
        }
      } else {
        console.error('[PAIBot] Chat error:', response.error);
        setMessages((prev) => [...prev, { role: 'assistant', content: t.chat.error }]);
      }
    } catch (error) {
      console.error('[PAIBot] Chat error:', error);
      setMessages((prev) => [...prev, { role: 'assistant', content: t.chat.error }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = () => setShowCloseDialog(true);

  const handleConfirmClose = () => {
    logout();
    setShowCloseDialog(false);
    config.onClose?.();
  };

  const stageNames = t.stage as Record<string, string>;

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-spin">⚙️</div>
          <p className="text-gray-600">{t.chat.loading}</p>
        </div>
      </div>
    );
  }

  // Skip auth check for local testing
  // if (!isAuthenticated) {
  //   return null;
  // }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Close Confirmation Dialog */}
      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.close.title}</AlertDialogTitle>
            <AlertDialogDescription>{t.close.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.close.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose} className="bg-red-600 hover:bg-red-700">
              {t.close.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              disabled={isSending}
              className="h-9 w-9"
            >
              <X className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">{config.title?.[language] || t.title}</h1>
            <div className="flex items-center gap-2">
              {config.showLanguageSwitcher && (
                <div className="flex rounded-lg border overflow-hidden">
                  <button
                    onClick={() => setLanguage('zh')}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${language === 'zh' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    {t.langSwitch.zh}
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${language === 'en' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    {t.langSwitch.en}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{stageNames[stage] || t.chat.loading}</span>
              <span className="text-gray-600">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="container py-6 max-w-3xl">
        <div className="space-y-4 mb-24">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <Card className={`max-w-[80%] p-4 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white'}`}>
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0">{msg.role === 'assistant' ? '🤖' : '👤'}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm mb-1">
                      {msg.role === 'assistant' ? t.chat.assistant : t.chat.you}
                    </div>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              </Card>
            </div>
          ))}

          {isSending && (
            <div className="flex justify-start">
              <Card className="max-w-[80%] p-4 bg-white">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🤖</div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {isComplete && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold mb-2">{t.complete.title}</h3>
              <p className="text-gray-600">{t.complete.subtitle}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      {!isComplete && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-white">
          <div className="container py-4 pb-20 md:pb-4 max-w-3xl">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t.chat.placeholder}
                disabled={isSending || !sessionId}
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={!input.trim() || isSending || !sessionId}>
                {t.chat.send}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PAIBotWidget;
