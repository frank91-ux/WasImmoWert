import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useProjectStore } from '@/store/useProjectStore'
import { useUiStore } from '@/store/useUiStore'
import { useCalculation } from '@/hooks/useCalculation'
import { calculateAll } from '@/calc'
import { calculateRentabilitaet } from '@/calc/rentabilitaet'
import { RentabilitaetBadge } from '@/components/results/RentabilitaetBadge'
import { ProjectTable } from '@/components/dashboard/ProjectTable'
import { ProjectFilterBar, type ViewMode, type FilterPreset } from '@/components/dashboard/ProjectFilterBar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Plus, Building2, Trash2, Copy, ArrowRight,
  TrendingUp, TrendingDown, DollarSign, BarChart3, Users,
  MapPin, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import { formatEur, formatPercent } from '@/lib/format'
import type { Project } from '@/calc/types'

/* ─── KPI Card ─── */
function KpiCard({
  icon: Icon,
  iconGradient,
  label,
  value,
  sublabel,
  trend,
  trendLabel,
}: {
  icon: React.ElementType
  iconGradient: string
  label: string
  value: string
  sublabel: string
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${iconGradient}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          {trend && trendLabel && (
            <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
              trend === 'up' ? 'badge-green' : trend === 'down' ? 'badge-red' : 'badge-yellow'
            }`}>
              {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : trend === 'down' ? <ArrowDownRight className="h-3 w-3" /> : null}
              {trendLabel}
            </span>
          )}
        </div>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <div className="text-sm font-medium text-foreground/80 mt-0.5">{label}</div>
        <div className="text-xs text-muted-foreground">{sublabel}</div>
      </CardContent>
    </Card>
  )
}

/* ─── Project Card (Grid) ─── */
function ProjectCard({ project }: { project: Project }) {
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
    <Card className="group hover:shadow-lg transition-all hover:border-primary/30">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4 text-white" />
            </div>
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
            <div className={`font-semibold tabular-nums ${cashflow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatEur(cashflow)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">EK-Rendite</div>
            <div className="font-semibold tabular-nums">{formatPercent(result.kpis.eigenkapitalrendite)}</div>
          </div>
        </div>

        <div className="flex items-center gap-1 pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-primary hover:text-primary"
            onClick={() => navigate(`/projects/${project.id}`)}
          >
            Details <ArrowRight className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => duplicateProject(project.id)}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => deleteProject(project.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/* ─── Dashboard Page ─── */
export function DashboardPage() {
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

  const handleNewProject = () => {
    navigate('/projects/new')
  }

  // Calculate aggregate KPIs
  const aggregateKpis = useMemo(() => {
    if (projects.length === 0) return null
    let totalCashflow = 0
    let totalRendite = 0
    let totalKaufpreis = 0
    let count = 0

    projects.forEach((p) => {
      try {
        const r = calculateAll(p)
        totalCashflow += r.kpis.monatlichCashflowNachSteuer
        totalRendite += r.kpis.bruttomietrendite
        totalKaufpreis += p.kaufpreis
        count++
      } catch { /* skip */ }
    })

    return {
      count,
      totalKaufpreis,
      avgCashflow: count > 0 ? totalCashflow / count : 0,
      totalCashflow,
      avgRendite: count > 0 ? totalRendite / count : 0,
    }
  }, [projects])

  const filteredProjects = useMemo(() => {
    let filtered = projects

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
  }, [projects, search, filter])

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
      {/* Hero Banner */}
      <div className="gradient-hero dark:gradient-hero-dark rounded-2xl p-6 lg:p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm mb-1">Willkommen zurück</p>
            <h2 className="text-2xl lg:text-3xl font-bold mb-2">
              Was ist Ihr Portfolio heute wert?
            </h2>
            {aggregateKpis ? (
              <p className="text-white/80 text-sm">
                Gesamtportfoliowert: <span className="font-semibold text-white">{formatEur(aggregateKpis.totalKaufpreis)}</span>
                {' · '}Letztes Update: {new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            ) : (
              <p className="text-white/80 text-sm">
                Starten Sie Ihre erste Immobilienbewertung
              </p>
            )}
          </div>
          <Button
            onClick={handleNewProject}
            className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm hidden sm:flex"
          >
            <Plus className="h-4 w-4" />
            Bewertung starten
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {aggregateKpis && (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
        >
          <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
            <KpiCard
              icon={Building2}
              iconGradient="bg-gradient-to-br from-emerald-400 to-emerald-600"
              value={String(aggregateKpis.count)}
              label="Immobilien Gesamt"
              sublabel={`${aggregateKpis.count} Objekt${aggregateKpis.count !== 1 ? 'e' : ''} analysiert`}
              trend="up"
              trendLabel={`+${aggregateKpis.count} gesamt`}
            />
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
            <KpiCard
              icon={DollarSign}
              iconGradient="bg-gradient-to-br from-amber-400 to-orange-500"
              value={formatEur(aggregateKpis.totalCashflow)}
              label="Monatlicher Cashflow"
              sublabel="Netto nach Kosten"
              trend={aggregateKpis.totalCashflow >= 0 ? 'up' : 'down'}
              trendLabel={aggregateKpis.totalCashflow >= 0 ? 'positiv' : 'negativ'}
            />
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
            <KpiCard
              icon={TrendingUp}
              iconGradient="bg-gradient-to-br from-indigo-400 to-indigo-600"
              value={formatPercent(aggregateKpis.avgRendite)}
              label="Ø Rendite"
              sublabel="Über alle Objekte"
              trend={aggregateKpis.avgRendite >= 4 ? 'up' : aggregateKpis.avgRendite >= 2 ? 'neutral' : 'down'}
              trendLabel={`Ø ${formatPercent(aggregateKpis.avgRendite)}`}
            />
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
            <KpiCard
              icon={BarChart3}
              iconGradient="bg-gradient-to-br from-pink-400 to-rose-600"
              value={formatEur(aggregateKpis.avgCashflow)}
              label="Ø Cashflow/Objekt"
              sublabel="Pro Monat"
              trend={aggregateKpis.avgCashflow >= 0 ? 'up' : 'down'}
              trendLabel={aggregateKpis.avgCashflow >= 0 ? 'positiv' : 'negativ'}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Empty State */}
      {projects.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center mb-5">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Noch keine Projekte</h3>
            <p className="text-muted-foreground text-sm text-center max-w-md mb-6">
              Erstellen Sie ein neues Projekt, um die Rentabilität einer Immobilie zu berechnen.
              Geben Sie einfach Kaufpreis, Adresse und Quadratmeter ein.
            </p>
            <Button onClick={handleNewProject} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0">
              <Plus className="h-4 w-4" />
              Erstes Projekt anlegen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filter Bar */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Immobilien Portfolio</h3>
              <p className="text-sm text-muted-foreground">Übersicht aller Objekte im Portfolio</p>
            </div>
            <Button onClick={handleNewProject} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0">
              <Plus className="h-4 w-4" />
              Objekt hinzufügen
            </Button>
          </div>

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
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredProjects.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
              {selectedIds.size >= 2 && (
                <div className="flex justify-center">
                  <Button onClick={handleCompare}>
                    {selectedIds.size} Projekte vergleichen
                  </Button>
                </div>
              )}
            </>
          )}

          {filteredProjects.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Keine Projekte gefunden für diese Filterkriterien.
            </div>
          )}
        </>
      )}
    </div>
  )
}
