import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Mail } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';

export default function PressePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <Logo />
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-2">Presse & Medien</h1>
        <p className="text-gray-600 mb-8">
          Informationen über WasImmoWert für Journalisten, Blogger und Medienkontakte.
        </p>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Über WasImmoWert</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            WasImmoWert ist eine moderne SaaS-Plattform zur professionellen Bewertung und Verwaltung von Immobilien. Wir unterstützen Makler, Investoren und private Nutzer bei der genauen Einschätzung von Immobilienwerten basierend auf aktuellen Marktdaten.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Mit unseren innovativen Tools und datengestützten Analysen bieten wir eine zuverlässige Lösung für die Immobilienbranche im deutschsprachigen Raum.
          </p>
        </section>

        <section className="mb-12 bg-blue-50 border border-blue-200 rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Fakten über WasImmoWert</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-blue-700 mb-1">Gründung</p>
              <p className="text-lg text-gray-900 font-semibold">2022</p>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-700 mb-1">Sitz</p>
              <p className="text-lg text-gray-900 font-semibold">Berlin, Deutschland</p>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-700 mb-1">Fokus</p>
              <p className="text-lg text-gray-900 font-semibold">Immobilienbewertung</p>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-700 mb-1">Nutzer</p>
              <p className="text-lg text-gray-900 font-semibold">5.000+ aktive Nutzer</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Presse-Kontakt</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
            <div className="flex items-start gap-4 mb-6">
              <Mail className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-gray-900">Presseanfragen</p>
                <p className="text-blue-600 font-medium">press@wasimmowert.de</p>
                <p className="text-sm text-gray-600 mt-1">
                  Für Interviews, Pressemitteilungen und Medienanfragen.
                </p>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600">
                Wir antworten auf Presseanfragen innerhalb von 24 Stunden während der Geschäftszeiten.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Download-Material</h2>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">WasImmoWert Logo (SVG)</p>
                  <p className="text-sm text-gray-600">Hochauflösendes Logo für Medienzwecke</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">Screenshots & Screenshots</p>
                  <p className="text-sm text-gray-600">Produktscreenshots für Veröffentlichungen</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">Pressemitteilungen-Archiv</p>
                  <p className="text-sm text-gray-600">Alle aktuellen und früheren Pressemitteilungen</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="pt-8 border-t border-gray-200">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}
