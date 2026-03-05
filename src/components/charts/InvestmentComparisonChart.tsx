import type { InvestmentComparisonResult } from '@/calc/types'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { formatEur } from '@/lib/format'

interface InvestmentComparisonChartProps {
  comparison: InvestmentComparisonResult
  eigenkapital: number
  onEtfRenditeChange?: (v: number) => void
  onEigenkapitalChange?: (v: number) => void
  etfRendite?: number
}

export function InvestmentComparisonChart({
  comparison,
  eigenkapital,
  etfRendite,
}: InvestmentComparisonChartProps) {
  const etfLabel = `ETF (${comparison.etfRendite}% p.a.)`

  const data = comparison.years.map((year, i) => ({
    year: `Jahr ${year}`,
    Immobilie: comparison.immobilie[i],
    [etfLabel]: comparison.etf[i],
  }))

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Investment-Vergleich</CardTitle>
        <CardDescription className="text-xs">
          {formatEur(eigenkapital)} Eigenkapital: Immobilie vs. ETF ({etfRendite ?? comparison.etfRendite}% p.a.)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value, name) => [formatEur(Number(value)), name]}
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
                wrapperStyle={{ fontSize: '0.75rem' }}
              />
              <Line
                type="monotone"
                dataKey="Immobilie"
                stroke="var(--color-primary)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey={etfLabel}
                stroke="#16a34a"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Vergleich: Was wäre, wenn Sie Ihr Eigenkapital statt in die Immobilie in einen ETF investiert hätten?
          Bei negativem Cashflow wird der Zuschuss auch als Einzahlung gerechnet.
        </p>
      </CardContent>
    </Card>
  )
}
