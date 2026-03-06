import { useState } from 'react'
import type { YearlyProjection } from '@/calc/types'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ChartCard, type TimeRange } from './ChartCard'
import { formatEur } from '@/lib/format'
import { TOOLTIP_STYLE, AXIS_TICK, GRID_STYLE, LEGEND_STYLE, ANIMATION_DURATION, CHART_COLORS } from './chartTheme'

interface WertentwicklungChartProps {
  projection: YearlyProjection[]
  baseProjection?: YearlyProjection[]  // Original for comparison when simulation is active
  defaultTimeRange?: TimeRange
}

function getMaxYear(range: TimeRange, payoffYear: number | null, totalYears: number): number {
  switch (range) {
    case '3': return Math.min(3, totalYears)
    case '10': return Math.min(10, totalYears)
    case '15': return Math.min(15, totalYears)
    case 'end': return payoffYear ? Math.min(payoffYear + 2, totalYears) : totalYears
  }
}

export function WertentwicklungChart({ projection, baseProjection, defaultTimeRange = 'end' }: WertentwicklungChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultTimeRange)

  const allData = projection.map((y, i) => ({
    year: `Jahr ${y.year}`,
    eigenkapital: Math.round(y.eigenkapitalImObjekt),
    immobilienWert: Math.round(y.immobilienWert),
    restschuld: Math.round(y.restschuld),
    kumulierterCashflow: Math.round(y.kumulierterCashflow),
    // Baseline data for comparison overlay
    ...(baseProjection ? {
      basisEigenkapital: Math.round(baseProjection[i]?.eigenkapitalImObjekt ?? 0),
      basisCashflow: Math.round(baseProjection[i]?.kumulierterCashflow ?? 0),
    } : {}),
  }))

  const payoffYear = projection.find((y) => y.restschuld <= 0)?.year ?? null
  const maxYear = getMaxYear(timeRange, payoffYear, allData.length)
  const data = allData.slice(0, maxYear)

  const xInterval = maxYear <= 5 ? 0 : Math.max(1, Math.floor(maxYear / 6) - 1)
  const hasBaseline = !!baseProjection

  return (
    <ChartCard
      title="Wertentwicklung"
      subtitle={hasBaseline ? 'Simulation vs. Original (gestrichelt)' : 'Immobilienwert, Eigenkapital & Restschuld'}
      timeRange={timeRange}
      onTimeRangeChange={setTimeRange}
    >
      <div className="h-44 lg:h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis dataKey="year" tick={{ ...AXIS_TICK, fontSize: 10 }} interval={xInterval} />
            <YAxis tick={{ ...AXIS_TICK, fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(value, name) => {
                const labels: Record<string, string> = {
                  eigenkapital: 'Eigenkapital',
                  immobilienWert: 'Immobilienwert',
                  restschuld: 'Restschuld',
                  kumulierterCashflow: 'Kum. Cashflow',
                  basisEigenkapital: 'EK (Original)',
                  basisCashflow: 'Cashflow (Original)',
                }
                return [formatEur(Number(value)), labels[name as string] ?? String(name)]
              }}
              contentStyle={TOOLTIP_STYLE}
            />
            <Legend
              iconType="line"
              iconSize={10}
              wrapperStyle={{ ...LEGEND_STYLE, fontSize: 9, lineHeight: '14px' }}
              payload={[
                { value: 'EK', type: 'line', color: CHART_COLORS.primary, id: 'ek' },
                { value: 'Wert', type: 'line', color: CHART_COLORS.positive, id: 'immo' },
                { value: 'Schuld', type: 'line', color: CHART_COLORS.negative, id: 'rest' },
                { value: 'Cashflow', type: 'line', color: CHART_COLORS.palette[7], id: 'cf' },
                ...(hasBaseline ? [
                  { value: 'Original', type: 'plainline' as const, color: CHART_COLORS.muted, id: 'bek' },
                ] : []),
              ] as any}
            />
            <defs>
              <linearGradient id="gradEkAi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.25} />
                <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradDebtAi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.negative} stopOpacity={0.15} />
                <stop offset="95%" stopColor={CHART_COLORS.negative} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            {/* Baseline dashed overlays when simulation active */}
            {hasBaseline && (
              <>
                <Area
                  type="monotone"
                  dataKey="basisEigenkapital"
                  fill="none"
                  stroke={CHART_COLORS.muted}
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                  animationDuration={ANIMATION_DURATION}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="basisCashflow"
                  fill="none"
                  stroke={CHART_COLORS.muted}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  animationDuration={ANIMATION_DURATION}
                  dot={false}
                />
              </>
            )}
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
              fill="url(#gradEkAi)"
              stroke={CHART_COLORS.primary}
              strokeWidth={2}
              animationDuration={ANIMATION_DURATION}
            />
            <Area
              type="monotone"
              dataKey="restschuld"
              fill="url(#gradDebtAi)"
              stroke={CHART_COLORS.negative}
              strokeWidth={2}
              animationDuration={ANIMATION_DURATION}
            />
            <Area
              type="monotone"
              dataKey="kumulierterCashflow"
              fill="none"
              stroke={CHART_COLORS.palette[7]}
              strokeWidth={2}
              animationDuration={ANIMATION_DURATION}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
