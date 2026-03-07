import { useState, useMemo } from 'react'
import type { CalculationResult, YearlyProjection } from '@/calc/types'
import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'
import { ChartCard, type TimeRange } from './ChartCard'
import { formatEur } from '@/lib/format'
import { AXIS_TICK, GRID_STYLE, ANIMATION_DURATION, CHART_COLORS } from './chartTheme'
import { CashflowInfoDialog } from './CashflowInfoDialog'

interface MonthlyCashflowChartProps {
  result: CalculationResult
  nutzungsart?: 'vermietung' | 'eigennutzung'
  scenarioProjection?: YearlyProjection[]
  defaultTimeRange?: TimeRange
}

interface DataPoint {
  label: string
  year: number
  Einnahmen: number
  Nebenkosten: number
  Zinsen: number
  Tilgung: number
  Steuer: number
  Netto: number
  BasisNetto: number
  SzenarioNetto?: number
}

function deriveMonthlyData(
  result: CalculationResult,
  nutzungsart: string,
  scenarioProjection?: YearlyProjection[],
): DataPoint[] {
  return result.projection.map((y, i) => {
    const baseMieteinnahmen = nutzungsart === 'eigennutzung'
      ? Math.round(result.kpis.ersparteMieteJahr / 12)
      : Math.round(result.rental.nettomieteinnahmen / 12)

    // When scenario exists, use scenario-adjusted per-year values
    // (scenario.ts now updates zinsenJahr, tilgungJahr, steuerbelastungJahr)
    const hasScenarioYear = scenarioProjection != null && scenarioProjection[i] != null
    const src = hasScenarioYear ? scenarioProjection[i] : y

    const nebenkosten = Math.round(result.operatingCosts.betriebskostenGesamt / 12)
    const zinsen = Math.round(src.zinsenJahr / 12)
    const tilgung = Math.round(src.tilgungJahr / 12)
    const steuer = Math.round(Math.max(0, src.steuerbelastungJahr) / 12)
    const totalAusgaben = nebenkosten + zinsen + tilgung + steuer

    const basisNetto = baseMieteinnahmen - Math.round(
      result.operatingCosts.betriebskostenGesamt / 12
      + y.zinsenJahr / 12
      + y.tilgungJahr / 12
      + Math.max(0, y.steuerbelastungJahr) / 12
    )

    const scenarioMonthly = hasScenarioYear
      ? Math.round(src.cashflowNachSteuer / 12)
      : undefined

    // Effective income: back-calculate from scenario cashflow + expenses
    // so that Einnahmen - Ausgaben = scenarioNetto visually makes sense
    const effectiveEinnahmen = scenarioMonthly != null
      ? Math.max(0, totalAusgaben + scenarioMonthly)
      : baseMieteinnahmen

    const displayNetto = scenarioMonthly != null ? scenarioMonthly : basisNetto

    const point: DataPoint = {
      label: `Jahr ${y.year}`,
      year: y.year,
      Einnahmen: effectiveEinnahmen,
      Nebenkosten: nebenkosten,
      Zinsen: zinsen,
      Tilgung: tilgung,
      Steuer: steuer > 0 ? steuer : 0,
      BasisNetto: basisNetto,
      Netto: displayNetto,
      SzenarioNetto: scenarioMonthly,
    }

    return point
  })
}

function getMaxYear(range: TimeRange, payoffYear: number | null, totalYears: number): number {
  switch (range) {
    case '3': return Math.min(3, totalYears)
    case '10': return Math.min(10, totalYears)
    case '15': return Math.min(15, totalYears)
    case 'end': return payoffYear ? Math.min(payoffYear + 2, totalYears) : totalYears
  }
}

const COLORS = {
  einnahmen: CHART_COLORS.positive,
  nebenkosten: CHART_COLORS.warning,
  zinsen: CHART_COLORS.negative,
  tilgung: CHART_COLORS.primary,
  steuer: CHART_COLORS.palette[5],
  nettoPos: CHART_COLORS.positive,
  nettoNeg: CHART_COLORS.negative,
  szenario: CHART_COLORS.secondary,
}

// Custom tooltip
function CashflowTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const dataPoint = payload[0]?.payload as DataPoint | undefined
  if (!dataPoint) return null

  const isScenario = dataPoint.SzenarioNetto != null
  const items = [
    { label: isScenario ? 'Eff. Einnahmen' : 'Mieteinnahmen', value: dataPoint.Einnahmen, color: COLORS.einnahmen, isIncome: true },
    { label: 'Nebenkosten', value: -dataPoint.Nebenkosten, color: COLORS.nebenkosten },
    { label: 'Zinsen', value: -dataPoint.Zinsen, color: COLORS.zinsen },
    { label: 'Tilgung', value: -dataPoint.Tilgung, color: COLORS.tilgung },
    { label: 'Steuer', value: -dataPoint.Steuer, color: COLORS.steuer },
  ]

  const netto = dataPoint.Netto

  return (
    <div
      className="rounded-xl border shadow-xl px-4 py-3 text-[13px] leading-relaxed"
      style={{
        backgroundColor: 'var(--color-card)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-foreground)',
        zIndex: 9999,
        pointerEvents: 'none',
        minWidth: 220,
      }}
    >
      <div className="font-bold text-sm mb-2">{label}</div>
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-6 py-0.5">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-muted-foreground">{item.label}</span>
          </div>
          <span className={`tabular-nums font-medium ${item.isIncome ? 'text-emerald-600' : 'text-red-500'}`}>
            {formatEur(item.value)}/Mon
          </span>
        </div>
      ))}
      {dataPoint.SzenarioNetto != null ? (
        <>
          <div className="flex items-center justify-between gap-6 pt-2 mt-1.5 border-t">
            <span className="text-muted-foreground">Basis Cashflow</span>
            <span className={`tabular-nums font-medium ${dataPoint.BasisNetto >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {formatEur(dataPoint.BasisNetto)}/Mon
            </span>
          </div>
          <div className="flex items-center justify-between gap-6 pt-1 font-bold">
            <span>Szenario Cashflow</span>
            <span className={`tabular-nums ${dataPoint.SzenarioNetto >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {formatEur(dataPoint.SzenarioNetto)}/Mon
            </span>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-between gap-6 pt-2 mt-1.5 border-t font-bold">
          <span>Netto Cashflow</span>
          <span className={`tabular-nums ${netto >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {formatEur(netto)}/Mon
          </span>
        </div>
      )}
    </div>
  )
}

// Custom label on the Cashflow bar — shows value above (positive) or below (negative)
function CashflowBarLabel(props: any) {
  const { x, y, width, height, value } = props
  if (value == null || value === 0) return null

  const isNeg = value < 0
  // For negative bars: recharts sets y at 0-line, height extends downward
  // We want the label BELOW the bar bottom, so y + Math.abs(height) + offset
  const labelY = isNeg ? y + Math.abs(height) + 14 : y - 6

  return (
    <text
      x={x + width / 2}
      y={labelY}
      textAnchor="middle"
      fontSize={9}
      fontWeight={700}
      fill={isNeg ? COLORS.nettoNeg : COLORS.nettoPos}
    >
      {value > 0 ? '+' : ''}{value}€
    </text>
  )
}

export function MonthlyCashflowChart({ result, nutzungsart = 'vermietung', scenarioProjection, defaultTimeRange = 'end' }: MonthlyCashflowChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultTimeRange)
  const [infoOpen, setInfoOpen] = useState(false)
  const hasScenario = !!scenarioProjection
  const data = deriveMonthlyData(result, nutzungsart, scenarioProjection)

  const payoffYear = result.projection.find((y) => y.restschuld <= 0)?.year ?? null
  const maxYear = getMaxYear(timeRange, payoffYear, data.length)
  const displayData = data.slice(0, maxYear)

  const xInterval = maxYear <= 5 ? 0 : Math.max(1, Math.floor(maxYear / 6) - 1)

  // Dynamic Y domain — must include negative cashflow, expense stack AND income bar
  const [yMin, yMax] = useMemo(() => {
    const maxExpenses = Math.max(...displayData.map(d => d.Nebenkosten + d.Zinsen + d.Tilgung + d.Steuer))
    const maxIncome = Math.max(...displayData.map(d => d.Einnahmen))
    const allNettos = displayData.map(d => d.Netto)
    if (hasScenario) {
      allNettos.push(...displayData.map(d => d.SzenarioNetto ?? 0))
    }
    const minVal = Math.min(...allNettos, 0)
    // Extra padding below negative bars for the value label (at least 30% of range or 400 abs minimum)
    const labelPadding = minVal < 0 ? Math.max(Math.abs(minVal) * 0.6, 400) : 0
    const calcMin = minVal < 0 ? Math.floor((minVal - labelPadding) / 100) * 100 : 0
    const calcMax = Math.ceil(Math.max(maxExpenses, maxIncome, Math.max(...allNettos)) * 1.15 / 100) * 100
    return [calcMin, Math.max(calcMax, 100)]
  }, [displayData, hasScenario])

  return (
    <ChartCard
      title="Jährlicher Cashflow"
      subtitle={hasScenario ? 'Szenario-Cashflow (€/Monat)' : 'Ausgaben & Cashflow (€/Monat)'}
      timeRange={timeRange}
      onTimeRangeChange={setTimeRange}
      onInfoClick={() => setInfoOpen(true)}
    >
      <div className="h-full min-h-[200px] cursor-pointer" onClick={() => setInfoOpen(true)} title="Klicken für Erklärung">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={displayData} barCategoryGap="20%" margin={{ top: 22, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis dataKey="label" tick={{ ...AXIS_TICK, fontSize: 10 }} interval={xInterval} />
            <YAxis
              tick={{ ...AXIS_TICK, fontSize: 10 }}
              tickFormatter={(v) => `${Math.round(v)}`}
              width={45}
              domain={[yMin, yMax]}
            />
            <Tooltip
              content={<CashflowTooltip />}
              wrapperStyle={{ zIndex: 9999 }}
              cursor={{ fill: 'var(--color-muted)', fillOpacity: 0.15 }}
            />
            <Legend
              iconType="rect" iconSize={7}
              wrapperStyle={{ fontSize: '0.6rem', lineHeight: '14px', paddingTop: 4 }}
              payload={[
                { value: 'Einnahmen', type: 'rect', color: COLORS.einnahmen, id: 'income' },
                { value: 'NK', type: 'rect', color: COLORS.nebenkosten, id: 'nk' },
                { value: 'Zinsen', type: 'rect', color: COLORS.zinsen, id: 'zinsen' },
                { value: 'Tilg.', type: 'rect', color: COLORS.tilgung, id: 'tilg' },
                { value: 'Steuer', type: 'rect', color: COLORS.steuer, id: 'steuer' },
                { value: 'Cashflow +', type: 'rect', color: COLORS.nettoPos, id: 'cfpos' },
                { value: 'Cashflow −', type: 'rect', color: COLORS.nettoNeg, id: 'cfneg' },
              ] as any}
            />

            {/* Zero reference line — always visible */}
            <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 3" strokeOpacity={0.5} />

            {/* Einnahmen bar in background — light green, behind everything */}
            <Bar dataKey="Einnahmen" fill={COLORS.einnahmen} fillOpacity={0.15} stroke={COLORS.einnahmen} strokeOpacity={0.3} strokeWidth={1} radius={[3, 3, 0, 0]} animationDuration={ANIMATION_DURATION} />

            {/* Expense bars — stacked above zero */}
            <Bar dataKey="Nebenkosten" stackId="expenses" fill={COLORS.nebenkosten} fillOpacity={0.85} animationDuration={ANIMATION_DURATION} />
            <Bar dataKey="Zinsen" stackId="expenses" fill={COLORS.zinsen} fillOpacity={0.85} animationDuration={ANIMATION_DURATION} />
            <Bar dataKey="Tilgung" stackId="expenses" fill={COLORS.tilgung} fillOpacity={0.85} animationDuration={ANIMATION_DURATION} />
            <Bar dataKey="Steuer" stackId="expenses" fill={COLORS.steuer} fillOpacity={0.7} radius={[3, 3, 0, 0]} animationDuration={ANIMATION_DURATION} />

            {/* Cashflow bar — green when positive, red when negative, with value label */}
            <Bar
              dataKey="Netto"
              animationDuration={ANIMATION_DURATION}
              label={<CashflowBarLabel />}
            >
              {displayData.map((entry, index) => (
                <Cell
                  key={`cf-${index}`}
                  fill={entry.Netto >= 0 ? COLORS.nettoPos : COLORS.nettoNeg}
                  fillOpacity={0.75}
                  stroke={entry.Netto >= 0 ? COLORS.nettoPos : COLORS.nettoNeg}
                  strokeWidth={1}
                  radius={entry.Netto >= 0 ? [4, 4, 0, 0] as any : [0, 0, 4, 4] as any}
                />
              ))}
            </Bar>

          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <CashflowInfoDialog
        open={infoOpen}
        onOpenChange={setInfoOpen}
        result={result}
        nutzungsart={nutzungsart}
      />
    </ChartCard>
  )
}
