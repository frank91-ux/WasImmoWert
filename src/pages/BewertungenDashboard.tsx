import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '@/store/useProjectStore'
import { useUiStore } from '@/store/useUiStore'
import { calculateAll } from '@/calc'
import { calculateRentabilitaet } from '@/calc/rentabilitaet'
import { RentabilitaetBadge } from '@/components/results/RentabilitaetBadge'
import { ProjectTable } from '@/components/dashboard/ProjectTable'
import { ProjectFilterBar, type ViewMode, type FilterPreset } from '@/components/dashboard/ProjectFilterBar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Plus, Search, Trash2, Copy, ArrowRight,
  TrendingUp, DollarSign, BarChart3, MapPin, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import { formatEur, formatPercent } from '@/lib/format'
import { useCalculation } from '@/hooks/useCalculation'
import type { Project } from '@/calc/types'

/* ─── KPI Card (compact) ─── */
function KpiCard({
  icon: Icon,
  iconGradient,
  label,
  value,
  sublabel,
}: {
  icon: React.ElementType
  iconGradient: string
  label: string
  value: string
  sublabel: string
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${iconGradient}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold tabular-nums">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* ─── Project Card ─── */
function ProjectCard({ project, selected, onToggle }: { project: Project; selected: boolean; onToggle: () => void }) {
  const navigate = useNavigate()
  const { deleteProject, duplicateProject } = useProjectStore()
  const result = useCalculation(project)

  const rentabilitaet = useMemo(
    () => result ? calculateRentabilitaet(result.kpis, project.nutzungsart, project) : null,
    [result, project.nutzungsart, project]
  )

  if (!result || !rentabilitaet) return null

  const cashflow = result.kpis.monatlichCashflowNachSteuer

  return (
    <Card className={`group hover:shadow-lg transition-all ${selected ? 'border-primary ring-1 ring-primary/30' : 'hover:border-primary/30'}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <label className="flex items-center mt-1">
              <input
                type="checkbox"
                checked={selected}
                onChange={onToggle}
                className="h-4 w-4 rounded border-input accent-primary"
              />
            </label>
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{project.name}</h3>
              {project.address && (
                <p className="text-xs text-muted-foreground truncate">{project.address}</p>
              )}
            </div>
          </div>
          <RentabilitaetBadge score={rentabilitaet} compact />
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
          <div>
            <div className="text-xs text-muted-foreground">Kaufpreis</div>
            <div className="font-semibold tabular-nums">{formatEur(project.kaufpreis)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Rendite</div>
            <div className="font-semibold tabular-nums">{formatPercent(result.kpis.bruttomietrendite)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Cashflow/Mon</div>
            <div className={`font-semibold tabular-nums ${cashflow >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {formatEur(cashflow)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">EK-Rendite</div>
            <div className="font-semibold tabular-nums">{formatPercent(result.kpis.eigenkapitalrendite)}</div>
          </div>
        </div>

        <div className="flex items-center gap-1 pt-3 border-t">
          <Button variant="ghost" size="sm" className="flex-1 text-primary hover:text-primary" onClick={() => navigate(`/projects/${project.id}`)}>
            Details <ArrowRight className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicateProject(project.id)}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteProject(project.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/* ─── Bewertungen Dashboard ─── */
export function BewertungenDashboard() {
  const { projects, loaded, loadProjects } = useProjectStore()
  const navigate = useNavigate()
  const { dashboardView, setDashboardView } = useUiStore()
  const view: ViewMode = dashboardView === 'list' ? 'table' : 'grid'
  const handleViewChange = (v: ViewMode) => setDashboardView(v === 'table' ? 'list' : 'grid')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterPreset>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!loaded) loadProjects()
  }, [loaded, loadProjects])

  // Only non-portfolio projects
  const bewertungen = useMemo(
    () => projects.filter((p) => !p.isInPortfolio),
    [projects]
  )

  const aggregateKpis = useMemo(() => {
    if (bewertungen.length === 0) return null
    let totalCashflow = 0
    let totalRendite = 0
    let bestCashflow = -Infinity
    let bestName = ''
    let totalKaufpreisfaktor = 0
    let count = 0

    bewertungen.forEach((p) => {
      try {
        const r = calculateAll(p)
        totalCashflow += r.kpis.monatlichCashflowNachSteuer
        totalRendite += r.kpis.bruttomietrendite
        const kpf = r.kpis.kaufpreisfaktor
        totalKaufpreisfaktor += isFinite(kpf) ? kpf : 0
        if (r.kpis.monatlichCashflowNachSteuer > bestCashflow) {
          bestCashflow = r.kpis.monatlichCashflowNachSteuer
          bestName = p.name
        }
        count++
      } catch { /* skip */ }
    })

    return {
      count,
      avgRendite: count > 0 ? totalRendite / count : 0,
      bestCashflow,
      bestName,
      avgKaufpreisfaktor: count > 0 ? totalKaufpreisfaktor / count : 0,
    }
  }, [bewertungen])

  const filteredProjects = useMemo(() => {
    let filtered = bewertungen
    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.address && p.address.toLowerCase().includes(q))
      )
    }
    if (filter !== 'all') {
      filtered = filtered.filter((p) => {
        if (filter === 'eigennutzung') return p.nutzungsart === 'eigennutzung'
        if (filter === 'vermietung') return p.nutzungsart === 'vermietung'
        const result = calculateAll(p)
        if (filter === 'positive-cashflow') return result.kpis.monatlichCashflowNachSteuer >= 0
        if (filter === 'rendite-4') return result.kpis.bruttomietrendite >= 4
        return true
      })
    }
    return filtered
  }, [bewertungen, search, filter])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCompare = () => {
    const ids = Array.from(selectedIds).join(',')
    navigate(`/compare?ids=${ids}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Meine Bewertungen</h1>
            <p className="text-sm text-muted-foreground">
              {bewertungen.length} Objekt{bewertungen.length !== 1 ? 'e' : ''} in Prüfung
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate('/projects/new')}
          className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white border-0"
        >
          <Plus className="h-4 w-4" />
          Neue Bewertung
        </Button>
      </div>

      {/* KPIs */}
      {aggregateKpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            icon={Search}
            iconGradient="bg-gradient-to-br from-teal-400 to-teal-600"
            value={String(aggregateKpis.count)}
            label="Objekte"
            sublabel="in Bewertung"
          />
          <KpiCard
            icon={TrendingUp}
            iconGradient="bg-gradient-to-br from-emerald-400 to-emerald-600"
            value={formatPercent(aggregateKpis.avgRendite)}
            label="Ø Rendite"
            sublabel="Bruttomietrendite"
          />
          <KpiCard
            icon={DollarSign}
            iconGradient="bg-gradient-to-br from-amber-400 to-orange-500"
            value={formatEur(aggregateKpis.bestCashflow)}
            label="Bester Cashflow"
            sublabel={aggregateKpis.bestName || '—'}
          />
          <KpiCard
            icon={BarChart3}
            iconGradient="bg-gradient-to-br from-pink-400 to-rose-600"
            value={aggregateKpis.avgKaufpreisfaktor.toFixed(1) + 'x'}
            label="Ø Kaufpreisfaktor"
            sublabel="Jahreskaltmieten"
          />
        </div>
      )}

      {/* Projects */}
      {bewertungen.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Search className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Keine Bewertungen</h3>
            <p className="text-muted-foreground text-sm text-center max-w-md mb-6">
              Erstellen Sie eine neue Bewertung, um eine Immobilie zu analysieren.
            </p>
            <Button onClick={() => navigate('/projects/new')} className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white border-0">
              <Plus className="h-4 w-4" />
              Erste Bewertung starten
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <ProjectFilterBar
            search={search}
            onSearchChange={setSearch}
            filter={filter}
            onFilterChange={setFilter}
            view={view}
            onViewChange={handleViewChange}
          />

          {view === 'table' ? (
            <ProjectTable
              projects={filteredProjects}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onCompare={handleCompare}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProjects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  selected={selectedIds.has(p.id)}
                  onToggle={() => toggleSelect(p.id)}
                />
              ))}
            </div>
          )}

          {selectedIds.size >= 2 && (
            <div className="flex justify-center">
              <Button onClick={handleCompare}>
                {selectedIds.size} Objekte vergleichen
              </Button>
            </div>
          )}

          {filteredProjects.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Keine Bewertungen für diese Filterkriterien gefunden.
            </div>
          )}
        </>
      )}
    </div>
  )
}
