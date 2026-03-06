import type { Project, CalculationResult } from '@/calc/types'
import { calculateVerkaufSimulation, type VerkaufTimepoint } from '@/calc/verkauf-simulation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatEur } from '@/lib/format'
import { useMemo, useState, useRef } from 'react'

interface VerkaufSimulationProps {
  project: Project
  result: CalculationResult
}

function parseGermanNumber(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  const num = Number(cleaned)
  return Number.isFinite(num) && num >= 0 ? num : null
}

function formatInputNumber(value: number): string {
  return value.toLocaleString('de-DE', { maximumFractionDigits: 0 })
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
  const [customPreis, setCustomPreis] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Projected property value at year 10 as reference
  const projectedValue = result.projection.length >= 10
    ? result.projection[9].immobilienWert
    : result.projection[result.projection.length - 1]?.immobilienWert ?? project.kaufpreis

  const timepoints = useMemo(
    () => calculateVerkaufSimulation(project, result, undefined, customPreis ?? undefined),
    [project, result, customPreis]
  )

  if (timepoints.length === 0) return null

  function startEditing() {
    setEditText(formatInputNumber(customPreis ?? Math.round(projectedValue)))
    setIsEditing(true)
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 0)
  }

  function commitEdit() {
    const parsed = parseGermanNumber(editText)
    if (parsed !== null && parsed > 0) {
      setCustomPreis(Math.round(parsed))
    }
    setIsEditing(false)
  }

  function cancelEdit() {
    setIsEditing(false)
  }

  function clearCustom() {
    setCustomPreis(null)
    setIsEditing(false)
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Verkauf-Simulation</CardTitle>
        <CardDescription className="text-xs">
          Gewinn und Rendite bei Verkauf nach verschiedenen Haltedauern
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Custom Verkaufspreis Input */}
        <div className="mb-4 p-3 rounded-lg border bg-muted/30 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium whitespace-nowrap">Verkaufspreis:</span>
          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <input
                ref={inputRef}
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitEdit()
                  if (e.key === 'Escape') cancelEdit()
                }}
                onBlur={commitEdit}
                className="w-36 h-8 px-2 text-sm font-medium rounded border bg-background text-right focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="z.B. 350.000"
              />
              <span className="text-sm text-muted-foreground">€</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={startEditing}
              className="h-8 px-3 text-sm font-medium rounded border bg-background hover:bg-accent transition-colors cursor-pointer"
              title="Klicken um eigenen Verkaufspreis einzugeben"
            >
              {customPreis ? formatEur(customPreis) : 'Eigenen Wert eingeben'}
            </button>
          )}
          {customPreis && !isEditing && (
            <button
              type="button"
              onClick={clearCustom}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Zurücksetzen
            </button>
          )}
          {customPreis && !isEditing && (
            <span className="text-xs text-muted-foreground ml-auto">
              Prognose: {formatEur(projectedValue)} (Jahr 10)
            </span>
          )}
        </div>

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
