import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';

type FeedbackType = 'feature' | 'bug' | 'other';

export default function FeedbackPage() {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('feature');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setFeedbackType('feature');
      setDescription('');
      setEmail('');
      setSubmitted(false);
    }, 3000);
  };

  const feedbackTypeOptions: { value: FeedbackType; label: string }[] = [
    { value: 'feature', label: 'Feature-Wunsch' },
    { value: 'bug', label: 'Fehler melden' },
    { value: 'other', label: 'Sonstiges' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <Logo />
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-2">Feedback</h1>
        <p className="text-gray-600 mb-8">
          Ihre Meinung ist uns wichtig. Teilen Sie Ihre Ideen, Verbesserungsvorschläge oder Fehlerberichte mit uns.
        </p>

        {submitted && (
          <div className="bg-teal-50 border border-teal-200 text-teal-700 px-6 py-4 rounded-lg mb-8">
            <p className="font-semibold">Danke für Ihr Feedback!</p>
            <p className="text-sm mt-1">Wir schätzen Ihre Unterstützung bei der Verbesserung von WasImmoWert.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-gray-50 p-8 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">Feedback-Typ</label>
            <div className="space-y-3">
              {feedbackTypeOptions.map(option => (
                <div key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    id={option.value}
                    name="feedbackType"
                    value={option.value}
                    checked={feedbackType === option.value}
                    onChange={(e) => setFeedbackType(e.target.value as FeedbackType)}
                    className="w-4 h-4 text-teal-600 cursor-pointer"
                  />
                  <label htmlFor={option.value} className="ml-3 text-gray-700 cursor-pointer">
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Beschreibung</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none"
              placeholder="Beschreiben Sie Ihr Feedback so detailliert wie möglich..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-Mail (optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              placeholder="ihre.email@example.com"
            />
            <p className="text-xs text-gray-500 mt-2">
              Damit wir Sie kontaktieren können, falls wir Fragen zu Ihrem Feedback haben.
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Feedback senden
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-gray-200">
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
