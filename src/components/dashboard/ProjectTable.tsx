import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Project, CalculationResult } from '@/calc/types'
import { calculateAll } from '@/calc'
import { calculateRentabilitaet } from '@/calc/rentabilitaet'
import { RentabilitaetBadge } from '@/components/results/RentabilitaetBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatEur, formatPercent } from '@/lib/format'
import { berechneMarktvergleich } from '@/data/marktdaten'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

type SortKey = 'name' | 'kaufpreis' | 'cashflow' | 'bruttomietrendite' | 'eigenkapitalrendite' | 'score'
type SortDir = 'asc' | 'desc'

interface ProjectWithResult {
  project: Project
  result: CalculationResult
  score: ReturnType<typeof calculateRentabilitaet>
}

interface ProjectTableProps {
  projects: Project[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onCompare: () => void
}

export function ProjectTable({ projects, selectedIds, onToggleSelect, onCompare }: ProjectTableProps) {
  const navigate = useNavigate()
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const projectsWithResults = useMemo(() => {
    return projects.map((project) => {
      const result = calculateAll(project)
      const preisProQm = project.wohnflaeche > 0 ? project.kaufpreis / project.wohnflaeche : 0
      const mieteProQm = project.wohnflaeche > 0 ? project.monatsmieteKalt / project.wohnflaeche : 0
      const markt = berechneMarktvergleich(preisProQm, mieteProQm, project.lat, project.lng)
      const score = calculateRentabilitaet(result.kpis, project.nutzungsart, project, markt)
      return { project, result, score }
    })
  }, [projects])

  const sorted = useMemo(() => {
    const arr = [...projectsWithResults]
    arr.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name': cmp = a.project.name.localeCompare(b.project.name); break
        case 'kaufpreis': cmp = a.project.kaufpreis - b.project.kaufpreis; break
        case 'cashflow': cmp = a.result.kpis.monatlichCashflowNachSteuer - b.result.kpis.monatlichCashflowNachSteuer; break
        case 'bruttomietrendite': cmp = a.result.kpis.bruttomietrendite - b.result.kpis.bruttomietrendite; break
        case 'eigenkapitalrendite': cmp = a.result.kpis.eigenkapitalrendite - b.result.kpis.eigenkapitalrendite; break
        case 'score': cmp = a.score.score - b.score.score; break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [projectsWithResults, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'name' ? 'asc' : 'desc')
    }
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 opacity-40" />
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="p-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === projects.length && projects.length > 0}
                    onChange={() => {
                      if (selectedIds.size === projects.length) {
                        projects.forEach((p) => onToggleSelect(p.id))
                      } else {
                        projects.filter((p) => !selectedIds.has(p.id)).forEach((p) => onToggleSelect(p.id))
                      }
                    }}
                    className="h-4 w-4 accent-primary"
                  />
                </th>
                <ThCell label="Name" col="name" onSort={handleSort}><SortIcon col="name" /></ThCell>
                <ThCell label="Kaufpreis" col="kaufpreis" onSort={handleSort} right><SortIcon col="kaufpreis" /></ThCell>
                <ThCell label="Cashflow/Mon" col="cashflow" onSort={handleSort} right><SortIcon col="cashflow" /></ThCell>
                <ThCell label="Bruttorendite" col="bruttomietrendite" onSort={handleSort} right><SortIcon col="bruttomietrendite" /></ThCell>
                <ThCell label="EK-Rendite" col="eigenkapitalrendite" onSort={handleSort} right><SortIcon col="eigenkapitalrendite" /></ThCell>
                <ThCell label="Note" col="score" onSort={handleSort} right><SortIcon col="score" /></ThCell>
              </tr>
            </thead>
            <tbody>
              {sorted.map(({ project, result, score }) => (
                <tr
                  key={project.id}
                  className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(project.id)}
                      onChange={() => onToggleSelect(project.id)}
                      className="h-4 w-4 accent-primary"
                    />
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{project.name}</div>
                    {project.address && <div className="text-xs text-muted-foreground truncate max-w-48">{project.address}</div>}
                  </td>
                  <td className="p-3 text-right tabular-nums">{formatEur(project.kaufpreis)}</td>
                  <td className={`p-3 text-right tabular-nums ${result.kpis.monatlichCashflowNachSteuer >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatEur(result.kpis.monatlichCashflowNachSteuer)}
                  </td>
                  <td className="p-3 text-right tabular-nums">{formatPercent(result.kpis.bruttomietrendite)}</td>
                  <td className="p-3 text-right tabular-nums">{formatPercent(result.kpis.eigenkapitalrendite)}</td>
                  <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <RentabilitaetBadge score={score} compact />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedIds.size >= 2 && (
          <div className="p-3 border-t bg-muted/30 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} Projekte ausgewählt
            </span>
            <Button size="sm" onClick={onCompare}>
              Vergleich starten
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ThCell({ label, col, onSort, children, right }: {
  label: string; col: SortKey; onSort: (col: SortKey) => void; children: React.ReactNode; right?: boolean
}) {
  return (
    <th className={`p-3 font-medium ${right ? 'text-right' : 'text-left'}`}>
      <button
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
        onClick={() => onSort(col)}
      >
        {label}
        {children}
      </button>
    </th>
  )
}
