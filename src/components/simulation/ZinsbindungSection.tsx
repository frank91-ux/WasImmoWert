import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'
import type { ZinsbindungPeriod, Project } from '@/calc/types'
import { calculateAll } from '@/calc'
import { formatEur } from '@/lib/format'

interface ZinsbindungSectionProps {
  project: Project
  periods: ZinsbindungPeriod[]
  onChange: (periods: ZinsbindungPeriod[]) => void
}

const PRESET_YEARS = [5, 10, 15, 20]

export function ZinsbindungSection({ project, periods, onChange }: ZinsbindungSectionProps) {
  const [collapsed, setCollapsed] = useState(periods.length === 0)

  const addPeriod = () => {
    const usedYears = new Set(periods.map((p) => p.afterYear))
    const nextYear = PRESET_YEARS.find((y) => !usedYears.has(y)) ?? 10
    onChange([...periods, { afterYear: nextYear, zinssatz: project.zinssatz, tilgung: project.tilgung }])
    setCollapsed(false)
  }

  const removePeriod = (idx: number) => {
    onChange(periods.filter((_, i) => i !== idx))
  }

  const updatePeriod = (idx: number, updates: Partial<ZinsbindungPeriod>) => {
    onChange(periods.map((p, i) => i === idx ? { ...p, ...updates } : p))
  }

  // Calculate cashflow preview for each period
  const sortedPeriods = [...periods].sort((a, b) => a.afterYear - b.afterYear)
  const cashflowPreview = getCashflowPreview(project, sortedPeriods)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Zinsbindung & Anschlussfinanzierung
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? 'Einblenden' : 'Ausblenden'}
          </Button>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Zinssatz und Tilgung nach Ablauf der Zinsbindung anpassen.
          </p>

          {/* Initial period info */}
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Jahr 1–{sortedPeriods.length > 0 ? sortedPeriods[0].afterYear : '∞'}</span>
              <span className="font-medium">{project.zinssatz}% Zins, {project.tilgung}% Tilgung</span>
            </div>
          </div>

          {/* Period inputs */}
          {sortedPeriods.map((period, idx) => {
            const originalIdx = periods.indexOf(period)
            const nextYear = sortedPeriods[idx + 1]?.afterYear
            return (
              <div key={originalIdx} className="rounded-md border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Ab Jahr {period.afterYear + 1}{nextYear ? ` bis ${nextYear}` : ''}
                  </span>
                  <button
                    className="p-1 hover:bg-muted rounded"
                    onClick={() => removePeriod(originalIdx)}
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs mb-1 block">Nach Jahr</Label>
                    <select
                      value={period.afterYear}
                      onChange={(e) => updatePeriod(originalIdx, { afterYear: Number(e.target.value) })}
                      className="w-full h-8 text-sm rounded-md border border-input bg-background px-2"
                    >
                      {PRESET_YEARS.map((y) => (
                        <option key={y} value={y}>{y} Jahre</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Zinssatz</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={period.zinssatz}
                        onChange={(e) => updatePeriod(originalIdx, { zinssatz: Number(e.target.value) })}
                        className="h-8 text-sm pr-6"
                        min={0}
                        max={15}
                        step={0.1}
                      />
                      <span className="absolute right-2 top-1.5 text-xs text-muted-foreground">%</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Tilgung</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={period.tilgung}
                        onChange={(e) => updatePeriod(originalIdx, { tilgung: Number(e.target.value) })}
                        className="h-8 text-sm pr-6"
                        min={0}
                        max={15}
                        step={0.1}
                      />
                      <span className="absolute right-2 top-1.5 text-xs text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {periods.length < 4 && (
            <Button variant="outline" size="sm" className="w-full" onClick={addPeriod}>
              <Plus className="h-3.5 w-3.5" />
              Zinsbindungsperiode hinzufügen
            </Button>
          )}

          {/* Cashflow preview */}
          {cashflowPreview.length > 0 && (
            <div className="border-t pt-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Cashflow-Vorschau (monatlich)
              </h4>
              <div className="space-y-1">
                {cashflowPreview.map((item) => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className={`font-medium tabular-nums ${item.cashflow >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatEur(item.cashflow)}/Mon
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

interface CashflowPreviewItem {
  label: string
  cashflow: number
}

function getCashflowPreview(project: Project, sortedPeriods: ZinsbindungPeriod[]): CashflowPreviewItem[] {
  if (sortedPeriods.length === 0) return []

  const items: CashflowPreviewItem[] = []

  // Base result (no zinsbindung periods)
  const baseResult = calculateAll({ ...project, zinsbindungPeriods: [] })
  items.push({
    label: `Jahr 1–${sortedPeriods[0].afterYear}`,
    cashflow: baseResult.kpis.monatlichCashflowNachSteuer,
  })

  // For each period, show the cashflow from the projection at that year
  const fullResult = calculateAll({ ...project, zinsbindungPeriods: sortedPeriods })
  for (let i = 0; i < sortedPeriods.length; i++) {
    const period = sortedPeriods[i]
    const nextYear = sortedPeriods[i + 1]?.afterYear
    const yearData = fullResult.projection.find((p) => p.year === period.afterYear + 1)
    if (yearData) {
      items.push({
        label: `Ab Jahr ${period.afterYear + 1}${nextYear ? ` bis ${nextYear}` : ''}`,
        cashflow: yearData.cashflowNachSteuer / 12,
      })
    }
  }

  return items
}
