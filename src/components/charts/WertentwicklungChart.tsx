import type { YearlyProjection } from '@/calc/types'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ChartCard } from './ChartCard'
import { formatEur } from '@/lib/format'
import { TOOLTIP_STYLE, AXIS_TICK, GRID_STYLE, LEGEND_STYLE, ANIMATION_DURATION } from './chartTheme'

interface WertentwicklungChartProps {
  projection: YearlyProjection[]
  baseProjection?: YearlyProjection[]  // Original for comparison when simulation is active
}

export function WertentwicklungChart({ projection, baseProjection }: WertentwicklungChartProps) {
  const data = projection.map((y, i) => ({
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

  const hasBaseline = !!baseProjection

  return (
    <ChartCard
      title="Wertentwicklung"
      subtitle={hasBaseline ? 'Simulation vs. Original (gestrichelt)' : 'Immobilienwert, Eigenkapital & Restschuld'}
    >
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis dataKey="year" tick={AXIS_TICK} interval={4} />
            <YAxis tick={AXIS_TICK} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
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
              iconSize={12}
              wrapperStyle={LEGEND_STYLE}
              payload={[
                { value: 'Eigenkapital', type: 'line', color: 'var(--color-primary)', id: 'ek' },
                { value: 'Immobilienwert', type: 'line', color: '#16a34a', id: 'immo' },
                { value: 'Restschuld', type: 'line', color: '#ef4444', id: 'rest' },
                { value: 'Kum. Cashflow', type: 'line', color: '#0ea5e9', id: 'cf' },
                ...(hasBaseline ? [
                  { value: 'Original (EK)', type: 'plainline' as const, color: 'var(--color-muted-foreground)', id: 'bek' },
                ] : []),
              ]}
            />
            <defs>
              <linearGradient id="gradEkAi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradDebtAi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            {/* Baseline dashed overlays when simulation active */}
            {hasBaseline && (
              <>
                <Area
                  type="monotone"
                  dataKey="basisEigenkapital"
                  fill="none"
                  stroke="var(--color-muted-foreground)"
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                  animationDuration={ANIMATION_DURATION}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="basisCashflow"
                  fill="none"
                  stroke="var(--color-muted-foreground)"
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
              stroke="#16a34a"
              strokeWidth={2}
              strokeDasharray="6 3"
              animationDuration={ANIMATION_DURATION}
            />
            <Area
              type="monotone"
              dataKey="eigenkapital"
              fill="url(#gradEkAi)"
              stroke="var(--color-primary)"
              strokeWidth={2}
              animationDuration={ANIMATION_DURATION}
            />
            <Area
              type="monotone"
              dataKey="restschuld"
              fill="url(#gradDebtAi)"
              stroke="#ef4444"
              strokeWidth={2}
              animationDuration={ANIMATION_DURATION}
            />
            <Area
              type="monotone"
              dataKey="kumulierterCashflow"
              fill="none"
              stroke="#0ea5e9"
              strokeWidth={2}
              animationDuration={ANIMATION_DURATION}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
