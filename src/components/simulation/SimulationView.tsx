import type { Project, ZinsbindungPeriod } from '@/calc/types'
import { useSimulationStore } from '@/store/useSimulationStore'
import { useUiStore } from '@/store/useUiStore'
import { useCalculation } from '@/hooks/useCalculation'
import { ParameterSlider } from './ParameterSlider'
import { ZinsbindungSection } from './ZinsbindungSection'
import { KpiOverview } from '@/components/results/KpiOverview'
import { CashflowTable } from '@/components/results/CashflowTable'
import { InvestmentComparisonChart } from '@/components/charts/InvestmentComparisonChart'
import { Button } from '@/components/ui/button'
import { RotateCcw, Check } from 'lucide-react'
import { formatEur } from '@/lib/format'

interface SimulationViewProps {
  project: Project
  onApply: (updates: Partial<Project>) => void
}

export function SimulationView({ project, onApply }: SimulationViewProps) {
  const { overrides, setOverride, resetOverrides, getSimulatedProject } = useSimulationStore()
  const { mode } = useUiStore()
  const simulated = getSimulatedProject(project)
  const result = useCalculation(simulated)

  const handleApply = () => {
    onApply(overrides)
    resetOverrides()
  }

  if (!result) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Simulation: {project.name}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetOverrides}>
            <RotateCcw className="h-4 w-4" />
            Zurücksetzen
          </Button>
          <Button size="sm" onClick={handleApply}>
            <Check className="h-4 w-4" />
            Übernehmen
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Kauf & Finanzierung</h3>
            <ParameterSlider
              label="Kaufpreis"
              value={simulated.kaufpreis}
              min={50000}
              max={20000000}
              step={5000}
              unit="€"
              scale="log"
              onChange={(v) => setOverride('kaufpreis', v)}
              formatValue={(v) => formatEur(v)}
            />
            <ParameterSlider
              label="Eigenkapital"
              value={simulated.eigenkapital}
              min={0}
              max={Math.max(simulated.kaufpreis, 500000)}
              step={5000}
              unit="€"
              tooltip="eigenkapital"
              onChange={(v) => setOverride('eigenkapital', v)}
              formatValue={(v) => formatEur(v)}
            />
            <ParameterSlider
              label="Zinssatz"
              value={simulated.zinssatz}
              min={0.5}
              max={8}
              step={0.1}
              unit="%"
              tooltip="zinssatz"
              onChange={(v) => setOverride('zinssatz', v)}
              formatValue={(v) => `${v.toFixed(1)} %`}
            />
            <ParameterSlider
              label="Tilgung"
              value={simulated.tilgung}
              min={1}
              max={10}
              step={0.1}
              unit="%"
              tooltip="tilgung"
              onChange={(v) => setOverride('tilgung', v)}
              formatValue={(v) => `${v.toFixed(1)} %`}
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Mieteinnahmen</h3>
            <ParameterSlider
              label="Kaltmiete"
              value={simulated.monatsmieteKalt}
              min={100}
              max={10000}
              step={10}
              unit="€/Mon"
              onChange={(v) => setOverride('monatsmieteKalt', v)}
              formatValue={(v) => `${v.toLocaleString('de-DE')} €/Mon`}
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Steuern</h3>
            <ParameterSlider
              label="Steuersatz"
              value={simulated.persoenlicherSteuersatz}
              min={0}
              max={45}
              step={1}
              unit="%"
              tooltip="persoenlicherSteuersatz"
              onChange={(v) => setOverride('persoenlicherSteuersatz', v)}
              formatValue={(v) => `${v} %`}
            />
          </div>

          <ZinsbindungSection
            project={simulated}
            periods={simulated.zinsbindungPeriods ?? []}
            onChange={(periods: ZinsbindungPeriod[]) => setOverride('zinsbindungPeriods', periods)}
          />

          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Wertentwicklung & Vergleich</h3>
            <ParameterSlider
              label="Wertsteigerung"
              value={simulated.wertsteigerung}
              min={-5}
              max={8}
              step={0.5}
              unit="% p.a."
              tooltip="wertsteigerung"
              onChange={(v) => setOverride('wertsteigerung', v)}
              formatValue={(v) => `${v.toFixed(1)} % p.a.`}
            />
            <ParameterSlider
              label="ETF-Rendite"
              value={simulated.etfRendite}
              min={1}
              max={15}
              step={0.5}
              unit="% p.a."
              onChange={(v) => setOverride('etfRendite', v)}
              formatValue={(v) => `${v.toFixed(1)} % p.a.`}
            />
            <ParameterSlider
              label="Anderes Investment"
              value={simulated.customRendite}
              min={0}
              max={20}
              step={0.5}
              unit="% p.a."
              onChange={(v) => setOverride('customRendite', v)}
              formatValue={(v) => `${v.toFixed(1)} % p.a.`}
            />
          </div>

          {mode === 'pro' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Weitere Parameter</h3>
              <ParameterSlider
                label="Mietausfallwagnis"
                value={simulated.mietausfallwagnis}
                min={0}
                max={10}
                step={0.5}
                unit="%"
                tooltip="mietausfallwagnis"
                onChange={(v) => setOverride('mietausfallwagnis', v)}
                formatValue={(v) => `${v} %`}
              />
              <ParameterSlider
                label="Instandhaltung"
                value={simulated.instandhaltungProQm}
                min={0}
                max={30}
                step={1}
                unit="€/m²/J"
                tooltip="instandhaltung"
                onChange={(v) => setOverride('instandhaltungProQm', v)}
                formatValue={(v) => `${v} €/m²/Jahr`}
              />
              <ParameterSlider
                label="Makler"
                value={simulated.maklerProvision}
                min={0}
                max={7}
                step={0.01}
                unit="%"
                tooltip="maklerProvision"
                onChange={(v) => setOverride('maklerProvision', v)}
                formatValue={(v) => `${v.toFixed(2)} %`}
              />
              <ParameterSlider
                label="Gebäudeanteil"
                value={100 - simulated.grundstueckAnteil}
                min={50}
                max={95}
                step={1}
                unit="%"
                tooltip="grundstueckAnteil"
                onChange={(v) => setOverride('grundstueckAnteil', 100 - v)}
                formatValue={(v) => `${v} %`}
              />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <KpiOverview
            result={result}
            nutzungsart={simulated.nutzungsart}
            eigenkapital={simulated.eigenkapital}
            gesamtkosten={result.kaufnebenkosten.gesamtkosten}
            project={simulated}
          />
          <CashflowTable result={result} nutzungsart={simulated.nutzungsart} />
          <InvestmentComparisonChart
            comparison={result.investmentComparison}
            eigenkapital={simulated.eigenkapital}
          />
        </div>
      </div>
    </div>
  )
}
