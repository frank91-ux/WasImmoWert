import type { CalculationResult, ZinsbindungPeriod } from '@/calc/types'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { ChartCard } from './ChartCard'
import { formatEur } from '@/lib/format'
import { TOOLTIP_STYLE, AXIS_TICK, GRID_STYLE, LEGEND_STYLE, BAR_RADIUS, ANIMATION_DURATION, ZINSBINDUNG_LEGEND_ENTRY, CHART_COLORS } from './chartTheme'

interface CashflowChartProps {
  result: CalculationResult
  nutzungsart?: 'vermietung' | 'eigennutzung'
  zinsbindung?: number
  zinsbindungPeriods?: ZinsbindungPeriod[]
}

const COLORS = {
  mieteinnahmen: CHART_COLORS.positive,
  nebenkosten: CHART_COLORS.warning,
  zinsen: CHART_COLORS.negative,
  tilgung: CHART_COLORS.primary,
  steuer: CHART_COLORS.palette[5],
  netto: CHART_COLORS.palette[7],
}

const LABEL_MAP: Record<string, string> = {
  Mieteinnahmen: 'Mieteinnahmen',
  Nebenkosten: 'Nebenkosten',
  Zinsen: 'Zinsen',
  Tilgung: 'Tilgung',
  Steuer: 'Steuer',
  Netto: 'Netto Cashflow',
}

export function CashflowChart({ result, nutzungsart = 'vermietung', zinsbindung, zinsbindungPeriods }: CashflowChartProps) {
  const zinsBoundaries: { year: number; label: string }[] = []
  if (zinsbindung && zinsbindung > 0) {
    zinsBoundaries.push({ year: zinsbindung, label: 'Zinsbindung' })
  }
  if (zinsbindungPeriods && zinsbindungPeriods.length > 0) {
    for (const p of zinsbindungPeriods) {
      zinsBoundaries.push({ year: p.afterYear, label: `${p.zinssatz}%` })
    }
  }

  // Show only first 10 years
  const maxYear = Math.min(10, result.projection.length)
  const displayProjection = result.projection.slice(0, maxYear)

  const data = displayProjection.map((y) => {
    const mieteinnahmen = nutzungsart === 'eigennutzung'
      ? Math.round(result.kpis.ersparteMieteJahr / 12)
      : Math.round(result.rental.nettomieteinnahmen / 12)
    const nebenkosten = -Math.round(result.operatingCosts.betriebskostenGesamt / 12)
    const zinsen = -Math.round(y.zinsenJahr / 12)
    const tilgung = -Math.round(y.tilgungJahr / 12)
    const steuer = -Math.round(y.steuerbelastungJahr / 12)
    const netto = mieteinnahmen + nebenkosten + zinsen + tilgung + steuer

    return {
      label: `J${y.year}`,
      yearNum: y.year,
      Mieteinnahmen: mieteinnahmen,
      Nebenkosten: nebenkosten,
      Zinsen: zinsen,
      Tilgung: tilgung,
      Steuer: steuer,
      Netto: netto,
    }
  })

  return (
    <ChartCard title="Cashflow-Entwicklung" subtitle="Monatlicher Cashflow aufgeschlüsselt (10 Jahre)">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis dataKey="label" tick={AXIS_TICK} />
            <YAxis
              tick={AXIS_TICK}
              tickFormatter={(v) => `${v >= 0 ? '' : ''}${v.toFixed(0)}`}
            />
            <Tooltip
              formatter={(value, name) => [
                formatEur(Number(value)) + '/Mon',
                LABEL_MAP[name as string] ?? name,
              ]}
              contentStyle={TOOLTIP_STYLE}
            />
            <Legend
              iconType="rect"
              iconSize={10}
              wrapperStyle={LEGEND_STYLE}
              payload={[
                { value: nutzungsart === 'eigennutzung' ? 'Ersparte Miete' : 'Mieteinnahmen', type: 'rect', color: COLORS.mieteinnahmen, id: 'miet' },
                { value: 'NK', type: 'rect', color: COLORS.nebenkosten, id: 'nk' },
                { value: 'Zinsen', type: 'rect', color: COLORS.zinsen, id: 'zins' },
                { value: 'Tilgung', type: 'rect', color: COLORS.tilgung, id: 'tilg' },
                { value: 'Steuer', type: 'rect', color: COLORS.steuer, id: 'steuer' },
                { value: 'Netto', type: 'line', color: COLORS.netto, id: 'netto' },
                ...(zinsBoundaries.length > 0 ? [ZINSBINDUNG_LEGEND_ENTRY] : []),
              ] as any}
            />
            <ReferenceLine y={0} stroke={CHART_COLORS.muted} strokeDasharray="3 3" strokeOpacity={0.5} />
            {zinsBoundaries.filter((b) => b.year <= maxYear).map((b) => (
              <ReferenceLine
                key={`zb-${b.year}`}
                x={`J${b.year}`}
                stroke={CHART_COLORS.warning}
                strokeDasharray="6 3"
                strokeWidth={2}
                label={{
                  value: b.label,
                  position: 'top',
                  fill: CHART_COLORS.warning,
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
            ))}
            <Bar dataKey="Mieteinnahmen" stackId="1" fill={COLORS.mieteinnahmen} radius={BAR_RADIUS} animationDuration={ANIMATION_DURATION} />
            <Bar dataKey="Nebenkosten" stackId="1" fill={COLORS.nebenkosten} animationDuration={ANIMATION_DURATION} />
            <Bar dataKey="Zinsen" stackId="1" fill={COLORS.zinsen} animationDuration={ANIMATION_DURATION} />
            <Bar dataKey="Tilgung" stackId="1" fill={COLORS.tilgung} animationDuration={ANIMATION_DURATION} />
            <Bar dataKey="Steuer" stackId="1" fill={COLORS.steuer} animationDuration={ANIMATION_DURATION} />
            <Line
              type="monotone"
              dataKey="Netto"
              stroke={COLORS.netto}
              strokeWidth={2}
              dot={false}
              animationDuration={ANIMATION_DURATION}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
        Monatlicher Cashflow aufgeschlüsselt: Einnahmen (grün) vs. Kosten. Die blaue Linie zeigt den Netto-Cashflow.
        Der Zinsanteil sinkt über die Jahre, während der Tilgungsanteil steigt.
      </p>
    </ChartCard>
  )
}
