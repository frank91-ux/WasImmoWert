import type { Project, CalculationResult } from '@/calc/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatEur } from '@/lib/format'
import { Building2, ChevronRight } from 'lucide-react'

interface PortfolioProjectTableProps {
  projects: Project[]
  results: Map<string, CalculationResult>
  onProjectClick: (id: string) => void
}

export function PortfolioProjectTable({ projects, results, onProjectClick }: PortfolioProjectTableProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Portfolio-Projekte</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-2 font-medium">Projekt</th>
                <th className="text-right py-2 font-medium">Kaufpreis</th>
                <th className="text-right py-2 font-medium">Miete/Mon</th>
                <th className="text-right py-2 font-medium">Kreditrate</th>
                <th className="text-right py-2 font-medium">Cashflow</th>
                <th className="text-right py-2 font-medium">EK-Rendite</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const r = results.get(p.id)
                if (!r) return null
                const cashflow = r.kpis.monatlichCashflowNachSteuer
                return (
                  <tr
                    key={p.id}
                    className="border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => onProjectClick(p.id)}
                  >
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{p.name}</p>
                          {p.address && (
                            <p className="text-xs text-muted-foreground truncate">{p.address}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 text-right tabular-nums">{formatEur(p.kaufpreis)}</td>
                    <td className="py-2.5 text-right tabular-nums">{formatEur(r.rental.nettomieteinnahmen / 12)}</td>
                    <td className="py-2.5 text-right tabular-nums">{formatEur(r.financing.monatlicheRate)}</td>
                    <td className={`py-2.5 text-right tabular-nums font-medium ${cashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatEur(cashflow)}/Mon
                    </td>
                    <td className="py-2.5 text-right tabular-nums">
                      {r.kpis.eigenkapitalrendite.toFixed(1)}%
                    </td>
                    <td className="py-2.5 text-right">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {/* Totals row */}
            <tfoot>
              <tr className="border-t-2 font-semibold">
                <td className="py-2.5">Gesamt</td>
                <td className="py-2.5 text-right tabular-nums">
                  {formatEur(projects.reduce((s, p) => s + p.kaufpreis, 0))}
                </td>
                <td className="py-2.5 text-right tabular-nums">
                  {formatEur(projects.reduce((s, p) => s + (results.get(p.id)?.rental.nettomieteinnahmen ?? 0) / 12, 0))}
                </td>
                <td className="py-2.5 text-right tabular-nums">
                  {formatEur(projects.reduce((s, p) => s + (results.get(p.id)?.financing.monatlicheRate ?? 0), 0))}
                </td>
                <td className={`py-2.5 text-right tabular-nums ${projects.reduce((s, p) => s + (results.get(p.id)?.kpis.monatlichCashflowNachSteuer ?? 0), 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatEur(projects.reduce((s, p) => s + (results.get(p.id)?.kpis.monatlichCashflowNachSteuer ?? 0), 0))}/Mon
                </td>
                <td className="py-2.5" />
                <td className="py-2.5" />
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
