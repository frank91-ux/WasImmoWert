import type { CalculationResult } from '@/calc/types'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { ChartCard } from './ChartCard'
import { formatEur } from '@/lib/format'

const COLORS = ['var(--color-primary)', '#16a34a', '#f59e0b', '#ef4444']

interface FinancingPieChartProps {
  result: CalculationResult
  kaufpreis: number
  eigenkapital: number
}

export function FinancingPieChart({ result, kaufpreis, eigenkapital }: FinancingPieChartProps) {
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
              contentStyle={{
                backgroundColor: 'var(--color-card)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-foreground)',
                borderRadius: '0.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                fontSize: '0.8125rem',
              }}
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
