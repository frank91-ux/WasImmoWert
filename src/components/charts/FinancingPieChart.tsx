import type { CalculationResult } from '@/calc/types'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { ChartCard } from './ChartCard'
import { formatEur } from '@/lib/format'
import { TOOLTIP_STYLE, CHART_COLORS } from './chartTheme'

const COLORS = [CHART_COLORS.primary, CHART_COLORS.positive, CHART_COLORS.warning, CHART_COLORS.negative]

interface FinancingPieChartProps {
  result: CalculationResult
  kaufpreis: number
  eigenkapital: number
}

export function FinancingPieChart({ result, kaufpreis: _kaufpreis, eigenkapital }: FinancingPieChartProps) {
  const { kaufnebenkosten, financing } = result

  const data = [
    { name: 'Eigenkapital', value: Math.round(eigenkapital) },
    { name: 'Darlehen', value: Math.round(financing.darlehensBetrag) },
    { name: 'Grunderwerbsteuer', value: Math.round(kaufnebenkosten.grunderwerbsteuer) },
    { name: 'Makler & Notar', value: Math.round(kaufnebenkosten.maklerkosten + kaufnebenkosten.notarkosten) },
  ].filter((d) => d.value > 0)

  const total = kaufnebenkosten.gesamtkosten

  return (
    <ChartCard title="Finanzierungsstruktur" subtitle={`Gesamt: ${formatEur(total)}`}>
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
              formatter={(value) => [formatEur(Number(value)), undefined]}
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
