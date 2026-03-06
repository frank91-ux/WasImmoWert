import type { InvestmentComparisonResult } from '@/calc/types'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { formatEur } from '@/lib/format'
import { TOOLTIP_STYLE, AXIS_TICK, GRID_STYLE, CHART_COLORS } from './chartTheme'

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
                formatter={(value, name) => [formatEur(Number(value)), name]}
                contentStyle={TOOLTIP_STYLE}
              />
              <Legend
                wrapperStyle={{ fontSize: '0.75rem' }}
              />
              <Line
                type="monotone"
                dataKey="Immobilie"
                stroke={CHART_COLORS.primary}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey={etfLabel}
                stroke={CHART_COLORS.positive}
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
