import type { CalculationResult } from '@/calc/types'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { ChartCard } from './ChartCard'
import { formatEur } from '@/lib/format'
import { TOOLTIP_STYLE, CHART_COLORS } from './chartTheme'

const COLORS = [CHART_COLORS.primary, CHART_COLORS.positive, CHART_COLORS.warning, CHART_COLORS.negative, CHART_COLORS.palette[5], CHART_COLORS.palette[7]]

interface CostBreakdownPieChartProps {
  result: CalculationResult
}

export function CostBreakdownPieChart({ result }: CostBreakdownPieChartProps) {
  const { financing, operatingCosts, tax, rental } = result

  const data = [
    { name: 'Zinsen', value: Math.round(financing.monatlicheZinsenStart * 12) },
    { name: 'Tilgung', value: Math.round(financing.monatlicheTilgungStart * 12) },
    { name: 'Instandhaltung', value: Math.round(operatingCosts.instandhaltungJahr) },
    { name: 'Verwaltung', value: Math.round(operatingCosts.verwaltungJahr) },
    { name: 'Steuern', value: Math.round(Math.max(0, tax.gesamtSteuerbelastungJahr)) },
    { name: 'Mietausfall', value: Math.round(rental.mietausfall) },
  ].filter((d) => d.value > 0)

  if (data.length === 0) return null

  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <ChartCard title="Jährliche Kosten">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              label={({ value }) => `${Math.round(value / total * 100)}%`}
              labelLine={false}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatEur(Number(value))}
              contentStyle={TOOLTIP_STYLE}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '0.75rem' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
