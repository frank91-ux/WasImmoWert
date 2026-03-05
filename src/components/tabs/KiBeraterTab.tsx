import { useCallback, useMemo } from 'react'
import type { Project, CalculationResult } from '@/calc/types'
import { useSimulationStore } from '@/store/useSimulationStore'
import { calculateAll } from '@/calc'
import { MonthlyCashflowChart } from '@/components/charts/MonthlyCashflowChart'
import { WertentwicklungChart } from '@/components/charts/WertentwicklungChart'
import { AiChat } from '@/components/ai/AiChat'
import { Button } from '@/components/ui/button'
import { Zap, RotateCcw, Save } from 'lucide-react'
import { formatEur } from '@/lib/format'

interface KiBeraterTabProps {
  project: Project
  result: CalculationResult
  onChange: (updates: Partial<Project>) => void
}

// Human-readable labels for parameter names
const PARAM_LABELS: Record<string, string> = {
  kaufpreis: 'Kaufpreis',
  eigenkapital: 'Eigenkapital',
  zinssatz: 'Zinssatz',
  tilgung: 'Tilgung',
  monatsmieteKalt: 'Kaltmiete',
  sondertilgung: 'Sondertilgung',
  wertsteigerung: 'Wertsteigerung',
  persoenlicherSteuersatz: 'Steuersatz',
  mietausfallwagnis: 'Mietausfallwagnis',
  instandhaltungProQm: 'Instandhaltung',
  maklerProvision: 'Maklerprovision',
  nebenkostenProQm: 'Nebenkosten',
  umlagefaehigAnteil: 'Umlagefähig',
  ersparteMiete: 'Ersparte Miete',
  verwaltungProEinheit: 'Verwaltung',
  nichtUmlegbareNebenkosten: 'Nicht umlegb. NK',
}

function formatParamValue(key: string, value: number): string {
  const pctKeys = ['zinssatz', 'tilgung', 'wertsteigerung', 'persoenlicherSteuersatz', 'mietausfallwagnis', 'maklerProvision', 'umlagefaehigAnteil']
  if (pctKeys.includes(key)) return `${value}%`
  if (['instandhaltungProQm', 'nebenkostenProQm'].includes(key)) return `${value} €/m²`
  return formatEur(value)
}

export function KiBeraterTab({ project, result, onChange }: KiBeraterTabProps) {
  const { overrides, setOverride, resetOverrides } = useSimulationStore()
  const overrideKeys = Object.keys(overrides)
  const hasOverrides = overrideKeys.length > 0

  // Create simulated project and recalculate
  const simulatedProject = useMemo(() => {
    if (!hasOverrides) return project
    return { ...project, ...overrides }
  }, [project, overrides, hasOverrides])

  const simulatedResult = useMemo(() => {
    if (!hasOverrides) return result
    return calculateAll(simulatedProject)
  }, [simulatedProject, hasOverrides, result])

  // Charts show simulated data when active, otherwise original
  const chartResult = hasOverrides ? simulatedResult : result

  // Handle AI parameter changes
  const handleParameterChange = useCallback((changes: Record<string, number>) => {
    for (const [key, value] of Object.entries(changes)) {
      setOverride(key as keyof typeof overrides, value as never)
    }
  }, [setOverride])

  // Apply simulation to project permanently
  const handleApply = () => {
    const updates: Partial<Project> = {}
    for (const [key, value] of Object.entries(overrides)) {
      ;(updates as Record<string, unknown>)[key] = value
    }
    onChange(updates)
    resetOverrides()
  }

  return (
    <div className="space-y-4">
      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <MonthlyCashflowChart result={chartResult} nutzungsart={project.nutzungsart} />
        <WertentwicklungChart
          projection={chartResult.projection}
          baseProjection={hasOverrides ? result.projection : undefined}
        />
      </div>

      {/* Simulation status bar */}
      {hasOverrides && (
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
          <Zap className="h-4 w-4 text-amber-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Simulation aktiv
            </span>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
              {overrideKeys.map((key) => {
                const val = (overrides as Record<string, number>)[key]
                const origVal = (project as Record<string, number>)[key]
                return (
                  <span key={key} className="text-xs text-amber-700 dark:text-amber-300">
                    {PARAM_LABELS[key] || key}: {formatParamValue(key, origVal)} → <strong>{formatParamValue(key, val)}</strong>
                  </span>
                )
              })}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={resetOverrides} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Zurücksetzen
            </Button>
            <Button size="sm" onClick={handleApply} className="gap-1.5">
              <Save className="h-3.5 w-3.5" />
              Übernehmen
            </Button>
          </div>
        </div>
      )}

      {/* AI Chat */}
      <AiChat
        project={project}
        result={result}
        onParameterChange={handleParameterChange}
      />
    </div>
  )
}
