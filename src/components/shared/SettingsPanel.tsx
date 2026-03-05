import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { CurrencyInput, PercentInput } from '@/components/shared/CurrencyInput'
import { useUiStore } from '@/store/useUiStore'
import { useProjectStore } from '@/store/useProjectStore'
import { BUNDESLAND_LABELS } from '@/calc/grunderwerbsteuer'
import { DEFAULT_VALUES } from '@/calc/defaults'
import type { Bundesland } from '@/calc/types'

const KPI_OPTIONS = [
  { key: 'cashflow', label: 'Monatlicher Cashflow' },
  { key: 'bruttomietrendite', label: 'Bruttomietrendite' },
  { key: 'kaufpreisfaktor', label: 'Kaufpreisfaktor' },
  { key: 'eigenkapitalrendite', label: 'Eigenkapitalrendite' },
  { key: 'dscr', label: 'DSCR' },
  { key: 'nettomietrendite', label: 'Nettomietrendite' },
  { key: 'cashOnCash', label: 'Cash-on-Cash Return' },
  { key: 'jaehrlichCashflowNachSteuer', label: 'Cashflow/Jahr' },
  { key: 'vermoegenszuwachs', label: 'Vermögenszuwachs' },
  { key: 'monatlicheKosten', label: 'Monatl. Kosten (Eigennutzung)' },
  { key: 'ersparteMiete', label: 'Ersparte Miete (Eigennutzung)' },
  { key: 'eigennutzungRendite', label: 'Eigennutzung-Rendite' },
]

interface SettingsPanelProps {
  open: boolean
  onClose: () => void
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const [tab, setTab] = useState('allgemein')
  const {
    mode, setMode,
    theme, setTheme,
    hiddenKpis, toggleKpiVisibility,
    defaultBundesland, setDefaultBundesland,
    defaultProjectionYears, setDefaultProjectionYears,
    primaryKpi, setPrimaryKpi,
    projectDefaults, setProjectDefault,
  } = useUiStore()
  const { projects, loadProjects } = useProjectStore()

  const bundeslandOptions = Object.entries(BUNDESLAND_LABELS).map(
    ([value, label]) => ({ value, label })
  )

  const handleExport = () => {
    const data = JSON.stringify(projects, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wasimmowert-projekte-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string)
          if (Array.isArray(data)) {
            localStorage.setItem('wasimmowert-projects', JSON.stringify(data))
            loadProjects()
          }
        } catch {
          alert('Ungültige JSON-Datei')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleDeleteAll = () => {
    if (confirm('Alle Projekte unwiderruflich löschen?')) {
      localStorage.removeItem('wasimmowert-projects')
      loadProjects()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }} size="2xl">
      <DialogContent onClose={onClose}>
        <DialogHeader>
          <DialogTitle>Einstellungen</DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full">
              <TabsTrigger value="allgemein">Allgemein</TabsTrigger>
              <TabsTrigger value="kpis">KPIs</TabsTrigger>
              <TabsTrigger value="defaults">Standards</TabsTrigger>
              <TabsTrigger value="daten">Daten</TabsTrigger>
            </TabsList>

            <TabsContent value="allgemein">
              <div className="space-y-5 mt-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Modus</label>
                  <div className="flex rounded-md overflow-hidden border">
                    <button
                      className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                        mode === 'beginner' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
                      }`}
                      onClick={() => setMode('beginner')}
                    >
                      Anfänger
                    </button>
                    <button
                      className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                        mode === 'pro' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
                      }`}
                      onClick={() => setMode('pro')}
                    >
                      Profi
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Profi-Modus zeigt erweiterte Eingaben und Kennzahlen.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">Darstellung</label>
                  <div className="flex rounded-md overflow-hidden border">
                    {(['light', 'dark', 'system'] as const).map((t) => (
                      <button
                        key={t}
                        className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                          theme === t ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
                        }`}
                        onClick={() => setTheme(t)}
                      >
                        {t === 'light' ? 'Hell' : t === 'dark' ? 'Dunkel' : 'System'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1.5">Standard-Bundesland</label>
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
                    <span>5 J.</span>
                    <span>50 J.</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="kpis">
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5">Primäre Kennzahl</label>
                  <Select
                    value={primaryKpi}
                    onChange={(e) => setPrimaryKpi(e.target.value)}
                    options={KPI_OPTIONS.map(({ key, label }) => ({ value: key, label }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Wird im Projektvergleich hervorgehoben.
                  </p>
                </div>
                <div className="border-t pt-3">
                  <p className="text-sm text-muted-foreground mb-3">Sichtbare Kennzahlen</p>
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
              <div className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Standardwerte für neue Projekte.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <PercentInput
                    label="Zinssatz"
                    value={projectDefaults.zinssatz}
                    onChange={(v) => setProjectDefault('zinssatz', v)}
                    min={0} max={15} step={0.1}
                  />
                  <PercentInput
                    label="Tilgung"
                    value={projectDefaults.tilgung}
                    onChange={(v) => setProjectDefault('tilgung', v)}
                    min={0} max={15} step={0.1}
                  />
                </div>

                <CurrencyInput
                  label="Eigenkapital"
                  value={projectDefaults.eigenkapital}
                  onChange={(v) => setProjectDefault('eigenkapital', v)}
                  min={0} step={5000}
                />

                <div className="grid grid-cols-2 gap-3">
                  <PercentInput
                    label="Makler"
                    value={projectDefaults.maklerProvision}
                    onChange={(v) => setProjectDefault('maklerProvision', v)}
                    min={0} max={10}
                  />
                  <PercentInput
                    label="Notar & Grundbuch"
                    value={projectDefaults.notarUndGrundbuch}
                    onChange={(v) => setProjectDefault('notarUndGrundbuch', v)}
                    min={0} max={5}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <CurrencyInput
                    label="Instandhaltung"
                    value={projectDefaults.instandhaltungProQm}
                    onChange={(v) => setProjectDefault('instandhaltungProQm', v)}
                    suffix="€/m²/J" min={0}
                  />
                  <CurrencyInput
                    label="Verwaltung"
                    value={projectDefaults.verwaltungProEinheit}
                    onChange={(v) => setProjectDefault('verwaltungProEinheit', v)}
                    suffix="€/Mon" min={0}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <PercentInput
                    label="Mietausfallwagnis"
                    value={projectDefaults.mietausfallwagnis}
                    onChange={(v) => setProjectDefault('mietausfallwagnis', v)}
                    min={0} max={20}
                  />
                  <PercentInput
                    label="Steuersatz"
                    value={projectDefaults.steuersatz}
                    onChange={(v) => setProjectDefault('steuersatz', v)}
                    min={0} max={45}
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    const d = DEFAULT_VALUES
                    setProjectDefault('zinssatz', d.zinssatz)
                    setProjectDefault('tilgung', d.tilgung)
                    setProjectDefault('eigenkapital', 50000)
                    setProjectDefault('maklerProvision', d.maklerProvision)
                    setProjectDefault('notarUndGrundbuch', d.notarUndGrundbuch)
                    setProjectDefault('instandhaltungProQm', d.instandhaltungProQm)
                    setProjectDefault('verwaltungProEinheit', d.verwaltungProEinheit)
                    setProjectDefault('mietausfallwagnis', d.mietausfallwagnis)
                    setProjectDefault('steuersatz', d.persoenlicherSteuersatz)
                  }}
                >
                  Auf Werkseinstellungen zurücksetzen
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="daten">
              <div className="space-y-4 mt-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Export</h3>
                  <Button variant="outline" size="sm" className="w-full" onClick={handleExport}>
                    Projekte als JSON exportieren
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    {projects.length} Projekt{projects.length !== 1 ? 'e' : ''} exportieren
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Import</h3>
                  <Button variant="outline" size="sm" className="w-full" onClick={handleImport}>
                    Projekte aus JSON importieren
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    Vorhandene Projekte werden ersetzt.
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-2 text-destructive">Gefahrenzone</h3>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={handleDeleteAll}
                    disabled={projects.length === 0}
                  >
                    Alle Projekte löschen
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
