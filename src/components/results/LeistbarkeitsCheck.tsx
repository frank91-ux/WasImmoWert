import { useState } from 'react'
import type { Project, CalculationResult } from '@/calc/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { CurrencyInput } from '@/components/shared/CurrencyInput'
import { Button } from '@/components/ui/button'
import { formatEur } from '@/lib/format'
import { Wallet, HelpCircle } from 'lucide-react'
import { KpiInfoDialog } from './KpiInfoDialog'

interface LeistbarkeitsCheckProps {
  project: Project
  result: CalculationResult
  onChange: (updates: Partial<Project>) => void
}

export function LeistbarkeitsCheck({ project, result, onChange }: LeistbarkeitsCheckProps) {
  const [showIncomeDialog, setShowIncomeDialog] = useState(false)
  const [tempGehalt, setTempGehalt] = useState(48000)
  const [tempAusgaben, setTempAusgaben] = useState(1500)
  const [showKpiInfo, setShowKpiInfo] = useState(false)

  if (project.nutzungsart !== 'eigennutzung') return null

  const nettoMonat = project.nettoJahresgehalt / 12
  const monatlicheImmobilienkosten = result.kpis.monatlicheKosten
  const belastungsquote = nettoMonat > 0
    ? (monatlicheImmobilienkosten / nettoMonat) * 100
    : 0
  const restBudget = nettoMonat - project.monatlicheAusgaben - monatlicheImmobilienkosten

  const ampelColor = belastungsquote <= 30
    ? 'bg-green-500'
    : belastungsquote <= 40
      ? 'bg-yellow-500'
      : 'bg-red-500'

  const ampelLabel = belastungsquote <= 30
    ? 'Leistbar'
    : belastungsquote <= 40
      ? 'Grenzwertig'
      : 'Überlastet'

  const hasData = project.nettoJahresgehalt > 0

  // Bar segments for the budget visualization
  const immobilienAnteil = nettoMonat > 0 ? (monatlicheImmobilienkosten / nettoMonat) * 100 : 0
  const ausgabenAnteil = nettoMonat > 0 ? (project.monatlicheAusgaben / nettoMonat) * 100 : 0
  const restAnteil = Math.max(0, 100 - immobilienAnteil - ausgabenAnteil)

  const handleIncomeSubmit = () => {
    onChange({ nettoJahresgehalt: tempGehalt, monatlicheAusgaben: tempAusgaben })
    setShowIncomeDialog(false)
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Leistbarkeits-Check</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasData ? (
          <div className="text-center py-4 space-y-3">
            <Wallet className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              Bitte Einkommensdaten eingeben, um die Leistbarkeit zu berechnen.
            </p>
            <Button variant="outline" size="sm" onClick={() => setShowIncomeDialog(true)}>
              Einkommensdaten eingeben
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <CurrencyInput
                label="Netto-Jahresgehalt"
                value={project.nettoJahresgehalt}
                onChange={(v) => onChange({ nettoJahresgehalt: v })}
                min={0}
                step={1000}
              />
              <CurrencyInput
                label="Monatl. Ausgaben"
                value={project.monatlicheAusgaben}
                onChange={(v) => onChange({ monatlicheAusgaben: v })}
                suffix="€/Mon"
                min={0}
                step={50}
              />
            </div>

            <button
              className="flex items-center gap-3 w-full text-left group cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1.5 -mx-2 transition-colors"
              onClick={() => setShowKpiInfo(true)}
            >
              <div className={`w-4 h-4 rounded-full ${ampelColor} shrink-0`} />
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm">{ampelLabel}</span>
                <span className="text-sm text-muted-foreground">
                  Belastungsquote: {belastungsquote.toFixed(0)}%
                </span>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
              </div>
            </button>

            {/* Budget bar */}
            <div className="space-y-1.5">
              <div className="flex h-6 rounded-md overflow-hidden">
                {immobilienAnteil > 0 && (
                  <div
                    className="bg-primary flex items-center justify-center text-[10px] text-primary-foreground font-medium"
                    style={{ width: `${Math.min(immobilienAnteil, 100)}%` }}
                  >
                    {immobilienAnteil > 10 && 'Immobilie'}
                  </div>
                )}
                {ausgabenAnteil > 0 && (
                  <div
                    className="bg-orange-400 flex items-center justify-center text-[10px] text-white font-medium"
                    style={{ width: `${Math.min(ausgabenAnteil, 100 - immobilienAnteil)}%` }}
                  >
                    {ausgabenAnteil > 10 && 'Ausgaben'}
                  </div>
                )}
                {restAnteil > 0 && (
                  <div
                    className="bg-green-400 flex items-center justify-center text-[10px] text-white font-medium"
                    style={{ width: `${restAnteil}%` }}
                  >
                    {restAnteil > 10 && 'Rest'}
                  </div>
                )}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Immobilie: {formatEur(monatlicheImmobilienkosten)}/Mon</span>
                <span>Rest: {formatEur(restBudget)}/Mon</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-xs text-muted-foreground">Netto/Mon</p>
                <p className="font-semibold text-sm">{formatEur(nettoMonat)}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-xs text-muted-foreground">Immobilie</p>
                <p className="font-semibold text-sm">{formatEur(monatlicheImmobilienkosten)}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-xs text-muted-foreground">Restbudget</p>
                <p className={`font-semibold text-sm ${restBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatEur(restBudget)}
                </p>
              </div>
            </div>
          </>
        )}

        <p className="text-xs text-muted-foreground">
          Empfehlung: max. 30–35% des Nettoeinkommens für Wohnkosten. Banken vergeben i.d.R. Kredit bis 40% Belastungsquote.
        </p>
      </CardContent>

      {/* Income data popup (C14) */}
      <Dialog open={showIncomeDialog} onOpenChange={setShowIncomeDialog}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Einkommensdaten eingeben
          </DialogTitle>
        </DialogHeader>
        <DialogContent onClose={() => setShowIncomeDialog(false)}>
          <div className="space-y-4">
            <CurrencyInput
              label="Netto-Jahresgehalt"
              value={tempGehalt}
              onChange={setTempGehalt}
              min={0}
              step={1000}
            />
            <CurrencyInput
              label="Monatliche Ausgaben (ohne Wohnen)"
              value={tempAusgaben}
              onChange={setTempAusgaben}
              suffix="€/Mon"
              min={0}
              step={100}
            />
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowIncomeDialog(false)}>Abbrechen</Button>
          <Button onClick={handleIncomeSubmit}>Übernehmen</Button>
        </DialogFooter>
      </Dialog>
      <KpiInfoDialog
        open={showKpiInfo}
        onOpenChange={setShowKpiInfo}
        kpiKey="leistbarkeit"
        currentValue={`${belastungsquote.toFixed(0)}%`}
        result={result}
        project={project}
      />
    </Card>
  )
}
