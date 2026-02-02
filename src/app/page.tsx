'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { defaultConfig } from '@/config';
import { useMasterData } from '@/contexts/MasterDataContext';
import { DynamicIcon } from '@/components/DynamicIcon';

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

// AMG Logo Component
const AMGLogo = () => (
  <div className="relative group">
    <div className="absolute inset-0 bg-gradient-to-br from-[#c9a962] to-[#d4b87a] rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
    <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-[#c9a962] to-[#d4b87a] flex items-center justify-center shadow-lg">
      <span className="text-[#0a1628] font-bold text-xl">A</span>
    </div>
  </div>
);

export default function Home() {
  const router = useRouter();
  const { language, setLanguage, languages, t, isLoading } = useMasterData();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginStep, setLoginStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleStartAssessment = () => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    if (storedToken && !isTokenExpired(storedToken)) {
      router.push('/assessment');
      return;
    }
    if (storedToken) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    }
    setShowLoginModal(true);
  };

  const sendOtp = async () => {
    setLoginError('');
    if (!validateEmail(email)) {
      setLoginError(t('home.login.invalidEmail'));
      return;
    }

    setLoginLoading(true);
    try {
      const response = await fetch(`${defaultConfig.authApiUrl}/AuthPrivy/SendPrivyOtp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error('Failed to send OTP');

      const data = await response.json();
      if (data.isSuccess && data.data?.success) {
        setLoginStep('otp');
      } else {
        setLoginError(t('home.login.otpFailed'));
      }
    } catch {
      setLoginError(t('home.login.otpFailed'));
    } finally {
      setLoginLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoginError('');
    if (!otp.trim()) {
      setLoginError(t('home.login.invalidOtp'));
      return;
    }

    setLoginLoading(true);
    try {
      const response = await fetch(`${defaultConfig.authApiUrl}/AuthPrivy/AuthenticatePrivyOtp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp }),
      });

      const data = await response.json();

      if (!response.ok || !data.dbResponse?.isSuccess || !data.dbResponse?.data) {
        const errorMsg = data.dbResponse?.errorMessage || data.message || t('home.login.verifyFailed');
        throw new Error(errorMsg);
      }

      const { userId, jwtToken } = data.dbResponse.data;
      const payload = parseJWT(jwtToken);

      const authUser = {
        userId: userId,
        role: payload?.role || 'NA',
        email: email,
      };

      localStorage.setItem(AUTH_TOKEN_KEY, jwtToken);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authUser));

      setShowLoginModal(false);
      resetLoginForm();
      router.push('/assessment');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('home.login.verifyFailed');
      setLoginError(errorMessage);
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
    if (!open) resetLoginForm();
    setShowLoginModal(open);
  };

  const LanguageSwitcher = () => (
    <div className="flex rounded-xl overflow-hidden border border-[#334155] bg-[#1a2744]/50 backdrop-blur-sm">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`px-4 py-2 text-sm font-medium transition-all duration-300 ${
            language === lang.code
              ? 'bg-gradient-to-r from-[#c9a962] to-[#d4b87a] text-[#0a1628]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {lang.code === 'zh' ? '中文' : lang.code.toUpperCase()}
        </button>
      ))}
    </div>
  );

  const features = [
    { iconKey: 'home.features.risk.icon', titleKey: 'home.features.risk.title', descKey: 'home.features.risk.desc' },
    { iconKey: 'home.features.goals.icon', titleKey: 'home.features.goals.title', descKey: 'home.features.goals.desc' },
    { iconKey: 'home.features.behavior.icon', titleKey: 'home.features.behavior.title', descKey: 'home.features.behavior.desc' },
    { iconKey: 'home.features.values.icon', titleKey: 'home.features.values.title', descKey: 'home.features.values.desc' },
  ];

  const benefits = [
    { titleKey: 'home.benefits.personalized.title', descKey: 'home.benefits.personalized.desc' },
    { titleKey: 'home.benefits.ai.title', descKey: 'home.benefits.ai.desc' },
    { titleKey: 'home.benefits.report.title', descKey: 'home.benefits.report.desc' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-20 h-20 border-4 border-[#1a2744] rounded-full"></div>
            <div className="w-20 h-20 border-4 border-t-[#c9a962] border-r-[#c9a962] rounded-full animate-spin absolute top-0 left-0"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[#c9a962] font-bold text-xl">A</span>
            </div>
          </div>
          <p className="mt-6 text-gray-400 animate-pulse">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh relative overflow-hidden noise-overlay">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating orbs */}
        <div className="absolute top-20 left-[10%] w-72 h-72 bg-[#c9a962]/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-40 right-[15%] w-96 h-96 bg-[#c9a962]/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-[20%] w-80 h-80 bg-[#1a2744] rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(201,169,98,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(201,169,98,0.03)_1px,transparent_1px)] bg-[size:64px_64px]"></div>

        {/* Gradient line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-40 bg-gradient-to-b from-transparent via-[#c9a962]/30 to-transparent"></div>
      </div>

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-[#1a2744] to-[#0a1628] border-[#334155] text-white animate-scale-in">
          <div className="absolute inset-0 bg-gradient-to-br from-[#c9a962]/5 to-transparent rounded-lg pointer-events-none"></div>
          <DialogHeader className="relative">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#c9a962] to-[#d4b87a] flex items-center justify-center">
                <span className="text-[#0a1628] font-bold text-2xl">A</span>
              </div>
            </div>
            <DialogTitle className="text-center text-2xl text-white font-bold">
              {loginStep === 'email' ? t('home.login.title') : t('home.login.otpTitle')}
            </DialogTitle>
            <DialogDescription className="text-center text-gray-400">
              {loginStep === 'email'
                ? t('home.login.subtitle')
                : `${t('home.login.otpSubtitle')} ${email}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 relative">
            {loginStep === 'email' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">{t('home.login.emailLabel')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('home.login.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !loginLoading && sendOtp()}
                    disabled={loginLoading}
                    autoFocus
                    className="bg-[#0a1628] border-[#334155] text-white placeholder:text-gray-500 focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 h-12 rounded-xl"
                  />
                </div>
                {loginError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-400 text-center">{loginError}</p>
                  </div>
                )}
                <Button
                  className="w-full h-12 rounded-xl btn-amg-primary text-base"
                  onClick={sendOtp}
                  disabled={loginLoading || !email.trim()}
                >
                  <span>{loginLoading ? t('home.login.sending') : t('home.login.sendOtp')}</span>
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-gray-300">{t('home.login.otpLabel')}</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder={t('home.login.otpPlaceholder')}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyPress={(e) => e.key === 'Enter' && !loginLoading && verifyOtp()}
                    disabled={loginLoading}
                    autoFocus
                    maxLength={6}
                    className="text-center text-3xl tracking-[0.5em] bg-[#0a1628] border-[#334155] text-white placeholder:text-gray-500 placeholder:text-base placeholder:tracking-normal focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 h-16 rounded-xl font-mono"
                  />
                </div>
                {loginError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-400 text-center">{loginError}</p>
                  </div>
                )}
                <div className="space-y-3">
                  <Button
                    className="w-full h-12 rounded-xl btn-amg-primary text-base"
                    onClick={verifyOtp}
                    disabled={loginLoading || !otp.trim()}
                  >
                    <span>{loginLoading ? t('home.login.verifying') : t('home.login.verify')}</span>
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 h-11 rounded-xl border-[#334155] text-gray-400 hover:bg-[#1a2744] hover:text-white hover:border-[#c9a962]/50"
                      onClick={() => { setLoginStep('email'); setOtp(''); setLoginError(''); }}
                      disabled={loginLoading}
                    >
                      {t('home.login.back')}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-11 rounded-xl border-[#334155] text-gray-400 hover:bg-[#1a2744] hover:text-white hover:border-[#c9a962]/50"
                      onClick={sendOtp}
                      disabled={loginLoading}
                    >
                      {t('home.login.resend')}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-[#0a1628]/60 backdrop-blur-xl sticky top-0">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 animate-slide-in">
              <AMGLogo />
              <div>
                <h1 className="text-xl font-bold text-white">{t('home.header.title')}</h1>
                <p className="text-xs text-gray-500">Powered by AI</p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 container py-20 lg:py-28">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="animate-slide-up opacity-0 stagger-1">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#1a2744]/60 backdrop-blur-sm border border-[#334155] mb-8">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c9a962] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#c9a962]"></span>
              </span>
              <span className="text-sm text-gray-300">AI-Powered Investment Assessment</span>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-6 animate-slide-up opacity-0 stagger-2">
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight">
              {t('home.hero.title').split(' ').slice(0, 2).join(' ')}{' '}
              <span className="text-gold-gradient">{t('home.hero.title').split(' ').slice(2, 4).join(' ')}</span>{' '}
              {t('home.hero.title').split(' ').slice(4).join(' ')}
            </h2>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              {t('home.hero.subtitle')}
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mt-20">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group card-amg-premium p-6 rounded-2xl text-left animate-slide-up opacity-0`}
                style={{ animationDelay: `${0.3 + index * 0.1}s` }}
              >
                <div className="relative">
                  <div className="absolute -inset-2 bg-[#c9a962]/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative w-14 h-14 rounded-xl bg-[#0a1628] border border-[#334155] group-hover:border-[#c9a962]/50 flex items-center justify-center mb-5 transition-all duration-500">
                    <DynamicIcon name={t(feature.iconKey)} size={28} className="text-[#c9a962]" />
                  </div>
                </div>
                <h3 className="font-semibold text-white text-lg mb-2 group-hover:text-[#c9a962] transition-colors duration-300">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">{t(feature.descKey)}</p>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-20 space-y-6 animate-slide-up opacity-0" style={{ animationDelay: '0.7s' }}>
            <div className="flex items-center justify-center gap-3 text-gray-500">
              <div className="w-8 h-8 rounded-lg bg-[#1a2744] border border-[#334155] flex items-center justify-center">
                <DynamicIcon name={t('ui.icon.time')} size={16} className="text-[#c9a962]" />
              </div>
              <span className="text-sm">{t('home.cta.time')}</span>
            </div>

            <button
              onClick={handleStartAssessment}
              className="group relative inline-flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#c9a962] to-[#d4b87a] rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
              <div className="relative px-12 py-5 bg-gradient-to-r from-[#c9a962] to-[#d4b87a] rounded-2xl text-[#0a1628] font-bold text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-[#c9a962]/30 transform hover:-translate-y-1">
                {t('home.cta.button')}
              </div>
            </button>
          </div>

          {/* Benefits Section */}
          <div className="mt-28 pt-16 border-t border-white/5">
            <div className="grid md:grid-cols-3 gap-10">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="text-left animate-slide-up opacity-0"
                  style={{ animationDelay: `${0.8 + index * 0.1}s` }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c9a962]/20 to-[#c9a962]/5 border border-[#c9a962]/30 flex items-center justify-center">
                      <DynamicIcon name={t('ui.icon.check')} size={20} className="text-[#c9a962]" />
                    </div>
                    <span className="font-semibold text-white text-lg">{t(benefit.titleKey)}</span>
                  </div>
                  <p className="text-gray-400 leading-relaxed pl-14">{t(benefit.descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 mt-16">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c9a962] to-[#d4b87a] flex items-center justify-center">
                <span className="text-[#0a1628] font-bold text-sm">A</span>
              </div>
              <span className="text-gray-500 text-sm">Ample Group Global</span>
            </div>
            <p className="text-sm text-gray-500">
              {t('home.footer')} © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
