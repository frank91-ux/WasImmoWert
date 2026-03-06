import { useMemo, useState } from 'react'
import type { Project, CalculationResult } from '@/calc/types'
import { calculateAfaRate } from '@/calc/tax'
import { ParameterSlider } from '@/components/simulation/ParameterSlider'
import { TaxExampleCalculation } from './TaxExampleCalculation'
import { TaxDeductionChart } from '@/components/charts/TaxDeductionChart'
import { KpiInfoDialog } from '@/components/results/KpiInfoDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatEur } from '@/lib/format'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { ChartCard } from '@/components/charts/ChartCard'
import { TOOLTIP_STYLE, AXIS_TICK, GRID_STYLE, CHART_COLORS, ANIMATION_DURATION } from '@/components/charts/chartTheme'
import { Receipt, TrendingDown, Percent, HelpCircle } from 'lucide-react'

interface SteuerSimulationTabProps {
  project: Project
  result: CalculationResult
  onChange: (updates: Partial<Project>) => void
}

export function SteuerSimulationTab({ project, result, onChange }: SteuerSimulationTabProps) {
  const { tax, rental, operatingCosts, financing, projection } = result

  const gebaeudeAnteil = 100 - project.grundstueckAnteil
  const gebaeudeWert = project.kaufpreis * (gebaeudeAnteil / 100)
  const bodenWert = project.kaufpreis * (project.grundstueckAnteil / 100)
  const afaRate = project.customAfaRate ?? calculateAfaRate(project.baujahr)
  const afaBetrag = gebaeudeWert * (afaRate / 100)

  const beweglichAbschreibung = project.beweglicheGegenstaende > 0 && project.afaBeweglichJahre > 0
    ? project.beweglicheGegenstaende / project.afaBeweglichJahre
    : 0

  // Tax over time data from projection
  const taxOverTime = useMemo(() => {
    return projection.map((y) => ({
      label: `Jahr ${y.year}`,
      year: y.year,
      steuerbelastung: Math.round(y.steuerbelastungJahr),
    }))
  }, [projection])

  const xInterval = taxOverTime.length <= 5 ? 0 : Math.max(1, Math.floor(taxOverTime.length / 8))

  const steuerEffektJahr = tax.gesamtSteuerbelastungJahr
  const isErsparnis = tax.zuVersteuerndeEinkuenfteImmobilie < 0
  const cashflowNachSteuer = result.kpis.monatlichCashflowNachSteuer

  // 3-color logic for Steuer KPI:
  // Green: Steuerersparnis (getting money back)
  // Yellow: Steuerlast but overall cashflow still positive
  // Red: Steuerlast so high that cashflow is negative
  const steuerColor = isErsparnis
    ? 'text-emerald-600'
    : cashflowNachSteuer >= 0
      ? 'text-amber-600'
      : 'text-red-500'
  const steuerIconColor = isErsparnis
    ? 'text-emerald-600'
    : cashflowNachSteuer >= 0
      ? 'text-amber-500'
      : 'text-red-500'
  const steuerLabel = isErsparnis
    ? 'Steuerrückerstattung'
    : 'Steuerlast'

  const [infoOpen, setInfoOpen] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {/* Steuer-KPIs */}
      <Card className="shadow-sm">
        <CardContent className="py-3 px-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Steuer KPI */}
            <button
              type="button"
              onClick={() => setInfoOpen('steuerEffekt')}
              className="flex items-center gap-2 text-left rounded-lg p-1.5 -m-1.5 hover:bg-muted/50 transition-colors cursor-pointer group"
            >
              <Receipt className={`h-4 w-4 shrink-0 ${steuerIconColor}`} />
              <div className="min-w-0">
                <div className={`text-sm font-bold tabular-nums ${steuerColor}`}>
                  {formatEur(Math.abs(steuerEffektJahr / 12))}/Mon
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1">{steuerLabel} <HelpCircle className="h-2.5 w-2.5 opacity-0 group-hover:opacity-60 transition-opacity" /></div>
              </div>
            </button>
            {/* AfA KPI */}
            <button
              type="button"
              onClick={() => setInfoOpen('afaBetrag')}
              className="flex items-center gap-2 text-left rounded-lg p-1.5 -m-1.5 hover:bg-muted/50 transition-colors cursor-pointer group"
            >
              <TrendingDown className="h-4 w-4 shrink-0 text-teal-600" />
              <div className="min-w-0">
                <div className="text-sm font-bold tabular-nums text-teal-600">{formatEur(afaBetrag)}/Jahr</div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1">AfA-Betrag <HelpCircle className="h-2.5 w-2.5 opacity-0 group-hover:opacity-60 transition-opacity" /></div>
              </div>
            </button>
            {/* Steuersatz KPI */}
            <button
              type="button"
              onClick={() => setInfoOpen('effSteuersatz')}
              className="flex items-center gap-2 text-left rounded-lg p-1.5 -m-1.5 hover:bg-muted/50 transition-colors cursor-pointer group"
            >
              <Percent className="h-4 w-4 shrink-0 text-teal-600" />
              <div className="min-w-0">
                <div className="text-sm font-bold tabular-nums text-teal-600">{project.persoenlicherSteuersatz}%</div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1">Eff. Steuersatz <HelpCircle className="h-2.5 w-2.5 opacity-0 group-hover:opacity-60 transition-opacity" /></div>
              </div>
            </button>
          </div>
          {!isErsparnis && (
            <p className="text-[10px] text-muted-foreground mt-2">
              {cashflowNachSteuer >= 0
                ? '🟡 Steuerlast vorhanden, aber dein Gesamt-Cashflow bleibt positiv. Wertentwicklung und Tilgung bauen zusätzlich Vermögen auf.'
                : '🔴 Steuerlast drückt den Cashflow ins Negative – Tilgung und Wertentwicklung können das langfristig ausgleichen.'
              }
            </p>
          )}
          {isErsparnis && (
            <p className="text-[10px] text-muted-foreground mt-2">
              🟢 Du bekommst Steuern zurück – die absetzbaren Kosten übersteigen die Mieteinnahmen.
            </p>
          )}
        </CardContent>
      </Card>

      {/* KPI Info Dialogs */}
      <KpiInfoDialog
        open={infoOpen === 'steuerEffekt'}
        onOpenChange={(open) => setInfoOpen(open ? 'steuerEffekt' : null)}
        kpiKey="steuerEffekt"
        currentValue={`${formatEur(Math.abs(steuerEffektJahr / 12))}/Mon`}
        result={result}
        project={project}
      />
      <KpiInfoDialog
        open={infoOpen === 'afaBetrag'}
        onOpenChange={(open) => setInfoOpen(open ? 'afaBetrag' : null)}
        kpiKey="afaBetrag"
        currentValue={`${formatEur(afaBetrag)}/Jahr`}
        result={result}
        project={project}
      />
      <KpiInfoDialog
        open={infoOpen === 'effSteuersatz'}
        onOpenChange={(open) => setInfoOpen(open ? 'effSteuersatz' : null)}
        kpiKey="effSteuersatz"
        currentValue={`${project.persoenlicherSteuersatz}%`}
        result={result}
        project={project}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Tax Sliders */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Gebäude / Boden</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ParameterSlider
                label="Gebäudeanteil"
                value={gebaeudeAnteil}
                min={30}
                max={95}
                step={1}
                unit="%"
                onChange={(v) => onChange({ grundstueckAnteil: 100 - v })}
                formatValue={(v) => `${v.toFixed(0)} %`}
              />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Gebäudewert</span>
                  <p className="font-semibold tabular-nums">{formatEur(gebaeudeWert)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Bodenwert</span>
                  <p className="font-semibold tabular-nums">{formatEur(bodenWert)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Abschreibung (AfA)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ParameterSlider
                label="AfA-Satz"
                value={project.customAfaRate ?? afaRate}
                min={0.5}
                max={5}
                step={0.1}
                unit="%"
                onChange={(v) => onChange({ customAfaRate: v })}
                formatValue={(v) => `${v.toFixed(1)} %`}
              />
              <p className="text-sm text-muted-foreground">
                AfA: {formatEur(afaBetrag)}/Jahr ({formatEur(afaBetrag / 12)}/Mon)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Steuersatz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ParameterSlider
                label="Persönlicher Steuersatz"
                value={project.persoenlicherSteuersatz}
                min={0}
                max={45}
                step={1}
                unit="%"
                onChange={(v) => onChange({ persoenlicherSteuersatz: v })}
                formatValue={(v) => `${v.toFixed(0)} %`}
              />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={project.kirchensteuer}
                    onChange={(e) => onChange({ kirchensteuer: e.target.checked })}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  Kirchensteuer
                </label>
                {project.kirchensteuer && (
                  <select
                    className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                    value={project.kirchensteuersatz}
                    onChange={(e) => onChange({ kirchensteuersatz: Number(e.target.value) })}
                  >
                    <option value={8}>8%</option>
                    <option value={9}>9%</option>
                  </select>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Bewegliche Gegenstände</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ParameterSlider
                label="Wert"
                value={project.beweglicheGegenstaende}
                min={0}
                max={50000}
                step={500}
                unit="€"
                onChange={(v) => onChange({ beweglicheGegenstaende: v })}
                formatValue={(v) => formatEur(v)}
              />
              <ParameterSlider
                label="Abschreibungsdauer"
                value={project.afaBeweglichJahre}
                min={1}
                max={20}
                step={1}
                unit="Jahre"
                onChange={(v) => onChange({ afaBeweglichJahre: v })}
                formatValue={(v) => `${v} Jahre`}
              />
              {beweglichAbschreibung > 0 && (
                <p className="text-sm text-muted-foreground">
                  Abschreibung: {formatEur(beweglichAbschreibung)}/Jahr für {project.afaBeweglichJahre} Jahre
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Charts */}
        <div className="lg:col-span-5 space-y-6">
          <TaxDeductionChart tax={tax} />
        </div>
      </div>

      {/* Charts + Tax Table side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Chart: Steuerbelastung über Laufzeit (moved from right column) */}
        {taxOverTime.length > 1 && (
          <ChartCard title="Steuerliche Auswirkung" subtitle="Jährliche Steuerbelastung bzw. Ersparnis">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={taxOverTime}>
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="label" tick={{ ...AXIS_TICK, fontSize: 10 }} interval={xInterval} />
                  <YAxis
                    tick={{ ...AXIS_TICK, fontSize: 10 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatEur(value), 'Steuer']}
                    contentStyle={TOOLTIP_STYLE}
                  />
                  <ReferenceLine y={0} stroke={CHART_COLORS.muted} strokeDasharray="3 3" strokeOpacity={0.6} />
                  <Line
                    type="monotone"
                    dataKey="steuerbelastung"
                    stroke={CHART_COLORS.primary}
                    strokeWidth={2}
                    dot={{ r: 2, fill: CHART_COLORS.primary, strokeWidth: 0 }}
                    activeDot={{ r: 4 }}
                    animationDuration={ANIMATION_DURATION}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {/* Tax Example Calculation */}
        <TaxExampleCalculation
          tax={tax}
          rental={rental}
          operatingCosts={operatingCosts}
          financing={financing}
        />
      </div>
    </div>
  )
}
