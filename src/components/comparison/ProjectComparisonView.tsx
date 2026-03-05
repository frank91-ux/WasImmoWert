import { useState, useMemo } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { useUiStore } from '@/store/useUiStore'
import { useCalculation } from '@/hooks/useCalculation'
import { calculateRentabilitaet } from '@/calc/rentabilitaet'
import { RentabilitaetBadge } from '@/components/results/RentabilitaetBadge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { InvestmentComparisonChart } from '@/components/charts/InvestmentComparisonChart'
import { formatEur, formatPercent, formatFactor } from '@/lib/format'

import type { Project, CalculationResult, KpiResult } from '@/calc/types'
import { calculateAll } from '@/calc'

const KPI_LABELS: Record<string, string> = {
  cashflow: 'Monatl. Cashflow',
  bruttomietrendite: 'Bruttomietrendite',
  kaufpreisfaktor: 'Kaufpreisfaktor',
  eigenkapitalrendite: 'EK-Rendite',
  dscr: 'DSCR',
  nettomietrendite: 'Nettomietrendite',
  cashOnCash: 'Cash-on-Cash',
  jaehrlichCashflowNachSteuer: 'Cashflow/Jahr',
  vermoegenszuwachs: 'Vermögenszuwachs',
}

function formatKpiValue(key: string, kpis: KpiResult): string {
  switch (key) {
    case 'cashflow': return formatEur(kpis.monatlichCashflowNachSteuer)
    case 'bruttomietrendite': return formatPercent(kpis.bruttomietrendite)
    case 'kaufpreisfaktor': return formatFactor(kpis.kaufpreisfaktor)
    case 'eigenkapitalrendite': return formatPercent(kpis.eigenkapitalrendite)
    case 'dscr': return kpis.dscr === Infinity ? '∞' : kpis.dscr.toFixed(2)
    case 'nettomietrendite': return formatPercent(kpis.nettomietrendite)
    case 'cashOnCash': return formatPercent(kpis.cashOnCash)
    case 'jaehrlichCashflowNachSteuer': return formatEur(kpis.jaehrlichCashflowNachSteuer)
    case 'vermoegenszuwachs': return formatEur(kpis.vermoegenszuwachsMonatlich)
    default: return ''
  }
}

function ProjectResult({ project, primaryKpi }: { project: Project; primaryKpi: string }) {
  const result = useCalculation(project)
  if (!result) return null
  return <ComparisonColumn project={project} result={result} primaryKpi={primaryKpi} />
}

function ComparisonColumn({ project, result, primaryKpi }: { project: Project; result: CalculationResult; primaryKpi: string }) {
  const { kpis } = result
  const cashflowColor = kpis.monatlichCashflowNachSteuer >= 0 ? 'text-success' : 'text-destructive'
  const rentabilitaet = useMemo(
    () => calculateRentabilitaet(kpis, project.nutzungsart),
    [kpis, project.nutzungsart]
  )

  const primaryLabel = KPI_LABELS[primaryKpi] || 'Monatl. Cashflow'
  const primaryValue = formatKpiValue(primaryKpi, kpis)

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2">
        <div className="font-semibold text-base truncate">{project.name}</div>
        <RentabilitaetBadge score={rentabilitaet} compact />
      </div>
      <div className="text-muted-foreground">{project.address || 'Keine Adresse'}</div>

      {/* Primary KPI highlight */}
      <div className="rounded-md bg-primary/10 p-2.5 mt-1">
        <div className="text-xs text-muted-foreground">{primaryLabel}</div>
        <div className="text-lg font-bold text-primary tabular-nums">{primaryValue}</div>
      </div>

      <div className="space-y-1.5 pt-2">
        <Row label="Kaufpreis" value={formatEur(project.kaufpreis)} />
        <Row label="Eigenkapital" value={formatEur(project.eigenkapital)} />
        <Row label="Kaltmiete" value={`${formatEur(project.monatsmieteKalt)}/Mon`} />
        <div className="border-t my-2" />
        <Row label="Monatl. Cashflow" value={formatEur(kpis.monatlichCashflowNachSteuer)} className={cashflowColor} bold />
        <Row label="Bruttomietrendite" value={formatPercent(kpis.bruttomietrendite)} />
        <Row label="Nettomietrendite" value={formatPercent(kpis.nettomietrendite)} />
        <Row label="Kaufpreisfaktor" value={formatFactor(kpis.kaufpreisfaktor)} />
        <Row label="EK-Rendite" value={formatPercent(kpis.eigenkapitalrendite)} />
        <Row label="DSCR" value={kpis.dscr === Infinity ? '∞' : kpis.dscr.toFixed(2)} />
      </div>
    </div>
  )
}

function Row({ label, value, className, bold }: { label: string; value: string; className?: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`tabular-nums ${bold ? 'font-semibold' : ''} ${className || ''}`}>{value}</span>
    </div>
  )
}

export function ProjectComparisonView({ initialSelectedIds }: { initialSelectedIds?: string[] }) {
  const { projects } = useProjectStore()
  const { primaryKpi } = useUiStore()
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (initialSelectedIds && initialSelectedIds.length > 0) {
      const valid = initialSelectedIds.filter((id) => projects.some((p) => p.id === id))
      if (valid.length >= 2) return valid.slice(0, 4)
    }
    return projects.slice(0, 3).map((p) => p.id)
  })

  const toggleProject = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 4
          ? [...prev, id]
          : prev
    )
  }

  const selectedProjects = projects.filter((p) => selectedIds.includes(p.id))

  if (projects.length < 2) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">Mindestens 2 Projekte nötig für einen Vergleich</p>
        <p className="text-sm mt-2">Erstellen Sie weitere Projekte über die Sidebar.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">Projektvergleich</h2>
        <div className="flex flex-wrap gap-2">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => toggleProject(p.id)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                selectedIds.includes(p.id)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:bg-muted'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Wählen Sie 2-4 Projekte zum Vergleichen</p>
      </div>

      {selectedProjects.length >= 2 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Kennzahlen-Vergleich</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`grid gap-6 ${selectedProjects.length === 2 ? 'grid-cols-2' : selectedProjects.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                {selectedProjects.map((p) => (
                  <ProjectResult key={p.id} project={p} primaryKpi={primaryKpi} />
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedProjects.map((p) => {
            const result = calculateAll(p)
            return (
              <InvestmentComparisonChart
                key={p.id}
                comparison={result.investmentComparison}
                eigenkapital={p.eigenkapital}
              />
            )
          })}
        </>
      )}
    </div>
  )
}
