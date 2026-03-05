import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '@/store/useProjectStore'
import { calculateAll } from '@/calc'
import { PortfolioSummaryCards } from '@/components/portfolio/PortfolioSummaryCards'
import { PortfolioProjectTable } from '@/components/portfolio/PortfolioProjectTable'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Briefcase, ArrowLeft } from 'lucide-react'
import type { CalculationResult } from '@/calc/types'

export function PortfolioPage() {
  const { projects, loaded, loadProjects } = useProjectStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loaded) loadProjects()
  }, [loaded, loadProjects])

  const portfolioProjects = useMemo(
    () => projects.filter((p) => p.isInPortfolio),
    [projects],
  )

  const results = useMemo(() => {
    const map = new Map<string, CalculationResult>()
    for (const p of portfolioProjects) {
      map.set(p.id, calculateAll(p))
    }
    return map
  }, [portfolioProjects])

  // Aggregated totals
  const totals = useMemo(() => {
    let mieteinnahmenMonat = 0
    let kreditrateMonat = 0
    let cashflowMonat = 0
    let gesamtVermoegenJ10 = 0

    for (const p of portfolioProjects) {
      const r = results.get(p.id)
      if (!r) continue
      mieteinnahmenMonat += r.rental.nettomieteinnahmen / 12
      kreditrateMonat += r.financing.monatlicheRate
      cashflowMonat += r.kpis.monatlichCashflowNachSteuer
      const y10 = r.projection.find((y) => y.year === 10)
      if (y10) gesamtVermoegenJ10 += y10.eigenkapitalImObjekt
    }

    return { mieteinnahmenMonat, kreditrateMonat, cashflowMonat, gesamtVermoegenJ10 }
  }, [portfolioProjects, results])

  if (!loaded) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Portfolio</h1>
        </div>
        <span className="text-sm text-muted-foreground">
          {portfolioProjects.length} {portfolioProjects.length === 1 ? 'Projekt' : 'Projekte'}
        </span>
      </div>

      {portfolioProjects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Briefcase className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground">
              Noch keine Projekte im Portfolio. Klicke in einem Projekt auf "Zum Portfolio hinzufügen".
            </p>
            <Button variant="outline" onClick={() => navigate('/projects')}>
              Zu den Projekten
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <PortfolioSummaryCards totals={totals} />
          <PortfolioProjectTable
            projects={portfolioProjects}
            results={results}
            onProjectClick={(id) => navigate(`/projects/${id}`)}
          />
        </>
      )}
    </div>
  )
}
