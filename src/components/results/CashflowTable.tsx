import { useState, useMemo } from 'react'
import type { CalculationResult, YearlyProjection, ZinsbindungPeriod } from '@/calc/types'
import { formatEur, formatEurDetail } from '@/lib/format'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ExplanationTooltip } from '@/components/shared/ExplanationTooltip'
import { Slider } from '@/components/ui/slider'
import { useUiStore } from '@/store/useUiStore'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'

interface CashflowTableProps {
  result: CalculationResult
  nutzungsart: 'vermietung' | 'eigennutzung'
  zinsbindung?: number
  zinsbindungPeriods?: ZinsbindungPeriod[]
}

interface CashflowRow {
  id: string
  label: string
  value: number
  annual: number
  bold?: boolean
  dim?: boolean
  highlight?: boolean
  toggleable?: boolean
  indent?: boolean
}

export function CashflowTable({ result, nutzungsart, zinsbindung, zinsbindungPeriods }: CashflowTableProps) {
  const { mode } = useUiStore()
  const { rental, operatingCosts, financing, tax, kpis, projection } = result
  const isEigennutzung = nutzungsart === 'eigennutzung'
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const [displayYear, setDisplayYear] = useState(1)
  const yearData: YearlyProjection | null = projection[displayYear - 1] ?? null

  const isModified = excluded.size > 0

  const toggleRow = (id: string) => {
    setExcluded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const resetExclusions = () => setExcluded(new Set())

  // Build individual (non-subtotal) rows with values
  const individualRows = useMemo(() => {
    const rows: CashflowRow[] = []

    if (!isEigennutzung) {
      rows.push(
        { id: 'kaltmiete', label: 'Kaltmiete (Monat)', value: rental.jahresmieteKalt / 12, annual: rental.jahresmieteKalt },
      )
      rows.push(
        { id: 'nk_gesamt', label: 'Nebenkosten gesamt', value: rental.nebenkostenGesamt / 12, annual: rental.nebenkostenGesamt, dim: true },
        { id: 'nk_umlagefaehig', label: 'davon umlagefähig (→ Mieter)', value: rental.umlagefaehigeNK / 12, annual: rental.umlagefaehigeNK, dim: true, indent: true },
        { id: 'nk_nicht_umlagefaehig', label: 'davon nicht umlagefähig', value: rental.nichtUmlagefaehigeNK / 12, annual: rental.nichtUmlagefaehigeNK, dim: true, indent: true },
      )
      if (rental.warmmieteMonat > 0) {
        rows.push(
          { id: 'warmmiete', label: 'Warmmiete (inkl. umlagef. NK)', value: rental.warmmieteMonat, annual: rental.warmmieteMonat * 12, dim: true },
        )
      }
      rows.push(
        { id: 'mietausfall', label: 'Mietausfall', value: -rental.mietausfall / 12, annual: -rental.mietausfall, dim: true, toggleable: true },
      )
    } else {
      if (kpis.ersparteMieteJahr > 0) {
        rows.push(
          { id: 'erspartemiete', label: 'Ersparte Miete (kalkulatorisch)', value: kpis.ersparteMieteJahr / 12, annual: kpis.ersparteMieteJahr, dim: true },
        )
      }
    }

    rows.push(
      { id: 'instandhaltung', label: 'Instandhaltung', value: -operatingCosts.instandhaltungJahr / 12, annual: -operatingCosts.instandhaltungJahr, toggleable: true },
      { id: 'verwaltung', label: 'Verwaltung', value: -operatingCosts.verwaltungJahr / 12, annual: -operatingCosts.verwaltungJahr, toggleable: true },
    )

    if (operatingCosts.nichtUmlegbarJahr > 0) {
      rows.push(
        { id: 'nk', label: 'Nicht umlegbare NK', value: -operatingCosts.nichtUmlegbarJahr / 12, annual: -operatingCosts.nichtUmlegbarJahr, toggleable: true },
      )
    }
    if (operatingCosts.sonstigeKostenJahr > 0) {
      rows.push(
        { id: 'sonstige', label: 'Sonstige Kosten', value: -operatingCosts.sonstigeKostenJahr / 12, annual: -operatingCosts.sonstigeKostenJahr, toggleable: true },
      )
    }

    // Use year-specific data for rate split and tax
    const yearSpecificTax = yearData ? yearData.steuerbelastungJahr : tax.gesamtSteuerbelastungJahr

    // Use year-specific annuity if available (changes with Zinsbindung periods)
    const yearAnnuity = yearData && displayYear > 1 ? yearData.zinsenJahr + yearData.tilgungJahr : financing.annuitaet

    rows.push(
      { id: 'kreditrate', label: 'Kreditrate (Zins + Tilgung)', value: -yearAnnuity / 12, annual: -yearAnnuity, toggleable: true },
    )
    // F1: Zins/Tilgung sub-rows for detailed breakdown
    if (yearData && financing.darlehensBetrag > 0) {
      rows.push(
        { id: 'zinsen_sub', label: 'davon Zinsen', value: -yearData.zinsenJahr / 12, annual: -yearData.zinsenJahr, dim: true, indent: true },
        { id: 'tilgung_sub', label: 'davon Tilgung', value: -yearData.tilgungJahr / 12, annual: -yearData.tilgungJahr, dim: true, indent: true },
      )
    }

    if (!isEigennutzung) {
      rows.push(
        { id: 'steuer', label: 'Steuerliche Auswirkung', value: -yearSpecificTax / 12, annual: -yearSpecificTax, toggleable: true },
      )
    }

    return rows
  }, [rental, operatingCosts, financing, tax, kpis, isEigennutzung, yearData, displayYear])

  // Compute modified subtotals
  const getValue = (id: string) => {
    if (excluded.has(id)) return { value: 0, annual: 0 }
    const row = individualRows.find((r) => r.id === id)
    return row ? { value: row.value, annual: row.annual } : { value: 0, annual: 0 }
  }

  const nettoMieteinnahmenMod = isEigennutzung ? 0 : (rental.jahresmieteKalt / 12 + getValue('mietausfall').value)
  const nettoMieteinnahmenAnnualMod = isEigennutzung ? 0 : (rental.jahresmieteKalt + getValue('mietausfall').annual)

  const costIds = ['instandhaltung', 'verwaltung', 'nk', 'sonstige']
  const costsMonthMod = costIds.reduce((sum, id) => sum + getValue(id).value, 0)
  const costsAnnualMod = costIds.reduce((sum, id) => sum + getValue(id).annual, 0)

  const cashflowVorSteuerMonth = nettoMieteinnahmenMod + costsMonthMod + getValue('kreditrate').value
  const cashflowVorSteuerAnnual = nettoMieteinnahmenAnnualMod + costsAnnualMod + getValue('kreditrate').annual

  const steuerMonth = getValue('steuer').value
  const steuerAnnual = getValue('steuer').annual
  const cashflowNachSteuerMonth = cashflowVorSteuerMonth + steuerMonth
  const cashflowNachSteuerAnnual = cashflowVorSteuerAnnual + steuerAnnual

  // Build final display rows including subtotals
  const displayRows: CashflowRow[] = []

  // Income section
  for (const row of individualRows) {
    if (['kaltmiete', 'nk_gesamt', 'nk_umlagefaehig', 'nk_nicht_umlagefaehig', 'warmmiete', 'mietausfall', 'erspartemiete'].includes(row.id)) {
      displayRows.push(row)
    }
  }

  // Netto subtotal (vermietung only)
  if (!isEigennutzung) {
    displayRows.push({
      id: '_netto',
      label: 'Netto-Mieteinnahmen',
      value: isModified ? nettoMieteinnahmenMod : rental.nettomieteinnahmen / 12,
      annual: isModified ? nettoMieteinnahmenAnnualMod : rental.nettomieteinnahmen,
      bold: true,
    })
  }

  // Cost rows
  for (const row of individualRows) {
    if (['instandhaltung', 'verwaltung', 'nk', 'sonstige', 'kreditrate', 'zinsen_sub', 'tilgung_sub'].includes(row.id)) {
      displayRows.push(row)
    }
  }

  // Summary rows – use yearData for non-year-1 when not modified
  if (!isEigennutzung) {
    const cfVorSteuerMonth = isModified
      ? cashflowVorSteuerMonth
      : (yearData && displayYear > 1
        ? (yearData.cashflowNachSteuer + yearData.steuerbelastungJahr) / 12
        : kpis.monatlichCashflowVorSteuer)
    const cfVorSteuerAnnual = isModified
      ? cashflowVorSteuerAnnual
      : (yearData && displayYear > 1
        ? yearData.cashflowNachSteuer + yearData.steuerbelastungJahr
        : kpis.jaehrlichCashflowVorSteuer)

    displayRows.push(
      {
        id: '_cfVorSteuer',
        label: 'Cashflow vor Steuer',
        value: cfVorSteuerMonth,
        annual: cfVorSteuerAnnual,
        bold: true,
      },
    )
    // Steuer row
    const steuerRow = individualRows.find((r) => r.id === 'steuer')
    if (steuerRow) displayRows.push(steuerRow)

    const cfNachSteuerMonth = isModified
      ? cashflowNachSteuerMonth
      : (yearData && displayYear > 1
        ? yearData.cashflowNachSteuer / 12
        : kpis.monatlichCashflowNachSteuer)
    const cfNachSteuerAnnual = isModified
      ? cashflowNachSteuerAnnual
      : (yearData && displayYear > 1
        ? yearData.cashflowNachSteuer
        : kpis.jaehrlichCashflowNachSteuer)

    displayRows.push(
      {
        id: '_cfNachSteuer',
        label: 'Cashflow nach Steuer',
        value: cfNachSteuerMonth,
        annual: cfNachSteuerAnnual,
        bold: true,
        highlight: true,
      },
    )
  } else {
    // Eigennutzung: use yearData for year-specific Belastung
    const belastungMonth = isModified
      ? (costsMonthMod + getValue('kreditrate').value)
      : (yearData && displayYear > 1
        ? yearData.cashflowNachSteuer / 12
        : kpis.monatlichCashflowNachSteuer)
    const belastungAnnual = isModified
      ? (costsAnnualMod + getValue('kreditrate').annual)
      : (yearData && displayYear > 1
        ? yearData.cashflowNachSteuer
        : kpis.jaehrlichCashflowNachSteuer)

    displayRows.push({
      id: '_belastung',
      label: 'Monatliche Belastung',
      value: belastungMonth,
      annual: belastungAnnual,
      bold: true,
      highlight: true,
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle>Cashflow-Rechnung</CardTitle>
          {isModified && (
            <Badge variant="outline" className="text-xs">Modifiziert</Badge>
          )}
        </div>
        {isModified && (
          <button
            onClick={resetExclusions}
            className="text-xs text-primary hover:underline"
          >
            Zurücksetzen
          </button>
        )}
      </CardHeader>
      <CardContent>
        {projection.length > 1 && (
          <div className="mb-4 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {displayYear === 1 ? 'Jahr 1 (Startwerte)' : `Jahr ${displayYear}`}
              </span>
              <span className="text-muted-foreground text-xs">
                {yearData ? `Restschuld: ${formatEur(yearData.restschuld)}` : ''}
              </span>
            </div>
            <Slider
              min={1}
              max={projection.length}
              step={1}
              value={displayYear}
              onChange={setDisplayYear}
            />
          </div>
        )}
        {/* F6: Zinsbindung info banner */}
        {(() => {
          // Check if current displayYear is a zinsbindung boundary
          const allBoundaries: { year: number; rate: number }[] = []
          if (zinsbindung && zinsbindung > 0) {
            allBoundaries.push({ year: zinsbindung, rate: 0 })
          }
          if (zinsbindungPeriods) {
            for (const p of zinsbindungPeriods) {
              allBoundaries.push({ year: p.startYear, rate: p.zinssatz })
            }
          }
          const boundary = allBoundaries.find(b => b.year === displayYear || b.year === displayYear - 1)
          if (!boundary) return null
          const matchingPeriod = zinsbindungPeriods?.find(p => p.startYear <= displayYear && displayYear < (p.startYear + 100))
          const rateText = matchingPeriod ? `${matchingPeriod.zinssatz}%` : boundary.rate > 0 ? `${boundary.rate}%` : ''
          return (
            <div className="flex items-center gap-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Ab Jahr {boundary.year}: Anschlussfinanzierung{rateText ? ` mit ${rateText} Zinssatz` : ''} – Kreditrate ändert sich
              </p>
            </div>
          )
        })()}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-2 font-medium w-6" />
                <th className="text-left py-2 font-medium">Position</th>
                <th className="text-right py-2 font-medium">Monat</th>
                <th className="text-right py-2 font-medium">Jahr</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row) => {
                const isExcluded = excluded.has(row.id)
                const displayValue = isExcluded ? 0 : row.value
                const displayAnnual = isExcluded ? 0 : row.annual

                return (
                  <tr
                    key={row.id}
                    className={[
                      row.highlight ? 'bg-primary/5 border-t-2 border-primary/20' :
                      row.bold ? 'border-t' : '',
                      isExcluded ? 'opacity-30' : '',
                    ].join(' ')}
                  >
                    <td className="py-2 w-6">
                      {row.toggleable && (
                        <input
                          type="checkbox"
                          checked={!isExcluded}
                          onChange={() => toggleRow(row.id)}
                          className="h-3.5 w-3.5 rounded border-input accent-primary cursor-pointer"
                        />
                      )}
                    </td>
                    <td className={`py-2 ${row.bold ? 'font-semibold' : ''} ${row.dim ? 'text-muted-foreground' : ''} ${row.indent ? 'pl-4 text-xs' : ''} ${isExcluded ? 'line-through' : ''}`}>
                      {row.label}
                    </td>
                    <td className={`py-2 text-right tabular-nums ${row.bold ? 'font-semibold' : ''} ${displayValue < 0 ? 'text-destructive' : row.highlight ? 'text-primary font-bold' : ''}`}>
                      {formatEurDetail(displayValue)}
                    </td>
                    <td className={`py-2 text-right tabular-nums ${row.bold ? 'font-semibold' : ''} ${displayAnnual < 0 ? 'text-destructive' : row.highlight ? 'text-primary font-bold' : ''}`}>
                      {formatEur(displayAnnual)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {isModified && (
          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
            Hinweis: Steuer basiert auf vollständiger Berechnung. Modifizierte Subtotale dienen der Analyse.
          </p>
        )}

        {mode === 'pro' && !isEigennutzung && (
          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground space-y-1">
            <p>
              <ExplanationTooltip term="afa">AfA</ExplanationTooltip>: {formatEur(tax.afaBetragJahr)}/Jahr ({tax.afaRate}%)
              {tax.abschreibungBeweglichJahr > 0 && ` + ${formatEur(tax.abschreibungBeweglichJahr)} bewegl. Gegenstände`}
            </p>
            <p>Absetzbare Zinsen: {formatEur(tax.absetzbarerZinsanteilJahr)}/Jahr</p>
            <p>Zu versteuernde Einkünfte aus Vermietung: {formatEur(tax.zuVersteuerndeEinkuenfteImmobilie)}/Jahr</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
