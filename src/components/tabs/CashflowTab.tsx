import type { Project, CalculationResult } from '@/calc/types'
import { ParameterSlider } from '@/components/simulation/ParameterSlider'
import { CashflowTable } from '@/components/results/CashflowTable'
import { KaufnebenkostenBreakdown } from '@/components/results/KaufnebenkostenBreakdown'
import { CostBreakdownPieChart } from '@/components/charts/CostBreakdownPieChart'
import { FinancingPieChart } from '@/components/charts/FinancingPieChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatEur } from '@/lib/format'
import { GRUNDERWERBSTEUER_SAETZE, BUNDESLAND_LABELS } from '@/calc/grunderwerbsteuer'

interface CashflowTabProps {
  project: Project
  result: CalculationResult
  onChange: (updates: Partial<Project>) => void
}

export function CashflowTab({ project, result, onChange }: CashflowTabProps) {
  const ekSliderMax = result.kaufnebenkosten.gesamtkosten

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
              <ParameterSlider
                label="Kaltmiete"
                value={project.monatsmieteKalt}
                min={100}
                max={10000}
                step={10}
                unit="€/Mon"
                onChange={(v) => onChange({ monatsmieteKalt: v })}
                formatValue={(v) => `${v.toLocaleString('de-DE')} €/Mon`}
              />
            ) : (
              <ParameterSlider
                label="Ersparte Miete"
                value={project.ersparteMiete}
                min={0}
                max={5000}
                step={10}
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
                max={1000}
                step={10}
                unit="€/Mon"
                onChange={(v) => onChange({ hausgeldProMonat: v })}
                formatValue={(v) => `${v.toLocaleString('de-DE')} €/Mon`}
              />
            ) : (
              <ParameterSlider
                label="Nebenkosten"
                value={project.nebenkostenProQm * project.wohnflaeche}
                min={0}
                max={1000}
                step={10}
                unit="€/Mon"
                onChange={(v) => onChange({ nebenkostenProQm: project.wohnflaeche > 0 ? v / project.wohnflaeche : 0 })}
                formatValue={(v) => `${v.toLocaleString('de-DE')} €/Mon`}
              />
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
              max={30}
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
            <div className="flex items-center justify-between text-sm pt-2 border-t">
              <span className="font-medium">Kaufnebenkosten gesamt</span>
              <span className="font-semibold tabular-nums">
                {formatEur(result.kaufnebenkosten.kaufnebenkosten)} ({(project.maklerProvision + project.notarUndGrundbuch + GRUNDERWERBSTEUER_SAETZE[project.bundesland]).toFixed(2)} %)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT: Pie charts */}
      <div className="lg:col-span-5 space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <CostBreakdownPieChart result={result} />
          <FinancingPieChart result={result} kaufpreis={project.kaufpreis} eigenkapital={project.eigenkapital} />
        </div>
      </div>

      {/* FULL WIDTH: CashflowTable + Kaufnebenkosten */}
      <div className="lg:col-span-12 space-y-6">
        <CashflowTable result={result} nutzungsart={project.nutzungsart} zinsbindung={project.zinsbindung} zinsbindungPeriods={project.zinsbindungPeriods} />
        <KaufnebenkostenBreakdown result={result.kaufnebenkosten} kaufpreis={project.kaufpreis} />
      </div>
    </div>
  )
}
