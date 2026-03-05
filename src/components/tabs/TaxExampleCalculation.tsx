import type { TaxResult, RentalResult, OperatingCostResult, FinancingResult } from '@/calc/types'
import { formatEur } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TaxExampleCalculationProps {
  tax: TaxResult
  rental: RentalResult
  operatingCosts: OperatingCostResult
  financing: FinancingResult
}

interface LineItem {
  label: string
  value: number
  bold?: boolean
  highlight?: boolean
  indent?: boolean
}

export function TaxExampleCalculation({ tax, rental, operatingCosts }: TaxExampleCalculationProps) {
  const lines: LineItem[] = [
    { label: 'Nettomieteinnahmen', value: rental.nettomieteinnahmen },
    { label: 'Betriebskosten', value: -operatingCosts.betriebskostenGesamt },
    { label: 'Absetzbare Zinsen', value: -tax.absetzbarerZinsanteilJahr },
    { label: 'Gebäude-AfA', value: -tax.afaBetragJahr },
  ]

  if (tax.abschreibungBeweglichJahr > 0) {
    lines.push({ label: 'Beweg. Gegenstände', value: -tax.abschreibungBeweglichJahr })
  }

  lines.push({
    label: 'Zu verst. Einkünfte',
    value: tax.zuVersteuerndeEinkuenfteImmobilie,
    bold: true,
  })

  const isNegative = tax.zuVersteuerndeEinkuenfteImmobilie < 0
  const steuerEffekt = tax.gesamtSteuerbelastungJahr

  lines.push({
    label: isNegative ? 'Steuerersparnis' : 'Zusätzliche Steuerlast',
    value: steuerEffekt,
    bold: true,
    highlight: true,
  })

  if (tax.soliBetrag !== 0) {
    lines.push({ label: 'davon Soli', value: tax.soliBetrag, indent: true })
  }
  if (tax.kirchensteuerBetrag !== 0) {
    lines.push({ label: 'davon Kirchensteuer', value: tax.kirchensteuerBetrag, indent: true })
  }

  const monatlich = steuerEffekt / 12

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Steuerliche Beispielrechnung (Jahr 1)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-2 font-medium">Position</th>
                <th className="text-right py-2 font-medium">pro Jahr</th>
                <th className="text-right py-2 font-medium">pro Monat</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr
                  key={line.label}
                  className={[
                    line.bold ? 'border-t font-semibold' : '',
                    line.highlight ? 'bg-primary/5' : '',
                  ].join(' ')}
                >
                  <td className={`py-1.5 ${line.indent ? 'pl-4 text-xs text-muted-foreground' : ''}`}>
                    {line.label}
                  </td>
                  <td className={`py-1.5 text-right tabular-nums ${line.value < 0 ? 'text-destructive' : ''} ${line.highlight ? 'text-primary font-bold' : ''}`}>
                    {formatEur(line.value)}
                  </td>
                  <td className={`py-1.5 text-right tabular-nums text-muted-foreground ${line.indent ? 'text-xs' : ''}`}>
                    {formatEur(line.value / 12)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 pt-3 border-t text-sm text-muted-foreground">
          {isNegative ? (
            <p>
              Durch Absetzen von Zinsen, AfA{tax.abschreibungBeweglichJahr > 0 ? ' und beweglichen Gegenständen' : ''} wird die steuerpflichtige Mieteinnahme reduziert.
              {' '}Es entsteht eine <span className="text-success font-medium">Steuerersparnis von {formatEur(Math.abs(steuerEffekt))}/Jahr ({formatEur(Math.abs(monatlich))}/Mon)</span>.
            </p>
          ) : (
            <p>
              Die Mieteinnahmen übersteigen die absetzbaren Kosten.
              {' '}Es entsteht eine <span className="text-destructive font-medium">zusätzliche Steuerlast von {formatEur(steuerEffekt)}/Jahr ({formatEur(monatlich)}/Mon)</span>.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
