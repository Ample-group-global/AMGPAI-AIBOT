'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMasterData } from '@/contexts/MasterDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { DynamicIcon } from '@/components/DynamicIcon';

export default function Home() {
  const router = useRouter();
  const { language, setLanguage, languages, t, isLoading: isMasterDataLoading, error, reload } = useMasterData();
  const { isAuthenticated, isLoading: isAuthLoading, sendOtp: authSendOtp, login } = useAuth();
  const isLoading = isMasterDataLoading || isAuthLoading;

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginStep, setLoginStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first OTP input when step changes to OTP
  useEffect(() => {
    if (loginStep === 'otp' && otpInputRefs.current[0]) {
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    }
  }, [loginStep]);

  // Update combined OTP value when digits change
  useEffect(() => {
    setOtp(otpDigits.join(''));
  }, [otpDigits]);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow single digit
    const digit = value.replace(/\D/g, '').slice(-1);

    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        // If current is empty and backspace pressed, go to previous
        otpInputRefs.current[index - 1]?.focus();
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
      } else {
        // Clear current
        const newDigits = [...otpDigits];
        newDigits[index] = '';
        setOtpDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter' && otp.length === 6 && !loginLoading) {
      verifyOtp();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pastedData[i] || '';
      }
      setOtpDigits(newDigits);
      // Focus last filled input or last input
      const lastFilledIndex = Math.min(pastedData.length, 5);
      otpInputRefs.current[lastFilledIndex]?.focus();
    }
  };

  const resetOtpDigits = () => {
    setOtpDigits(['', '', '', '', '', '']);
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleStartAssessment = () => {
    if (isAuthenticated) {
      router.push('/assessment');
      return;
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
      const result = await authSendOtp(email);
      if (result.success) {
        setLoginStep('otp');
      } else {
        setLoginError(result.error || t('home.login.otpFailed'));
      }
    } catch (error) {
      console.error('SendOTP Error:', error);
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
      const result = await login(email, otp);
      if (result.success) {
        setShowLoginModal(false);
        resetLoginForm();
        router.push('/assessment');
      } else {
        setLoginError(result.error || t('home.login.verifyFailed'));
      }
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
    setOtpDigits(['', '', '', '', '', '']);
    setLoginError('');
  };

  const handleCloseModal = (open: boolean) => {
    if (!open) resetLoginForm();
    setShowLoginModal(open);
  };

  const LanguageSwitcher = () => (
    <div className="flex rounded-lg sm:rounded-xl overflow-hidden border border-[#334155] bg-[#1a2744]/50 backdrop-blur-sm">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-300 ${
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
      <div className="min-h-screen gradient-mesh flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mb-6 sm:mb-8">
            <Image src="/logo.png" alt="Ample Group Global" width={160} height={40} className="object-contain mx-auto sm:w-[200px] sm:h-[50px]" />
          </div>
          <div className="relative inline-block">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-[#1a2744] rounded-full"></div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-t-[#c9a962] border-r-[#c9a962] rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <div className="mt-4 sm:mt-6 text-gray-400 animate-pulse">
            <p className="text-sm sm:text-base">載入中...</p>
            <p className="text-xs sm:text-sm">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mb-6 sm:mb-8">
            <Image src="/logo.png" alt="Ample Group Global" width={160} height={40} className="object-contain mx-auto sm:w-[200px] sm:h-[50px]" />
          </div>
          <div className="p-6 rounded-xl bg-[#1a2744]/80 border border-[#334155]">
            <p className="text-red-400 text-sm sm:text-base mb-4">{error}</p>
            <button
              onClick={reload}
              className="px-6 py-2.5 bg-gradient-to-r from-[#c9a962] to-[#d4b87a] rounded-lg text-[#0a1628] font-bold text-sm hover:shadow-lg transition-all"
            >
              Retry / 重試
            </button>
          </div>
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
        <DialogContent className="w-[92vw] max-w-[420px] mx-auto bg-gradient-to-br from-[#1a2744] to-[#0a1628] border border-[#334155] text-white animate-scale-in shadow-2xl shadow-[#c9a962]/10 rounded-2xl p-6 sm:p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#c9a962]/5 to-transparent rounded-2xl pointer-events-none"></div>
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#c9a962]/20 via-transparent to-[#c9a962]/20 rounded-2xl blur-sm pointer-events-none"></div>
          <DialogHeader className="relative space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-xl bg-[#0a1628]/50 border border-[#334155]">
                <Image src="/logo.png" alt="Ample Group Global" width={140} height={35} className="object-contain sm:w-[160px] sm:h-[40px]" />
              </div>
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-center text-xl sm:text-2xl text-white font-bold">
                {loginStep === 'email' ? t('home.login.title') : t('home.login.otpTitle')}
              </DialogTitle>
              <DialogDescription className="text-center text-sm sm:text-base text-gray-400 leading-relaxed">
                {loginStep === 'email'
                  ? t('home.login.subtitle')
                  : `${t('home.login.otpSubtitle')} ${email}`}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-5 pt-4 relative">
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
                <div className="space-y-4">
                  <Label className="text-gray-300 text-center block">{t('home.login.otpLabel')}</Label>
                  <div className="flex justify-center gap-2 sm:gap-3">
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { otpInputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={handleOtpPaste}
                        disabled={loginLoading}
                        className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold bg-[#0a1628] border-2 border-[#334155] text-white rounded-lg sm:rounded-xl focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 focus:outline-none transition-all duration-200 disabled:opacity-50"
                        aria-label={`OTP digit ${index + 1}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 text-center">{t('home.login.otpPlaceholder')}</p>
                </div>
                {loginError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-400 text-center">{loginError}</p>
                  </div>
                )}
                <div className="space-y-3 pt-2">
                  <Button
                    className="w-full h-12 rounded-xl btn-amg-primary text-base"
                    onClick={verifyOtp}
                    disabled={loginLoading || otp.length !== 6}
                  >
                    <span>{loginLoading ? t('home.login.verifying') : t('home.login.verify')}</span>
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 h-11 rounded-xl border-[#334155] text-gray-400 hover:bg-[#1a2744] hover:text-white hover:border-[#c9a962]/50"
                      onClick={() => { setLoginStep('email'); resetOtpDigits(); setLoginError(''); }}
                      disabled={loginLoading}
                    >
                      {t('home.login.back')}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-11 rounded-xl border-[#334155] text-gray-400 hover:bg-[#1a2744] hover:text-white hover:border-[#c9a962]/50"
                      onClick={() => { resetOtpDigits(); sendOtp(); }}
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
        <div className="container py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 animate-slide-in">
              <Image src="/logo.png" alt="Ample Group Global" width={100} height={25} className="object-contain sm:w-[120px] sm:h-[30px]" />
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 container py-4 sm:py-6 md:py-8 lg:py-10">
        <div className="max-w-6xl mx-auto text-center px-2 sm:px-4">
          {/* Badge */}
          <div className="animate-slide-up opacity-0 stagger-1">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#1a2744]/60 backdrop-blur-sm border border-[#334155] mb-3 sm:mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c9a962] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c9a962]"></span>
              </span>
              <span className="text-xs sm:text-sm">
                <span className="text-white font-medium">Ample Group Global</span>
                <span className="text-gray-400 mx-1 sm:mx-2">|</span>
                <span className="text-[#c9a962]">AI-Powered Investment Assessment</span>
              </span>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2 sm:space-y-3 animate-slide-up opacity-0 stagger-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-[1.2] tracking-tight px-2">
              {language === 'zh' ? (
                <>
                  與 <span className="text-gold-gradient">Ample Group Global</span> 一起探索您的永續投資之路
                </>
              ) : (
                <>
                  Discover Your Sustainable Investment Path with <span className="text-gold-gradient">Ample Group Global</span>
                </>
              )}
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-300 max-w-2xl mx-auto leading-relaxed px-4">
              {t('home.hero.subtitle')}
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mt-4 sm:mt-6 md:mt-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group card-amg-premium p-3 sm:p-4 rounded-lg sm:rounded-xl text-left animate-slide-up opacity-0`}
                style={{ animationDelay: `${0.3 + index * 0.1}s` }}
              >
                <div className="relative">
                  <div className="absolute -inset-2 bg-[#c9a962]/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#0a1628] border border-[#c9a962]/30 group-hover:border-[#c9a962]/50 flex items-center justify-center mb-2 sm:mb-3 transition-all duration-500">
                    <DynamicIcon name={t(feature.iconKey)} size={16} className="text-[#c9a962] sm:w-5 sm:h-5" />
                  </div>
                </div>
                <h3 className="font-bold text-white text-xs sm:text-sm mb-1 group-hover:text-[#c9a962] transition-colors duration-300">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-[10px] sm:text-xs text-gray-300 leading-relaxed line-clamp-2">{t(feature.descKey)}</p>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-4 sm:mt-6 md:mt-8 space-y-2 sm:space-y-3 animate-slide-up opacity-0" style={{ animationDelay: '0.7s' }}>
            <div className="flex items-center justify-center gap-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#1a2744] border border-[#c9a962]/30 flex items-center justify-center">
                <DynamicIcon name={t('ui.icon.time')} size={12} className="text-[#c9a962] sm:w-3.5 sm:h-3.5" />
              </div>
              <span className="text-xs sm:text-sm text-gray-300">{t('home.cta.time')}</span>
            </div>

            <button
              onClick={handleStartAssessment}
              className="group relative inline-flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#c9a962] to-[#d4b87a] rounded-lg sm:rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
              <div className="relative px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-[#c9a962] to-[#d4b87a] rounded-lg sm:rounded-xl text-[#0a1628] font-bold text-sm sm:text-base transition-all duration-300 hover:shadow-2xl hover:shadow-[#c9a962]/30 transform hover:-translate-y-1">
                {t('home.cta.button')}
              </div>
            </button>
          </div>

          {/* Benefits Section - Compact horizontal layout */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white/10">
            <div className="flex flex-wrap justify-center gap-3 sm:gap-6 md:gap-8">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 animate-slide-up opacity-0"
                  style={{ animationDelay: `${0.8 + index * 0.1}s` }}
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#c9a962]/20 border border-[#c9a962]/40 flex items-center justify-center flex-shrink-0">
                    <DynamicIcon name={t('ui.icon.check')} size={10} className="text-[#c9a962] sm:w-3 sm:h-3" />
                  </div>
                  <span className="text-xs sm:text-sm text-gray-300">{t(benefit.titleKey)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer - More compact */}
      <footer className="relative z-10 border-t border-white/10 py-3 sm:py-4 mt-4 sm:mt-6">
        <div className="container">
          <div className="flex flex-col items-center justify-center gap-2 sm:gap-3 md:flex-row md:justify-between">
            <div className="flex items-center">
              <Image src="/logo.png" alt="Ample Group Global" width={100} height={25} className="object-contain sm:w-[120px] sm:h-[30px]" />
            </div>
            <p className="text-[10px] sm:text-xs text-gray-400 text-center">
              {t('home.footer')} © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
