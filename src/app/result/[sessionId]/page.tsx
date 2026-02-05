'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { defaultConfig } from '@/config';
import { useMasterData } from '@/contexts/MasterDataContext';
import Image from 'next/image';
import { AssessmentResult, getResult, MBTI_DIMENSIONS } from '@/types/assessment';

export default function ResultPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const { language, setLanguage, languages, t } = useMasterData();
  const sessionId = params.sessionId;

  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    getResult(defaultConfig.assessmentApiUrl, sessionId, language)
      .then((response) => {
        if (response.success && response.data) {
          setResult(response.data);
        } else {
          setError(response.error || 'Failed to load result');
        }
      })
      .catch((err) => {
        setError(err.message || 'Unknown error');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [sessionId, language]);

  const LanguageSwitcher = () => (
    <div className="flex rounded-lg sm:rounded-xl overflow-hidden border border-[#334155] bg-[#1a2744]/50">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${language === lang.code
            ? 'bg-gradient-to-r from-[#c9a962] to-[#d4b87a] text-[#0a1628]'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {lang.code === 'zh' ? '中文' : lang.code.toUpperCase()}
        </button>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto border-4 border-[#1a2744] border-t-[#c9a962] rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm sm:text-base">{t('result.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center px-4">
        <Card className="p-6 sm:p-8 max-w-md text-center space-y-4 bg-[#1a2744] border-[#334155]">
          <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <span className="text-2xl sm:text-3xl">⚠️</span>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-white">{t('result.error.title')}</h2>
          <p className="text-sm sm:text-base text-gray-400">{t('result.error.message')}</p>
          <Button onClick={() => router.push('/')} className="bg-gradient-to-r from-[#c9a962] to-[#d4b87a] text-[#0a1628] hover:opacity-90">
            {t('result.button.home')}
          </Button>
        </Card>
      </div>
    );
  }

  const { investorProfile, scores } = result;
  const investorMBTI = scores.investor_mbti;

  return (
    <div className="min-h-screen bg-[#0a1628]">
      <header className="border-b border-white/5 bg-[#0a1628]/90 backdrop-blur-xl sticky top-0 z-10">
        <div className="container py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Image src="/logo.png" alt="Ample Group Global" width={100} height={25} className="object-contain sm:w-[120px] sm:h-[30px]" />
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageSwitcher />
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 border-[#334155] text-gray-300 hover:bg-[#1a2744] hover:text-white"
              >
                {t('result.nav.retake')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-4 sm:py-6 md:py-8 max-w-5xl space-y-4 sm:space-y-6 md:space-y-8 px-3 sm:px-4">
        {investorMBTI?.type_code && (
          <Card className="p-4 sm:p-6 md:p-8 bg-gradient-to-r from-[#c9a962] to-[#d4b87a] border-0">
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#0a1628] flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-2xl sm:text-3xl font-bold text-[#c9a962] tracking-wider">{investorMBTI.type_code}</span>
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#0a1628]">
                      {language === 'zh' ? investorMBTI.type_name : (investorMBTI.type_name_en || investorMBTI.type_name)}
                    </h2>
                    <p className="text-sm sm:text-base text-[#0a1628]/70">
                      {language === 'zh' ? (investorMBTI.type_name_en || '') : investorMBTI.type_name}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {(['gs', 'di', 'lv', 'pa'] as const).map((dim) => {
                  const dimension = MBTI_DIMENSIONS[dim];
                  const data = investorMBTI[dim];
                  if (!data) return null;

                  const isRight = data.letter === dimension.rightLetter;
                  const rawScore = data.score ?? 0;
                  const normalizedPercent = (rawScore / 2) * 100;
                  const percentage = isRight ? normalizedPercent : (100 - normalizedPercent);

                  return (
                    <div key={dim} className="bg-[#0a1628]/10 rounded-xl p-3 sm:p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs sm:text-sm font-medium text-[#0a1628]/80">
                          {language === 'zh' ? dimension.labelZh : dimension.labelEn}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-[#0a1628] bg-white/50 px-2 py-0.5 rounded">
                          {data.letter}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] sm:text-xs">
                        <span className={`font-medium ${!isRight ? 'text-[#0a1628]' : 'text-[#0a1628]/50'}`}>
                          {language === 'zh' ? dimension.leftZh : dimension.leftEn}
                        </span>
                        <div className="flex-1 h-2 bg-[#0a1628]/20 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${dimension.color} rounded-full transition-all`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className={`font-medium ${isRight ? 'text-[#0a1628]' : 'text-[#0a1628]/50'}`}>
                          {language === 'zh' ? dimension.rightZh : dimension.rightEn}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {((investorMBTI.strengths && investorMBTI.strengths.length > 0) ||
                (investorMBTI.blind_spots && investorMBTI.blind_spots.length > 0)) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
                  {investorMBTI.strengths && investorMBTI.strengths.length > 0 && (
                    <div className="bg-green-900/20 rounded-xl p-3 sm:p-4">
                      <h4 className="text-sm font-semibold text-[#0a1628] mb-2 flex items-center gap-1">
                        <span>💪</span>
                        {t('result.mbti.strengths')}
                      </h4>
                      <ul className="space-y-1">
                        {investorMBTI.strengths?.map((item, idx) => (
                          <li key={idx} className="text-xs sm:text-sm text-[#0a1628]/80 flex items-start gap-1">
                            <span className="text-green-700">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {investorMBTI.blind_spots && investorMBTI.blind_spots.length > 0 && (
                    <div className="bg-amber-900/20 rounded-xl p-3 sm:p-4">
                      <h4 className="text-sm font-semibold text-[#0a1628] mb-2 flex items-center gap-1">
                        <span>👁️</span>
                        {t('result.mbti.blindSpots')}
                      </h4>
                      <ul className="space-y-1">
                        {investorMBTI.blind_spots?.map((item, idx) => (
                          <li key={idx} className="text-xs sm:text-sm text-[#0a1628]/80 flex items-start gap-1">
                            <span className="text-amber-700">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

        {!investorMBTI?.type_code && (
          <Card className="p-4 sm:p-6 md:p-8 bg-gradient-to-r from-[#c9a962] to-[#d4b87a] border-0">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#0a1628]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl sm:text-3xl">👤</span>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0a1628]">{investorProfile.type}</h2>
                  <p className="text-sm sm:text-base text-[#0a1628]/80">{investorProfile.summary}</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-4 sm:pt-8">
          <Button
            variant="outline"
            onClick={() => window.close()}
            className="border-[#334155] text-gray-300 hover:bg-[#1a2744] hover:text-white h-10 sm:h-11"
          >
            {t('result.button.home')}
          </Button>
          <Button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-[#c9a962] to-[#d4b87a] text-[#0a1628] hover:opacity-90 h-10 sm:h-11"
          >
            {t('result.button.retake')}
          </Button>
        </div>
      </main>

      <footer className="border-t border-white/5 mt-8 sm:mt-12 md:mt-16 py-6 sm:py-8 text-center">
        <div className="container">
          <p className="text-xs sm:text-sm text-gray-500">{t('result.footer')}</p>
        </div>
      </footer>
    </div>
  );
}
