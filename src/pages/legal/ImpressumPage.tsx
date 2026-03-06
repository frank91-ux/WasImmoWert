import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';

export default function ImpressumPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-white min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-6"
          >
            <ArrowLeft size={20} />
            Zurück
          </button>
          <Logo />
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-2">Impressum</h1>
        <p className="text-gray-600 mb-8">Gem. § 5 Telemediengesetz (TMG)</p>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Angaben gem. § 5 TMG</h2>
            <div className="space-y-4">
              <div>
                <p className="font-semibold">Unternehmensname:</p>
                <p>[PLACEHOLDER: WasImmoWert GmbH]</p>
              </div>
              <div>
                <p className="font-semibold">Adresse:</p>
                <p>
                  [PLACEHOLDER: Straße und Hausnummer]<br />
                  [PLACEHOLDER: Postleitzahl und Stadt]<br />
                  [PLACEHOLDER: Deutschland]
                </p>
              </div>
              <div>
                <p className="font-semibold">Vertretungsberechtigte Geschäftsführer:</p>
                <p>[PLACEHOLDER: Max Mustermann, Erika Musterfrau]</p>
              </div>
              <div>
                <p className="font-semibold">Handelsregister:</p>
                <p>[PLACEHOLDER: HR-Nummer XYZ, Amtsgericht München]</p>
              </div>
              <div>
                <p className="font-semibold">Umsatzsteuer-ID:</p>
                <p>[PLACEHOLDER: DE123456789]</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Kontaktinformationen</h2>
            <div className="space-y-2">
              <p><strong>Telefon:</strong> [PLACEHOLDER: +49 XXX XXXXXXXX]</p>
              <p><strong>E-Mail:</strong> [PLACEHOLDER: kontakt@example.com]</p>
              <p><strong>Internet:</strong> <a href="#" className="text-teal-600 hover:text-teal-700">www.wasimmowert.de</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Haftungsausschluss</h2>
            <div className="space-y-3 text-sm">
              <p>
                <strong>Haftung für Inhalte:</strong> Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
              </p>
              <p>
                <strong>Haftung für Links:</strong> Unser Angebot enthält Links zu externen Websites. Für den Inhalt dieser externen Seiten sind wir nicht verantwortlich.
              </p>
              <p>
                <strong>Haftung für Immobilienbewertungen:</strong> Die auf dieser Plattform angezeigten Immobilienbewertungen dienen nur zu Informationszwecken und stellen keine rechtliche oder finanzielle Beratung dar.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Urheberrecht</h2>
            <p>
              Die Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des Autors oder Erstellers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Datenschutz</h2>
            <p>
              Informationen zur Verarbeitung personenbezogener Daten finden Sie in unserer <a href="/legal/datenschutz" className="text-teal-600 hover:text-teal-700">Datenschutzerklärung</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Redaktionelle Verantwortung</h2>
            <p>
              Redaktionell verantwortlich ist:<br />
              [PLACEHOLDER: Name]<br />
              [PLACEHOLDER: Titel/Position]
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200">
          <button
            onClick={() => navigate('/')}
            className="text-teal-600 hover:text-teal-700 flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Zur Startseite
          </button>
        </div>
      </div>
    </div>
  );
}
