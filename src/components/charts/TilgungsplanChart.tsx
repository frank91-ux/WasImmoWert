import type { YearlyProjection, ZinsbindungPeriod } from '@/calc/types'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ReferenceLine } from 'recharts'
import { ChartCard } from './ChartCard'
import { formatEur } from '@/lib/format'
import { TOOLTIP_STYLE, AXIS_TICK, GRID_STYLE, LEGEND_STYLE, ANIMATION_DURATION, ZINSBINDUNG_LEGEND_ENTRY, CHART_COLORS } from './chartTheme'

interface TilgungsplanChartProps {
  projection: YearlyProjection[]
  zinsbindung?: number
  zinsbindungPeriods?: ZinsbindungPeriod[]
}

export function TilgungsplanChart({ projection, zinsbindung, zinsbindungPeriods }: TilgungsplanChartProps) {
  // Collect all Zinsbindung boundary years for reference lines
  const zinsBoundaries: { year: number; label: string }[] = []
  if (zinsbindung && zinsbindung > 0) {
    zinsBoundaries.push({ year: zinsbindung, label: `Zinsbindung endet` })
  }
  if (zinsbindungPeriods && zinsbindungPeriods.length > 0) {
    for (const p of zinsbindungPeriods) {
      zinsBoundaries.push({ year: p.afterYear, label: `${p.zinssatz}% Zins` })
    }
  }
  // Only show years where there's still debt
  const relevantYears = projection.filter((y) => y.zinsenJahr > 0 || y.tilgungJahr > 0)
  if (relevantYears.length === 0) return null

  const data = relevantYears.map((y) => ({
    year: `Jahr ${y.year}`,
    Zinsanteil: Math.round(y.zinsenJahr),
    Tilgungsanteil: Math.round(y.tilgungJahr),
    Restschuld: Math.round(y.restschuld),
  }))

  return (
    <ChartCard title="Tilgungsplan" subtitle="Aufschlüsselung der Annuitätenrate über die Laufzeit">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis
              dataKey="year"
              tick={AXIS_TICK}
              interval={Math.max(1, Math.floor(relevantYears.length / 8) - 1)}
            />
            <YAxis
              yAxisId="rate"
              tick={AXIS_TICK}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              yAxisId="restschuld"
              orientation="right"
              tick={AXIS_TICK}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value, name) => [formatEur(Number(value)), name]}
              contentStyle={TOOLTIP_STYLE}
            />
            <Legend
              wrapperStyle={LEGEND_STYLE}
              payload={zinsBoundaries.length > 0 ? [
                { value: 'Zinsanteil', type: 'rect', color: CHART_COLORS.warning, id: 'zins' },
                { value: 'Tilgungsanteil', type: 'rect', color: CHART_COLORS.primary, id: 'tilgung' },
                { value: 'Restschuld', type: 'line', color: CHART_COLORS.muted, id: 'restschuld' },
                ZINSBINDUNG_LEGEND_ENTRY,
              ] : undefined as any}
            />
            <defs>
              <linearGradient id="gradZins" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.warning} stopOpacity={0.7} />
                <stop offset="95%" stopColor={CHART_COLORS.warning} stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="gradTilgung" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.7} />
                <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <Area
              yAxisId="rate"
              type="monotone"
              dataKey="Zinsanteil"
              stackId="1"
              fill="url(#gradZins)"
              stroke={CHART_COLORS.warning}
              animationDuration={ANIMATION_DURATION}
            />
            <Area
              yAxisId="rate"
              type="monotone"
              dataKey="Tilgungsanteil"
              stackId="1"
              fill="url(#gradTilgung)"
              stroke={CHART_COLORS.primary}
              animationDuration={ANIMATION_DURATION}
            />
            {zinsBoundaries.map((b) => (
              <ReferenceLine
                key={`zb-${b.year}`}
                yAxisId="rate"
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
            <Line
              yAxisId="restschuld"
              type="monotone"
              dataKey="Restschuld"
              stroke={CHART_COLORS.muted}
              strokeDasharray="5 3"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
        Bei einem Annuitätendarlehen bleibt die Gesamtrate konstant. Der Zinsanteil sinkt über die Jahre, während der Tilgungsanteil steigt. Die gestrichelte Linie zeigt die verbleibende Restschuld.
      </p>
    </ChartCard>
  )
}
