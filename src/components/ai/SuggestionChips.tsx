import {
  Banknote, TrendingUp, PiggyBank, Percent,
  ArrowDownCircle, Lightbulb, Wallet, FileText,
  Wrench, Scale, Building2, Calculator,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Suggestion {
  label: string
  description: string
  prompt: string
  icon: LucideIcon
}

const SUGGESTIONS: Suggestion[] = [
  {
    label: 'Modernisierung planen',
    description: 'Modernisierung nach 4 Jahren mit 80.000 € Kredit — wie wirkt sich das auf Wert, AfA und Cashflow aus?',
    prompt: 'Ich plane eine Modernisierung nach 4 Jahren für ca. 80.000 EUR, finanziert über einen Zusatzkredit. Berechne die Auswirkungen auf den Immobilienwert (Mieterhöhung nach §559 BGB), die zusätzliche AfA-Abschreibung und den neuen monatlichen Cashflow.',
    icon: Wrench,
  },
  {
    label: 'Cashflow verbessern',
    description: 'Welche 3 Stellschrauben haben den größten Hebel auf meinen monatlichen Cashflow?',
    prompt: 'Analysiere mein Projekt und zeige mir die 3 wirkungsvollsten Stellschrauben, um den monatlichen Cashflow zu verbessern. Berechne für jeden Hebel den konkreten Effekt in EUR/Monat.',
    icon: Lightbulb,
  },
  {
    label: 'Zinsbindungsende',
    description: 'Was passiert wenn der Zinssatz nach der Zinsbindung auf 5% steigt? Wie ändert sich die Rate?',
    prompt: 'Berechne was nach der Zinsbindung passiert, wenn der Anschlusszins bei 5% liegt. Zeige mir die neue monatliche Rate, den Cashflow-Unterschied und wie sich die Restschuld entwickelt.',
    icon: Percent,
  },
  {
    label: 'Mieterhöhung simulieren',
    description: 'Was bringt eine Mieterhöhung um 10%? Wie ändern sich Rendite und Cashflow?',
    prompt: 'Simuliere eine Mieterhöhung um 10%. Zeige mir die Auswirkungen auf Bruttomietrendite, Nettomietrendite, monatlichen Cashflow und Eigenkapitalrendite.',
    icon: TrendingUp,
  },
  {
    label: 'Sondertilgung',
    description: 'Lohnt sich eine jährliche Sondertilgung von 5.000 €? Wie viel spare ich an Zinsen?',
    prompt: 'Berechne den Effekt einer jährlichen Sondertilgung von 5.000 EUR. Wie viel Zinsen spare ich insgesamt? Wie viel früher ist der Kredit abbezahlt? Was ist die bessere Alternative: Sondertilgung oder ETF-Sparplan?',
    icon: PiggyBank,
  },
  {
    label: 'Kaufpreis verhandeln',
    description: 'Was bringt mir ein 10% niedrigerer Kaufpreis bei allen Kennzahlen?',
    prompt: 'Berechne wie sich ein 10% niedrigerer Kaufpreis auf alle relevanten Kennzahlen auswirkt: Kaufnebenkosten, Kreditrate, Cashflow, Bruttomietrendite, Eigenkapitalrendite und DSCR.',
    icon: ArrowDownCircle,
  },
  {
    label: 'Mehr Eigenkapital',
    description: 'Was passiert wenn ich 20.000 € mehr Eigenkapital einbringe?',
    prompt: 'Berechne die Auswirkungen von 20.000 EUR mehr Eigenkapital: Wie ändert sich die monatliche Rate, der Cashflow und die Eigenkapitalrendite? Ist es sinnvoller, das Geld stattdessen in einen ETF zu investieren?',
    icon: Wallet,
  },
  {
    label: 'Steuerliche Auswirkung',
    description: 'Wie stark reduziert die AfA-Abschreibung meine Steuerlast? Was bedeutet das real?',
    prompt: 'Erkläre mir die steuerlichen Auswirkungen meiner Immobilie: Wie hoch ist die AfA-Abschreibung? Wie viel spare ich real an Steuern pro Jahr? Wie wirkt sich das auf den Cashflow nach Steuer aus?',
    icon: Calculator,
  },
  {
    label: 'Nebenkosten-Explosion',
    description: 'Simuliere: Nebenkosten verdoppeln sich ab Jahr 3 — wie verändert sich der Cashflow über 30 Jahre?',
    prompt: 'Simuliere folgendes Szenario in den Charts: Die Nebenkosten verdoppeln sich ab Jahr 3 (z.B. durch steigende Energiepreise). Zeige mir die Auswirkung auf den jährlichen Cashflow und die Wertentwicklung über 30 Jahre.',
    icon: TrendingUp,
  },
  {
    label: 'Sonderumlage mit Kredit',
    description: 'Sonderumlage von 15.000 € ab Jahr 4 über einen Kredit finanziert — Auswirkung simulieren',
    prompt: 'Simuliere eine Sonderumlage von 15.000 EUR ab Jahr 4, die ich über einen Kredit mit 4,5% Zinsen und 5% anfänglicher Tilgung finanziere. Zeige die Auswirkung auf den Cashflow und die Gesamtrestschuld in den Charts.',
    icon: Banknote,
  },
  {
    label: 'MFH-Potenzial',
    description: 'Lohnt sich eine Aufteilung in mehrere Wohneinheiten für die Mietrendite?',
    prompt: 'Analysiere das Potenzial einer Aufteilung meiner Immobilie in Wohneinheiten. Wie würde sich die Mietrendite ändern, wenn ich statt einer großen Wohnung zwei kleinere vermiete? Berücksichtige den Aufwand und die Kosten.',
    icon: Building2,
  },
  {
    label: 'Gesamtbewertung',
    description: 'Gib mir eine ehrliche Einschätzung: Ist dieses Investment empfehlenswert?',
    prompt: 'Gib mir eine ehrliche und ausführliche Gesamtbewertung meines Immobilien-Investments. Analysiere Stärken, Schwächen und Risiken. Für wen ist dieses Investment geeignet und für wen nicht? Vergleiche mit alternativen Anlagen.',
    icon: Scale,
  },
]

interface SuggestionChipsProps {
  onSelect: (prompt: string) => void
  disabled?: boolean
}

export function SuggestionChips({ onSelect, disabled }: SuggestionChipsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {SUGGESTIONS.map((s) => {
        const Icon = s.icon
        return (
          <button
            key={s.label}
            onClick={() => onSelect(s.prompt)}
            disabled={disabled}
            className="flex items-start gap-3 p-3 rounded-xl text-left
              bg-card hover:bg-muted/60 border hover:border-teal-300 dark:hover:border-teal-700
              transition-all group
              disabled:opacity-40 disabled:cursor-not-allowed
              hover:shadow-sm active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 flex items-center justify-center shrink-0 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/40 transition-colors">
              <Icon className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground">{s.label}</div>
              <div className="text-xs text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">{s.description}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
