'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { defaultConfig } from '@/config';
import { useMasterData } from '@/contexts/MasterDataContext';
import Image from 'next/image';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

interface AssessmentResult {
  sessionId: string;
  investorProfile: {
    type: string;
    summary: string;
    strengths: string[];
    watchPoints: string[];
  };
  scores: {
    risk?: { raw: number; confidence: number };
    timeHorizon?: { raw: number; confidence: number };
    goalType?: string;
    biases?: Array<{ type: string; strength: string; evidence: string }>;
    esg?: { environmental: number; social: number; governance: number };
    sdgPriorities?: number[];
  };
  recommendedTracks: Array<{
    rank: number;
    trackId: string;
    trackName: string;
    trackNameEn?: string;
    description?: string;
    matchScore: number;
    reason?: string;
    sdgs?: number[];
    examples?: string[];
  }>;
  behavioralInsights?: {
    mainBiases: string[];
    suggestions: string[];
  };
  sdgAlignment?: {
    primarySDGs: number[];
    explanation: string;
  };
}

async function getResult(apiUrl: string, sessionId: string): Promise<ApiResponse<AssessmentResult>> {
  try {
    const response = await fetch(`${apiUrl}/GetResult/${sessionId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return await response.json() as ApiResponse<AssessmentResult>;
  } catch (error) {
    console.error('[API Error]', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export default function ResultPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const { language, setLanguage, languages, t, sdgDefinitions } = useMasterData();
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
    getResult(defaultConfig.assessmentApiUrl, sessionId)
      .then((response) => {
        if (response.success && response.data) {
          setResult(response.data);
        } else {
          setError(response.error || 'Failed to load result');
        }
      })
      .catch((err) => {
        console.error('[Result] Error fetching result:', err);
        setError(err.message || 'Unknown error');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [sessionId]);

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

  const { investorProfile, scores, recommendedTracks, sdgAlignment } = result;
  const sdgNames = Object.fromEntries(
    Object.entries(sdgDefinitions).map(([id, sdg]) => [
      parseInt(id),
      { name: sdg.name, nameEn: sdg.nameEn, icon: sdg.icon }
    ])
  );

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
        {/* Profile Card */}
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

        {/* Scores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card className="p-4 sm:p-6 space-y-3 sm:space-y-4 bg-[#1a2744] border-[#334155]">
            <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <span>📊</span>
              <span>{t('result.scores.risk.title')}</span>
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <div className="flex justify-between text-xs sm:text-sm mb-1.5">
                  <span className="text-gray-400">{t('result.scores.risk.tolerance')}</span>
                  <span className="font-semibold text-[#c9a962]">{Math.round(scores.risk?.raw || 0)}/100</span>
                </div>
                <div className="h-2 sm:h-2.5 bg-[#0a1628] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#c9a962] to-[#d4b87a] rounded-full transition-all" style={{ width: `${Math.round(scores.risk?.raw || 0)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs sm:text-sm mb-1.5">
                  <span className="text-gray-400">{t('result.scores.risk.horizon')}</span>
                  <span className="font-semibold text-green-400">{Math.round(scores.timeHorizon?.raw || 0)}/100</span>
                </div>
                <div className="h-2 sm:h-2.5 bg-[#0a1628] rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${Math.round(scores.timeHorizon?.raw || 0)}%` }} />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6 space-y-3 sm:space-y-4 bg-[#1a2744] border-[#334155]">
            <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <span>🌱</span>
              <span>{t('result.scores.esg.title')}</span>
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <div className="flex justify-between text-xs sm:text-sm mb-1.5">
                  <span className="text-gray-400">{t('result.scores.esg.environmental')}</span>
                  <span className="font-semibold text-green-400">{Math.round(scores.esg?.environmental || 0)}/100</span>
                </div>
                <div className="h-2 sm:h-2.5 bg-[#0a1628] rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${Math.round(scores.esg?.environmental || 0)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs sm:text-sm mb-1.5">
                  <span className="text-gray-400">{t('result.scores.esg.social')}</span>
                  <span className="font-semibold text-orange-400">{Math.round(scores.esg?.social || 0)}/100</span>
                </div>
                <div className="h-2 sm:h-2.5 bg-[#0a1628] rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${Math.round(scores.esg?.social || 0)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs sm:text-sm mb-1.5">
                  <span className="text-gray-400">{t('result.scores.esg.governance')}</span>
                  <span className="font-semibold text-purple-400">{Math.round(scores.esg?.governance || 0)}/100</span>
                </div>
                <div className="h-2 sm:h-2.5 bg-[#0a1628] rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${Math.round(scores.esg?.governance || 0)}%` }} />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Recommended Tracks */}
        {recommendedTracks && recommendedTracks.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white">{t('result.tracks.title')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {recommendedTracks.map((track) => (
                <Card key={track.trackId} className="p-4 sm:p-6 space-y-3 sm:space-y-4 bg-[#1a2744] border-[#334155] hover:border-[#c9a962]/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="text-xs text-[#c9a962]">#{track.rank}</div>
                      <h3 className="text-base sm:text-lg font-bold text-white truncate">{language === 'zh' ? track.trackName : track.trackNameEn}</h3>
                      <p className="text-xs sm:text-sm text-gray-400 truncate">{language === 'zh' ? track.trackNameEn : track.trackName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xl sm:text-2xl font-bold text-[#c9a962]">{Math.round(track.matchScore)}%</div>
                      <div className="text-[10px] sm:text-xs text-gray-500">{t('result.tracks.match')}</div>
                    </div>
                  </div>

                  {track.description && <p className="text-xs sm:text-sm text-gray-300 line-clamp-2">{track.description}</p>}

                  {track.reason && (
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-gray-400">{t('result.tracks.reason')}</div>
                      <p className="text-xs sm:text-sm text-gray-300 line-clamp-2">{track.reason}</p>
                    </div>
                  )}

                  {track.sdgs && track.sdgs.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-gray-400">{t('result.tracks.sdg')}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {track.sdgs.slice(0, 4).map((sdgId: number) => (
                          <div key={sdgId} className="px-2 py-1 bg-[#0a1628] text-[#c9a962] rounded text-[10px] sm:text-xs flex items-center gap-1">
                            <span>{sdgNames[sdgId]?.icon}</span>
                            <span>SDG {sdgId}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {track.examples && track.examples.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-gray-400">{t('result.tracks.examples')}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {track.examples.slice(0, 3).map((example: string, idx: number) => (
                          <div key={idx} className="px-2 py-1 bg-[#0a1628] text-gray-300 rounded text-[10px] sm:text-xs">{example}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* SDG Alignment */}
        {sdgAlignment?.primarySDGs && sdgAlignment.primarySDGs.length > 0 && (
          <Card className="p-4 sm:p-6 space-y-3 sm:space-y-4 bg-[#1a2744] border-[#334155]">
            <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <span>🎯</span>
              <span>{t('result.sdg.title')}</span>
            </h3>
            <p className="text-xs sm:text-sm text-gray-400">{sdgAlignment.explanation}</p>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {sdgAlignment.primarySDGs.map((sdgId: number) => (
                <div key={sdgId} className="flex items-center gap-2 px-3 py-2 bg-[#0a1628] border border-[#334155] rounded-lg">
                  <span className="text-xl sm:text-2xl">{sdgNames[sdgId]?.icon}</span>
                  <div>
                    <div className="font-semibold text-xs sm:text-sm text-white">SDG {sdgId}</div>
                    <div className="text-[10px] sm:text-xs text-gray-400">{language === 'zh' ? sdgNames[sdgId]?.name : sdgNames[sdgId]?.nameEn}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Action Buttons */}
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
