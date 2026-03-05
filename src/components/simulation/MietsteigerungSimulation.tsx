import { useState, useMemo } from 'react'
import type { Project, CalculationResult } from '@/calc/types'
import { ParameterSlider } from './ParameterSlider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartCard } from '@/components/charts/ChartCard'
import { formatEur } from '@/lib/format'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, ComposedChart,
} from 'recharts'

interface MietsteigerungSimulationProps {
  project: Project
  result: CalculationResult
}

export function MietsteigerungSimulation({ project, result }: MietsteigerungSimulationProps) {
  const [steigerung, setSteigerung] = useState(2)
  const { projection, rental, operatingCosts, financing } = result

  const data = useMemo(() => {
    const baselineAnnualRent = rental.nettomieteinnahmen

    return projection.map((y) => {
      const year = y.year
      // Increased rent for this year
      const increasedRent = baselineAnnualRent * Math.pow(1 + steigerung / 100, year)
      const rentDifference = increasedRent - baselineAnnualRent

      // Baseline monthly cashflow (from projection)
      const baselineCfMonat = y.cashflowNachSteuer / 12

      // Scenario monthly cashflow: baseline + additional rent (simplified, ignoring tax effect on increase)
      const scenarioCfMonat = baselineCfMonat + rentDifference / 12

      return {
        year,
        baseline: Math.round(baselineCfMonat),
        szenario: Math.round(scenarioCfMonat),
        miete: Math.round(baselineAnnualRent * Math.pow(1 + steigerung / 100, year) / 12),
        differenz: Math.round(rentDifference / 12),
      }
    })
  }, [projection, rental, steigerung])

  // Summary years
  const summaryYears = [5, 10, 15, 20, 25].filter((y) => y <= projection.length)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mietsteigerung-Simulation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ParameterSlider
          label="Jährliche Mietsteigerung"
          value={steigerung}
          min={0}
          max={5}
          step={0.5}
          unit="% p.a."
          onChange={setSteigerung}
          formatValue={(v) => `${v.toFixed(1)} %`}
        />

        {data.length > 1 && (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="year" fontSize={11} tickLine={false} />
                <YAxis
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `${v.toLocaleString('de-DE')} €`}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatEur(value),
                    name === 'baseline' ? 'Ohne Steigerung' : 'Mit Steigerung',
                  ]}
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-foreground)',
                    borderRadius: '0.5rem',
                    fontSize: '0.8125rem',
                  }}
                  labelFormatter={(l) => `Jahr ${l}`}
                />
                <ReferenceLine y={0} stroke="var(--color-border)" />
                <Line
                  type="monotone"
                  dataKey="baseline"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="baseline"
                />
                <Line
                  type="monotone"
                  dataKey="szenario"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={false}
                  name="szenario"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {summaryYears.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 font-medium">Jahr</th>
                  <th className="text-right py-2 font-medium">Miete/Mon</th>
                  <th className="text-right py-2 font-medium">Cashflow (Basis)</th>
                  <th className="text-right py-2 font-medium">Cashflow (Szenario)</th>
                  <th className="text-right py-2 font-medium">Differenz</th>
                </tr>
              </thead>
              <tbody>
                {summaryYears.map((y) => {
                  const row = data[y - 1]
                  if (!row) return null
                  return (
                    <tr key={y} className="border-b last:border-0">
                      <td className="py-1.5">{y}</td>
                      <td className="py-1.5 text-right tabular-nums">{formatEur(row.miete)}</td>
                      <td className="py-1.5 text-right tabular-nums">{formatEur(row.baseline)}</td>
                      <td className="py-1.5 text-right tabular-nums font-medium">{formatEur(row.szenario)}</td>
                      <td className={`py-1.5 text-right tabular-nums ${row.differenz >= 0 ? 'text-success' : 'text-destructive'}`}>
                        +{formatEur(row.differenz)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
