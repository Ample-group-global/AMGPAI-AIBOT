import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocation } from 'wouter';

// Texts for both languages
const texts = {
  en: {
    header: 'Sustainable Investment Assessment',
    hero: {
      title: 'Discover Your Sustainable Investment Path',
      subtitle: 'Through AI-powered conversation, understand your investment profile and receive personalized sustainable investment recommendations',
    },
    features: {
      risk: { title: 'Risk Tolerance', desc: 'Assess your investment risk preference' },
      goals: { title: 'Investment Goals', desc: 'Understand your financial planning and time horizon' },
      behavior: { title: 'Decision Patterns', desc: 'Identify potential behavioral biases' },
      values: { title: 'Sustainability Values', desc: 'Explore your ESG priorities' },
    },
    cta: {
      time: 'Complete in ~10 minutes',
      button: 'Start Assessment',
    },
    benefits: {
      personalized: { title: 'Personalized Recommendations', desc: 'Get investment track and SDG recommendations based on your profile' },
      ai: { title: 'AI Conversation', desc: 'Natural dialogue to deeply understand your investment motivations and values' },
      report: { title: 'Professional Analysis', desc: 'Receive comprehensive investor personality analysis and behavioral insights' },
    },
    footer: 'Sustainable Investment Assessment © 2025',
    login: {
      title: 'Sign In',
      subtitle: 'Enter your email to receive a verification code',
      emailLabel: 'Email Address',
      emailPlaceholder: 'Enter your email',
      sendOtp: 'Send Verification Code',
      otpTitle: 'Enter Verification Code',
      otpSubtitle: 'We sent a code to',
      otpLabel: 'Verification Code',
      otpPlaceholder: 'Enter 6-digit code',
      verify: 'Verify & Sign In',
      back: 'Back',
      resend: 'Resend Code',
      sending: 'Sending...',
      verifying: 'Verifying...',
      invalidEmail: 'Please enter a valid email address',
      invalidOtp: 'Please enter the verification code',
      otpFailed: 'Failed to send code. Please try again.',
      verifyFailed: 'Invalid code. Please try again.',
    },
    langSwitch: { zh: '中文', en: 'EN' },
  },
  zh: {
    header: '永續投資性向評估',
    hero: {
      title: '探索您的永續投資之路',
      subtitle: '透過 AI 對話，了解您的投資特質，獲得個人化的永續投資建議',
    },
    features: {
      risk: { title: '風險承受度', desc: '評估您的投資風險偏好' },
      goals: { title: '投資目標', desc: '了解您的財務規劃與投資期限' },
      behavior: { title: '決策模式', desc: '識別潛在的行為偏誤' },
      values: { title: '永續價值觀', desc: '探索您的 ESG 優先順序' },
    },
    cta: {
      time: '約 10 分鐘完成',
      button: '開始評估',
    },
    benefits: {
      personalized: { title: '個人化建議', desc: '根據您的特質獲得投資賽道與 SDG 推薦' },
      ai: { title: 'AI 對話', desc: '自然對話深入了解您的投資動機與價值觀' },
      report: { title: '專業分析', desc: '獲得完整的投資人格分析與行為洞察' },
    },
    footer: '永續投資性向評估 © 2025',
    login: {
      title: '登入',
      subtitle: '輸入您的電子郵件以接收驗證碼',
      emailLabel: '電子郵件地址',
      emailPlaceholder: '請輸入電子郵件',
      sendOtp: '發送驗證碼',
      otpTitle: '輸入驗證碼',
      otpSubtitle: '我們已發送驗證碼至',
      otpLabel: '驗證碼',
      otpPlaceholder: '請輸入6位數驗證碼',
      verify: '驗證並登入',
      back: '返回',
      resend: '重新發送',
      sending: '發送中...',
      verifying: '驗證中...',
      invalidEmail: '請輸入有效的電子郵件地址',
      invalidOtp: '請輸入驗證碼',
      otpFailed: '發送失敗，請重試。',
      verifyFailed: '驗證碼無效，請重試。',
    },
    langSwitch: { zh: '中文', en: 'EN' },
  },
};

// Storage key - just use jwtToken
const AUTH_TOKEN_KEY = 'paibot_jwt_token';
const AUTH_USER_KEY = 'paibot_user';

// API Base URL
const getApiBaseUrl = () => {
  const isDevelopment = import.meta.env.DEV;
  const envUrl = import.meta.env.VITE_AUTH_API_URL;
  if (envUrl) return envUrl;
  return isDevelopment
    ? 'http://localhost:5164/api'
    : 'https://amgweb3webapp-it-eseqcmg7awggf6hr.southeastasia-01.azurewebsites.net/api';
};

// Parse JWT token
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

// Check if token is expired
function isTokenExpired(token: string): boolean {
  const payload = parseJWT(token);
  if (!payload) return true;
  return Date.now() >= payload.exp * 1000;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const t = texts[language];

  // Login modal state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginStep, setLoginStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleStartAssessment = () => {
    // Check if already logged in
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    if (storedToken && !isTokenExpired(storedToken)) {
      // Already logged in, go to assessment
      setLocation('/assessment');
      return;
    }
    // Clear expired token
    if (storedToken) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    }
    // Show login modal
    setShowLoginModal(true);
  };

  const sendOtp = async () => {
    setLoginError('');
    if (!validateEmail(email)) {
      setLoginError(t.login.invalidEmail);
      return;
    }

    setLoginLoading(true);
    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/AuthPrivy/SendPrivyOtp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error('Failed to send OTP');

      const data = await response.json();
      if (data.isSuccess && data.data?.success) {
        setLoginStep('otp');
      } else {
        setLoginError(t.login.otpFailed);
      }
    } catch {
      setLoginError(t.login.otpFailed);
    } finally {
      setLoginLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoginError('');
    if (!otp.trim()) {
      setLoginError(t.login.invalidOtp);
      return;
    }

    setLoginLoading(true);
    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/AuthPrivy/AuthenticatePrivyOtp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp }),
      });

      const data = await response.json();

      if (!response.ok || !data.dbResponse?.isSuccess || !data.dbResponse?.data) {
        const errorMsg = data.dbResponse?.errorMessage || data.message || 'Authentication failed';
        throw new Error(errorMsg);
      }

      // Extract jwtToken and userId from API response
      const { userId, jwtToken } = data.dbResponse.data;

      // Parse JWT to get role
      const payload = parseJWT(jwtToken);

      // Build user object
      const authUser = {
        userId: userId,
        role: payload?.role || 'NA',
        email: email,
      };

      // Store jwtToken and user in localStorage
      localStorage.setItem(AUTH_TOKEN_KEY, jwtToken);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authUser));

      // Close modal and navigate to assessment
      setShowLoginModal(false);
      resetLoginForm();
      setLocation('/assessment');
    } catch (error: any) {
      setLoginError(error.message || t.login.verifyFailed);
    } finally {
      setLoginLoading(false);
    }
  };

  const resetLoginForm = () => {
    setLoginStep('email');
    setEmail('');
    setOtp('');
    setLoginError('');
  };

  const handleCloseModal = (open: boolean) => {
    if (!open) {
      resetLoginForm();
    }
    setShowLoginModal(open);
  };

  // Language Switcher
  const LanguageSwitcher = () => (
    <div className="flex rounded-lg border overflow-hidden">
      <button
        onClick={() => setLanguage('zh')}
        className={`px-3 py-1.5 text-sm font-medium transition-colors ${
          language === 'zh' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        {t.langSwitch.zh}
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1.5 text-sm font-medium transition-colors ${
          language === 'en' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        {t.langSwitch.en}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              {loginStep === 'email' ? t.login.title : t.login.otpTitle}
            </DialogTitle>
            <DialogDescription className="text-center">
              {loginStep === 'email' ? t.login.subtitle : `${t.login.otpSubtitle} ${email}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {loginStep === 'email' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">{t.login.emailLabel}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t.login.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !loginLoading && sendOtp()}
                    disabled={loginLoading}
                    autoFocus
                  />
                </div>
                {loginError && <p className="text-sm text-red-500 text-center">{loginError}</p>}
                <Button className="w-full" onClick={sendOtp} disabled={loginLoading || !email.trim()}>
                  {loginLoading ? t.login.sending : t.login.sendOtp}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp">{t.login.otpLabel}</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder={t.login.otpPlaceholder}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyPress={(e) => e.key === 'Enter' && !loginLoading && verifyOtp()}
                    disabled={loginLoading}
                    autoFocus
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                  />
                </div>
                {loginError && <p className="text-sm text-red-500 text-center">{loginError}</p>}
                <div className="space-y-2">
                  <Button className="w-full" onClick={verifyOtp} disabled={loginLoading || !otp.trim()}>
                    {loginLoading ? t.login.verifying : t.login.verify}
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setLoginStep('email');
                        setOtp('');
                        setLoginError('');
                      }}
                      disabled={loginLoading}
                    >
                      {t.login.back}
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={sendOtp} disabled={loginLoading}>
                      {t.login.resend}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-blue-900">{t.header}</h1>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">{t.hero.title}</h2>
            <p className="text-xl text-gray-600">{t.hero.subtitle}</p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
            <Card className="p-6 text-center space-y-2 border-2 hover:border-blue-200 transition-colors">
              <div className="text-3xl">📊</div>
              <h3 className="font-semibold">{t.features.risk.title}</h3>
              <p className="text-sm text-gray-600">{t.features.risk.desc}</p>
            </Card>

            <Card className="p-6 text-center space-y-2 border-2 hover:border-blue-200 transition-colors">
              <div className="text-3xl">🎯</div>
              <h3 className="font-semibold">{t.features.goals.title}</h3>
              <p className="text-sm text-gray-600">{t.features.goals.desc}</p>
            </Card>

            <Card className="p-6 text-center space-y-2 border-2 hover:border-blue-200 transition-colors">
              <div className="text-3xl">🧠</div>
              <h3 className="font-semibold">{t.features.behavior.title}</h3>
              <p className="text-sm text-gray-600">{t.features.behavior.desc}</p>
            </Card>

            <Card className="p-6 text-center space-y-2 border-2 hover:border-blue-200 transition-colors">
              <div className="text-3xl">🌍</div>
              <h3 className="font-semibold">{t.features.values.title}</h3>
              <p className="text-sm text-gray-600">{t.features.values.desc}</p>
            </Card>
          </div>

          {/* CTA */}
          <div className="mt-12 space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <span>⏱️</span>
              <span>{t.cta.time}</span>
            </div>
            <Button size="lg" className="px-8 py-6 text-lg" onClick={handleStartAssessment}>
              {t.cta.button}
            </Button>
          </div>

          {/* Benefits */}
          <div className="mt-16 grid md:grid-cols-3 gap-6 text-left">
            <div className="space-y-2">
              <div className="text-blue-600 font-semibold">✓ {t.benefits.personalized.title}</div>
              <p className="text-sm text-gray-600">{t.benefits.personalized.desc}</p>
            </div>

            <div className="space-y-2">
              <div className="text-blue-600 font-semibold">✓ {t.benefits.ai.title}</div>
              <p className="text-sm text-gray-600">{t.benefits.ai.desc}</p>
            </div>

            <div className="space-y-2">
              <div className="text-blue-600 font-semibold">✓ {t.benefits.report.title}</div>
              <p className="text-sm text-gray-600">{t.benefits.report.desc}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8 text-center text-sm text-gray-600">
        <div className="container">
          <p>{t.footer}</p>
        </div>
      </footer>
    </div>
  );
}
