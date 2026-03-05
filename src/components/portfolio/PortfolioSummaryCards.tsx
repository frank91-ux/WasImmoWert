import { Card, CardContent } from '@/components/ui/card'
import { formatEur } from '@/lib/format'
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react'

interface PortfolioSummaryCardsProps {
  totals: {
    mieteinnahmenMonat: number
    kreditrateMonat: number
    cashflowMonat: number
    gesamtVermoegenJ10: number
  }
}

export function PortfolioSummaryCards({ totals }: PortfolioSummaryCardsProps) {
  const cards = [
    {
      label: 'Mieteinnahmen',
      value: formatEur(totals.mieteinnahmenMonat) + '/Mon',
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-950/30',
    },
    {
      label: 'Kreditraten',
      value: formatEur(totals.kreditrateMonat) + '/Mon',
      icon: TrendingDown,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-950/30',
    },
    {
      label: 'Netto Cashflow',
      value: formatEur(totals.cashflowMonat) + '/Mon',
      icon: Wallet,
      color: totals.cashflowMonat >= 0 ? 'text-green-600' : 'text-red-600',
      bg: totals.cashflowMonat >= 0 ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30',
    },
    {
      label: 'Vermögen (Jahr 10)',
      value: formatEur(totals.gesamtVermoegenJ10),
      icon: PiggyBank,
      color: 'text-primary',
      bg: 'bg-primary/5',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg ${card.bg} flex items-center justify-center shrink-0`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className={`text-lg font-bold tabular-nums ${card.color}`}>{card.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
