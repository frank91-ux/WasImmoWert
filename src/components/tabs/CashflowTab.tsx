import { useMemo, useState, useCallback } from 'react'
import type { Project, CalculationResult, Wohnung } from '@/calc/types'
import { ParameterSlider } from '@/components/simulation/ParameterSlider'
import { CashflowTable } from '@/components/results/CashflowTable'
import { CostBreakdownPieChart } from '@/components/charts/CostBreakdownPieChart'
import { FinancingPieChart } from '@/components/charts/FinancingPieChart'
import { MonthlyCashflowChart } from '@/components/charts/MonthlyCashflowChart'
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatEur } from '@/lib/format'
import { GRUNDERWERBSTEUER_SAETZE, BUNDESLAND_LABELS } from '@/calc/grunderwerbsteuer'
import { getMarktdatenForBundesland } from '@/data/marktdaten'
import { Home, ChevronDown, ChevronUp, Plus, X, AlertTriangle } from 'lucide-react'

const MAX_WOHNUNGEN = 50

interface CashflowTabProps {
  project: Project
  result: CalculationResult
  onChange: (updates: Partial<Project>) => void
}

export function CashflowTab({ project, result, onChange }: CashflowTabProps) {
  const ekSliderMax = isFinite(result.kaufnebenkosten.gesamtkosten) ? result.kaufnebenkosten.gesamtkosten : project.kaufpreis * 1.15
  const [mfhOpen, setMfhOpen] = useState(false)
  const [nebenkostenMfhOpen, setNebenkostenMfhOpen] = useState(false)
  const [qmMismatchOpen, setQmMismatchOpen] = useState(false)
  const [qmMismatchDismissed, setQmMismatchDismissed] = useState(false)
  const [pendingQmSum, setPendingQmSum] = useState(0)

  // Market data for comparison
  const markt = getMarktdatenForBundesland(project.bundesland)

  // MFH: Sum of individual apartments determines Kaltmiete
  const wohnungenSumme = useMemo(() => {
    if (!project.isMehrfamilienhaus || !project.wohnungen?.length) return 0
    return project.wohnungen.reduce((s, w) => s + w.mietpreis, 0)
  }, [project.isMehrfamilienhaus, project.wohnungen])

  // Total qm from wohnungen
  const wohnungenQmSumme = useMemo(() => {
    if (!project.isMehrfamilienhaus || !project.wohnungen?.length) return 0
    return project.wohnungen.reduce((s, w) => s + w.qm, 0)
  }, [project.isMehrfamilienhaus, project.wohnungen])

  const qmMismatch = project.isMehrfamilienhaus && project.wohnungen?.length
    ? Math.abs(wohnungenQmSumme - project.wohnflaeche) > 0.5
    : false

  // MFH: Sum of individual apartment Nebenkosten
  const wohnungenNebenkostenSumme = useMemo(() => {
    if (!project.isMehrfamilienhaus || !project.wohnungen?.length) return 0
    return project.wohnungen.reduce((s, w) => s + (w.nebenkosten ?? 0), 0)
  }, [project.isMehrfamilienhaus, project.wohnungen])

  // Helper: sync totals from wohnungen array
  const syncTotalsFromWohnungen = useCallback((wohnungen: Wohnung[]) => {
    const mietSum = wohnungen.reduce((s, w) => s + w.mietpreis, 0)
    const nkSum = wohnungen.reduce((s, w) => s + (w.nebenkosten ?? 0), 0)
    const updates: Partial<Project> = { wohnungen, monatsmieteKalt: mietSum }
    // Sync nebenkosten: hausgeld mode → hausgeldProMonat, else → nebenkostenProQm
    if (project.hausgeldModus === 'hausgeld' && project.propertyType === 'wohnung') {
      updates.hausgeldProMonat = nkSum
    } else {
      updates.nebenkostenProQm = project.wohnflaeche > 0 ? nkSum / project.wohnflaeche : 0
    }
    return updates
  }, [project.hausgeldModus, project.propertyType, project.wohnflaeche])

  // Sync Kaltmiete + Nebenkosten from Wohnungen sum when MFH
  const handleWohnungUpdate = useCallback((id: string, updates: Partial<Wohnung>) => {
    const wohnungen = (project.wohnungen ?? []).map(w => w.id === id ? { ...w, ...updates } : w)
    onChange(syncTotalsFromWohnungen(wohnungen))
  }, [project.wohnungen, onChange, syncTotalsFromWohnungen])

  const handleAddWohnung = useCallback(() => {
    const wohnungen = [...(project.wohnungen ?? [])]
    const avgNk = wohnungen.length > 0 ? Math.round(wohnungen.reduce((s, w) => s + (w.nebenkosten ?? 0), 0) / wohnungen.length) : 150
    const newW: Wohnung = { id: crypto.randomUUID(), qm: 60, mietpreis: 500, nebenkosten: avgNk }
    wohnungen.push(newW)
    onChange(syncTotalsFromWohnungen(wohnungen))
  }, [project.wohnungen, onChange, syncTotalsFromWohnungen])

  const handleRemoveWohnung = useCallback((id: string) => {
    const wohnungen = (project.wohnungen ?? []).filter(w => w.id !== id)
    onChange(syncTotalsFromWohnungen(wohnungen))
  }, [project.wohnungen, onChange, syncTotalsFromWohnungen])

  // Dynamic slider limits based on Kaufpreis
  const kaufpreis = project.kaufpreis
  const sliderLimits = useMemo(() => {
    const isOver10M = kaufpreis >= 10_000_000
    const isOver2M = kaufpreis >= 2_000_000
    const isOver1M = kaufpreis >= 1_000_000
    const isOver500k = kaufpreis >= 500_000
    return {
      kaltmieteMax: isOver10M ? 200_000 : isOver1M ? 50_000 : 15_000,
      kaltmieteStep: isOver10M ? 100 : isOver1M ? 50 : 10,
      hausgeldMax: isOver10M ? 50_000 : isOver2M ? 20_000 : isOver1M ? 10_000 : isOver500k ? 5_000 : 1_000,
      hausgeldStep: isOver10M ? 100 : isOver1M ? 50 : 10,
      nebenkostenMax: isOver10M ? 50_000 : isOver2M ? 20_000 : isOver1M ? 10_000 : isOver500k ? 5_000 : 1_000,
      nebenkostenStep: isOver10M ? 100 : isOver1M ? 50 : 10,
      ersparteMieteMax: isOver10M ? 50_000 : isOver1M ? 15_000 : 5_000,
      instandhaltungMax: isOver10M ? 100 : isOver1M ? 50 : 30,
    }
  }, [kaufpreis])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT: Sliders */}
      <div className="lg:col-span-7 space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Finanzierung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ParameterSlider
              label="Kaufpreis"
              value={project.kaufpreis}
              min={50000}
              max={20000000}
              step={5000}
              unit="€"
              scale="log"
              onChange={(v) => onChange({ kaufpreis: v })}
              formatValue={(v) => formatEur(v)}
            />
            <ParameterSlider
              label="Eigenkapital"
              value={project.eigenkapital}
              min={0}
              max={ekSliderMax}
              step={5000}
              unit="€"
              tooltip="eigenkapital"
              onChange={(v) => onChange({ eigenkapital: v })}
              formatValue={(v) => formatEur(v)}
            />
            <ParameterSlider
              label="Zinssatz"
              value={project.zinssatz}
              min={0.5}
              max={8}
              step={0.1}
              unit="%"
              tooltip="zinssatz"
              onChange={(v) => onChange({ zinssatz: v })}
              formatValue={(v) => `${v.toFixed(1)} %`}
            />
            <ParameterSlider
              label="Tilgung"
              value={project.tilgung}
              min={1}
              max={10}
              step={0.1}
              unit="%"
              tooltip="tilgung"
              onChange={(v) => onChange({ tilgung: v })}
              formatValue={(v) => `${v.toFixed(1)} %`}
            />
            {project.nutzungsart === 'vermietung' ? (
              <div className="space-y-0">
                <ParameterSlider
                  label="Kaltmiete"
                  value={project.monatsmieteKalt}
                  min={100}
                  max={sliderLimits.kaltmieteMax}
                  step={sliderLimits.kaltmieteStep}
                  unit="€/Mon"
                  onChange={(v) => onChange({ monatsmieteKalt: v })}
                  formatValue={(v) => `${v.toLocaleString('de-DE')} €/Mon`}
                />
                {/* MFH Toggle - always visible */}
                <label className="flex items-center gap-2 mt-1.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={project.isMehrfamilienhaus ?? false}
                    onChange={(e) => {
                      const checked = e.target.checked
                      if (checked && (!project.wohnungen || project.wohnungen.length === 0)) {
                        // Initialize with one default apartment
                        const currentNk = project.hausgeldModus === 'hausgeld' && project.propertyType === 'wohnung'
                          ? project.hausgeldProMonat
                          : project.nebenkostenProQm * project.wohnflaeche
                        onChange({
                          isMehrfamilienhaus: true,
                          wohnungen: [{ id: crypto.randomUUID(), qm: project.wohnflaeche || 60, mietpreis: project.monatsmieteKalt || 500, nebenkosten: Math.round(currentNk) || 150 }],
                        })
                        setMfhOpen(true)
                      } else {
                        onChange({ isMehrfamilienhaus: checked })
                        if (!checked) setMfhOpen(false)
                      }
                    }}
                    className="h-3.5 w-3.5 rounded border-input accent-teal-600"
                  />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                    Mehrere Wohnungen im Objekt
                  </span>
                </label>
                {/* MFH Dropdown */}
                {project.isMehrfamilienhaus && (
                  <div className="mt-1.5">
                    <button
                      onClick={() => {
                        const wasOpen = mfhOpen
                        setMfhOpen(!mfhOpen)
                        // When closing the dropdown, check for qm mismatch and auto-show dialog
                        if (wasOpen && !qmMismatchDismissed) {
                          const sumQm = (project.wohnungen ?? []).reduce((s, w) => s + w.qm, 0)
                          if ((project.wohnungen ?? []).length > 0 && Math.abs(sumQm - project.wohnflaeche) > 0.5) {
                            setPendingQmSum(sumQm)
                            setQmMismatchOpen(true)
                          }
                        }
                      }}
                      className="flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
                    >
                      <Home className="h-3.5 w-3.5" />
                      Wohnungen bearbeiten ({(project.wohnungen ?? []).length} Einheiten · {wohnungenSumme.toLocaleString('de-DE')} €/Mon)
                      {mfhOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                    {mfhOpen && (
                      <div className="mt-2 p-3 rounded-lg bg-muted/40 border border-border/50 space-y-2">
                        {/* Header row */}
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium px-0.5">
                          <span className="w-10">Nr.</span>
                          <span className="w-16 text-right">m²</span>
                          <span className="w-20 text-right ml-3">Miete</span>
                          <span className="ml-2">€/m²</span>
                        </div>
                        {/* Scrollable list */}
                        <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                          {(project.wohnungen ?? []).map((w, idx) => {
                            const pricePerQm = w.qm > 0 ? w.mietpreis / w.qm : 0
                            const diff = markt.mietpreisProQm > 0 ? ((pricePerQm / markt.mietpreisProQm) - 1) * 100 : 0
                            return (
                              <div key={w.id} className="flex items-center gap-2 text-xs">
                                <span className="text-muted-foreground font-medium shrink-0 w-10">WE {idx + 1}</span>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    value={w.qm}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => handleWohnungUpdate(w.id, { qm: Math.max(1, Number(e.target.value) || 0) })}
                                    className="w-16 h-7 rounded border border-input bg-background px-1.5 text-xs tabular-nums text-right"
                                  />
                                  <span className="text-muted-foreground">m²</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    value={w.mietpreis}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => handleWohnungUpdate(w.id, { mietpreis: Math.max(0, Number(e.target.value) || 0) })}
                                    className="w-20 h-7 rounded border border-input bg-background px-1.5 text-xs tabular-nums text-right"
                                  />
                                  <span className="text-muted-foreground">€</span>
                                </div>
                                <span className="text-muted-foreground tabular-nums shrink-0">
                                  ({pricePerQm.toFixed(2)} €/m²)
                                </span>
                                <span className={`tabular-nums text-[10px] font-medium shrink-0 ${diff >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                  {diff >= 0 ? '+' : ''}{diff.toFixed(0)}%
                                </span>
                                <button onClick={() => handleRemoveWohnung(w.id)} className="ml-auto text-muted-foreground hover:text-red-500 transition-colors shrink-0">
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                        {/* Footer: Add + Totals */}
                        <div className="pt-2 border-t border-border/50 space-y-2">
                          <div className="flex items-center justify-between">
                            {(project.wohnungen ?? []).length < MAX_WOHNUNGEN ? (
                              <button
                                onClick={handleAddWohnung}
                                className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors"
                              >
                                <Plus className="h-3 w-3" /> Wohnung hinzufügen
                              </button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">Max. {MAX_WOHNUNGEN} Einheiten</span>
                            )}
                            <span className="text-xs font-semibold tabular-nums">
                              Gesamt: {wohnungenSumme.toLocaleString('de-DE')} €/Mon
                            </span>
                          </div>
                          {/* QM Summary */}
                          <div className="text-[10px] text-muted-foreground">
                            Summe m²: <span className="font-semibold tabular-nums">{wohnungenQmSumme.toLocaleString('de-DE')} m²</span>
                            <span className="ml-1">(Projekt: {project.wohnflaeche.toLocaleString('de-DE')} m²)</span>
                          </div>
                          {qmMismatch && (
                            <button
                              type="button"
                              onClick={() => { setPendingQmSum(wohnungenQmSumme); setQmMismatchOpen(true); setQmMismatchDismissed(false) }}
                              className="flex items-center gap-1.5 w-full p-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors"
                            >
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                              <span>Wohnfläche weicht ab: {wohnungenQmSumme.toLocaleString('de-DE')} m² vs. {project.wohnflaeche.toLocaleString('de-DE')} m² — Klicke um anzupassen</span>
                            </button>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            Vergleich: {markt.mietpreisProQm.toFixed(2)} €/m² ({BUNDESLAND_LABELS[project.bundesland]})
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* QM Mismatch Dialog */}
                <Dialog open={qmMismatchOpen} onOpenChange={setQmMismatchOpen}>
                  <DialogHeader>
                    <DialogTitle>Wohnfläche anpassen?</DialogTitle>
                  </DialogHeader>
                  <DialogContent onClose={() => setQmMismatchOpen(false)}>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">Die Quadratmeterzahlen stimmen nicht überein.</p>
                          <p className="text-muted-foreground mt-1">
                            Summe der Wohnungen: <span className="font-semibold tabular-nums">{pendingQmSum.toLocaleString('de-DE')} m²</span>
                          </p>
                          <p className="text-muted-foreground">
                            Aktuelle Wohnfläche im Projekt: <span className="font-semibold tabular-nums">{project.wohnflaeche.toLocaleString('de-DE')} m²</span>
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Soll die Gesamt-Wohnfläche auf <span className="font-semibold">{pendingQmSum.toLocaleString('de-DE')} m²</span> aktualisiert werden?
                        Dies beeinflusst AfA, Nebenkosten und Instandhaltungsberechnungen.
                      </p>
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => { setQmMismatchOpen(false); setQmMismatchDismissed(true) }}
                          className="px-4 py-2 text-sm rounded-md border hover:bg-muted transition-colors"
                        >
                          Beibehalten
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onChange({ wohnflaeche: pendingQmSum })
                            setQmMismatchOpen(false)
                          }}
                          className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                        >
                          Auf {pendingQmSum.toLocaleString('de-DE')} m² ändern
                        </button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <ParameterSlider
                label="Ersparte Miete"
                value={project.ersparteMiete}
                min={0}
                max={sliderLimits.ersparteMieteMax}
                step={sliderLimits.kaltmieteStep}
                unit="€/Mon"
                onChange={(v) => onChange({ ersparteMiete: v })}
                formatValue={(v) => `${v.toLocaleString('de-DE')} €/Mon`}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Nebenkosten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.hausgeldModus === 'hausgeld' && project.propertyType === 'wohnung' ? (
              <ParameterSlider
                label="Hausgeld"
                value={project.hausgeldProMonat}
                min={0}
                max={sliderLimits.hausgeldMax}
                step={sliderLimits.hausgeldStep}
                unit="€/Mon"
                onChange={(v) => onChange({ hausgeldProMonat: v })}
                formatValue={(v) => `${v.toLocaleString('de-DE')} €/Mon`}
              />
            ) : (
              <ParameterSlider
                label="Nebenkosten"
                value={project.nebenkostenProQm * project.wohnflaeche}
                min={0}
                max={sliderLimits.nebenkostenMax}
                step={sliderLimits.nebenkostenStep}
                unit="€/Mon"
                onChange={(v) => onChange({ nebenkostenProQm: project.wohnflaeche > 0 ? v / project.wohnflaeche : 0 })}
                formatValue={(v) => `${v.toLocaleString('de-DE')} €/Mon`}
              />
            )}
            {/* MFH: Nebenkosten pro Wohnung */}
            {project.isMehrfamilienhaus && (project.wohnungen ?? []).length > 0 && (
              <div className="space-y-0">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={nebenkostenMfhOpen}
                    onChange={(e) => setNebenkostenMfhOpen(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-input accent-teal-600"
                  />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                    Nebenkosten pro Wohnung aufschlüsseln
                  </span>
                </label>
                {nebenkostenMfhOpen && (
                  <div className="mt-2 p-3 rounded-lg bg-muted/40 border border-border/50 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium px-0.5">
                      <span className="w-10">Nr.</span>
                      <span className="w-16 text-right">m²</span>
                      <span className="w-20 text-right ml-3">{project.hausgeldModus === 'hausgeld' && project.propertyType === 'wohnung' ? 'Hausgeld' : 'NK'}</span>
                      <span className="ml-2">€/m²</span>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {(project.wohnungen ?? []).map((w, idx) => {
                        const nkPerQm = w.qm > 0 ? (w.nebenkosten ?? 0) / w.qm : 0
                        return (
                          <div key={w.id} className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground font-medium shrink-0 w-10">WE {idx + 1}</span>
                            <span className="w-16 text-right text-muted-foreground tabular-nums">{w.qm} m²</span>
                            <div className="flex items-center gap-1 ml-3">
                              <input
                                type="number"
                                value={w.nebenkosten ?? 0}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => handleWohnungUpdate(w.id, { nebenkosten: Math.max(0, Number(e.target.value) || 0) })}
                                className="w-20 h-7 rounded border border-input bg-background px-1.5 text-xs tabular-nums text-right"
                              />
                              <span className="text-muted-foreground">€</span>
                            </div>
                            <span className="text-muted-foreground tabular-nums shrink-0 text-[10px]">
                              ({nkPerQm.toFixed(2)} €/m²)
                            </span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Ø {((project.wohnungen ?? []).length > 0 && wohnungenQmSumme > 0
                          ? (wohnungenNebenkostenSumme / wohnungenQmSumme).toFixed(2)
                          : '0.00')} €/m²
                      </span>
                      <span className="font-semibold tabular-nums">
                        Gesamt: {wohnungenNebenkostenSumme.toLocaleString('de-DE')} €/Mon
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
            <ParameterSlider
              label="Umlagefähig"
              value={project.umlagefaehigAnteil}
              min={0}
              max={100}
              step={5}
              unit="%"
              onChange={(v) => onChange({ umlagefaehigAnteil: v })}
              formatValue={(v) => `${v.toFixed(0)} %`}
            />
            <ParameterSlider
              label="Instandhaltung"
              value={project.instandhaltungProQm}
              min={0}
              max={sliderLimits.instandhaltungMax}
              step={0.5}
              unit="€/m²"
              onChange={(v) => onChange({ instandhaltungProQm: v })}
              formatValue={(v) => `${v.toFixed(1)} €/m²`}
            />
            <ParameterSlider
              label="Mietausfallwagnis"
              value={project.mietausfallwagnis}
              min={0}
              max={10}
              step={0.5}
              unit="%"
              onChange={(v) => onChange({ mietausfallwagnis: v })}
              formatValue={(v) => `${v.toFixed(1)} %`}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Kaufnebenkosten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ParameterSlider
              label="Maklerprovision"
              value={project.maklerProvision}
              min={0}
              max={7.14}
              step={0.01}
              unit="%"
              onChange={(v) => onChange({ maklerProvision: v })}
              formatValue={(v) => `${v.toFixed(2)} %`}
            />
            <ParameterSlider
              label="Notar & Grundbuch"
              value={project.notarUndGrundbuch}
              min={0}
              max={3}
              step={0.1}
              unit="%"
              onChange={(v) => onChange({ notarUndGrundbuch: v })}
              formatValue={(v) => `${v.toFixed(1)} %`}
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Grunderwerbsteuer ({BUNDESLAND_LABELS[project.bundesland]})
              </span>
              <span className="font-medium tabular-nums">
                {GRUNDERWERBSTEUER_SAETZE[project.bundesland].toFixed(1)} %
              </span>
            </div>
            {/* €-Aufschlüsselung */}
            <div className="space-y-1.5 pt-3 border-t text-xs">
              {project.beweglicheGegenstaende > 0 && (
                <div className="flex justify-between text-teal-600">
                  <span>Bemessungsgrundlage (KP − Bewegl.)</span>
                  <span className="tabular-nums font-medium">{formatEur(Math.max(0, project.kaufpreis - project.beweglicheGegenstaende))}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Grunderwerbsteuer ({GRUNDERWERBSTEUER_SAETZE[project.bundesland].toFixed(1)} %)</span>
                <span className="tabular-nums font-medium">{formatEur(result.kaufnebenkosten.grunderwerbsteuer)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Notar & Grundbuch ({project.notarUndGrundbuch.toFixed(1)} %)</span>
                <span className="tabular-nums font-medium">{formatEur(result.kaufnebenkosten.notarkosten)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Makler ({project.maklerProvision.toFixed(2)} %)</span>
                <span className="tabular-nums font-medium">{formatEur(result.kaufnebenkosten.maklerkosten)}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t text-sm font-semibold">
                <span>Nebenkosten gesamt</span>
                <span className="tabular-nums">{formatEur(result.kaufnebenkosten.kaufnebenkostenGesamt)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-primary">
                <span>Gesamtkosten</span>
                <span className="tabular-nums">{formatEur(result.kaufnebenkosten.gesamtkosten)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT: Cashflow Chart */}
      <div className="lg:col-span-5">
        <div className="h-[480px]">
          <MonthlyCashflowChart result={result} nutzungsart={project.nutzungsart} defaultTimeRange="10" />
        </div>
      </div>

      {/* FULL WIDTH: Jährliche Kosten & Finanzierungsstruktur */}
      <div className="lg:col-span-12 grid grid-cols-1 xl:grid-cols-2 gap-4">
        <CostBreakdownPieChart result={result} />
        <FinancingPieChart result={result} kaufpreis={project.kaufpreis} eigenkapital={project.eigenkapital} />
      </div>

      {/* FULL WIDTH: CashflowTable */}
      <div className="lg:col-span-12">
        <CashflowTable result={result} nutzungsart={project.nutzungsart} zinsbindung={project.zinsbindung} zinsbindungPeriods={project.zinsbindungPeriods} />
      </div>
    </div>
  )
}
