import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APP_TITLE } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container py-4">
          <h1 className="text-xl font-semibold text-blue-900">{APP_TITLE}</h1>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">
              發現你的永續投資方向
            </h2>
            <p className="text-xl text-gray-600">
              透過 AI 對話式評估，深入了解你的投資特性，獲得個人化的永續投資建議
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
            <Card className="p-6 text-center space-y-2 border-2 hover:border-blue-200 transition-colors">
              <div className="text-3xl">📊</div>
              <h3 className="font-semibold">風險承受度</h3>
              <p className="text-sm text-gray-600">評估你的投資風險偏好</p>
            </Card>
            
            <Card className="p-6 text-center space-y-2 border-2 hover:border-blue-200 transition-colors">
              <div className="text-3xl">🎯</div>
              <h3 className="font-semibold">投資目標</h3>
              <p className="text-sm text-gray-600">了解你的財務規劃與時間偏好</p>
            </Card>
            
            <Card className="p-6 text-center space-y-2 border-2 hover:border-blue-200 transition-colors">
              <div className="text-3xl">🧠</div>
              <h3 className="font-semibold">決策習慣</h3>
              <p className="text-sm text-gray-600">識別可能的行為偏誤</p>
            </Card>
            
            <Card className="p-6 text-center space-y-2 border-2 hover:border-blue-200 transition-colors">
              <div className="text-3xl">🌍</div>
              <h3 className="font-semibold">永續價值觀</h3>
              <p className="text-sm text-gray-600">探索你關注的 ESG 議題</p>
            </Card>
          </div>

          {/* CTA */}
          <div className="mt-12 space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <span>⏱️</span>
              <span>約 10 分鐘完成評估</span>
            </div>
            <Button 
              size="lg" 
              className="px-8 py-6 text-lg"
              onClick={() => setLocation('/assessment')}
            >
              開始評估
            </Button>
          </div>

          {/* Benefits */}
          <div className="mt-16 grid md:grid-cols-3 gap-6 text-left">
            <div className="space-y-2">
              <div className="text-blue-600 font-semibold">✓ 個人化推薦</div>
              <p className="text-sm text-gray-600">
                基於你的特性推薦適合的投資賽道與 SDG 目標
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="text-blue-600 font-semibold">✓ AI 對話體驗</div>
              <p className="text-sm text-gray-600">
                自然流暢的對話，深入了解你的投資動機與價值觀
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="text-blue-600 font-semibold">✓ 專業分析報告</div>
              <p className="text-sm text-gray-600">
                獲得完整的投資人格分析與行為建議
              </p>
            </div>
          </div>
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

