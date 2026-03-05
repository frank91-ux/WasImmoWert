import type { KpiResult } from '@/calc/types'
import { formatEur, formatPercent } from '@/lib/format'

interface ProjectHeaderKpisProps {
  kpis: KpiResult
  nutzungsart: 'vermietung' | 'eigennutzung'
}

export function ProjectHeaderKpis({ kpis, nutzungsart }: ProjectHeaderKpisProps) {
  const isEigennutzung = nutzungsart === 'eigennutzung'

  const items = isEigennutzung
    ? [
        { label: 'Monatl. Kosten', value: formatEur(kpis.monatlicheKosten) },
        { label: 'Ersparte Miete', value: formatEur(kpis.ersparteMieteJahr / 12) },
        { label: 'Vermögenszuw.', value: formatEur(kpis.vermoegenszuwachsMonatlich), trend: kpis.vermoegenszuwachsMonatlich >= 0 },
      ]
    : [
        { label: 'Cashflow/Mon', value: formatEur(kpis.monatlichCashflowNachSteuer), trend: kpis.monatlichCashflowNachSteuer >= 0 },
        { label: 'Bruttorendite', value: formatPercent(kpis.bruttomietrendite), trend: kpis.bruttomietrendite >= 4 },
        { label: 'Vermögenszuw.', value: formatEur(kpis.vermoegenszuwachsMonatlich), trend: kpis.vermoegenszuwachsMonatlich >= 0 },
      ]

  return (
    <div className="flex items-center gap-3">
      {items.map((item) => (
        <div key={item.label} className="text-center px-2">
          <div className="text-[0.65rem] text-muted-foreground leading-tight">{item.label}</div>
          <div className={`text-sm font-semibold tabular-nums ${
            item.trend === undefined ? '' : item.trend ? 'text-success' : 'text-destructive'
          }`}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  )
}
