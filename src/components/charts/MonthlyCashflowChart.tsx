import type { CalculationResult } from '@/calc/types'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { ChartCard } from './ChartCard'
import { formatEur } from '@/lib/format'
import { TOOLTIP_STYLE, AXIS_TICK, GRID_STYLE, LEGEND_STYLE, BAR_RADIUS, ANIMATION_DURATION } from './chartTheme'

interface MonthlyCashflowChartProps {
  result: CalculationResult
  nutzungsart?: 'vermietung' | 'eigennutzung'
}

interface DataPoint {
  label: string
  year: number
  Mieteinnahmen: number
  Nebenkosten: number
  Zinsen: number
  Tilgung: number
  Steuer: number
  Netto: number
}

function deriveMonthlyData(result: CalculationResult, nutzungsart: string): DataPoint[] {
  return result.projection.map((y) => {
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
      year: y.year,
      Mieteinnahmen: mieteinnahmen,
      Nebenkosten: nebenkosten,
      Zinsen: zinsen,
      Tilgung: tilgung,
      Steuer: steuer,
      Netto: netto,
    }
  })
}

const COLORS = {
  mieteinnahmen: '#16a34a',
  nebenkosten: '#f97316',
  zinsen: '#ef4444',
  tilgung: 'var(--color-primary)',
  steuer: '#8b5cf6',
  netto: '#0ea5e9',
}

const LABEL_MAP: Record<string, string> = {
  Mieteinnahmen: 'Mieteinnahmen',
  Nebenkosten: 'Nebenkosten',
  Zinsen: 'Zinsen',
  Tilgung: 'Tilgung',
  Steuer: 'Steuer',
  Netto: 'Netto Cashflow',
}

export function MonthlyCashflowChart({ result, nutzungsart = 'vermietung' }: MonthlyCashflowChartProps) {
  const data = deriveMonthlyData(result, nutzungsart)
  // Show payoff year
  const payoffYear = result.projection.find((y) => y.restschuld <= 0)?.year ?? null
  const maxYear = payoffYear ? Math.min(payoffYear + 2, data.length) : data.length
  const displayData = data.slice(0, maxYear)

  return (
    <ChartCard
      title="Monatlicher Cashflow"
      subtitle="Aufschlüsselung nach Komponenten (€/Monat)"
    >
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={displayData}>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis
              dataKey="label"
              tick={AXIS_TICK}
              interval={Math.max(1, Math.floor(maxYear / 8) - 1)}
            />
            <YAxis
              tick={AXIS_TICK}
              tickFormatter={(v) => `${v >= 0 ? '' : ''}${(v / 1).toFixed(0)}`}
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
              ]}
            />
            <ReferenceLine y={0} stroke="var(--color-muted-foreground)" strokeDasharray="3 3" strokeOpacity={0.5} />
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
    </ChartCard>
  )
}
