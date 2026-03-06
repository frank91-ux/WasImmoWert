import type { CalculationResult } from '@/calc/types'
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog'
import { formatEur } from '@/lib/format'

interface CashflowInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  result: CalculationResult
  nutzungsart: 'vermietung' | 'eigennutzung'
}

const BAR_COLORS = {
  einnahmen: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-700', fill: '#10b981' },
  nebenkosten: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-700', fill: '#f59e0b' },
  zinsen: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', border: 'border-red-300 dark:border-red-700', fill: '#ef4444' },
  tilgung: { bg: 'bg-teal-100 dark:bg-teal-900/40', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-300 dark:border-teal-700', fill: '#0d9488' },
  steuer: { bg: 'bg-violet-100 dark:bg-violet-900/40', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-300 dark:border-violet-700', fill: '#8b5cf6' },
  cashflowPos: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-700', fill: '#10b981' },
  cashflowNeg: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', border: 'border-red-300 dark:border-red-700', fill: '#ef4444' },
}

export function CashflowInfoDialog({ open, onOpenChange, result, nutzungsart }: CashflowInfoDialogProps) {
  // Year 1 example data
  const y1 = result.projection[0]
  if (!y1) return null

  const mieteinnahmen = nutzungsart === 'eigennutzung'
    ? Math.round(result.kpis.ersparteMieteJahr / 12)
    : Math.round(result.rental.nettomieteinnahmen / 12)
  const nebenkosten = Math.round(result.operatingCosts.betriebskostenGesamt / 12)
  const zinsen = Math.round(y1.zinsenJahr / 12)
  const tilgung = Math.round(y1.tilgungJahr / 12)
  const steuer = Math.round(Math.max(0, y1.steuerbelastungJahr) / 12)
  const totalAusgaben = nebenkosten + zinsen + tilgung + steuer
  const cashflow = mieteinnahmen - totalAusgaben
  const isPositive = cashflow >= 0

  // For the visual bar chart
  const maxVal = Math.max(mieteinnahmen, totalAusgaben)

  function BarSegment({ label, value, color, pct }: { label: string; value: number; color: typeof BAR_COLORS.einnahmen; pct: number }) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground w-24 shrink-0 text-right">{label}</span>
        <div className="flex-1 h-6 bg-muted/30 rounded overflow-hidden relative">
          <div
            className="h-full rounded transition-all duration-500"
            style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: color.fill, opacity: 0.8 }}
          />
        </div>
        <span className={`text-xs font-semibold tabular-nums w-20 shrink-0 ${color.text}`}>
          {formatEur(value)}/Mon
        </span>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} size="lg">
      <DialogHeader>
        <DialogTitle>Jährlicher Cashflow – Erklärung</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <div className="space-y-5">

          {/* What does the chart show */}
          <div>
            <h4 className="text-sm font-semibold mb-1.5">Was zeigt diese Grafik?</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Der jährliche Cashflow zeigt für jedes Jahr, wie viel Geld nach Abzug aller Kosten
              von deinen Mieteinnahmen übrig bleibt. Ist der Cashflow positiv (grün), verdienst du Geld.
              Ist er negativ (rot), musst du monatlich zuschießen.
            </p>
          </div>

          {/* Visual legend */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Die Balken im Detail</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded shrink-0" style={{ backgroundColor: BAR_COLORS.einnahmen.fill, opacity: 0.2, border: `1px solid ${BAR_COLORS.einnahmen.fill}` }} />
                <span><strong className={BAR_COLORS.einnahmen.text}>Einnahmen</strong> – Hellgrüner Hintergrund zeigt deine gesamten Mieteinnahmen</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded shrink-0" style={{ backgroundColor: BAR_COLORS.nebenkosten.fill, opacity: 0.85 }} />
                <span><strong className={BAR_COLORS.nebenkosten.text}>Nebenkosten</strong> – Nicht-umlagefähige Betriebskosten</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded shrink-0" style={{ backgroundColor: BAR_COLORS.zinsen.fill, opacity: 0.85 }} />
                <span><strong className={BAR_COLORS.zinsen.text}>Zinsen</strong> – Kreditzinsen an die Bank</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded shrink-0" style={{ backgroundColor: BAR_COLORS.tilgung.fill, opacity: 0.85 }} />
                <span><strong className={BAR_COLORS.tilgung.text}>Tilgung</strong> – Rückzahlung des Darlehens</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded shrink-0" style={{ backgroundColor: BAR_COLORS.steuer.fill, opacity: 0.7 }} />
                <span><strong className={BAR_COLORS.steuer.text}>Steuer</strong> – Steuerliche Auswirkung (kann auch positiv sein durch AfA)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded shrink-0" style={{ backgroundColor: isPositive ? BAR_COLORS.cashflowPos.fill : BAR_COLORS.cashflowNeg.fill, opacity: 0.75 }} />
                <span><strong className={isPositive ? BAR_COLORS.cashflowPos.text : BAR_COLORS.cashflowNeg.text}>Cashflow</strong> – Was am Ende übrig bleibt</span>
              </div>
            </div>
          </div>

          {/* Year 1 example with visual bars */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Beispiel: Jahr 1 deiner Immobilie</h4>
            <div className="space-y-2 bg-muted/20 rounded-xl border p-4">
              {/* Income */}
              <BarSegment label="Einnahmen" value={mieteinnahmen} color={BAR_COLORS.einnahmen} pct={(mieteinnahmen / maxVal) * 100} />

              <div className="border-t border-dashed my-2" />
              <p className="text-[11px] text-muted-foreground ml-[108px] -mt-1 mb-1">Davon gehen ab:</p>

              {/* Expenses */}
              <BarSegment label="Nebenkosten" value={nebenkosten} color={BAR_COLORS.nebenkosten} pct={(nebenkosten / maxVal) * 100} />
              <BarSegment label="Zinsen" value={zinsen} color={BAR_COLORS.zinsen} pct={(zinsen / maxVal) * 100} />
              <BarSegment label="Tilgung" value={tilgung} color={BAR_COLORS.tilgung} pct={(tilgung / maxVal) * 100} />
              {steuer > 0 && (
                <BarSegment label="Steuer" value={steuer} color={BAR_COLORS.steuer} pct={(steuer / maxVal) * 100} />
              )}

              <div className="border-t-2 border-foreground/20 my-2" />

              {/* Result */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold w-24 shrink-0 text-right">= Cashflow</span>
                <div className="flex-1 h-7 bg-muted/30 rounded overflow-hidden relative">
                  <div
                    className="h-full rounded transition-all duration-500"
                    style={{
                      width: `${Math.max(Math.abs(cashflow) / maxVal * 100, 3)}%`,
                      backgroundColor: isPositive ? BAR_COLORS.cashflowPos.fill : BAR_COLORS.cashflowNeg.fill,
                      opacity: 0.75,
                    }}
                  />
                </div>
                <span className={`text-sm font-bold tabular-nums w-20 shrink-0 ${isPositive ? BAR_COLORS.cashflowPos.text : BAR_COLORS.cashflowNeg.text}`}>
                  {cashflow > 0 ? '+' : ''}{formatEur(cashflow)}/Mon
                </span>
              </div>
            </div>
          </div>

          {/* Formula */}
          <div className="bg-muted/30 rounded-lg border px-4 py-3">
            <p className="text-xs font-semibold mb-1.5">Formel</p>
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className={`px-2 py-0.5 rounded border ${BAR_COLORS.einnahmen.bg} ${BAR_COLORS.einnahmen.text} ${BAR_COLORS.einnahmen.border}`}>
                Mieteinnahmen
              </span>
              <span className="text-muted-foreground font-bold">−</span>
              <span className={`px-2 py-0.5 rounded border ${BAR_COLORS.nebenkosten.bg} ${BAR_COLORS.nebenkosten.text} ${BAR_COLORS.nebenkosten.border}`}>
                Nebenkosten
              </span>
              <span className="text-muted-foreground font-bold">−</span>
              <span className={`px-2 py-0.5 rounded border ${BAR_COLORS.zinsen.bg} ${BAR_COLORS.zinsen.text} ${BAR_COLORS.zinsen.border}`}>
                Zinsen
              </span>
              <span className="text-muted-foreground font-bold">−</span>
              <span className={`px-2 py-0.5 rounded border ${BAR_COLORS.tilgung.bg} ${BAR_COLORS.tilgung.text} ${BAR_COLORS.tilgung.border}`}>
                Tilgung
              </span>
              <span className="text-muted-foreground font-bold">−</span>
              <span className={`px-2 py-0.5 rounded border ${BAR_COLORS.steuer.bg} ${BAR_COLORS.steuer.text} ${BAR_COLORS.steuer.border}`}>
                Steuer
              </span>
              <span className="text-muted-foreground font-bold">=</span>
              <span className={`px-2 py-1 rounded border font-bold ${isPositive ? `${BAR_COLORS.cashflowPos.bg} ${BAR_COLORS.cashflowPos.text} ${BAR_COLORS.cashflowPos.border}` : `${BAR_COLORS.cashflowNeg.bg} ${BAR_COLORS.cashflowNeg.text} ${BAR_COLORS.cashflowNeg.border}`}`}>
                {cashflow > 0 ? '+' : ''}{formatEur(cashflow)}/Mon
              </span>
            </div>
          </div>

          {/* How to read the chart */}
          <div>
            <h4 className="text-sm font-semibold mb-1.5">So liest du die Grafik</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Gestapelte Balken</strong> – Die farbigen Balken (Nebenkosten, Zinsen, Tilgung, Steuer) sind übereinander gestapelt und zeigen deine gesamten monatlichen Ausgaben.
              </p>
              <p>
                <strong className="text-foreground">Hintergrund-Balken</strong> – Der hellgrüne Hintergrund zeigt deine Einnahmen. Wenn die gestapelten Ausgaben den Hintergrund übersteigen, ist dein Cashflow negativ.
              </p>
              <p>
                <strong className="text-foreground">Cashflow-Balken</strong> – Der separate kleine Balken mit dem €-Wert zeigt deinen Netto-Cashflow: grün nach oben bei Gewinn, rot nach unten bei Verlust.
              </p>
              <p>
                <strong className="text-foreground">Über die Jahre</strong> – Zinsen sinken typischerweise über die Jahre (da die Restschuld abnimmt), während die Tilgung steigt. Das verbessert deinen Cashflow langfristig.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
