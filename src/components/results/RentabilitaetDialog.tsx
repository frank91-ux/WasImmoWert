import { Dialog, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog'
import type { RentabilitaetScore } from '@/calc/rentabilitaet'
import { formatEur, formatPercent } from '@/lib/format'
import { KPI_INFO } from '@/i18n/kpiInfo'
import { Info } from 'lucide-react'

interface RentabilitaetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  score: RentabilitaetScore
  nutzungsart: 'vermietung' | 'eigennutzung'
}

// Map breakdown kpiKey → KPI_INFO key
const KPI_KEY_MAP: Record<string, string> = {
  monatlichCashflowNachSteuer: 'cashflow',
  eigenkapitalrendite: 'eigenkapitalrendite',
  bruttomietrendite: 'bruttomietrendite',
  dscr: 'dscr',
  kaufpreisfaktor: 'kaufpreisfaktor',
  vermoegenszuwachsMonatlich: 'vermoegenszuwachs',
  eigennutzungRendite: 'eigennutzungRendite',
  kostenVsErsparnis: 'ersparteMiete',
  marktvergleichKauf: 'marktvergleich',
  marktvergleichMiete: 'mietvergleich',
}

function formatRawValue(kpiKey: string, value: number): string {
  switch (kpiKey) {
    case 'monatlichCashflowNachSteuer':
    case 'vermoegenszuwachsMonatlich':
      return formatEur(value)
    case 'eigenkapitalrendite':
    case 'bruttomietrendite':
    case 'eigennutzungRendite':
      return formatPercent(value)
    case 'dscr':
      return value >= 10 ? '∞' : value.toFixed(2)
    case 'kaufpreisfaktor':
      return value >= 40 ? '∞' : value.toFixed(1) + 'x'
    case 'kostenVsErsparnis':
      return value.toFixed(2) + 'x'
    case 'marktvergleichKauf':
    case 'marktvergleichMiete':
      return `${value > 0 ? '+' : ''}${value.toFixed(0)}%`
    default:
      return value.toFixed(2)
  }
}

export function RentabilitaetDialog({ open, onOpenChange, score, nutzungsart }: RentabilitaetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3">
          <span className={`text-2xl font-black ${score.color}`}>{score.grade}</span>
          <span>{score.label} — {score.score.toFixed(1)}/10</span>
        </DialogTitle>
      </DialogHeader>
      <DialogContent onClose={() => onOpenChange(false)}>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {nutzungsart === 'vermietung'
              ? `Die Rentabilitätsnote fasst ${score.breakdown.length} Kennzahlen zu einer Gesamtbewertung zusammen. Jede KPI wird auf einer Skala von 0\u201310 normalisiert und gewichtet.`
              : 'Die Rentabilitätsnote bewertet Ihre Eigennutzung anhand von 3 Kernkennzahlen: Rendite, Kosten-Ersparnis-Verhältnis und Vermögensaufbau.'
            }
          </p>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-2 font-medium">Kennzahl</th>
                <th className="text-right py-2 font-medium">Wert</th>
                <th className="text-right py-2 font-medium">Score</th>
                <th className="text-right py-2 font-medium">Gewicht</th>
              </tr>
            </thead>
            <tbody>
              {score.breakdown.map((b) => {
                const infoKey = KPI_KEY_MAP[b.kpiKey]
                const info = infoKey ? KPI_INFO[infoKey] : undefined
                return (
                  <tr key={b.kpiKey} className="border-b border-border/50">
                    <td className="py-2">
                      {info ? (
                        <span className="group/tip relative flex items-center gap-1 cursor-help">
                          {b.label}
                          <Info className="h-3 w-3 text-muted-foreground opacity-40 group-hover/tip:opacity-100 transition-opacity shrink-0" />
                          <span className="absolute left-0 top-full mt-1 z-50 hidden group-hover/tip:block w-64 p-2.5 rounded-lg bg-popover text-popover-foreground text-xs shadow-lg border border-border leading-relaxed">
                            {info.description.slice(0, 200)}{info.description.length > 200 ? '...' : ''}
                          </span>
                        </span>
                      ) : (
                        b.label
                      )}
                    </td>
                    <td className="py-2 text-right tabular-nums">{formatRawValue(b.kpiKey, b.rawValue)}</td>
                    <td className="py-2 text-right">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              b.normalizedScore >= 7 ? 'bg-emerald-500' :
                              b.normalizedScore >= 4 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${b.normalizedScore * 10}%` }}
                          />
                        </div>
                        <span className="tabular-nums w-8 text-right">{b.normalizedScore.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">
                      <span className={b.contextMultiplier !== 1 ? 'font-medium text-foreground' : ''}>
                        {(b.weight * 100).toFixed(0)}%
                      </span>
                      {b.contextMultiplier !== 1 && (
                        <span className="block text-[10px] text-muted-foreground leading-tight mt-0.5">
                          {b.contextReason}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t font-semibold">
                <td className="py-2">Gesamt</td>
                <td />
                <td className="py-2 text-right">
                  <span className={`${score.color}`}>{score.score.toFixed(1)}/10</span>
                </td>
                <td className="py-2 text-right tabular-nums text-muted-foreground">100%</td>
              </tr>
            </tfoot>
          </table>

          <p className="text-xs text-muted-foreground border-t pt-3">
            Hinweis: Diese Bewertung ist eine vereinfachte Heuristik und ersetzt keine professionelle Immobilienbewertung.
            Die Gewichtung spiegelt eine ausgewogene Perspektive wider, individuelle Pr\u00e4ferenzen k\u00f6nnen abweichen.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
