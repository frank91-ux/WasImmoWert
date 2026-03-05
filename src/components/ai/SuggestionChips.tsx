import {
  Banknote, TrendingUp, PiggyBank, Percent,
  ArrowDownCircle, Lightbulb, Wallet, FileText,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Suggestion {
  label: string
  prompt: string
  icon: LucideIcon
}

const SUGGESTIONS: Suggestion[] = [
  {
    label: 'Modernisierung 50k€',
    prompt: 'Simuliere eine Modernisierung für 50.000€ — wie wirkt sich das auf die Instandhaltungskosten und den Wert aus?',
    icon: Banknote,
  },
  {
    label: 'Mieterhöhung +10%',
    prompt: 'Was passiert bei einer Mieterhöhung um 10%?',
    icon: TrendingUp,
  },
  {
    label: 'Sondertilgung 5k€/J',
    prompt: 'Simuliere eine jährliche Sondertilgung von 5.000€.',
    icon: PiggyBank,
  },
  {
    label: 'Zinssatz nach Bindung?',
    prompt: 'Was passiert wenn der Zinssatz nach der Zinsbindung auf 5% steigt?',
    icon: Percent,
  },
  {
    label: 'Kaufpreis −10%',
    prompt: 'Wie ändern sich die Kennzahlen bei einem 10% niedrigeren Kaufpreis?',
    icon: ArrowDownCircle,
  },
  {
    label: 'Cashflow verbessern',
    prompt: 'Wie kann ich den monatlichen Cashflow verbessern? Gib mir konkrete Vorschläge mit Simulation.',
    icon: Lightbulb,
  },
  {
    label: 'Mehr Eigenkapital',
    prompt: 'Was bringt es, 20.000€ mehr Eigenkapital einzubringen?',
    icon: Wallet,
  },
  {
    label: 'Zusammenfassung',
    prompt: 'Gib mir eine kurze Zusammenfassung der wichtigsten Kennzahlen und eine Einschätzung.',
    icon: FileText,
  },
]

interface SuggestionChipsProps {
  onSelect: (prompt: string) => void
  disabled?: boolean
}

export function SuggestionChips({ onSelect, disabled }: SuggestionChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
      {SUGGESTIONS.map((s) => {
        const Icon = s.icon
        return (
          <button
            key={s.label}
            onClick={() => onSelect(s.prompt)}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
              bg-muted/60 hover:bg-muted text-foreground border border-border/50
              hover:border-border transition-all whitespace-nowrap
              disabled:opacity-40 disabled:cursor-not-allowed
              hover:shadow-sm active:scale-[0.97]"
          >
            <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            {s.label}
          </button>
        )
      })}
    </div>
  )
}
