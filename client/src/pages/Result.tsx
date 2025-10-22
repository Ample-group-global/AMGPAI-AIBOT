import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";

export default function Result() {
  const params = useParams<{ sessionId: string }>();
  const [, setLocation] = useLocation();
  const sessionId = params.sessionId;

  const { data: result, isLoading, error } = trpc.assessment.getResult.useQuery(
    { sessionId: sessionId || '' },
    { enabled: !!sessionId }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-spin">⚙️</div>
          <p className="text-gray-600">正在生成你的投資分析報告...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-semibold">無法載入結果</h2>
          <p className="text-gray-600">請確認評估已完成，或重新開始評估。</p>
          <Button onClick={() => setLocation('/')}>返回首頁</Button>
        </Card>
      </div>
    );
  }

  const { investorProfile, scores, recommendedTracks, sdgAlignment } = result;

  // SDG 名稱對照
  const sdgNames: Record<number, { name: string; icon: string }> = {
    1: { name: '消除貧窮', icon: '🏘️' },
    2: { name: '消除飢餓', icon: '🌾' },
    3: { name: '健康與福祉', icon: '❤️' },
    4: { name: '優質教育', icon: '📚' },
    5: { name: '性別平等', icon: '⚖️' },
    6: { name: '淨水與衛生', icon: '💧' },
    7: { name: '可負擔的潔淨能源', icon: '⚡' },
    8: { name: '就業與經濟成長', icon: '💼' },
    9: { name: '工業、創新與基礎建設', icon: '🏗️' },
    10: { name: '減少不平等', icon: '🤝' },
    11: { name: '永續城市與社區', icon: '🏙️' },
    12: { name: '責任消費與生產', icon: '♻️' },
    13: { name: '氣候行動', icon: '🌍' },
    14: { name: '海洋生態', icon: '🌊' },
    15: { name: '陸地生態', icon: '🌳' },
    16: { name: '和平、正義與健全制度', icon: '⚖️' },
    17: { name: '全球夥伴關係', icon: '🤝' }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-blue-900">你的投資傾向分析結果</h1>
            <Button variant="outline" onClick={() => setLocation('/')}>
              重新測驗
            </Button>
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
              <span>風險與時間偏好</span>
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>風險承受度</span>
                  <span className="font-semibold">{scores.risk?.raw || 0}/100</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${scores.risk?.raw || 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>投資期限</span>
                  <span className="font-semibold">{scores.timeHorizon?.raw || 0}/100</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-600 rounded-full transition-all"
                    style={{ width: `${scores.timeHorizon?.raw || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span>🌍</span>
              <span>ESG 價值觀</span>
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>環境 (E)</span>
                  <span className="font-semibold">{scores.esg?.environmental || 0}/100</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-600 rounded-full transition-all"
                    style={{ width: `${scores.esg?.environmental || 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>社會 (S)</span>
                  <span className="font-semibold">{scores.esg?.social || 0}/100</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-600 rounded-full transition-all"
                    style={{ width: `${scores.esg?.social || 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>治理 (G)</span>
                  <span className="font-semibold">{scores.esg?.governance || 0}/100</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-600 rounded-full transition-all"
                    style={{ width: `${scores.esg?.governance || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Recommended Tracks */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">推薦投資賽道</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {recommendedTracks.map((track: any) => (
              <Card key={track.trackId} className="p-6 space-y-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600">#{track.rank}</div>
                    <h3 className="text-xl font-bold">{track.trackName}</h3>
                    <p className="text-sm text-gray-600">{track.trackNameEn}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{track.matchScore}%</div>
                    <div className="text-xs text-gray-600">匹配度</div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-700">{track.description}</p>
                
                <div className="space-y-2">
                  <div className="text-sm font-semibold">推薦理由</div>
                  <p className="text-sm text-gray-600">{track.reason}</p>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-semibold">對應 SDG</div>
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

                <div className="space-y-2">
                  <div className="text-sm font-semibold">投資範例</div>
                  <div className="flex flex-wrap gap-2">
                    {track.examples.slice(0, 3).map((example: string, idx: number) => (
                      <div key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {example}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* SDG Alignment */}
        {sdgAlignment.primarySDGs.length > 0 && (
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span>🎯</span>
              <span>你的 SDG 優先目標</span>
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
                    <div className="text-xs text-gray-600">{sdgNames[sdgId]?.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-4 pt-8">
          <Button variant="outline" onClick={() => setLocation('/')}>
            返回首頁
          </Button>
          <Button onClick={() => setLocation('/assessment')}>
            重新測驗
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8 text-center text-sm text-gray-600">
        <div className="container">
          <p>永續投資傾向評估系統 © 2025</p>
        </div>
      </footer>
    </div>
  );
}

