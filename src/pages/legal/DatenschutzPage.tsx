import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';

export default function DatenschutzPage() {
  const navigate = useNavigate();

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

        <h1 className="text-4xl font-bold text-gray-900 mb-2">Datenschutzerklärung</h1>
        <p className="text-gray-600 mb-8">Gültig ab: März 2024</p>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Verantwortlicher</h2>
            <p>
              Verantwortlich für die Datenverarbeitung ist:<br />
              <strong>[PLACEHOLDER: Unternehmensname]</strong><br />
              [PLACEHOLDER: Straße und Hausnummer]<br />
              [PLACEHOLDER: Postleitzahl und Stadt]<br />
              E-Mail: [PLACEHOLDER: kontakt@example.com]<br />
              Telefon: [PLACEHOLDER: +49 XXX XXXXXXXX]
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. Erhobene Daten</h2>
            <p>
              Wir verarbeiten folgende Kategorien personenbezogener Daten:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Kontaktdaten (Name, E-Mail, Telefon)</li>
              <li>Authentifizierungsdaten (Passwort-Hashes)</li>
              <li>Nutzungsdaten (IP-Adresse, Browser-Informationen)</li>
              <li>Immobilien-Daten (Objekt-Informationen, Bewertungen)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. Zweck der Verarbeitung</h2>
            <p>
              Ihre Daten werden verarbeitet für:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Bereitstellung der WasImmoWert-Plattform</li>
              <li>Authentifizierung und Sicherheit</li>
              <li>Verbesserung unserer Services</li>
              <li>Erfüllung gesetzlicher Anforderungen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. Rechtsgrundlage</h2>
            <p>
              Die Verarbeitung erfolgt auf Basis von Art. 6 DSGVO:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Art. 6 Abs. 1 b) DSGVO - Erfüllung eines Vertrags</li>
              <li>Art. 6 Abs. 1 f) DSGVO - Berechtigte Interessen</li>
              <li>Art. 6 Abs. 1 a) DSGVO - Ihre Einwilligung</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. Speicherdauer</h2>
            <p>
              Ihre Daten werden so lange gespeichert, wie Ihr Konto aktiv ist. Nach Löschung des Kontos werden Ihre Daten innerhalb von 30 Tagen gelöscht, soweit keine gesetzlichen Aufbewahrungspflichten bestehen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. Ihre Rechte</h2>
            <p>
              Sie haben folgende Rechte gemäß DSGVO:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Auskunftsrecht (Art. 15 DSGVO)</li>
              <li>Berichtigungsrecht (Art. 16 DSGVO)</li>
              <li>Löschungsrecht (Art. 17 DSGVO)</li>
              <li>Einschränkungsrecht (Art. 18 DSGVO)</li>
              <li>Datenportabilität (Art. 20 DSGVO)</li>
              <li>Widerspruchsrecht (Art. 21 DSGVO)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Cookies</h2>
            <p>
              Wir verwenden notwendige und analytische Cookies. Weitere Informationen finden Sie in unserer <a href="/legal/cookies" className="text-blue-600 hover:text-blue-700">Cookie-Richtlinie</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Kontakt</h2>
            <p>
              Für Fragen zum Datenschutz kontaktieren Sie uns unter:<br />
              E-Mail: [PLACEHOLDER: datenschutz@example.com]
            </p>
          </section>
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
