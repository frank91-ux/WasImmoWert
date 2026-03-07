import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, Check, Star, Zap, Crown, ChevronDown, ArrowRight } from 'lucide-react'
import { staggerContainer, staggerItem, fadeInUp } from '@/lib/animations'
import { useAuthStore } from '@/store/useAuthStore'

/* ─── Pricing Tiers ─── */
interface PricingTier {
  name: string
  price: string
  priceNote?: string
  icon: typeof Check
  badge?: string
  features: string[]
  cta: string
  popular?: boolean
  highlight?: string
}

const tiers: PricingTier[] = [
  {
    name: 'Free',
    price: 'Kostenlos',
    icon: Zap,
    features: [
      '3 Projekte',
      'Schnellbewertung',
      'Basis-KPIs (Cashflow, Kaufpreisfaktor)',
      'Regionale Vergleichsdaten',
      'Helle & Dunkle Ansicht',
    ],
    cta: 'Kostenlos starten',
  },
  {
    name: 'Pro',
    price: '€9,99',
    priceNote: '/ Monat',
    icon: Star,
    badge: 'Beliebt',
    popular: true,
    features: [
      'Unbegrenzte Projekte',
      'Steuer-Simulation (AfA, §32a EStG)',
      'KI-Immobilienberater',
      'Alle Charts & Grafiken',
      'Sensitivitätsanalyse',
      'Szenarien-Vergleich',
      'Daten-Export (PDF, CSV)',
      'Projekt-Portfolio',
      'Priority-Updates',
    ],
    cta: 'Pro starten',
  },
  {
    name: 'Lifetime',
    price: '€99,99',
    priceNote: 'einmalig',
    icon: Crown,
    highlight: 'Bester Wert',
    features: [
      'Alles aus Pro — für immer',
      'Lifetime-Zugang ohne Abo',
      'Priority-Support',
      'Alle zukünftigen Features',
      'Keine monatlichen Kosten',
      'Early Access für Beta-Features',
    ],
    cta: 'Lifetime sichern',
  },
]

/* ─── FAQ ─── */
const faqs = [
  {
    q: 'Kann ich jederzeit kündigen?',
    a: 'Ja, du kannst dein Pro-Abo jederzeit kündigen. Der Zugang bleibt bis zum Ende der bezahlten Periode bestehen.',
  },
  {
    q: 'Was passiert mit meinen Projekten beim Downgrade?',
    a: 'Deine Projekte bleiben erhalten. Du kannst weiterhin alle Projekte einsehen, aber nur die ersten 3 bearbeiten.',
  },
  {
    q: 'Wie funktioniert der Lifetime-Plan?',
    a: 'Eine Einmalzahlung — kein Abo. Du erhältst dauerhaft Zugang zu allen Pro-Features, inklusive aller zukünftigen Updates.',
  },
  {
    q: 'Gibt es eine Geld-zurück-Garantie?',
    a: 'Ja, innerhalb von 14 Tagen nach dem Kauf bieten wir eine volle Rückerstattung an — keine Fragen.',
  },
  {
    q: 'Welche Zahlungsmethoden werden akzeptiert?',
    a: 'Wir akzeptieren Kreditkarten (Visa, Mastercard, AMEX), PayPal und SEPA-Lastschrift.',
  },
]

/* ─── Feature Comparison ─── */
const comparisonFeatures = [
  { name: 'Projekte', free: '3', pro: 'Unbegrenzt', lifetime: 'Unbegrenzt' },
  { name: 'Schnellbewertung', free: true, pro: true, lifetime: true },
  { name: 'Basis-KPIs', free: true, pro: true, lifetime: true },
  { name: 'Regionale Daten', free: true, pro: true, lifetime: true },
  { name: 'Erweiterte KPIs (DSCR, EK-Rendite)', free: false, pro: true, lifetime: true },
  { name: 'Steuer-Simulation', free: false, pro: true, lifetime: true },
  { name: 'KI-Immobilienberater', free: false, pro: true, lifetime: true },
  { name: 'Alle Charts & Grafiken', free: false, pro: true, lifetime: true },
  { name: 'Sensitivitätsanalyse', free: false, pro: true, lifetime: true },
  { name: 'Szenarien-Vergleich', free: false, pro: true, lifetime: true },
  { name: 'Daten-Export (PDF, CSV)', free: false, pro: true, lifetime: true },
  { name: 'Projekt-Portfolio', free: false, pro: true, lifetime: true },
  { name: 'Priority-Support', free: false, pro: false, lifetime: true },
  { name: 'Early Access', free: false, pro: false, lifetime: true },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border last:border-0">
      <button
        className="flex items-center justify-between w-full py-4 text-left text-sm font-medium hover:text-primary transition-colors cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        {q}
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-40 pb-4' : 'max-h-0'}`}>
        <p className="text-sm text-muted-foreground">{a}</p>
      </div>
    </div>
  )
}

export default function PricingPage() {
  const navigate = useNavigate()
  const { authMode } = useAuthStore()

  const handleSelectPlan = (plan: string) => {
    if (authMode === 'authenticated') {
      navigate('/account')
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="h-8 w-8 rounded-lg brand-gradient flex items-center justify-center">
              <Building2 className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="brand-gradient-text">WasImmoWert</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Startseite
            </Link>
            <button
              onClick={() => navigate(authMode === 'authenticated' ? '/projects' : '/')}
              className="btn-brand px-4 py-2 rounded-lg text-sm"
            >
              {authMode === 'authenticated' ? 'Zum Dashboard' : 'Jetzt starten'}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 lg:py-24 px-4 sm:px-6">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Einfache, transparente <span className="brand-gradient-text">Preise</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Starte kostenlos und erweitere bei Bedarf. Keine versteckten Kosten, keine Überraschungen.
          </p>
        </motion.div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4 sm:px-6">
        <motion.div
          className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6 lg:gap-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {tiers.map((tier) => {
            const Icon = tier.icon
            return (
              <motion.div
                key={tier.name}
                variants={staggerItem}
                className={`relative rounded-2xl border p-6 lg:p-8 flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
                  tier.popular
                    ? 'border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/20 scale-[1.02]'
                    : 'border-border hover:border-blue-200'
                } bg-card`}
              >
                {tier.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold text-white btn-brand">
                    {tier.badge}
                  </span>
                )}
                {tier.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                    {tier.highlight}
                  </span>
                )}

                <div className="flex items-center gap-3 mb-5">
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                    tier.popular ? 'brand-gradient' : tier.name === 'Lifetime' ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-muted'
                  }`}>
                    <Icon className={`h-5 w-5 ${tier.popular || tier.name === 'Lifetime' ? 'text-white' : 'text-muted-foreground'}`} />
                  </div>
                  <h3 className="text-xl font-bold">{tier.name}</h3>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold tabular-nums">{tier.price}</span>
                  {tier.priceNote && (
                    <span className="text-muted-foreground ml-1.5 text-sm">{tier.priceNote}</span>
                  )}
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check className={`h-4 w-4 mt-0.5 shrink-0 ${tier.popular ? 'text-blue-500' : 'text-primary'}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(tier.name.toLowerCase())}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                    tier.popular
                      ? 'btn-brand'
                      : tier.name === 'Lifetime'
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow-sm hover:shadow-md'
                        : 'border border-border hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20'
                  }`}
                >
                  {tier.cta}
                  <ArrowRight className="inline-block h-4 w-4 ml-1" />
                </button>
              </motion.div>
            )
          })}
        </motion.div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-16 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            className="text-2xl font-bold text-center mb-10"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            Alle Features im Vergleich
          </motion.h2>

          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="grid grid-cols-4 text-sm font-semibold border-b bg-muted/50 px-4 py-3">
              <div>Feature</div>
              <div className="text-center">Free</div>
              <div className="text-center text-primary">Pro</div>
              <div className="text-center">Lifetime</div>
            </div>
            {comparisonFeatures.map((f, i) => (
              <div key={f.name} className={`grid grid-cols-4 text-sm px-4 py-3 ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                <div className="font-medium">{f.name}</div>
                {(['free', 'pro', 'lifetime'] as const).map((plan) => {
                  const val = f[plan]
                  return (
                    <div key={plan} className="text-center">
                      {typeof val === 'boolean' ? (
                        val ? (
                          <Check className="h-4 w-4 text-blue-500 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )
                      ) : (
                        <span className={plan !== 'free' ? 'font-medium' : ''}>{val}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <motion.h2
            className="text-2xl font-bold text-center mb-8"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            Häufig gestellte Fragen
          </motion.h2>
          <div className="rounded-xl border bg-card p-6">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="gradient-hero dark:gradient-hero-dark rounded-2xl p-8 lg:p-12 text-white">
            <h2 className="text-2xl lg:text-3xl font-bold mb-3">
              Bereit, Ihre Immobilien professionell zu bewerten?
            </h2>
            <p className="text-white/80 mb-6 max-w-lg mx-auto">
              Starten Sie kostenlos und erleben Sie, wie einfach Immobilienbewertung sein kann.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-white text-primary font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors cursor-pointer"
            >
              Jetzt kostenlos starten
              <ArrowRight className="inline-block h-4 w-4 ml-1.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded brand-gradient flex items-center justify-center">
              <Building2 className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-medium text-foreground">WasImmoWert</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/legal/impressum" className="hover:text-foreground transition-colors">Impressum</Link>
            <Link to="/legal/datenschutz" className="hover:text-foreground transition-colors">Datenschutz</Link>
            <Link to="/legal/agb" className="hover:text-foreground transition-colors">AGB</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
