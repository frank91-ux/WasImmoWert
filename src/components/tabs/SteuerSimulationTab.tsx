import { useMemo } from 'react'
import type { Project, CalculationResult } from '@/calc/types'
import { calculateAfaRate } from '@/calc/tax'
import { ParameterSlider } from '@/components/simulation/ParameterSlider'
import { TaxExampleCalculation } from './TaxExampleCalculation'
import { TaxDeductionChart } from '@/components/charts/TaxDeductionChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatEur } from '@/lib/format'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { ChartCard } from '@/components/charts/ChartCard'

interface SteuerSimulationTabProps {
  project: Project
  result: CalculationResult
  onChange: (updates: Partial<Project>) => void
}

export function SteuerSimulationTab({ project, result, onChange }: SteuerSimulationTabProps) {
  const { tax, rental, operatingCosts, financing, projection } = result

  const gebaeudeAnteil = 100 - project.grundstueckAnteil
  const gebaeudeWert = project.kaufpreis * (gebaeudeAnteil / 100)
  const bodenWert = project.kaufpreis * (project.grundstueckAnteil / 100)
  const afaRate = project.customAfaRate ?? calculateAfaRate(project.baujahr)
  const afaBetrag = gebaeudeWert * (afaRate / 100)

  const beweglichAbschreibung = project.beweglicheGegenstaende > 0 && project.afaBeweglichJahre > 0
    ? project.beweglicheGegenstaende / project.afaBeweglichJahre
    : 0

  // Tax over time data from projection
  const taxOverTime = useMemo(() => {
    return projection.map((y) => ({
      year: y.year,
      steuerbelastung: Math.round(y.steuerbelastungJahr),
    }))
  }, [projection])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Tax Sliders */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Gebäude / Boden</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ParameterSlider
                label="Gebäudeanteil"
                value={gebaeudeAnteil}
                min={30}
                max={95}
                step={1}
                unit="%"
                onChange={(v) => onChange({ grundstueckAnteil: 100 - v })}
                formatValue={(v) => `${v.toFixed(0)} %`}
              />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Gebäudewert</span>
                  <p className="font-semibold tabular-nums">{formatEur(gebaeudeWert)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Bodenwert</span>
                  <p className="font-semibold tabular-nums">{formatEur(bodenWert)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Abschreibung (AfA)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ParameterSlider
                label="AfA-Satz"
                value={project.customAfaRate ?? afaRate}
                min={0.5}
                max={5}
                step={0.1}
                unit="%"
                onChange={(v) => onChange({ customAfaRate: v })}
                formatValue={(v) => `${v.toFixed(1)} %`}
              />
              <p className="text-sm text-muted-foreground">
                AfA: {formatEur(afaBetrag)}/Jahr ({formatEur(afaBetrag / 12)}/Mon)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Steuersatz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ParameterSlider
                label="Persönlicher Steuersatz"
                value={project.persoenlicherSteuersatz}
                min={0}
                max={45}
                step={1}
                unit="%"
                onChange={(v) => onChange({ persoenlicherSteuersatz: v })}
                formatValue={(v) => `${v.toFixed(0)} %`}
              />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={project.kirchensteuer}
                    onChange={(e) => onChange({ kirchensteuer: e.target.checked })}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  Kirchensteuer
                </label>
                {project.kirchensteuer && (
                  <select
                    className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                    value={project.kirchensteuersatz}
                    onChange={(e) => onChange({ kirchensteuersatz: Number(e.target.value) })}
                  >
                    <option value={8}>8%</option>
                    <option value={9}>9%</option>
                  </select>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Bewegliche Gegenstände</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ParameterSlider
                label="Wert"
                value={project.beweglicheGegenstaende}
                min={0}
                max={50000}
                step={500}
                unit="€"
                onChange={(v) => onChange({ beweglicheGegenstaende: v })}
                formatValue={(v) => formatEur(v)}
              />
              <ParameterSlider
                label="Abschreibungsdauer"
                value={project.afaBeweglichJahre}
                min={1}
                max={20}
                step={1}
                unit="Jahre"
                onChange={(v) => onChange({ afaBeweglichJahre: v })}
                formatValue={(v) => `${v} Jahre`}
              />
              {beweglichAbschreibung > 0 && (
                <p className="text-sm text-muted-foreground">
                  Abschreibung: {formatEur(beweglichAbschreibung)}/Jahr für {project.afaBeweglichJahre} Jahre
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Charts */}
        <div className="lg:col-span-5 space-y-6">
          <TaxDeductionChart tax={tax} />

          {taxOverTime.length > 1 && (
            <ChartCard title="Steuerbelastung über Laufzeit">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={taxOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="year" fontSize={11} tickLine={false} />
                    <YAxis
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatEur(value), 'Steuer']}
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
                      dataKey="steuerbelastung"
                      stroke="var(--color-primary)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          )}
        </div>
      </div>

      {/* Full-width: Tax Example Calculation */}
      <TaxExampleCalculation
        tax={tax}
        rental={rental}
        operatingCosts={operatingCosts}
        financing={financing}
      />
    </div>
  )
}
