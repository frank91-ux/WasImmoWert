import type { Project, CalculationResult } from '@/calc/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatEur, formatPercent } from '@/lib/format'
import { AlertTriangle, CheckCircle } from 'lucide-react'

interface AnschlussfinanzierungCardProps {
  project: Project
  result: CalculationResult
}

export function AnschlussfinanzierungCard({ project, result }: AnschlussfinanzierungCardProps) {
  const zinsbindungsEnde = project.zinsbindung
  if (!zinsbindungsEnde || zinsbindungsEnde <= 0) return null

  const anschlussProjection = result.projection[zinsbindungsEnde - 1]
  if (!anschlussProjection) return null

  const restschuld = anschlussProjection.restschuld
  const bisherigeTilgung = result.financing.darlehensBetrag - restschuld
  const getilgtProzent = result.financing.darlehensBetrag > 0
    ? (bisherigeTilgung / result.financing.darlehensBetrag) * 100
    : 0
  const isVollgetilgt = restschuld <= 0

  return (
    <Card className={`border-2 ${isVollgetilgt ? 'border-green-500/30 bg-green-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          {isVollgetilgt ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          )}
          <CardTitle className="text-base">
            {isVollgetilgt
              ? `Darlehen vollständig getilgt nach ${zinsbindungsEnde} Jahren`
              : `Anschlussfinanzierung nach ${zinsbindungsEnde} Jahren`
            }
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Restschuld</p>
            <p className="text-lg font-bold tabular-nums">
              {isVollgetilgt ? '0 €' : formatEur(restschuld)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Bisherige Tilgung</p>
            <p className="text-lg font-bold tabular-nums">{formatEur(bisherigeTilgung)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Getilgt</p>
            <p className="text-lg font-bold tabular-nums">{formatPercent(getilgtProzent)}</p>
            {/* Progress bar */}
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isVollgetilgt ? 'bg-green-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(100, getilgtProzent)}%` }}
              />
            </div>
          </div>
        </div>

        {project.zinsbindungPeriods.length > 0 && (
          <div className="mt-3 pt-3 border-t space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Definierte Anschluss-Perioden</p>
            {project.zinsbindungPeriods.map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-amber-500/20 text-amber-700 text-xs font-semibold">
                  {i + 1}
                </span>
                <span>Ab Jahr {p.afterYear}: {p.zinssatz}% Zins, {p.tilgung}% Tilgung</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
