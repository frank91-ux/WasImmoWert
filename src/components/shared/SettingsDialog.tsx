import { useState } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { useUiStore } from '@/store/useUiStore'
import { BUNDESLAND_LABELS } from '@/calc/grunderwerbsteuer'
import type { Bundesland } from '@/calc/types'

const KPI_OPTIONS = [
  { key: 'cashflow', label: 'Monatlicher Cashflow' },
  { key: 'bruttomietrendite', label: 'Bruttomietrendite' },
  { key: 'kaufpreisfaktor', label: 'Kaufpreisfaktor' },
  { key: 'eigenkapitalrendite', label: 'Eigenkapitalrendite' },
  { key: 'dscr', label: 'DSCR (Schuldendienstdeckungsgrad)' },
  { key: 'nettomietrendite', label: 'Nettomietrendite' },
  { key: 'cashOnCash', label: 'Cash-on-Cash Return' },
  { key: 'jaehrlichCashflowNachSteuer', label: 'Cashflow nach Steuer (jährlich)' },
  { key: 'vermoegenszuwachs', label: 'Vermögenszuwachs' },
  { key: 'monatlicheKosten', label: 'Monatliche Kosten (Eigennutzung)' },
  { key: 'ersparteMiete', label: 'Ersparte Miete (Eigennutzung)' },
  { key: 'eigennutzungRendite', label: 'Eigennutzung-Rendite' },
]

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [tab, setTab] = useState('kpis')
  const {
    hiddenKpis, toggleKpiVisibility,
    defaultBundesland, setDefaultBundesland,
    defaultProjectionYears, setDefaultProjectionYears,
    primaryKpi, setPrimaryKpi,
  } = useUiStore()

  const bundeslandOptions = Object.entries(BUNDESLAND_LABELS).map(
    ([value, label]) => ({ value, label })
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Einstellungen</DialogTitle>
      </DialogHeader>
      <DialogContent onClose={() => onOpenChange(false)}>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="kpis">Kennzahlen</TabsTrigger>
            <TabsTrigger value="defaults">Standardwerte</TabsTrigger>
          </TabsList>

          <TabsContent value="kpis">
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">
                  Primäre Kennzahl (für Vergleiche)
                </label>
                <Select
                  value={primaryKpi}
                  onChange={(e) => setPrimaryKpi(e.target.value)}
                  options={KPI_OPTIONS.map(({ key, label }) => ({ value: key, label }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Wird im Projektvergleich hervorgehoben angezeigt.
                </p>
              </div>
              <div className="border-t pt-3">
                <p className="text-sm text-muted-foreground mb-3">
                  Welche Kennzahlen sollen in der Übersicht sichtbar sein?
                </p>
                {KPI_OPTIONS.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 text-sm cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={!hiddenKpis.includes(key)}
                      onChange={() => toggleKpiVisibility(key)}
                      className="rounded border-input h-4 w-4 accent-primary"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="defaults">
            <div className="space-y-5 mt-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">
                  Standard-Bundesland für neue Projekte
                </label>
                <Select
                  value={defaultBundesland}
                  onChange={(e) => setDefaultBundesland(e.target.value as Bundesland)}
                  options={bundeslandOptions}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">
                  Projektionszeitraum: {defaultProjectionYears} Jahre
                </label>
                <Slider
                  min={5}
                  max={50}
                  step={5}
                  value={defaultProjectionYears}
                  onChange={setDefaultProjectionYears}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>5 Jahre</span>
                  <span>50 Jahre</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
