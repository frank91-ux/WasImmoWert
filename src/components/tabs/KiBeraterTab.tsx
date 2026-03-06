import { useCallback, useMemo, useState } from 'react'
import type { Project, CalculationResult, ScenarioAdjustment } from '@/calc/types'
import { useSimulationStore } from '@/store/useSimulationStore'
import { calculateAll } from '@/calc'
import { applyScenarioToProjection } from '@/calc/scenario'
import { MonthlyCashflowChart } from '@/components/charts/MonthlyCashflowChart'
import { WertentwicklungChart } from '@/components/charts/WertentwicklungChart'
import { AiChat } from '@/components/ai/AiChat'
import { SuggestionChips } from '@/components/ai/SuggestionChips'
import { useAiChatStore } from '@/store/useAiChatStore'
import { useEtvStore } from '@/store/useEtvStore'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Zap, RotateCcw, Save, ChevronDown, X, TrendingUp, Percent, Activity, BarChart3 } from 'lucide-react'
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

/* ─── Compact KPI Row ─── */
function KpiMiniRow({ result, scenarioResult }: { result: CalculationResult; scenarioResult?: CalculationResult }) {
  const display = scenarioResult || result
  const hasScenario = !!scenarioResult

  const kpis = [
    {
      icon: TrendingUp,
      label: 'Cashflow',
      value: `${display.kpis.monatlichCashflowNachSteuer >= 0 ? '+' : ''}${Math.round(display.kpis.monatlichCashflowNachSteuer)} €`,
      color: display.kpis.monatlichCashflowNachSteuer >= 0 ? 'text-emerald-600' : 'text-red-500',
    },
    {
      icon: Percent,
      label: 'EK-Rendite',
      value: `${display.kpis.eigenkapitalrendite.toFixed(1)}%`,
      color: display.kpis.eigenkapitalrendite >= 0 ? 'text-teal-600' : 'text-red-500',
    },
    {
      icon: Activity,
      label: 'DSCR',
      value: display.kpis.dscr.toFixed(2),
      color: display.kpis.dscr >= 1.2 ? 'text-emerald-600' : display.kpis.dscr >= 1.0 ? 'text-amber-600' : 'text-red-500',
    },
    {
      icon: BarChart3,
      label: 'Netto-Rendite',
      value: `${display.kpis.nettomietrendite.toFixed(1)}%`,
      color: 'text-teal-600',
    },
  ]

  return (
    <Card className={`px-3 py-2 shadow-sm ${hasScenario ? 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20' : ''}`}>
      <div className="grid grid-cols-4 gap-2">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="flex items-center gap-1.5 min-w-0">
            <kpi.icon className={`h-3.5 w-3.5 shrink-0 ${kpi.color}`} />
            <div className="min-w-0">
              <div className={`text-xs font-bold tabular-nums ${kpi.color}`}>{kpi.value}</div>
              <div className="text-[10px] text-muted-foreground truncate">{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function KiBeraterTab({ project, result, onChange }: KiBeraterTabProps) {
  const overrides = useSimulationStore((s) => s.overrides)
  const setOverride = useSimulationStore((s) => s.setOverride)
  const resetOverrides = useSimulationStore((s) => s.resetOverrides)
  const scenarioAdjustments = useSimulationStore((s) => s.scenarioAdjustments)
  const addScenarioAdjustment = useSimulationStore((s) => s.addScenarioAdjustment)
  const removeScenarioAdjustment = useSimulationStore((s) => s.removeScenarioAdjustment)
  const clearScenarioAdjustments = useSimulationStore((s) => s.clearScenarioAdjustments)
  const etvProtokolleMaybe = useEtvStore((s) => s.protokolle[project.id])
  const etvProtokolle = useMemo(() => etvProtokolleMaybe ?? [], [etvProtokolleMaybe])
  const overrideKeys = Object.keys(overrides)
  const hasOverrides = overrideKeys.length > 0
  const hasScenarios = scenarioAdjustments.length > 0
  const hasAnySimulation = hasOverrides || hasScenarios
  const messages = useAiChatStore((s) => s.messages)
  const isLoading = useAiChatStore((s) => s.isLoading)
  const [showSuggestions, setShowSuggestions] = useState(true)

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

  // Apply scenario adjustments to projection (with tax rate for proper after-tax calculation)
  const steuersatz = project.persoenlicherSteuersatz ?? 0
  const scenarioProjection = useMemo(() => {
    if (!hasScenarios) return chartResult.projection
    return applyScenarioToProjection(chartResult.projection, scenarioAdjustments, steuersatz)
  }, [chartResult.projection, scenarioAdjustments, hasScenarios, steuersatz])

  // Build a result with scenario projection for KPI display
  const scenarioKpiResult = useMemo(() => {
    if (!hasScenarios) return undefined
    // Recalculate KPIs based on scenario cashflow from year 1
    const y1 = scenarioProjection[0]
    if (!y1) return undefined
    return {
      ...chartResult,
      kpis: {
        ...chartResult.kpis,
        monatlichCashflowNachSteuer: y1.cashflowNachSteuer / 12,
      },
    }
  }, [chartResult, scenarioProjection, hasScenarios])

  // Handle AI parameter changes
  const handleParameterChange = useCallback((changes: Record<string, number>) => {
    for (const [key, value] of Object.entries(changes)) {
      setOverride(key as keyof typeof overrides, value as never)
    }
  }, [setOverride])

  // Handle AI scenario adjustments
  const handleScenarioAdjustments = useCallback((adjustments: ScenarioAdjustment[]) => {
    for (const adj of adjustments) {
      addScenarioAdjustment(adj)
    }
  }, [addScenarioAdjustment])

  // Handle suggestion chip selection — send to AI chat
  const handleSuggestion = useCallback(async (prompt: string) => {
    const { apiKey, addMessage, setLoading, setError } = useAiChatStore.getState()
    if (!apiKey) return

    const { sendChatMessage } = await import('@/lib/ai-service')

    const userMsg = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: prompt,
      timestamp: Date.now(),
    }
    addMessage(userMsg)
    setLoading(true)
    setError(null)

    try {
      const currentMessages = useAiChatStore.getState().messages
      const history = currentMessages.map((m) => ({
        role: m.role,
        content: m.role === 'assistant' && (m.parameterChanges || m.inlineCalculation || m.scenarioAdjustments)
          ? JSON.stringify({
              message: m.content,
              ...(m.scenarioAdjustments ? { scenarioAdjustments: m.scenarioAdjustments } : {}),
            })
          : m.content,
      }))

      const currentEtv = useEtvStore.getState().protokolle[project.id] ?? []
      const response = await sendChatMessage(apiKey, project, result, history, currentEtv)

      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.message,
        parameterChanges: response.parameterChanges as Record<string, number | string> | undefined,
        inlineCalculation: response.inlineCalculation,
        scenarioAdjustments: response.scenarioAdjustments,
        timestamp: Date.now(),
      })

      if (response.parameterChanges) {
        handleParameterChange(response.parameterChanges)
      }
      if (response.scenarioAdjustments) {
        handleScenarioAdjustments(response.scenarioAdjustments)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      useAiChatStore.getState().setLoading(false)
    }
  }, [project, result, handleParameterChange, handleScenarioAdjustments])

  // Apply simulation to project permanently
  const handleApply = () => {
    const updates: Partial<Project> = {}
    for (const [key, value] of Object.entries(overrides)) {
      ;(updates as Record<string, unknown>)[key] = value
    }
    onChange(updates)
    resetOverrides()
  }

  // Reset everything
  const handleResetAll = () => {
    resetOverrides()
    clearScenarioAdjustments()
  }

  return (
    <div className="space-y-4">
      {/* Main layout: Chat left + KPI/Charts right — FIXED HEIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:h-[750px]" style={{ gridTemplateRows: 'auto 1.2fr 1fr' }}>
        {/* AI Chat — Left, fills full height */}
        <div className="lg:row-span-3 flex flex-col min-h-[400px] lg:min-h-0 lg:h-full overflow-hidden">
          <AiChat
            project={project}
            result={result}
            onParameterChange={handleParameterChange}
            onScenarioAdjustments={handleScenarioAdjustments}
            etvProtokolle={etvProtokolle}
          />
        </div>

        {/* KPI Row — Right top */}
        <KpiMiniRow result={chartResult} scenarioResult={scenarioKpiResult} />

        {/* Cashflow Chart — Right middle (larger, tooltip above) */}
        <div className="min-h-0 relative" style={{ zIndex: 10, overflow: 'visible' }}>
          <MonthlyCashflowChart
            result={chartResult}
            nutzungsart={project.nutzungsart}
            scenarioProjection={hasScenarios ? scenarioProjection : undefined}
            defaultTimeRange="10"
          />
        </div>

        {/* Wertentwicklung Chart — Right bottom */}
        <div className="min-h-0 relative overflow-hidden" style={{ zIndex: 5 }}>
          <WertentwicklungChart
            projection={hasScenarios ? scenarioProjection : chartResult.projection}
            baseProjection={hasAnySimulation ? result.projection : undefined}
          />
        </div>
      </div>

      {/* Simulation status bars */}
      {hasOverrides && (
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
          <Zap className="h-4 w-4 text-amber-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Parameter-Simulation
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

      {/* Scenario adjustments status */}
      {hasScenarios && (
        <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3">
          <BarChart3 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Aktive Szenarien
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {scenarioAdjustments.map((adj) => (
                <span
                  key={adj.id}
                  className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-1 rounded-full"
                >
                  {adj.label}
                  <button
                    onClick={() => removeScenarioAdjustment(adj.id)}
                    className="ml-0.5 hover:text-blue-600 dark:hover:text-blue-100 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={clearScenarioAdjustments} className="gap-1.5 shrink-0">
            <RotateCcw className="h-3.5 w-3.5" />
            Alle entfernen
          </Button>
        </div>
      )}

      {/* Reset all button when both are active */}
      {hasOverrides && hasScenarios && (
        <div className="flex justify-end">
          <Button size="sm" variant="ghost" onClick={handleResetAll} className="gap-1.5 text-muted-foreground">
            <RotateCcw className="h-3.5 w-3.5" />
            Alles zurücksetzen
          </Button>
        </div>
      )}

      {/* Suggestion chips — below the chat */}
      <div>
        <button
          className="flex items-center gap-2 text-sm font-semibold text-foreground/70 hover:text-foreground transition-colors mb-3"
          onClick={() => setShowSuggestions(!showSuggestions)}
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${showSuggestions ? '' : '-rotate-90'}`} />
          Fragen & Szenarien für den KI-Berater
        </button>
        {showSuggestions && (
          <SuggestionChips onSelect={handleSuggestion} disabled={isLoading} />
        )}
      </div>
    </div>
  )
}
