import type { CalculationResult } from '@/calc/types'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { ChartCard } from './ChartCard'
import { formatEur } from '@/lib/format'
import { TOOLTIP_STYLE, AXIS_TICK, GRID_STYLE, BAR_RADIUS, ANIMATION_DURATION, LEGEND_STYLE } from './chartTheme'

interface ThreeYearCostChartProps {
  result: CalculationResult
  nutzungsart?: 'vermietung' | 'eigennutzung'
}

const COLORS = {
  mieteinnahmen: '#16a34a',
  nebenkosten: '#f97316',
  zinsen: '#ef4444',
  tilgung: 'var(--color-primary)',
  steuer: '#8b5cf6',
  zinsanteil: '#ef4444',
  tilgungsanteil: '#3b82f6',
}

const TOOLTIP_LABELS: Record<string, string> = {
  Mieteinnahmen: 'Mieteinnahmen',
  Nebenkosten: 'Nebenkosten',
  Zinsen: 'Zinsen',
  Tilgung: 'Tilgung',
  Steuer: 'Steuer',
  Zinsanteil: 'Zinsanteil (Kredit)',
  Tilgungsanteil: 'Tilgungsanteil (Kredit)',
}

export function ThreeYearCostChart({ result, nutzungsart = 'vermietung' }: ThreeYearCostChartProps) {
  const firstThreeYears = result.projection.slice(0, 3)

  const data = firstThreeYears.map((y) => {
    const mieteinnahmen = nutzungsart === 'eigennutzung'
      ? Math.round(result.kpis.ersparteMieteJahr)
      : Math.round(result.rental.nettomieteinnahmen)
    const nebenkosten = -Math.round(result.operatingCosts.betriebskostenGesamt)
    const zinsen = -Math.round(y.zinsenJahr)
    const tilgung = -Math.round(y.tilgungJahr)
    const steuer = -Math.round(y.steuerbelastungJahr)

    return {
      label: `Jahr ${y.year}`,
      // Cashflow stack (income vs expenses)
      Mieteinnahmen: mieteinnahmen,
      Nebenkosten: nebenkosten,
      Zinsen: zinsen,
      Tilgung: tilgung,
      Steuer: steuer,
      // Credit stack (rate breakdown)
      Zinsanteil: Math.round(y.zinsenJahr),
      Tilgungsanteil: Math.round(y.tilgungJahr),
    }
  })

  return (
    <ChartCard
      title="3-Jahres-Kostenübersicht"
      subtitle="Cashflow-Komponenten & Kreditaufschlüsselung pro Jahr"
    >
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={8} barCategoryGap="25%">
            <CartesianGrid {...GRID_STYLE} />
            <XAxis dataKey="label" tick={AXIS_TICK} />
            <YAxis
              tick={AXIS_TICK}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value, name) => [
                formatEur(Math.abs(Number(value))) + '/Jahr',
                TOOLTIP_LABELS[name as string] ?? name,
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
                { value: 'Zinsanteil (Kredit)', type: 'rect', color: COLORS.zinsanteil, id: 'za' },
                { value: 'Tilgungsanteil (Kredit)', type: 'rect', color: COLORS.tilgungsanteil, id: 'ta' },
              ]}
            />
            <ReferenceLine y={0} stroke="var(--color-muted-foreground)" strokeDasharray="3 3" strokeOpacity={0.5} />

            {/* Cashflow stack */}
            <Bar dataKey="Mieteinnahmen" stackId="cashflow" fill={COLORS.mieteinnahmen} radius={BAR_RADIUS} animationDuration={ANIMATION_DURATION} />
            <Bar dataKey="Nebenkosten" stackId="cashflow" fill={COLORS.nebenkosten} animationDuration={ANIMATION_DURATION} />
            <Bar dataKey="Zinsen" stackId="cashflow" fill={COLORS.zinsen} animationDuration={ANIMATION_DURATION} />
            <Bar dataKey="Tilgung" stackId="cashflow" fill={COLORS.tilgung} animationDuration={ANIMATION_DURATION} />
            <Bar dataKey="Steuer" stackId="cashflow" fill={COLORS.steuer} animationDuration={ANIMATION_DURATION} />

            {/* Credit stack */}
            <Bar dataKey="Zinsanteil" stackId="kredit" fill={COLORS.zinsanteil} radius={BAR_RADIUS} animationDuration={ANIMATION_DURATION} />
            <Bar dataKey="Tilgungsanteil" stackId="kredit" fill={COLORS.tilgungsanteil} animationDuration={ANIMATION_DURATION} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
        Links: Cashflow-Aufschlüsselung (Einnahmen oben, Ausgaben unten). Rechts: Kreditrate aufgeteilt in Zins- und Tilgungsanteil.
        Der Zinsanteil sinkt über die Jahre, während der Tilgungsanteil steigt.
      </p>
    </ChartCard>
  )
}
