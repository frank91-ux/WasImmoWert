import type { YearlyProjection, ZinsbindungPeriod } from '@/calc/types'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { ChartCard } from './ChartCard'
import { formatEur } from '@/lib/format'
import { TOOLTIP_STYLE, AXIS_TICK, GRID_STYLE, LEGEND_STYLE, ANIMATION_DURATION, ZINSBINDUNG_LEGEND_ENTRY, CHART_COLORS } from './chartTheme'

interface EquityGrowthChartProps {
  projection: YearlyProjection[]
  zinsbindung?: number
  zinsbindungPeriods?: ZinsbindungPeriod[]
}

export function EquityGrowthChart({ projection, zinsbindung, zinsbindungPeriods }: EquityGrowthChartProps) {
  const zinsBoundaries: { year: number; label: string }[] = []
  if (zinsbindung && zinsbindung > 0) {
    zinsBoundaries.push({ year: zinsbindung, label: 'Zinsbindung' })
  }
  if (zinsbindungPeriods && zinsbindungPeriods.length > 0) {
    for (const p of zinsbindungPeriods) {
      zinsBoundaries.push({ year: p.afterYear, label: `${p.zinssatz}%` })
    }
  }
  const data = projection.map((y) => ({
    year: `Jahr ${y.year}`,
    eigenkapital: Math.round(y.eigenkapitalImObjekt),
    restschuld: Math.round(y.restschuld),
    immobilienWert: Math.round(y.immobilienWert),
  }))

  return (
    <ChartCard title="Eigenkapitalaufbau & Restschuld">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis
              dataKey="year"
              tick={AXIS_TICK}
              interval={4}
            />
            <YAxis
              tick={AXIS_TICK}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value, name) => [
                formatEur(Number(value)),
                name === 'eigenkapital' ? 'Eigenkapital im Objekt'
                  : name === 'immobilienWert' ? 'Immobilienwert'
                  : 'Restschuld',
              ]}
              contentStyle={TOOLTIP_STYLE}
            />
            <Legend
              iconType="line"
              iconSize={12}
              wrapperStyle={LEGEND_STYLE}
              payload={[
                { value: 'Eigenkapital', type: 'line', color: CHART_COLORS.primary, id: 'eigenkapital' },
                { value: 'Immobilienwert', type: 'line', color: CHART_COLORS.positive, id: 'immobilienWert' },
                { value: 'Restschuld', type: 'line', color: CHART_COLORS.negative, id: 'restschuld' },
                ...(zinsBoundaries.length > 0 ? [ZINSBINDUNG_LEGEND_ENTRY] : []),
              ] as any}
            />
            {zinsBoundaries.filter((b) => b.year <= projection.length).map((b) => (
              <ReferenceLine
                key={`zb-${b.year}`}
                x={`Jahr ${b.year}`}
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
            <defs>
              <linearGradient id="gradEk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradDebt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.negative} stopOpacity={0.2} />
                <stop offset="95%" stopColor={CHART_COLORS.negative} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="immobilienWert"
              fill="none"
              stroke={CHART_COLORS.positive}
              strokeWidth={2}
              strokeDasharray="6 3"
              animationDuration={ANIMATION_DURATION}
            />
            <Area
              type="monotone"
              dataKey="eigenkapital"
              fill="url(#gradEk)"
              stroke={CHART_COLORS.primary}
              strokeWidth={2}
              animationDuration={ANIMATION_DURATION}
            />
            <Area
              type="monotone"
              dataKey="restschuld"
              fill="url(#gradDebt)"
              stroke={CHART_COLORS.negative}
              strokeWidth={2}
              animationDuration={ANIMATION_DURATION}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Eigenkapital im Objekt = Immobilienwert abzgl. Restschuld. Gestrichelt: geschätzter Immobilienwert.
      </p>
    </ChartCard>
  )
}
