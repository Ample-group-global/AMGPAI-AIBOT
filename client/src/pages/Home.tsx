import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Home() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-blue-900">{t('app.title')}</h1>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">
              {t('home.hero.title')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('home.hero.subtitle')}
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
            <Card className="p-6 text-center space-y-2 border-2 hover:border-blue-200 transition-colors">
              <div className="text-3xl">📊</div>
              <h3 className="font-semibold">{t('home.feature.risk.title')}</h3>
              <p className="text-sm text-gray-600">{t('home.feature.risk.desc')}</p>
            </Card>
            
            <Card className="p-6 text-center space-y-2 border-2 hover:border-blue-200 transition-colors">
              <div className="text-3xl">🎯</div>
              <h3 className="font-semibold">{t('home.feature.goals.title')}</h3>
              <p className="text-sm text-gray-600">{t('home.feature.goals.desc')}</p>
            </Card>
            
            <Card className="p-6 text-center space-y-2 border-2 hover:border-blue-200 transition-colors">
              <div className="text-3xl">🧠</div>
              <h3 className="font-semibold">{t('home.feature.behavior.title')}</h3>
              <p className="text-sm text-gray-600">{t('home.feature.behavior.desc')}</p>
            </Card>
            
            <Card className="p-6 text-center space-y-2 border-2 hover:border-blue-200 transition-colors">
              <div className="text-3xl">🌍</div>
              <h3 className="font-semibold">{t('home.feature.values.title')}</h3>
              <p className="text-sm text-gray-600">{t('home.feature.values.desc')}</p>
            </Card>
          </div>

          {/* CTA */}
          <div className="mt-12 space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <span>⏱️</span>
              <span>{t('home.cta.time')}</span>
            </div>
            <Button 
              size="lg" 
              className="px-8 py-6 text-lg"
              onClick={() => setLocation('/assessment')}
            >
              {t('home.cta.button')}
            </Button>
          </div>

          {/* Benefits */}
          <div className="mt-16 grid md:grid-cols-3 gap-6 text-left">
            <div className="space-y-2">
              <div className="text-blue-600 font-semibold">✓ {t('home.benefit.personalized')}</div>
              <p className="text-sm text-gray-600">
                {t('home.benefit.personalized.desc')}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="text-blue-600 font-semibold">✓ {t('home.benefit.ai')}</div>
              <p className="text-sm text-gray-600">
                {t('home.benefit.ai.desc')}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="text-blue-600 font-semibold">✓ {t('home.benefit.report')}</div>
              <p className="text-sm text-gray-600">
                {t('home.benefit.report.desc')}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8 text-center text-sm text-gray-600">
        <div className="container">
          <p>{t('home.footer')}</p>
        </div>
      </footer>
    </div>
  );
}

