import type { Project, CalculationResult } from '@/calc/types'
import { calculateVerkaufSimulation, type VerkaufTimepoint } from '@/calc/verkauf-simulation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatEur } from '@/lib/format'
import { useMemo } from 'react'

interface VerkaufSimulationProps {
  project: Project
  result: CalculationResult
}

function VerkaufCard({ tp }: { tp: VerkaufTimepoint }) {
  const isPositive = tp.gewinnNetto > 0
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">Jahr {tp.year}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          tp.istSteuerfrei
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {tp.istSteuerfrei ? 'Steuerfrei' : 'Steuerpflichtig'}
        </span>
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Verkaufspreis</span>
          <span className="font-medium">{formatEur(tp.verkaufspreis)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Restschuld</span>
          <span className="font-medium">{formatEur(tp.restschuld)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Notarkosten Verkauf</span>
          <span className="font-medium">−{formatEur(tp.notarkostenVerkauf)}</span>
        </div>
        {tp.modernisierungKumuliert > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Modernisierungen</span>
            <span className="font-medium">−{formatEur(tp.modernisierungKumuliert)}</span>
          </div>
        )}
        <div className="flex justify-between border-t pt-1.5">
          <span className="text-muted-foreground">Gewinn (brutto)</span>
          <span className={`font-medium ${tp.gewinnBrutto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatEur(tp.gewinnBrutto)}
          </span>
        </div>
        {!tp.istSteuerfrei && tp.spekulationssteuer > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Spekulationssteuer</span>
            <span className="font-medium">−{formatEur(tp.spekulationssteuer)}</span>
          </div>
        )}
        <div className="flex justify-between border-t pt-1.5 font-semibold">
          <span>Gewinn (netto)</span>
          <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
            {formatEur(tp.gewinnNetto)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cashflow (kumuliert)</span>
          <span className={`font-medium ${tp.gesamtCashflowHaltedauer >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatEur(tp.gesamtCashflowHaltedauer)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Rendite p.a.</span>
          <span className={`font-semibold ${tp.effektiveRenditePa >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {tp.effektiveRenditePa.toFixed(1)} %
          </span>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground leading-snug">
        {tp.steuerfreiGrund}
      </p>
    </div>
  )
}

export function VerkaufSimulation({ project, result }: VerkaufSimulationProps) {
  const timepoints = useMemo(
    () => calculateVerkaufSimulation(project, result),
    [project, result]
  )

  if (timepoints.length === 0) return null

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Verkauf-Simulation</CardTitle>
        <CardDescription className="text-xs">
          Gewinn und Rendite bei Verkauf nach verschiedenen Haltedauern
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {timepoints.map((tp) => (
            <VerkaufCard key={tp.year} tp={tp} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
          {project.nutzungsart === 'eigennutzung'
            ? 'Bei Eigennutzung ist der Verkauf grundsätzlich steuerfrei (§23 Abs. 1 Nr. 1 S. 3 EStG).'
            : 'Verkauf nach 10 Jahren Haltedauer = steuerfrei. Davor: Spekulationssteuer mit persönlichem Steuersatz. Freigrenze: 1.000 €.'}
        </p>
      </CardContent>
    </Card>
  )
}
