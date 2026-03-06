import type { KaufnebenkostenResult } from '@/calc/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ExplanationTooltip } from '@/components/shared/ExplanationTooltip'
import { formatEur, formatPercent } from '@/lib/format'

interface KaufnebenkostenBreakdownProps {
  result: KaufnebenkostenResult
  kaufpreis: number
}

export function KaufnebenkostenBreakdown({ result, kaufpreis }: KaufnebenkostenBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Kaufnebenkosten</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <tbody>
            <tr>
              <td className="py-1.5">Kaufpreis</td>
              <td className="py-1.5 text-right tabular-nums font-medium">{formatEur(kaufpreis)}</td>
            </tr>
            <tr>
              <td className="py-1.5">
                <ExplanationTooltip term="grunderwerbsteuer">Grunderwerbsteuer</ExplanationTooltip>
                <span className="text-muted-foreground ml-1">({formatPercent(result.grunderwerbsteuerSatz)})</span>
              </td>
              <td className="py-1.5 text-right tabular-nums">{formatEur(result.grunderwerbsteuer)}</td>
            </tr>
            <tr>
              <td className="py-1.5">
                <ExplanationTooltip term="notarUndGrundbuch">Notar & Grundbuch</ExplanationTooltip>
                <span className="text-muted-foreground ml-1">
                  ({kaufpreis > 0 ? ((result.notarkosten / kaufpreis) * 100).toFixed(1) : '1,5'} % — typ. 1,5–2,0 %)
                </span>
              </td>
              <td className="py-1.5 text-right tabular-nums">{formatEur(result.notarkosten)}</td>
            </tr>
            <tr>
              <td className="py-1.5">
                <ExplanationTooltip term="maklerProvision">Makler</ExplanationTooltip>
                <span className="text-muted-foreground ml-1">
                  ({kaufpreis > 0 ? ((result.maklerkosten / kaufpreis) * 100).toFixed(2) : '0'} % — typ. 3,57–7,14 %)
                </span>
              </td>
              <td className="py-1.5 text-right tabular-nums">{formatEur(result.maklerkosten)}</td>
            </tr>
            <tr className="border-t font-semibold">
              <td className="py-2">Nebenkosten gesamt</td>
              <td className="py-2 text-right tabular-nums">{formatEur(result.kaufnebenkostenGesamt)}</td>
            </tr>
            <tr className="border-t-2 font-bold text-primary">
              <td className="py-2">Gesamtkosten</td>
              <td className="py-2 text-right tabular-nums">{formatEur(result.gesamtkosten)}</td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
