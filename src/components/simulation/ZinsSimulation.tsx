import { useState, useMemo } from 'react'
import type { Project, CalculationResult } from '@/calc/types'
import { calculateAll } from '@/calc'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ParameterSlider } from './ParameterSlider'
import { formatEur } from '@/lib/format'

interface ZinsSimulationProps {
  project: Project
  result: CalculationResult
}

export function ZinsSimulation({ project, result }: ZinsSimulationProps) {
  const [scenarioZins, setScenarioZins] = useState(project.zinssatz)

  // Was-wäre-wenn: recalculate with different Zinssatz
  const scenarioResult = useMemo(() => {
    if (Math.abs(scenarioZins - project.zinssatz) < 0.01) return null
    return calculateAll({ ...project, zinssatz: scenarioZins })
  }, [project, scenarioZins])

  const originalRate = result.financing.monatlicheRate
  const originalCashflow = result.kpis.monatlichCashflowNachSteuer
  const originalEkRendite = result.kpis.eigenkapitalrendite
  const originalDscr = result.kpis.dscr

  const scenarioRate = scenarioResult?.financing.monatlicheRate ?? originalRate
  const scenarioCashflow = scenarioResult?.kpis.monatlichCashflowNachSteuer ?? originalCashflow
  const scenarioEkRendite = scenarioResult?.kpis.eigenkapitalrendite ?? originalEkRendite
  const scenarioDscr = scenarioResult?.kpis.dscr ?? originalDscr

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Zins-Simulation</CardTitle>
        <CardDescription className="text-xs">
          Auswirkungen von Zinsänderungen auf Ihre Finanzierung
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Was wäre wenn?</h4>
          <ParameterSlider
            label="Zinssatz"
            value={scenarioZins}
            min={0.5}
            max={10}
            step={0.1}
            unit="%"
            onChange={setScenarioZins}
            formatValue={(v) => `${v.toFixed(1)} %`}
          />

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Kennzahl</th>
                  <th className="text-right py-2 px-4 text-muted-foreground font-medium">
                    Aktuell ({project.zinssatz}%)
                  </th>
                  <th className="text-right py-2 pl-4 font-medium">
                    Szenario ({scenarioZins.toFixed(1)}%)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 pr-4">Monatliche Rate</td>
                  <td className="py-2 px-4 text-right tabular-nums">{formatEur(originalRate)}</td>
                  <td className={`py-2 pl-4 text-right tabular-nums font-medium ${
                    scenarioRate > originalRate ? 'text-red-600' : scenarioRate < originalRate ? 'text-green-600' : ''
                  }`}>
                    {formatEur(scenarioRate)}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Cashflow/Mon</td>
                  <td className="py-2 px-4 text-right tabular-nums">{formatEur(originalCashflow)}</td>
                  <td className={`py-2 pl-4 text-right tabular-nums font-medium ${
                    scenarioCashflow < originalCashflow ? 'text-red-600' : scenarioCashflow > originalCashflow ? 'text-green-600' : ''
                  }`}>
                    {formatEur(scenarioCashflow)}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">EK-Rendite</td>
                  <td className="py-2 px-4 text-right tabular-nums">{originalEkRendite.toFixed(1)} %</td>
                  <td className={`py-2 pl-4 text-right tabular-nums font-medium ${
                    scenarioEkRendite < originalEkRendite ? 'text-red-600' : scenarioEkRendite > originalEkRendite ? 'text-green-600' : ''
                  }`}>
                    {scenarioEkRendite.toFixed(1)} %
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">DSCR</td>
                  <td className="py-2 px-4 text-right tabular-nums">{originalDscr.toFixed(2)}</td>
                  <td className={`py-2 pl-4 text-right tabular-nums font-medium ${
                    scenarioDscr < originalDscr ? 'text-red-600' : scenarioDscr > originalDscr ? 'text-green-600' : ''
                  }`}>
                    {scenarioDscr.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {scenarioResult && Math.abs(scenarioRate - originalRate) > 1 && (
            <p className="text-xs text-muted-foreground">
              Differenz: {formatEur(Math.abs(scenarioRate - originalRate))}/Mon
              ({scenarioRate > originalRate ? 'Mehrbelastung' : 'Entlastung'})
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
