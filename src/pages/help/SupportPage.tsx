import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    id: 'account-1',
    category: 'Account',
    question: 'Wie erstelle ich ein neues Konto?',
    answer: 'Klicken Sie auf "Registrieren" auf der Startseite und folgen Sie den Anweisungen. Sie benötigen eine gültige E-Mail-Adresse und ein sicheres Passwort.'
  },
  {
    id: 'projects-1',
    category: 'Projekte',
    question: 'Wie viele Projekte kann ich erstellen?',
    answer: 'Mit Ihrem WasImmoWert-Konto können Sie unbegrenzt viele Immobilienprojekte erstellen und verwalten.'
  },
  {
    id: 'calculation-1',
    category: 'Berechnung',
    question: 'Wie wird die Immobilienbewertung berechnet?',
    answer: 'Unsere Bewertungsmethode basiert auf aktuellen Marktdaten, Lage, Zustand und vergleichbaren Objekten in Ihrer Region.'
  },
  {
    id: 'export-1',
    category: 'Export',
    question: 'In welchen Formaten kann ich Berichte exportieren?',
    answer: 'Sie können Ihre Berichte als PDF oder Excel-Datei exportieren. Beide Formate enthalten alle relevanten Daten und Grafiken.'
  },
  {
    id: 'billing-1',
    category: 'Abrechnung',
    question: 'Wie kann ich mein Abonnement kündigen?',
    answer: 'Sie können Ihr Abonnement jederzeit in den Kontoeinstellungen unter "Abrechnung" kündigen. Es entstehen keine zusätzlichen Kosten.'
  },
  {
    id: 'account-2',
    category: 'Account',
    question: 'Wie ändere ich mein Passwort?',
    answer: 'Gehen Sie zu Ihren Kontoeinstellungen, wählen Sie "Sicherheit" und klicken Sie auf "Passwort ändern". Sie müssen Ihr aktuelles Passwort bestätigen.'
  }
];

export default function SupportPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const categories = Array.from(new Set(faqItems.map(item => item.category)));

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <Logo />
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-2">Hilfe & Support</h1>
        <p className="text-gray-600 mb-8">
          Finden Sie Antworten auf häufig gestellte Fragen zu WasImmoWert.
        </p>

        {categories.map(category => (
          <div key={category} className="mb-8">
            <h2 className="text-2xl font-semibold text-teal-700 mb-4">{category}</h2>
            <div className="space-y-3">
              {faqItems
                .filter(item => item.category === category)
                .map(item => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:border-teal-300 transition-colors"
                  >
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                    >
                      <span className="font-medium text-gray-900">{item.question}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-teal-600 transition-transform duration-200 ${
                          expandedId === item.id ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedId === item.id && (
                      <div className="px-6 py-4 bg-white border-t border-gray-200">
                        <p className="text-gray-700">{item.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}

        <div className="bg-teal-50 border border-teal-200 rounded-lg p-6 mt-12 mb-12">
          <p className="text-teal-900 font-medium mb-2">Noch weitere Fragen?</p>
          <p className="text-teal-700 text-sm">
            Kontaktieren Sie unser Support-Team unter{' '}
            <Link to="/help/kontakt" className="underline font-semibold hover:text-teal-800">
              Kontakt
            </Link>
          </p>
        </div>

        <div className="pt-8 border-t border-gray-200">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}
