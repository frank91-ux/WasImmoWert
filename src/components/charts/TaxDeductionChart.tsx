import type { TaxResult } from '@/calc/types'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { ChartCard } from './ChartCard'
import { formatEur } from '@/lib/format'

const COLORS = ['var(--color-primary)', '#16a34a', '#f59e0b']

interface TaxDeductionChartProps {
  tax: TaxResult
}

export function TaxDeductionChart({ tax }: TaxDeductionChartProps) {
  const data = [
    { name: 'Gebäude-AfA', value: Math.round(tax.afaBetragJahr) },
    { name: 'Absetzbare Zinsen', value: Math.round(tax.absetzbarerZinsanteilJahr) },
    { name: 'Beweg. Gegenstände', value: Math.round(tax.abschreibungBeweglichJahr) },
  ].filter((d) => d.value > 0)

  if (data.length === 0) return null

  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <ChartCard title="Steuerliche Absetzungen" subtitle={`Gesamt: ${formatEur(total)}/Jahr`}>
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
