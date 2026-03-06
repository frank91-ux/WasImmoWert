import { useState, useMemo } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { useUiStore } from '@/store/useUiStore'
import { useCalculation } from '@/hooks/useCalculation'
import { calculateRentabilitaet } from '@/calc/rentabilitaet'
import { RentabilitaetBadge } from '@/components/results/RentabilitaetBadge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ChartCard } from '@/components/charts/ChartCard'
import { InvestmentComparisonChart } from '@/components/charts/InvestmentComparisonChart'
import { formatEur, formatPercent, formatFactor } from '@/lib/format'
import { TOOLTIP_STYLE, AXIS_TICK, GRID_STYLE, CHART_COLORS, ANIMATION_DURATION } from '@/components/charts/chartTheme'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'

import type { Project, CalculationResult, KpiResult } from '@/calc/types'
import { calculateAll } from '@/calc'

// Colors for up to 4 projects
const PROJECT_COLORS = [CHART_COLORS.primary, CHART_COLORS.positive, CHART_COLORS.palette[4], CHART_COLORS.palette[6]]

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

/* ─── Overlaid Charts ─── */
function OverlaidCharts({ projects }: { projects: Project[] }) {
  const maxYears = 30

  const { cashflowData, ekData } = useMemo(() => {
    const results = projects.map((p) => ({ project: p, result: calculateAll(p) }))
    const maxLen = Math.min(maxYears, Math.max(...results.map((r) => r.result.projection.length)))

    const cfData: Record<string, string | number>[] = []
    const eData: Record<string, string | number>[] = []

    for (let i = 0; i < maxLen; i++) {
      const cfPoint: Record<string, string | number> = { label: `Jahr ${i + 1}` }
      const ePoint: Record<string, string | number> = { label: `Jahr ${i + 1}` }
      for (let j = 0; j < results.length; j++) {
        const y = results[j].result.projection[i]
        if (y) {
          cfPoint[`cf_${j}`] = Math.round(y.cashflowNachSteuer / 12)
          ePoint[`ek_${j}`] = Math.round(y.eigenkapitalImObjekt)
        }
      }
      cfData.push(cfPoint)
      eData.push(ePoint)
    }

    return { cashflowData: cfData, ekData: eData }
  }, [projects])

  const xInterval = cashflowData.length <= 5 ? 0 : Math.max(1, Math.floor(cashflowData.length / 8))

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {/* Cashflow Vergleich */}
      <ChartCard title="Cashflow-Vergleich" subtitle="Monatl. Netto-Cashflow über Zeit">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cashflowData}>
              <CartesianGrid {...GRID_STYLE} />
              <XAxis dataKey="label" tick={{ ...AXIS_TICK, fontSize: 10 }} interval={xInterval} />
              <YAxis tick={{ ...AXIS_TICK, fontSize: 10 }} tickFormatter={(v) => `${Math.round(v)}`} width={50} />
              <Tooltip
                formatter={((value: number, name: string) => {
                  const idx = parseInt(name.replace('cf_', ''))
                  return [formatEur(value) + '/Mon', projects[idx]?.name ?? name]
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                }) as any}
                contentStyle={TOOLTIP_STYLE}
              />
              <Legend
                iconType="line" iconSize={8}
                wrapperStyle={{ fontSize: '0.7rem' }}
                payload={projects.map((p, i) => ({
                  value: p.name.length > 15 ? p.name.slice(0, 15) + '…' : p.name,
                  type: 'line' as const,
                  color: PROJECT_COLORS[i % PROJECT_COLORS.length],
                  id: `cf_${i}`,
                })) as any}
              />
              <ReferenceLine y={0} stroke={CHART_COLORS.muted} strokeDasharray="3 3" strokeOpacity={0.5} />
              {projects.map((_, i) => (
                <Line
                  key={`cf_${i}`}
                  type="monotone"
                  dataKey={`cf_${i}`}
                  stroke={PROJECT_COLORS[i % PROJECT_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 1.5, strokeWidth: 0, fill: PROJECT_COLORS[i % PROJECT_COLORS.length] }}
                  activeDot={{ r: 4 }}
                  animationDuration={ANIMATION_DURATION}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Eigenkapital Vergleich */}
      <ChartCard title="Eigenkapital-Vergleich" subtitle="Eigenkapital im Objekt über Zeit">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ekData}>
              <CartesianGrid {...GRID_STYLE} />
              <XAxis dataKey="label" tick={{ ...AXIS_TICK, fontSize: 10 }} interval={xInterval} />
              <YAxis tick={{ ...AXIS_TICK, fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number, name: string) => {
                  const idx = parseInt(name.replace('ek_', ''))
                  return [formatEur(value), projects[idx]?.name ?? name]
                }}
                contentStyle={TOOLTIP_STYLE}
              />
              <Legend
                iconType="line" iconSize={8}
                wrapperStyle={{ fontSize: '0.7rem' }}
                payload={projects.map((p, i) => ({
                  value: p.name.length > 15 ? p.name.slice(0, 15) + '…' : p.name,
                  type: 'line' as const,
                  color: PROJECT_COLORS[i % PROJECT_COLORS.length],
                  id: `ek_${i}`,
                }))}
              />
              {projects.map((_, i) => (
                <Line
                  key={`ek_${i}`}
                  type="monotone"
                  dataKey={`ek_${i}`}
                  stroke={PROJECT_COLORS[i % PROJECT_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 1.5, strokeWidth: 0, fill: PROJECT_COLORS[i % PROJECT_COLORS.length] }}
                  activeDot={{ r: 4 }}
                  animationDuration={ANIMATION_DURATION}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
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

          {/* Overlaid Charts */}
          <OverlaidCharts projects={selectedProjects} />

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
