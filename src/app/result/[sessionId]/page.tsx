'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { defaultConfig } from '@/config';
import { useMasterData } from '@/contexts/MasterDataContext';

// ============ Types ============

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

// ============ API Functions ============

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

// ============ Component ============

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
    <div className="flex rounded-lg border overflow-hidden">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`px-3 py-1.5 text-sm font-medium transition-colors ${
            language === lang.code ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          {lang.code === 'zh' ? '中文' : lang.code.toUpperCase()}
        </button>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-spin">{t('ui.icon.loading')}</div>
          <p className="text-gray-600">{t('result.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center space-y-4">
          <div className="text-4xl">{t('ui.icon.error')}</div>
          <h2 className="text-xl font-semibold">{t('result.error.title')}</h2>
          <p className="text-gray-600">{t('result.error.message')}</p>
          <Button onClick={() => router.push('/')}>{t('result.button.home')}</Button>
        </Card>
      </div>
    );
  }

  const { investorProfile, scores, recommendedTracks, sdgAlignment } = result;

  // Use SDG definitions from API
  const sdgNames = Object.fromEntries(
    Object.entries(sdgDefinitions).map(([id, sdg]) => [
      parseInt(id),
      { name: sdg.name, nameEn: sdg.nameEn, icon: sdg.icon }
    ])
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-blue-900">{t('result.header.title')}</h1>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <Button variant="outline" onClick={() => router.push('/')}>
                {t('result.nav.retake')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-5xl space-y-8">
        {/* Investor Profile */}
        <Card className="p-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{t('ui.icon.user')}</div>
              <div>
                <h2 className="text-2xl font-bold">{investorProfile.type}</h2>
                <p className="text-blue-100">{investorProfile.summary}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Scores Overview */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span>{t('result.scores.risk.icon')}</span>
              <span>{t('result.scores.risk.title')}</span>
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>{t('result.scores.risk.tolerance')}</span>
                  <span className="font-semibold">{Math.round(scores.risk?.raw || 0)}/100</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${Math.round(scores.risk?.raw || 0)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>{t('result.scores.risk.horizon')}</span>
                  <span className="font-semibold">{Math.round(scores.timeHorizon?.raw || 0)}/100</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-600 rounded-full transition-all" style={{ width: `${Math.round(scores.timeHorizon?.raw || 0)}%` }} />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span>{t('result.scores.esg.icon')}</span>
              <span>{t('result.scores.esg.title')}</span>
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>{t('result.scores.esg.environmental')}</span>
                  <span className="font-semibold">{Math.round(scores.esg?.environmental || 0)}/100</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-600 rounded-full transition-all" style={{ width: `${Math.round(scores.esg?.environmental || 0)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>{t('result.scores.esg.social')}</span>
                  <span className="font-semibold">{Math.round(scores.esg?.social || 0)}/100</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-600 rounded-full transition-all" style={{ width: `${Math.round(scores.esg?.social || 0)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>{t('result.scores.esg.governance')}</span>
                  <span className="font-semibold">{Math.round(scores.esg?.governance || 0)}/100</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full transition-all" style={{ width: `${Math.round(scores.esg?.governance || 0)}%` }} />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Recommended Tracks */}
        {recommendedTracks && recommendedTracks.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{t('result.tracks.title')}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {recommendedTracks.map((track) => (
                <Card key={track.trackId} className="p-6 space-y-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">#{track.rank}</div>
                      <h3 className="text-xl font-bold">{language === 'zh' ? track.trackName : track.trackNameEn}</h3>
                      <p className="text-sm text-gray-600">{language === 'zh' ? track.trackNameEn : track.trackName}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{Math.round(track.matchScore)}%</div>
                      <div className="text-xs text-gray-600">{t('result.tracks.match')}</div>
                    </div>
                  </div>

                  {track.description && <p className="text-sm text-gray-700">{track.description}</p>}

                  {track.reason && (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold">{t('result.tracks.reason')}</div>
                      <p className="text-sm text-gray-600">{track.reason}</p>
                    </div>
                  )}

                  {track.sdgs && track.sdgs.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold">{t('result.tracks.sdg')}</div>
                      <div className="flex flex-wrap gap-2">
                        {track.sdgs.map((sdgId: number) => (
                          <div key={sdgId} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs flex items-center gap-1">
                            <span>{sdgNames[sdgId]?.icon}</span>
                            <span>SDG {sdgId}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {track.examples && track.examples.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold">{t('result.tracks.examples')}</div>
                      <div className="flex flex-wrap gap-2">
                        {track.examples.slice(0, 3).map((example: string, idx: number) => (
                          <div key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">{example}</div>
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
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span>{t('result.sdg.icon')}</span>
              <span>{t('result.sdg.title')}</span>
            </h3>
            <p className="text-sm text-gray-600">{sdgAlignment.explanation}</p>
            <div className="flex flex-wrap gap-3">
              {sdgAlignment.primarySDGs.map((sdgId: number) => (
                <div key={sdgId} className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-2xl">{sdgNames[sdgId]?.icon}</span>
                  <div>
                    <div className="font-semibold text-sm">SDG {sdgId}</div>
                    <div className="text-xs text-gray-600">{language === 'zh' ? sdgNames[sdgId]?.name : sdgNames[sdgId]?.nameEn}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-4 pt-8">
          <Button variant="outline" onClick={() => window.close()}>{t('result.button.home')}</Button>
          <Button onClick={() => router.push('/')}>{t('result.button.retake')}</Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8 text-center text-sm text-gray-600">
        <div className="container">
          <p>{t('result.footer')}</p>
        </div>
      </footer>
    </div>
  );
}
