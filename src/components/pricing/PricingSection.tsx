import { Check, Star, Zap, Crown } from 'lucide-react'
import { motion } from 'framer-motion'
import { staggerContainer, staggerItem } from '@/lib/animations'

interface PricingTier {
  name: string
  price: string
  priceNote?: string
  icon: typeof Check
  badge?: string
  features: string[]
  cta: string
  popular?: boolean
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
    ],
    cta: 'Pro starten',
  },
  {
    name: 'Lifetime',
    price: '€99,99',
    priceNote: 'einmalig',
    icon: Crown,
    features: [
      'Alles aus Pro – für immer',
      'Lifetime-Zugang',
      'Priority-Support',
      'Alle zukünftigen Features',
      'Keine monatlichen Kosten',
    ],
    cta: 'Lifetime sichern',
  },
]

interface PricingSectionProps {
  onSelectPlan?: (plan: 'free' | 'pro' | 'lifetime') => void
}

export function PricingSection({ onSelectPlan }: PricingSectionProps) {
  return (
    <section id="preise" className="py-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-3">
            Einfache, transparente Preise
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Starte kostenlos und erweitere bei Bedarf. Keine versteckten Kosten.
          </p>
        </div>

        <motion.div
          className="grid md:grid-cols-3 gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {tiers.map((tier) => {
            const Icon = tier.icon
            const planKey = tier.name.toLowerCase() as 'free' | 'pro' | 'lifetime'
            return (
              <motion.div
                key={tier.name}
                variants={staggerItem}
                className={`relative rounded-2xl border p-6 flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${
                  tier.popular
                    ? 'border-blue-500 shadow-lg shadow-blue-500/10 scale-[1.02]'
                    : 'border-border'
                } bg-card`}
              >
                {tier.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold text-white btn-brand">
                    {tier.badge}
                  </span>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                    tier.popular
                      ? 'brand-gradient'
                      : 'bg-muted'
                  }`}>
                    <Icon className={`h-5 w-5 ${tier.popular ? 'text-white' : 'text-muted-foreground'}`} />
                  </div>
                  <h3 className="text-lg font-bold">{tier.name}</h3>
                </div>

                <div className="mb-6">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  {tier.priceNote && (
                    <span className="text-muted-foreground ml-1">{tier.priceNote}</span>
                  )}
                </div>

                <ul className="space-y-3 flex-1 mb-6">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => onSelectPlan?.(planKey)}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                    tier.popular
                      ? 'btn-brand'
                      : 'border border-border hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20'
                  }`}
                >
                  {tier.cta}
                </button>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
