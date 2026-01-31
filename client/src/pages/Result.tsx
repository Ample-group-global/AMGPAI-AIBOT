/**
 * Assessment Result Page
 * Uses REST API instead of tRPC
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation, useParams } from "wouter";
import { useState, useEffect } from "react";
import { SDG_NAMES } from "../../../shared/investmentTracks";
import { defaultConfig } from "@/config";

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
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data as ApiResponse<AssessmentResult>;
  } catch (error) {
    console.error('[API Error]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============ Texts ============

const texts = {
  en: {
    title: 'Assessment Results',
    loading: 'Loading your results...',
    error: {
      title: 'Unable to Load Results',
      message: 'There was an error loading your assessment results. Please try again.',
    },
    scores: {
      risk: {
        title: 'Risk Assessment',
        tolerance: 'Risk Tolerance',
        horizon: 'Investment Horizon',
      },
      esg: {
        title: 'ESG Preferences',
        environmental: 'Environmental',
        social: 'Social',
        governance: 'Governance',
      },
    },
    tracks: {
      title: 'Recommended Investment Tracks',
      match: 'Match',
      reason: 'Why This Track',
      sdg: 'Related SDGs',
      examples: 'Example Investments',
    },
    sdg: {
      title: 'Your SDG Alignment',
    },
    button: {
      home: 'Close',
      retake: 'Retake Assessment',
    },
    nav: {
      retake: 'New Assessment',
    },
    footer: 'AI-powered investment assessment by PAIBot',
    langSwitch: { zh: 'Chinese', en: 'EN' },
  },
  zh: {
    title: '評估結果',
    loading: '正在載入您的結果...',
    error: {
      title: '無法載入結果',
      message: '載入評估結果時發生錯誤，請重試。',
    },
    scores: {
      risk: {
        title: '風險評估',
        tolerance: '風險承受度',
        horizon: '投資期限',
      },
      esg: {
        title: 'ESG 偏好',
        environmental: '環境',
        social: '社會',
        governance: '治理',
      },
    },
    tracks: {
      title: '推薦投資賽道',
      match: '匹配度',
      reason: '推薦原因',
      sdg: '相關 SDG',
      examples: '投資範例',
    },
    sdg: {
      title: '您的 SDG 價值取向',
    },
    button: {
      home: '關閉',
      retake: '重新評估',
    },
    nav: {
      retake: '新評估',
    },
    footer: 'PAIBot AI 投資性向評估',
    langSwitch: { zh: '中文', en: 'EN' },
  },
};

// ============ Component ============

export default function Result() {
  const params = useParams<{ sessionId: string }>();
  const [, setLocation] = useLocation();
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const t = texts[language];
  const sessionId = params.sessionId;

  // State for API data
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch result on mount
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

  // Language Switcher Component
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-spin">⚙️</div>
          <p className="text-gray-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-semibold">{t.error.title}</h2>
          <p className="text-gray-600">{t.error.message}</p>
          <Button onClick={() => setLocation('/')}>{t.button.home}</Button>
        </Card>
      </div>
    );
  }

  const { investorProfile, scores, recommendedTracks, sdgAlignment } = result;
  const sdgNames = SDG_NAMES;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-blue-900">{t.title}</h1>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <Button variant="outline" onClick={() => setLocation('/')}>
                {t.nav.retake}
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
              <div className="text-4xl">👤</div>
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
              <span>📊</span>
              <span>{t.scores.risk.title}</span>
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>{t.scores.risk.tolerance}</span>
                  <span className="font-semibold">{Math.round(scores.risk?.raw || 0)}/100</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${Math.round(scores.risk?.raw || 0)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>{t.scores.risk.horizon}</span>
                  <span className="font-semibold">{Math.round(scores.timeHorizon?.raw || 0)}/100</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600 rounded-full transition-all"
                    style={{ width: `${Math.round(scores.timeHorizon?.raw || 0)}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span>🌍</span>
              <span>{t.scores.esg.title}</span>
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>{t.scores.esg.environmental}</span>
                  <span className="font-semibold">{Math.round(scores.esg?.environmental || 0)}/100</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600 rounded-full transition-all"
                    style={{ width: `${Math.round(scores.esg?.environmental || 0)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>{t.scores.esg.social}</span>
                  <span className="font-semibold">{Math.round(scores.esg?.social || 0)}/100</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-600 rounded-full transition-all"
                    style={{ width: `${Math.round(scores.esg?.social || 0)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>{t.scores.esg.governance}</span>
                  <span className="font-semibold">{Math.round(scores.esg?.governance || 0)}/100</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all"
                    style={{ width: `${Math.round(scores.esg?.governance || 0)}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Recommended Tracks */}
        {recommendedTracks && recommendedTracks.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{t.tracks.title}</h2>
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
                      <div className="text-xs text-gray-600">{t.tracks.match}</div>
                    </div>
                  </div>

                  {track.description && (
                    <p className="text-sm text-gray-700">{track.description}</p>
                  )}

                  {track.reason && (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold">{t.tracks.reason}</div>
                      <p className="text-sm text-gray-600">{track.reason}</p>
                    </div>
                  )}

                  {track.sdgs && track.sdgs.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold">{t.tracks.sdg}</div>
                      <div className="flex flex-wrap gap-2">
                        {track.sdgs.map((sdgId: number) => (
                          <div
                            key={sdgId}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs flex items-center gap-1"
                          >
                            <span>{sdgNames[sdgId]?.icon}</span>
                            <span>SDG {sdgId}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {track.examples && track.examples.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold">{t.tracks.examples}</div>
                      <div className="flex flex-wrap gap-2">
                        {track.examples.slice(0, 3).map((example: string, idx: number) => (
                          <div key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {example}
                          </div>
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
              <span>🎯</span>
              <span>{t.sdg.title}</span>
            </h3>
            <p className="text-sm text-gray-600">{sdgAlignment.explanation}</p>
            <div className="flex flex-wrap gap-3">
              {sdgAlignment.primarySDGs.map((sdgId: number) => (
                <div
                  key={sdgId}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg"
                >
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
          <Button variant="outline" onClick={() => window.close()}>
            {t.button.home}
          </Button>
          <Button onClick={() => setLocation('/')}>
            {t.button.retake}
          </Button>
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
