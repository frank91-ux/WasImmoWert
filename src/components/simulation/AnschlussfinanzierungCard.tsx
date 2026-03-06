import { useState, useMemo, useCallback } from 'react'
import type { Project, CalculationResult, ZinsbindungPeriod } from '@/calc/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ParameterSlider } from '@/components/simulation/ParameterSlider'
import { ChartCard } from '@/components/charts/ChartCard'
import { formatEur, formatPercent } from '@/lib/format'
import { TOOLTIP_STYLE, AXIS_TICK, GRID_STYLE, CHART_COLORS, ANIMATION_DURATION } from '@/components/charts/chartTheme'
import { AlertTriangle, CheckCircle, Plus, X, TrendingUp } from 'lucide-react'
import {
  AreaChart, Area, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'

interface AnschlussfinanzierungCardProps {
  project: Project
  result: CalculationResult
  onChange?: (updates: Partial<Project>) => void
}

const PRESET_YEARS = [5, 10, 15, 20]

export function AnschlussfinanzierungCard({ project, result, onChange }: AnschlussfinanzierungCardProps) {
  const zinsbindungsEnde = project.zinsbindung
  if (!zinsbindungsEnde || zinsbindungsEnde <= 0) return null

  const anschlussProjection = result.projection[zinsbindungsEnde - 1]
  if (!anschlussProjection) return null

  const restschuld = anschlussProjection.restschuld
  const bisherigeTilgung = result.financing.darlehensBetrag - restschuld
  const getilgtProzent = result.financing.darlehensBetrag > 0
    ? (bisherigeTilgung / result.financing.darlehensBetrag) * 100
    : 0
  const isVollgetilgt = restschuld <= 0

  const periods = project.zinsbindungPeriods || []
  const canAddPeriod = periods.length < 3

  const handleAddPeriod = useCallback(() => {
    if (!onChange || !canAddPeriod) return
    const lastAfterYear = periods.length > 0 ? periods[periods.length - 1].afterYear : zinsbindungsEnde
    const newPeriod: ZinsbindungPeriod = {
      afterYear: lastAfterYear + 10,
      zinssatz: 4.0,
      tilgung: 2.0,
    }
    onChange({ zinsbindungPeriods: [...periods, newPeriod] })
  }, [onChange, canAddPeriod, periods, zinsbindungsEnde])

  const handleRemovePeriod = useCallback((idx: number) => {
    if (!onChange) return
    onChange({ zinsbindungPeriods: periods.filter((_, i) => i !== idx) })
  }, [onChange, periods])

  const handleUpdatePeriod = useCallback((idx: number, updates: Partial<ZinsbindungPeriod>) => {
    if (!onChange) return
    const newPeriods = periods.map((p, i) => i === idx ? { ...p, ...updates } : p)
    onChange({ zinsbindungPeriods: newPeriods })
  }, [onChange, periods])

  // Compute payoff year
  const payoffYear = result.projection.find((y) => y.restschuld <= 0)?.year ?? result.projection.length
  const totalYears = Math.min(payoffYear + 2, result.projection.length)

  // Zinsbindung boundary years
  const boundaries = useMemo(() => {
    const b = [zinsbindungsEnde]
    for (const p of periods) {
      if (p.afterYear > 0 && !b.includes(p.afterYear)) b.push(p.afterYear)
    }
    return b.sort((a, c) => a - c)
  }, [zinsbindungsEnde, periods])

  // Chart data - Wertentwicklung
  const wertData = useMemo(() => {
    return result.projection.slice(0, totalYears).map((y) => ({
      label: `Jahr ${y.year}`,
      eigenkapital: Math.round(y.eigenkapitalImObjekt),
      immobilienWert: Math.round(y.immobilienWert),
      restschuld: Math.round(y.restschuld),
    }))
  }, [result.projection, totalYears])

  // Chart data - Cashflow
  const cashflowData = useMemo(() => {
    return result.projection.slice(0, totalYears).map((y) => ({
      label: `Jahr ${y.year}`,
      zinsen: -Math.round(y.zinsenJahr / 12),
      tilgung: -Math.round(y.tilgungJahr / 12),
      netto: Math.round(y.cashflowNachSteuer / 12),
    }))
  }, [result.projection, totalYears])

  const xInterval = totalYears <= 5 ? 0 : Math.max(1, Math.floor(totalYears / 8))

  // Restschuld at each boundary
  const restschuldAtBoundaries = useMemo(() => {
    return boundaries.map((yr) => {
      const proj = result.projection[yr - 1]
      return { year: yr, restschuld: proj ? proj.restschuld : 0 }
    })
  }, [boundaries, result.projection])

  return (
    <Card className={`border-2 ${isVollgetilgt ? 'border-green-500/30 bg-green-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          {isVollgetilgt ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          )}
          <CardTitle className="text-base">
            {isVollgetilgt
              ? `Darlehen vollständig getilgt nach ${zinsbindungsEnde} Jahren`
              : `Anschlussfinanzierung nach ${zinsbindungsEnde} Jahren`
            }
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Restschuld</p>
            <p className="text-lg font-bold tabular-nums">
              {isVollgetilgt ? '0 €' : formatEur(restschuld)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Bisherige Tilgung</p>
            <p className="text-lg font-bold tabular-nums">{formatEur(bisherigeTilgung)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Getilgt</p>
            <p className="text-lg font-bold tabular-nums">{formatPercent(getilgtProzent)}</p>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isVollgetilgt ? 'bg-green-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(100, getilgtProzent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Period editing UI */}
        {onChange && (
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Anschluss-Perioden</p>
              {canAddPeriod && (
                <Button size="sm" variant="outline" onClick={handleAddPeriod} className="gap-1 h-7 text-xs">
                  <Plus className="h-3 w-3" />
                  Periode
                </Button>
              )}
            </div>

            {periods.map((p, i) => {
              const rs = restschuldAtBoundaries.find(r => r.year === p.afterYear)
              return (
                <div key={i} className="relative p-3 rounded-lg bg-white/50 dark:bg-white/5 border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-amber-500/20 text-amber-700 text-xs font-semibold">
                        {i + 1}
                      </span>
                      Ab Jahr {p.afterYear}
                      {rs && <span className="text-xs text-muted-foreground ml-1">(Restschuld: {formatEur(rs.restschuld)})</span>}
                    </span>
                    <button onClick={() => handleRemovePeriod(i)} className="text-muted-foreground hover:text-red-500 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {PRESET_YEARS.map((yr) => {
                      const base = i === 0 ? zinsbindungsEnde : (periods[i - 1]?.afterYear || zinsbindungsEnde)
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
                  <ParameterSlider
                    label="Zinssatz"
                    value={p.zinssatz}
                    min={0.5}
                    max={8}
                    step={0.1}
                    unit="%"
                    onChange={(v) => handleUpdatePeriod(i, { zinssatz: v })}
                    formatValue={(v) => `${v.toFixed(1)} %`}
                  />
                  <ParameterSlider
                    label="Tilgung"
                    value={p.tilgung}
                    min={1}
                    max={10}
                    step={0.1}
                    unit="%"
                    onChange={(v) => handleUpdatePeriod(i, { tilgung: v })}
                    formatValue={(v) => `${v.toFixed(1)} %`}
                  />
                </div>
              )
            })}

            {periods.length === 0 && (
              <p className="text-xs text-muted-foreground">Keine Anschluss-Perioden definiert. Füge eine hinzu, um verschiedene Zins-Szenarien zu simulieren.</p>
            )}
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
                  <Legend
                    iconType="line" iconSize={8}
                    wrapperStyle={{ fontSize: '0.65rem' }}
                    payload={[
                      { value: 'EK', type: 'line', color: CHART_COLORS.primary, id: 'ek' },
                      { value: 'Wert', type: 'line', color: CHART_COLORS.positive, id: 'wert' },
                      { value: 'Schuld', type: 'line', color: CHART_COLORS.negative, id: 'schuld' },
                    ]}
                  />
                  <defs>
                    <linearGradient id="gradEkAnschluss" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  {boundaries.map((yr) => (
                    <ReferenceLine
                      key={`zb-${yr}`}
                      x={`Jahr ${yr}`}
                      stroke="#f59e0b"
                      strokeDasharray="6 4"
                      strokeWidth={1.5}
                      label={{ value: `ZB ${yr}J`, fontSize: 9, fill: '#f59e0b', position: 'insideTopRight' }}
                    />
                  ))}
                  <Area type="monotone" dataKey="immobilienWert" fill="none" stroke={CHART_COLORS.positive} strokeWidth={2} strokeDasharray="6 3" animationDuration={ANIMATION_DURATION} />
                  <Area type="monotone" dataKey="eigenkapital" fill="url(#gradEkAnschluss)" stroke={CHART_COLORS.primary} strokeWidth={2} animationDuration={ANIMATION_DURATION} />
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
                  <Legend
                    iconType="rect" iconSize={7}
                    wrapperStyle={{ fontSize: '0.65rem' }}
                    payload={[
                      { value: 'Zins', type: 'rect', color: CHART_COLORS.negative, id: 'zins' },
                      { value: 'Tilg.', type: 'rect', color: CHART_COLORS.primary, id: 'tilg' },
                      { value: 'Netto', type: 'line', color: CHART_COLORS.palette[7], id: 'netto' },
                    ]}
                  />
                  <ReferenceLine y={0} stroke={CHART_COLORS.muted} strokeDasharray="3 3" strokeOpacity={0.4} />
                  {boundaries.map((yr) => (
                    <ReferenceLine
                      key={`zb-cf-${yr}`}
                      x={`Jahr ${yr}`}
                      stroke="#f59e0b"
                      strokeDasharray="6 4"
                      strokeWidth={1.5}
                    />
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
