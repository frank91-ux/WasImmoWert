import React, { useState, useEffect } from 'react';

interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

export const CookieBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consent, setConsent] = useState<Omit<CookieConsent, 'timestamp'>>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already consented
    const savedConsent = localStorage.getItem('cookie-consent');
    if (!savedConsent) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const consentData: CookieConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('cookie-consent', JSON.stringify(consentData));
    setIsVisible(false);
  };

  const handleAcceptNecessary = () => {
    const consentData: CookieConsent = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('cookie-consent', JSON.stringify(consentData));
    setIsVisible(false);
  };

  const handleSaveSettings = () => {
    const consentData: CookieConsent = {
      necessary: true,
      analytics: consent.analytics,
      marketing: consent.marketing,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('cookie-consent', JSON.stringify(consentData));
    setIsVisible(false);
    setShowSettings(false);
  };

  const handleToggle = (key: 'analytics' | 'marketing') => {
    setConsent((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop blur */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 z-40 ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => {
          if (showSettings) {
            setShowSettings(false);
          }
        }}
      />

      {/* Cookie Banner */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white shadow-2xl transition-transform duration-500 ease-out z-50 ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {!showSettings ? (
          // Main Banner
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Cookie-Einstellungen
                </h2>
                <p className="text-sm text-gray-600">
                  Wir nutzen Cookies, um dir ein optimales Nutzungserlebnis zu bieten. Einige Cookies sind notwendig, damit die Website funktioniert. Andere helfen uns, deine Erfahrung zu verbessern.
                </p>
              </div>

              {/* Button Group */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleAcceptNecessary}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Nur notwendige
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Einstellungen
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Alle akzeptieren
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Settings Panel
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Cookie-Einstellungen
                </h2>
                <p className="text-sm text-gray-600">
                  Wähle aus, welche Cookies du akzeptieren möchtest.
                </p>
              </div>

              {/* Cookie Toggles */}
              <div className="space-y-4">
                {/* Necessary Cookies */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Notwendige Cookies
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Sind erforderlich, damit die Website funktioniert. Sie können nicht deaktiviert werden.
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="w-5 h-5 text-blue-600 rounded cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Analyse-Cookies
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Helfen uns zu verstehen, wie du unsere Website nutzt, damit wir sie verbessern können.
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => handleToggle('analytics')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        consent.analytics
                          ? 'bg-blue-600'
                          : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          consent.analytics ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Marketing-Cookies
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Ermöglichen es, dir relevante Inhalte basierend auf deinen Interessen zu zeigen.
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => handleToggle('marketing')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        consent.marketing
                          ? 'bg-blue-600'
                          : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          consent.marketing ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Zurück
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
