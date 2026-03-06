import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Logo from '@/components/shared/Logo';

export default function AgbPage() {
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

        <h1 className="text-4xl font-bold text-gray-900 mb-2">Allgemeine Geschäftsbedingungen</h1>
        <p className="text-gray-600 mb-8">WasImmoWert SaaS Plattform</p>

        <div className="space-y-6 text-gray-700 text-sm">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Geltungsbereich</h2>
            <p>
              Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Dienstleistungen der WasImmoWert Plattform. Durch die Registrierung und Nutzung stimmen Sie diesen AGB zu.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. Vertragsgegenstand</h2>
            <p>
              WasImmoWert stellt eine Cloud-basierte SaaS-Plattform zur Bewertung und Verwaltung von Immobilien bereit. Der Umfang der Leistungen richtet sich nach dem gewählten Tarif.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. Registrierung und Nutzerkonto</h2>
            <p>
              Sie verpflichten sich, bei der Registrierung wahre und vollständige Informationen anzugeben. Sie sind für die Sicherheit Ihres Passworts verantwortlich. Unbefugte Nutzung Ihres Kontos ist sofort zu melden.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. Preise und Zahlung</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Alle Preise verstehen sich inkl. MwSt. für Kunden in Deutschland</li>
              <li>Rechnungen werden monatlich oder jährlich gestellt je nach Abo-Modell</li>
              <li>Zahlungen sind innerhalb von 14 Tagen nach Rechnungsdatum fällig</li>
              <li>Bei Zahlungsverzug behalten wir uns das Recht vor, den Zugang zu sperren</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. Kündigung</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Monatliche Abos können mit 30 Tagen Frist zum Ende eines Monats gekündigt werden</li>
              <li>Jährliche Abos sind an die vereinbarte Laufzeit gebunden</li>
              <li>Kündigung erfolgt schriftlich oder über das Kundenportal</li>
              <li>Bei Kündigung werden keine Rückerstattungen für bereits bezahlte Zeiträume gewährt</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. Haftung</h2>
            <p className="mb-2">
              WasImmoWert haftet nicht für:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Indirekte oder Folgeschäden</li>
              <li>Datenverluste durch externe Faktoren</li>
              <li>Bewertungsgenauigkeit (Informationen nur zu Demonstrationszwecken)</li>
              <li>Fehler oder Unterbrechungen der Dienstleistung bis zu 99,5% Verfügbarkeit</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Nutzerpflichten</h2>
            <p className="mb-2">
              Sie verpflichten sich:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Keine illegalen oder schädlichen Aktivitäten auszuführen</li>
              <li>Keine Urheberrechte Dritter zu verletzen</li>
              <li>Keine Malware oder Hacking-Versuche durchzuführen</li>
              <li>Die Plattform nicht zu überlasten oder missbrauchen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Datenschutz</h2>
            <p>
              Die Verarbeitung Ihrer Daten erfolgt gemäß unserer <a href="/legal/datenschutz" className="text-teal-600 hover:text-teal-700">Datenschutzerklärung</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">9. Änderungen dieser AGB</h2>
            <p>
              Wir behalten uns das Recht vor, diese AGB jederzeit zu ändern. Wesentliche Änderungen werden Ihnen mindestens 30 Tage vorher mitgeteilt. Die Fortnutzung der Plattform gilt als Annahme der geänderten Bedingungen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">10. Anwendbares Recht</h2>
            <p>
              Dieses Verhältnis unterliegt deutschem Recht. Gerichtsstand ist [PLACEHOLDER: München].
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">11. Kontakt bei Fragen</h2>
            <p>
              Bei Fragen zu diesen AGB kontaktieren Sie uns unter:<br />
              E-Mail: [PLACEHOLDER: support@example.com]
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
