import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';

interface CookieSettings {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export default function CookiePage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<CookieSettings>({
    necessary: true,
    analytics: false,
    marketing: false,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('cookieSettings');
    if (stored) {
      setSettings(JSON.parse(stored));
    }
  }, []);

  const handleToggle = (category: keyof CookieSettings) => {
    if (category === 'necessary') return;
    setSettings(prev => ({ ...prev, [category]: !prev[category] }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('cookieSettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAcceptAll = () => {
    const allAccepted = { necessary: true, analytics: true, marketing: true };
    setSettings(allAccepted);
    localStorage.setItem('cookieSettings', JSON.stringify(allAccepted));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="bg-white min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
          >
            <ArrowLeft size={20} />
            Zurück
          </button>
          <Logo />
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-2">Cookie-Richtlinie</h1>
        <p className="text-gray-600 mb-8">Verwalten Sie Ihre Cookie-Einstellungen</p>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Was sind Cookies?</h2>
            <p>
              Cookies sind kleine Dateien, die auf Ihrem Gerät gespeichert werden, wenn Sie unsere Website besuchen. Sie helfen uns, Ihre Erfahrung zu verbessern und die Website optimieren.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Cookie-Kategorien</h2>

            <div className="space-y-4 mt-4">
              {/* Notwendige Cookies */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Notwendige Cookies</h3>
                    <p className="text-sm text-gray-600">Erforderlich</p>
                  </div>
                  <div className="relative inline-block w-12 h-6 bg-blue-600 rounded-full">
                    <span className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"></span>
                  </div>
                </div>
                <p className="text-sm text-gray-700">
                  Diese Cookies sind notwendig, um die Website funktionsfähig zu machen. Sie umfassen Authentifizierung und Sicherheit.
                </p>
              </div>

              {/* Analyse-Cookies */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Analyse-Cookies</h3>
                    <p className="text-sm text-gray-600">Optional</p>
                  </div>
                  <button
                    onClick={() => handleToggle('analytics')}
                    className={`relative inline-block w-12 h-6 rounded-full transition-colors ${
                      settings.analytics ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.analytics ? 'left-6' : 'left-1'
                      }`}
                    ></span>
                  </button>
                </div>
                <p className="text-sm text-gray-700">
                  Diese Cookies helfen uns zu verstehen, wie Benutzer unsere Website nutzen. Dadurch können wir unsere Services verbessern.
                </p>
              </div>

              {/* Marketing-Cookies */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Marketing-Cookies</h3>
                    <p className="text-sm text-gray-600">Optional</p>
                  </div>
                  <button
                    onClick={() => handleToggle('marketing')}
                    className={`relative inline-block w-12 h-6 rounded-full transition-colors ${
                      settings.marketing ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.marketing ? 'left-6' : 'left-1'
                      }`}
                    ></span>
                  </button>
                </div>
                <p className="text-sm text-gray-700">
                  Diese Cookies werden verwendet, um Ihnen personalisierte Werbung anzuzeigen und unsere Marketing-Kampagnen zu verbessern.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Ihre Einstellungen</h2>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
              <p><span className="font-semibold">Notwendig:</span> {settings.necessary ? 'Aktiviert' : 'Deaktiviert'}</p>
              <p><span className="font-semibold">Analyse:</span> {settings.analytics ? 'Aktiviert' : 'Deaktiviert'}</p>
              <p><span className="font-semibold">Marketing:</span> {settings.marketing ? 'Aktiviert' : 'Deaktiviert'}</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Cookie-Verwaltung</h2>
            <p className="text-sm mb-4">
              Sie können Cookies in Ihren Browser-Einstellungen deaktivieren. Dies könnte jedoch die Funktionalität dieser Website beeinträchtigen.
            </p>
          </section>
        </div>

        {saved && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
            Einstellungen gespeichert!
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Speichern
          </button>
          <button
            onClick={handleAcceptAll}
            className="flex-1 border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Alle akzeptieren
          </button>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Zur Startseite
          </button>
        </div>
      </div>
    </div>
  );
}
