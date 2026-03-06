import { useState } from 'react'
import type { KpiResult, CalculationResult, Project } from '@/calc/types'
import { formatEur, formatPercent } from '@/lib/format'
import { HelpCircle } from 'lucide-react'
import { KpiInfoDialog } from './KpiInfoDialog'

interface ProjectHeaderKpisProps {
  kpis: KpiResult
  nutzungsart: 'vermietung' | 'eigennutzung'
  result?: CalculationResult
  project?: Project
}

export function ProjectHeaderKpis({ kpis, nutzungsart, result, project }: ProjectHeaderKpisProps) {
  const [infoKey, setInfoKey] = useState<string | null>(null)
  const [infoValue, setInfoValue] = useState('')

  const isEigennutzung = nutzungsart === 'eigennutzung'

  const items = isEigennutzung
    ? [
        { label: 'Monatl. Kosten', value: formatEur(kpis.monatlicheKosten), key: 'monatlicheKosten' },
        { label: 'Ersparte Miete', value: formatEur(kpis.ersparteMieteJahr / 12), key: 'ersparteMiete' },
        { label: 'Vermögenszuw.', value: formatEur(kpis.vermoegenszuwachsMonatlich), trend: kpis.vermoegenszuwachsMonatlich >= 0, key: 'vermoegenszuwachs' },
      ]
    : [
        { label: 'Cashflow/Mon', value: formatEur(kpis.monatlichCashflowNachSteuer), trend: kpis.monatlichCashflowNachSteuer >= 0, key: 'cashflow' },
        { label: 'Bruttorendite', value: formatPercent(kpis.bruttomietrendite), trend: kpis.bruttomietrendite >= 4, key: 'bruttomietrendite' },
        { label: 'Vermögenszuw.', value: formatEur(kpis.vermoegenszuwachsMonatlich), trend: kpis.vermoegenszuwachsMonatlich >= 0, key: 'vermoegenszuwachs' },
      ]

  return (
    <>
      <div className="flex items-center gap-3">
        {items.map((item) => (
          <button
            key={item.label}
            className="text-center px-2 group cursor-pointer hover:bg-muted/50 rounded-md py-1 transition-colors"
            onClick={() => { setInfoKey(item.key); setInfoValue(item.value) }}
          >
            <div className="text-[0.65rem] text-muted-foreground leading-tight flex items-center justify-center gap-1">
              {item.label}
              <HelpCircle className="h-2.5 w-2.5 opacity-0 group-hover:opacity-60 transition-opacity" />
            </div>
            <div className={`text-sm font-semibold tabular-nums ${
              item.trend === undefined ? '' : item.trend ? 'text-success' : 'text-destructive'
            }`}>
              {item.value}
            </div>
          </button>
        ))}
      </div>
      {result && project && (
        <KpiInfoDialog
          open={infoKey !== null}
          onOpenChange={(open) => { if (!open) setInfoKey(null) }}
          kpiKey={infoKey ?? ''}
          currentValue={infoValue}
          result={result}
          project={project}
        />
      )}
    </>
  )
}
