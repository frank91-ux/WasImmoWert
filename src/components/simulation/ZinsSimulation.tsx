import { useState, useMemo, useCallback } from 'react'
import type { Project, CalculationResult, ZinsbindungPeriod } from '@/calc/types'
import { calculateAll } from '@/calc'
import { calculateVerkaufSimulation } from '@/calc/verkauf-simulation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ParameterSlider } from './ParameterSlider'
import { ChartCard } from '@/components/charts/ChartCard'
import { formatEur, formatPercent } from '@/lib/format'
import { TOOLTIP_STYLE, AXIS_TICK, GRID_STYLE, CHART_COLORS, ANIMATION_DURATION } from '@/components/charts/chartTheme'
import { AlertTriangle, CheckCircle, Plus, X, TrendingUp, TrendingDown, Clock, ArrowUpDown } from 'lucide-react'
import {
  AreaChart, Area, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'

interface ZinsSimulationProps {
  project: Project
  result: CalculationResult
  onChange?: (updates: Partial<Project>) => void
}

const INITIAL_PRESETS = [5, 10]
const PERIOD1_PRESETS = [5, 10, 15]
const PERIOD2_PRESETS = [5, 10, 15]

export function ZinsSimulation({ project, result, onChange }: ZinsSimulationProps) {
  const zinsbindungsEnde = project.zinsbindung

  // --- Anschlussfinanzierung state ---
  const anschlussProjection = zinsbindungsEnde > 0 ? result.projection[zinsbindungsEnde - 1] : null
  const restschuld = anschlussProjection?.restschuld ?? 0
  const bisherigeTilgung = result.financing.darlehensBetrag - restschuld
  const getilgtProzent = result.financing.darlehensBetrag > 0
    ? (bisherigeTilgung / result.financing.darlehensBetrag) * 100 : 0
  const isVollgetilgt = restschuld <= 0

  const periods = project.zinsbindungPeriods || []
  const canAddPeriod = periods.length < 2

  const handleAddPeriod = useCallback(() => {
    if (!onChange || !canAddPeriod) return
    if (periods.length === 0) {
      // First Zinsänderung: starts at end of initial period
      const newPeriod: ZinsbindungPeriod = { afterYear: zinsbindungsEnde + 10, zinssatz: 4.0, tilgung: 2.0 }
      onChange({ zinsbindungPeriods: [newPeriod] })
    } else {
      // Second Zinsänderung: starts at end of first period
      const newPeriod: ZinsbindungPeriod = { afterYear: periods[0].afterYear + 10, zinssatz: 4.0, tilgung: 2.0 }
      onChange({ zinsbindungPeriods: [...periods, newPeriod] })
    }
  }, [onChange, canAddPeriod, periods, zinsbindungsEnde])

  const handleRemovePeriod = useCallback((idx: number) => {
    if (!onChange) return
    onChange({ zinsbindungPeriods: periods.filter((_, i) => i !== idx) })
  }, [onChange, periods])

  const handleUpdatePeriod = useCallback((idx: number, updates: Partial<ZinsbindungPeriod>) => {
    if (!onChange) return
    const newPeriods = [...periods]
    newPeriods[idx] = { ...newPeriods[idx], ...updates }
    // If first period's afterYear changed and there's a second period, auto-adjust second to stay relative
    if (idx === 0 && updates.afterYear !== undefined && newPeriods.length > 1) {
      const oldBase = periods[0].afterYear
      const newBase = updates.afterYear
      const offset = newPeriods[1].afterYear - oldBase
      newPeriods[1] = { ...newPeriods[1], afterYear: newBase + Math.max(offset, 5) }
    }
    // Ensure second period is always after first
    if (newPeriods.length > 1 && newPeriods[1].afterYear <= newPeriods[0].afterYear) {
      newPeriods[1] = { ...newPeriods[1], afterYear: newPeriods[0].afterYear + 5 }
    }
    onChange({ zinsbindungPeriods: newPeriods })
  }, [onChange, periods])

  // --- Full scenario recalculation ---
  const scenarioResult = useMemo(() => {
    if (periods.length === 0) return null
    // Recalculate everything with the zinsbindungPeriods applied
    return calculateAll({ ...project, zinsbindungPeriods: periods })
  }, [project, periods])

  const activeResult = scenarioResult ?? result

  // Payoff year comparison
  const originalPayoffYear = result.projection.find(y => y.restschuld <= 0)?.year ?? result.projection.length
  const scenarioPayoffYear = activeResult.projection.find(y => y.restschuld <= 0)?.year ?? activeResult.projection.length
  const payoffDelta = scenarioPayoffYear - originalPayoffYear

  // Verkaufsszenarien comparison
  const originalVerkauf = useMemo(
    () => calculateVerkaufSimulation(project, result, [5, 10, 15, 20]),
    [project, result]
  )
  const scenarioVerkauf = useMemo(() => {
    if (!scenarioResult) return null
    return calculateVerkaufSimulation({ ...project, zinsbindungPeriods: periods }, scenarioResult, [5, 10, 15, 20])
  }, [project, scenarioResult, periods])

  const totalYears = Math.min(scenarioPayoffYear + 2, activeResult.projection.length)

  // Zinsbindung boundary years
  const boundaries = useMemo(() => {
    const b = zinsbindungsEnde > 0 ? [zinsbindungsEnde] : []
    for (const p of periods) {
      if (p.afterYear > 0 && !b.includes(p.afterYear)) b.push(p.afterYear)
    }
    return b.sort((a, c) => a - c)
  }, [zinsbindungsEnde, periods])

  // Chart data - Wertentwicklung
  const wertData = useMemo(() => {
    return activeResult.projection.slice(0, totalYears).map((y) => ({
      label: `Jahr ${y.year}`,
      eigenkapital: Math.round(y.eigenkapitalImObjekt),
      immobilienWert: Math.round(y.immobilienWert),
      restschuld: Math.round(y.restschuld),
    }))
  }, [activeResult.projection, totalYears])

  // Chart data - Cashflow
  const cashflowData = useMemo(() => {
    return activeResult.projection.slice(0, totalYears).map((y) => ({
      label: `Jahr ${y.year}`,
      zinsen: -Math.round(y.zinsenJahr / 12),
      tilgung: -Math.round(y.tilgungJahr / 12),
      netto: Math.round(y.cashflowNachSteuer / 12),
    }))
  }, [activeResult.projection, totalYears])

  const xInterval = totalYears <= 5 ? 0 : Math.max(1, Math.floor(totalYears / 8))

  // Restschuld at each boundary
  const restschuldAtBoundaries = useMemo(() => {
    return boundaries.map((yr) => {
      const proj = activeResult.projection[yr - 1]
      return { year: yr, restschuld: proj ? proj.restschuld : 0 }
    })
  }, [boundaries, activeResult.projection])

  // KPI comparison table
  const kpiComparison = useMemo(() => {
    if (!scenarioResult) return null
    return {
      rateOrig: result.financing.monatlicheRate,
      rateNew: scenarioResult.financing.monatlicheRate,
      cfOrig: result.kpis.monatlichCashflowNachSteuer,
      cfNew: scenarioResult.kpis.monatlichCashflowNachSteuer,
      ekRenditeOrig: result.kpis.eigenkapitalrendite,
      ekRenditeNew: scenarioResult.kpis.eigenkapitalrendite,
      dscrOrig: result.kpis.dscr,
      dscrNew: scenarioResult.kpis.dscr,
    }
  }, [result, scenarioResult])

  return (
    <Card className={`border-2 shadow-sm ${
      isVollgetilgt && zinsbindungsEnde > 0
        ? 'border-green-500/30 bg-green-500/5'
        : 'border-blue-500/30 bg-blue-500/5'
    }`}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-5 w-5 text-blue-600" />
          <div>
            <CardTitle className="text-base">Zins-Simulation & Anschlussfinanzierung</CardTitle>
            <CardDescription className="text-xs">
              Was-wäre-wenn: Zinsänderungen über die Laufzeit simulieren
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPIs: Anschlussfinanzierung Status */}
        {zinsbindungsEnde > 0 && anschlussProjection && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Restschuld (Jahr {zinsbindungsEnde})</p>
              <p className="text-lg font-bold tabular-nums">
                {isVollgetilgt ? '0 €' : formatEur(restschuld)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Getilgt</p>
              <p className="text-lg font-bold tabular-nums">{formatPercent(getilgtProzent)}</p>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isVollgetilgt ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(100, getilgtProzent)}%` }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Vollständig getilgt</p>
              <p className="text-lg font-bold tabular-nums flex items-center gap-1">
                {scenarioPayoffYear > result.projection.length ? '> 30' : scenarioPayoffYear} Jahre
                {payoffDelta !== 0 && periods.length > 0 && (
                  <span className={`text-xs font-medium ${payoffDelta > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                    ({payoffDelta > 0 ? '+' : ''}{payoffDelta} J.)
                  </span>
                )}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Perioden</p>
              <p className="text-lg font-bold tabular-nums">{periods.length + 1}</p>
              <p className="text-[10px] text-muted-foreground">(Initial + {periods.length} Anschluss)</p>
            </div>
          </div>
        )}

        {/* Tilgungsdauer-Delta Banner */}
        {periods.length > 0 && payoffDelta !== 0 && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
            payoffDelta > 0
              ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
          }`}>
            {payoffDelta > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            Abzahlung {payoffDelta > 0 ? 'verlängert' : 'verkürzt'} sich um {Math.abs(payoffDelta)} Jahre
            <Clock className="h-3.5 w-3.5 ml-auto opacity-50" />
          </div>
        )}

        {/* Period editing UI */}
        {onChange && (
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Zinsänderungen (max. 2 über Laufzeit)</p>
              {canAddPeriod && (
                <Button size="sm" variant="outline" onClick={handleAddPeriod} className="gap-1 h-7 text-xs">
                  <Plus className="h-3 w-3" />
                  Zinsänderung
                </Button>
              )}
            </div>

            {/* Initial period - editable */}
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-2">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-500/20 text-blue-700 text-xs font-semibold">1</span>
                Initial: Jahr 0–{zinsbindungsEnde}
              </div>
              <div className="flex gap-1 flex-wrap">
                {INITIAL_PRESETS.map((yr) => (
                  <button
                    key={yr}
                    onClick={() => {
                      if (!onChange) return
                      const updates: Partial<Project> = { zinsbindung: yr }
                      // Cascade: adjust period afterYears to maintain relative offsets
                      if (periods.length > 0) {
                        const newPeriods = [...periods]
                        const offset0 = periods[0].afterYear - zinsbindungsEnde
                        newPeriods[0] = { ...newPeriods[0], afterYear: yr + Math.max(offset0, 5) }
                        if (newPeriods.length > 1) {
                          const offset1 = periods[1].afterYear - periods[0].afterYear
                          newPeriods[1] = { ...newPeriods[1], afterYear: newPeriods[0].afterYear + Math.max(offset1, 5) }
                        }
                        updates.zinsbindungPeriods = newPeriods
                      }
                      onChange(updates)
                    }}
                    className={`px-2 py-0.5 text-[10px] rounded-md border transition-colors ${
                      zinsbindungsEnde === yr
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-700 font-medium'
                        : 'bg-muted/50 border-border text-muted-foreground hover:border-blue-300'
                    }`}
                  >
                    {yr}J
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Zinssatz: {project.zinssatz.toFixed(1)}% · Tilgung: {project.tilgung.toFixed(1)}% · Rate: {formatEur(result.financing.monatlicheRate)}/Mon
              </p>
            </div>

            {periods.map((p, i) => {
              const base = i === 0 ? zinsbindungsEnde : periods[0].afterYear
              const presets = i === 0 ? PERIOD1_PRESETS : PERIOD2_PRESETS
              const rs = restschuldAtBoundaries.find(r => r.year === p.afterYear)
              // For second period: display start year (= end of first period)
              const periodStart = i === 1 ? periods[0].afterYear : undefined
              const periodEnd = p.afterYear
              return (
                <div key={i} className="relative p-3 rounded-lg bg-white/50 dark:bg-white/5 border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-amber-500/20 text-amber-700 text-xs font-semibold">
                        {i + 2}
                      </span>
                      {i === 0
                        ? `Jahr ${zinsbindungsEnde}–${periodEnd}`
                        : `Jahr ${periodStart}–${periodEnd}`
                      }
                      {rs && <span className="text-xs text-muted-foreground ml-1">(Restschuld: {formatEur(rs.restschuld)})</span>}
                    </span>
                    <button onClick={() => handleRemovePeriod(i)} className="text-muted-foreground hover:text-red-500 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {presets.map((yr) => {
                      const target = base + yr
                      return (
                        <button
                          key={yr}
                          onClick={() => handleUpdatePeriod(i, { afterYear: target })}
                          className={`px-2 py-0.5 text-[10px] rounded-md border transition-colors ${
                            p.afterYear === target
                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-700 font-medium'
                              : 'bg-muted/50 border-border text-muted-foreground hover:border-amber-300'
                          }`}
                        >
                          +{yr}J
                        </button>
                      )
                    })}
                  </div>
                  <ParameterSlider label="Zinssatz" value={p.zinssatz} min={0.5} max={10} step={0.1} unit="%" onChange={(v) => handleUpdatePeriod(i, { zinssatz: v })} formatValue={(v) => `${v.toFixed(1)} %`} />
                  <ParameterSlider label="Tilgung" value={p.tilgung} min={1} max={10} step={0.1} unit="%" onChange={(v) => handleUpdatePeriod(i, { tilgung: v })} formatValue={(v) => `${v.toFixed(1)} %`} />
                </div>
              )
            })}

            {periods.length === 0 && (
              <p className="text-xs text-muted-foreground">Keine Zinsänderungen definiert. Füge eine hinzu, um Was-wäre-wenn-Szenarien zu simulieren.</p>
            )}
          </div>
        )}

        {/* KPI comparison table */}
        {kpiComparison && (
          <div className="pt-3 border-t">
            <p className="text-sm font-semibold mb-2">Auswirkungen auf Kennzahlen</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1.5 pr-4 text-muted-foreground font-medium text-xs">Kennzahl</th>
                    <th className="text-right py-1.5 px-4 text-muted-foreground font-medium text-xs">Aktuell</th>
                    <th className="text-right py-1.5 pl-4 font-medium text-xs">Mit Zinsänderung</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Monatliche Rate', orig: formatEur(kpiComparison.rateOrig), nw: formatEur(kpiComparison.rateNew), worse: kpiComparison.rateNew > kpiComparison.rateOrig },
                    { label: 'Cashflow/Mon', orig: formatEur(kpiComparison.cfOrig), nw: formatEur(kpiComparison.cfNew), worse: kpiComparison.cfNew < kpiComparison.cfOrig },
                    { label: 'EK-Rendite', orig: `${kpiComparison.ekRenditeOrig.toFixed(1)} %`, nw: `${kpiComparison.ekRenditeNew.toFixed(1)} %`, worse: kpiComparison.ekRenditeNew < kpiComparison.ekRenditeOrig },
                    { label: 'DSCR', orig: kpiComparison.dscrOrig.toFixed(2), nw: kpiComparison.dscrNew.toFixed(2), worse: kpiComparison.dscrNew < kpiComparison.dscrOrig },
                  ].map((row) => (
                    <tr key={row.label} className="border-b last:border-0">
                      <td className="py-1.5 pr-4 text-xs">{row.label}</td>
                      <td className="py-1.5 px-4 text-right tabular-nums text-xs">{row.orig}</td>
                      <td className={`py-1.5 pl-4 text-right tabular-nums text-xs font-medium ${row.worse ? 'text-red-600' : 'text-emerald-600'}`}>{row.nw}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Verkaufsszenarien comparison */}
        {scenarioVerkauf && scenarioVerkauf.length > 0 && (
          <div className="pt-3 border-t">
            <p className="text-sm font-semibold mb-2">Verkaufsszenarien (mit Zinsänderung)</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {scenarioVerkauf.map((sv, i) => {
                const orig = originalVerkauf[i]
                const rendDiff = orig ? sv.effektiveRenditePa - orig.effektiveRenditePa : 0
                return (
                  <div key={sv.year} className="p-2 rounded-lg border bg-white/50 dark:bg-white/5 space-y-1">
                    <p className="text-xs font-semibold">Jahr {sv.year}</p>
                    <p className={`text-sm font-bold tabular-nums ${sv.gewinnNetto >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatEur(sv.gewinnNetto)}
                    </p>
                    <p className="text-[10px] text-muted-foreground tabular-nums">
                      Rendite: {sv.effektiveRenditePa.toFixed(1)}%
                      {Math.abs(rendDiff) > 0.05 && (
                        <span className={rendDiff > 0 ? 'text-emerald-600' : 'text-red-500'}>
                          {' '}({rendDiff > 0 ? '+' : ''}{rendDiff.toFixed(1)}%)
                        </span>
                      )}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pt-3 border-t">
          {/* Wertentwicklung Chart */}
          <ChartCard title="Wertentwicklung" subtitle="Bis zur Abbezahlung">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={wertData}>
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="label" tick={{ ...AXIS_TICK, fontSize: 10 }} interval={xInterval} />
                  <YAxis tick={{ ...AXIS_TICK, fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value, name) => {
                      const labels: Record<string, string> = { eigenkapital: 'Eigenkapital', immobilienWert: 'Immobilienwert', restschuld: 'Restschuld' }
                      return [formatEur(Number(value)), labels[name as string] ?? String(name)]
                    }}
                    contentStyle={TOOLTIP_STYLE}
                  />
                  <Legend iconType="line" iconSize={8} wrapperStyle={{ fontSize: '0.65rem' }}
                    payload={[
                      { value: 'EK', type: 'line', color: CHART_COLORS.primary, id: 'ek' },
                      { value: 'Wert', type: 'line', color: CHART_COLORS.positive, id: 'wert' },
                      { value: 'Schuld', type: 'line', color: CHART_COLORS.negative, id: 'schuld' },
                    ]}
                  />
                  <defs>
                    <linearGradient id="gradEkZins" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  {boundaries.map((yr) => (
                    <ReferenceLine key={`zb-${yr}`} x={`Jahr ${yr}`} stroke="#f59e0b" strokeDasharray="6 4" strokeWidth={1.5}
                      label={{ value: `ZB ${yr}J`, fontSize: 9, fill: '#f59e0b', position: 'insideTopRight' }}
                    />
                  ))}
                  <Area type="monotone" dataKey="immobilienWert" fill="none" stroke={CHART_COLORS.positive} strokeWidth={2} strokeDasharray="6 3" animationDuration={ANIMATION_DURATION} />
                  <Area type="monotone" dataKey="eigenkapital" fill="url(#gradEkZins)" stroke={CHART_COLORS.primary} strokeWidth={2} animationDuration={ANIMATION_DURATION} />
                  <Area type="monotone" dataKey="restschuld" fill="none" stroke={CHART_COLORS.negative} strokeWidth={2} animationDuration={ANIMATION_DURATION} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Cashflow Chart */}
          <ChartCard title="Cashflow" subtitle="Monatlich bis Abbezahlung">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={cashflowData} barGap={0} barCategoryGap="15%">
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="label" tick={{ ...AXIS_TICK, fontSize: 10 }} interval={xInterval} />
                  <YAxis tick={{ ...AXIS_TICK, fontSize: 10 }} tickFormatter={(v) => `${Math.round(v)}`} width={45} />
                  <Tooltip
                    formatter={(value, name) => {
                      const labels: Record<string, string> = { zinsen: 'Zinsen', tilgung: 'Tilgung', netto: 'Netto' }
                      return [`${formatEur(Number(value))}/Mon`, labels[name as string] ?? String(name)]
                    }}
                    contentStyle={TOOLTIP_STYLE}
                  />
                  <Legend iconType="rect" iconSize={7} wrapperStyle={{ fontSize: '0.65rem' }}
                    payload={[
                      { value: 'Zins', type: 'rect', color: CHART_COLORS.negative, id: 'zins' },
                      { value: 'Tilg.', type: 'rect', color: CHART_COLORS.primary, id: 'tilg' },
                      { value: 'Netto', type: 'line', color: CHART_COLORS.palette[7], id: 'netto' },
                    ]}
                  />
                  <ReferenceLine y={0} stroke={CHART_COLORS.muted} strokeDasharray="3 3" strokeOpacity={0.4} />
                  {boundaries.map((yr) => (
                    <ReferenceLine key={`zb-cf-${yr}`} x={`Jahr ${yr}`} stroke="#f59e0b" strokeDasharray="6 4" strokeWidth={1.5} />
                  ))}
                  <Bar dataKey="zinsen" stackId="1" fill={CHART_COLORS.negative} fillOpacity={0.8} animationDuration={ANIMATION_DURATION} />
                  <Bar dataKey="tilgung" stackId="1" fill={CHART_COLORS.primary} fillOpacity={0.8} animationDuration={ANIMATION_DURATION} />
                  <Line type="monotone" dataKey="netto" stroke={CHART_COLORS.palette[7]} strokeWidth={2.5} dot={{ r: 1.5, fill: CHART_COLORS.palette[7], strokeWidth: 0 }} activeDot={{ r: 3 }} animationDuration={ANIMATION_DURATION} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </CardContent>
    </Card>
  )
}
