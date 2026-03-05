import type { TaxResult, Project } from '@/calc/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ExplanationTooltip } from '@/components/shared/ExplanationTooltip'
import { formatEur, formatPercent } from '@/lib/format'

interface TaxBreakdownProps {
  tax: TaxResult
  project: Project
}

export function TaxBreakdown({ tax, project }: TaxBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Steuerliche Betrachtung</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <tbody>
            <tr className="text-muted-foreground">
              <td colSpan={2} className="py-2 text-xs font-semibold uppercase tracking-wider">Abschreibungen</td>
            </tr>
            <tr>
              <td className="py-1.5">
                <ExplanationTooltip term="afa">Gebäude-AfA</ExplanationTooltip>
                <span className="text-muted-foreground ml-1">({formatPercent(tax.afaRate)})</span>
              </td>
              <td className="py-1.5 text-right tabular-nums text-success">{formatEur(tax.afaBetragJahr)}/Jahr</td>
            </tr>
            {tax.abschreibungBeweglichJahr > 0 && (
              <tr>
                <td className="py-1.5">
                  <ExplanationTooltip term="beweglicheGegenstaende">Bewegliche Gegenstände</ExplanationTooltip>
                  <span className="text-muted-foreground ml-1">({project.afaBeweglichJahre} Jahre)</span>
                </td>
                <td className="py-1.5 text-right tabular-nums text-success">{formatEur(tax.abschreibungBeweglichJahr)}/Jahr</td>
              </tr>
            )}
            <tr>
              <td className="py-1.5">Absetzbare Zinsen</td>
              <td className="py-1.5 text-right tabular-nums text-success">{formatEur(tax.absetzbarerZinsanteilJahr)}/Jahr</td>
            </tr>

            <tr className="text-muted-foreground">
              <td colSpan={2} className="py-2 pt-4 text-xs font-semibold uppercase tracking-wider">Steuerlast</td>
            </tr>
            <tr>
              <td className="py-1.5">Zu verst. Einkünfte (Immobilie)</td>
              <td className={`py-1.5 text-right tabular-nums ${tax.zuVersteuerndeEinkuenfteImmobilie < 0 ? 'text-success' : ''}`}>
                {formatEur(tax.zuVersteuerndeEinkuenfteImmobilie)}/Jahr
              </td>
            </tr>
            <tr>
              <td className="py-1.5">
                Einkommensteuer-Differenz
                {project.useProgressiveTax && <span className="text-muted-foreground ml-1">(progressiv)</span>}
              </td>
              <td className={`py-1.5 text-right tabular-nums ${tax.steuerlicheAuswirkung < 0 ? 'text-success' : 'text-destructive'}`}>
                {formatEur(tax.steuerlicheAuswirkung)}/Jahr
              </td>
            </tr>
            <tr>
              <td className="py-1.5">Solidaritätszuschlag</td>
              <td className="py-1.5 text-right tabular-nums">{formatEur(tax.soliBetrag)}/Jahr</td>
            </tr>
            {project.kirchensteuer && (
              <tr>
                <td className="py-1.5">
                  <ExplanationTooltip term="kirchensteuer">Kirchensteuer</ExplanationTooltip>
                  <span className="text-muted-foreground ml-1">({project.kirchensteuersatz}%)</span>
                </td>
                <td className="py-1.5 text-right tabular-nums">{formatEur(tax.kirchensteuerBetrag)}/Jahr</td>
              </tr>
            )}
            <tr className="border-t font-semibold">
              <td className="py-2">Gesamte Steuerbelastung</td>
              <td className={`py-2 text-right tabular-nums ${tax.gesamtSteuerbelastungJahr < 0 ? 'text-success' : 'text-destructive'}`}>
                {formatEur(tax.gesamtSteuerbelastungJahr)}/Jahr
              </td>
            </tr>
            <tr className="text-muted-foreground">
              <td className="py-1.5 text-xs" colSpan={2}>
                {tax.gesamtSteuerbelastungJahr < 0
                  ? 'Negativer Wert = Steuerersparnis durch die Immobilie'
                  : 'Zusätzliche Steuerlast durch die Mieteinnahmen'
                }
              </td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
