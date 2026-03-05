import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '@/store/useProjectStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AddressAutocomplete, type PlaceResult } from '@/components/shared/AddressAutocomplete'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExplanationTooltip } from '@/components/shared/ExplanationTooltip'
import { ArrowRight, Building2, TrendingUp, TrendingDown, Minus, ChevronRight, ChevronDown, BarChart3, SlidersHorizontal, GitCompare } from 'lucide-react'
import { calculateAll } from '@/calc'
import { createDefaultProject } from '@/calc/defaults'
import { formatEur, formatPercent, formatFactor } from '@/lib/format'
import { getAssessment } from '@/lib/assessment'
import { useUiStore } from '@/store/useUiStore'
import { cn } from '@/lib/utils'
import type { CalculationResult } from '@/calc/types'

function QuickResult({ result, onDetails }: { result: CalculationResult; onDetails: () => void }) {
  const assessment = getAssessment(result)
  const { kpis } = result

  const ratingConfig = {
    good: { color: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800', textColor: 'text-emerald-700 dark:text-emerald-400', icon: TrendingUp, badge: 'success' as const },
    okay: { color: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800', textColor: 'text-amber-700 dark:text-amber-400', icon: Minus, badge: 'warning' as const },
    bad: { color: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800', textColor: 'text-red-700 dark:text-red-400', icon: TrendingDown, badge: 'destructive' as const },
  }
  const config = ratingConfig[assessment.rating]
  const Icon = config.icon

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Assessment card */}
      <Card className={`border-2 ${config.color}`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className={`rounded-full p-2.5 ${config.color}`}>
              <Icon className={`h-6 w-6 ${config.textColor}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`text-xl font-bold ${config.textColor}`}>{assessment.headline}</h3>
                <Badge variant={config.badge}>
                  {formatEur(kpis.monatlichCashflowNachSteuer)}/Mon
                </Badge>
              </div>
              <p className="text-muted-foreground">{assessment.summary}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Monatl. Cashflow"
          value={formatEur(kpis.monatlichCashflowNachSteuer)}
          trend={kpis.monatlichCashflowNachSteuer >= 0 ? 'positive' : 'negative'}
          tooltip="cashflow"
        />
        <MetricCard
          label="Bruttomietrendite"
          value={formatPercent(kpis.bruttomietrendite)}
          trend={kpis.bruttomietrendite >= 4 ? 'positive' : kpis.bruttomietrendite >= 3 ? 'neutral' : 'negative'}
          tooltip="bruttomietrendite"
        />
        <MetricCard
          label="Kaufpreisfaktor"
          value={formatFactor(kpis.kaufpreisfaktor)}
          trend={kpis.kaufpreisfaktor <= 20 ? 'positive' : kpis.kaufpreisfaktor <= 25 ? 'neutral' : 'negative'}
          tooltip="kaufpreisfaktor"
        />
        <MetricCard
          label="EK-Rendite"
          value={formatPercent(kpis.eigenkapitalrendite)}
          trend={kpis.eigenkapitalrendite >= 6 ? 'positive' : kpis.eigenkapitalrendite >= 3 ? 'neutral' : 'negative'}
          tooltip="eigenkapitalrendite"
        />
      </div>

      {/* Detail bullets */}
      <Card>
        <CardContent className="p-5">
          <ul className="space-y-2">
            {assessment.details.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* CTA */}
      <Button size="lg" className="w-full" onClick={onDetails}>
        Detailanalyse & Simulation
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

function MetricCard({ label, value, trend, tooltip }: {
  label: string; value: string; trend: 'positive' | 'negative' | 'neutral'; tooltip: string
}) {
  const trendColor = trend === 'positive' ? 'text-success' : trend === 'negative' ? 'text-destructive' : 'text-foreground'
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground mb-0.5">
          <ExplanationTooltip term={tooltip}>{label}</ExplanationTooltip>
        </div>
        <div className={`text-lg font-bold tabular-nums ${trendColor}`}>{value}</div>
      </CardContent>
    </Card>
  )
}

export function LandingPage() {
  const navigate = useNavigate()
  const { loaded, loadProjects, addProject, projects } = useProjectStore()
  const { defaultBundesland } = useUiStore()
  const [address, setAddress] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [kaufpreis, setKaufpreis] = useState('')
  const [miete, setMiete] = useState('')
  const [qm, setQm] = useState('')
  const [showResult, setShowResult] = useState(false)

  // Adjustable defaults
  const [showDefaults, setShowDefaults] = useState(false)
  const [eigenkapital, setEigenkapital] = useState('50000')
  const [zinssatz, setZinssatz] = useState('3.5')
  const [tilgung, setTilgung] = useState('2')

  // Load projects on mount so sidebar works
  if (!loaded) loadProjects()

  const canCalculate = Number(kaufpreis) > 0 && Number(miete) > 0 && Number(qm) > 0

  const result = useMemo<CalculationResult | null>(() => {
    if (!canCalculate) return null
    const project = createDefaultProject({
      address,
      kaufpreis: Number(kaufpreis),
      monatsmieteKalt: Number(miete),
      wohnflaeche: Number(qm),
      eigenkapital: Number(eigenkapital),
      zinssatz: Number(zinssatz),
      tilgung: Number(tilgung),
      bundesland: defaultBundesland,
    })
    return calculateAll(project)
  }, [address, kaufpreis, miete, qm, canCalculate, eigenkapital, zinssatz, tilgung, defaultBundesland])

  const handleAnalyze = () => {
    if (!canCalculate) return
    setShowResult(true)
  }

  const handleDetails = () => {
    const project = addProject({
      name: address || `Immobilie ${formatEur(Number(kaufpreis))}`,
      address,
      lat,
      lng,
      kaufpreis: Number(kaufpreis),
      monatsmieteKalt: Number(miete),
      wohnflaeche: Number(qm),
      eigenkapital: Number(eigenkapital),
      zinssatz: Number(zinssatz),
      tilgung: Number(tilgung),
    })
    navigate(`/projects/${project.id}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canCalculate) handleAnalyze()
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3 pt-4 lg:pt-8">
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
          Lohnt sich die Immobilie?
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Geben Sie die Eckdaten ein und erhalten Sie sofort eine Einschätzung der Rentabilität.
        </p>
      </div>

      {/* Quick input form */}
      <Card className="max-w-2xl mx-auto border-2">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label className="mb-1.5 block text-sm font-medium">Adresse / Ort</Label>
              <AddressAutocomplete
                value={address}
                onChange={setAddress}
                onPlaceSelect={useCallback((place: PlaceResult) => {
                  setAddress(place.address)
                  setLat(place.lat)
                  setLng(place.lng)
                }, [])}
                placeholder="z.B. Berlin Neukölln, Hauptstr. 12"
                className="h-11"
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm font-medium">Kaufpreis</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={kaufpreis}
                  onChange={(e) => { setKaufpreis(e.target.value); setShowResult(false) }}
                  onKeyDown={handleKeyDown}
                  placeholder="250.000"
                  className="h-11 pr-8"
                  min={0}
                  step={1000}
                />
                <span className="absolute right-3 top-3 text-sm text-muted-foreground pointer-events-none">€</span>
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block text-sm font-medium">Kaltmiete / Monat</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={miete}
                  onChange={(e) => { setMiete(e.target.value); setShowResult(false) }}
                  onKeyDown={handleKeyDown}
                  placeholder="800"
                  className="h-11 pr-8"
                  min={0}
                  step={10}
                />
                <span className="absolute right-3 top-3 text-sm text-muted-foreground pointer-events-none">€</span>
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block text-sm font-medium">Wohnfläche</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={qm}
                  onChange={(e) => { setQm(e.target.value); setShowResult(false) }}
                  onKeyDown={handleKeyDown}
                  placeholder="70"
                  className="h-11 pr-8"
                  min={1}
                />
                <span className="absolute right-3 top-3 text-sm text-muted-foreground pointer-events-none">m²</span>
              </div>
            </div>
            <div className="flex items-end">
              <Button
                size="lg"
                className="w-full h-11"
                disabled={!canCalculate}
                onClick={handleAnalyze}
              >
                <Building2 className="h-4 w-4" />
                Bewerten
              </Button>
            </div>
          </div>

          <button
            type="button"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mt-3 mx-auto transition-colors"
            onClick={() => setShowDefaults(!showDefaults)}
          >
            <ChevronDown className={cn(
              'h-4 w-4 transition-transform',
              showDefaults && 'rotate-180'
            )} />
            Annahmen anpassen
          </button>

          {showDefaults && (
            <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t animate-in fade-in slide-in-from-top-2 duration-200">
              <div>
                <Label className="mb-1 block text-xs">Eigenkapital</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={eigenkapital}
                    onChange={(e) => { setEigenkapital(e.target.value); setShowResult(false) }}
                    className="h-9 pr-6 text-sm"
                    min={0}
                    step={1000}
                  />
                  <span className="absolute right-2 top-2 text-xs text-muted-foreground pointer-events-none">€</span>
                </div>
              </div>
              <div>
                <Label className="mb-1 block text-xs">Zinssatz</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={zinssatz}
                    onChange={(e) => { setZinssatz(e.target.value); setShowResult(false) }}
                    className="h-9 pr-6 text-sm"
                    min={0}
                    max={15}
                    step={0.1}
                  />
                  <span className="absolute right-2 top-2 text-xs text-muted-foreground pointer-events-none">%</span>
                </div>
              </div>
              <div>
                <Label className="mb-1 block text-xs">Tilgung</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={tilgung}
                    onChange={(e) => { setTilgung(e.target.value); setShowResult(false) }}
                    className="h-9 pr-6 text-sm"
                    min={0}
                    max={15}
                    step={0.1}
                  />
                  <span className="absolute right-2 top-2 text-xs text-muted-foreground pointer-events-none">%</span>
                </div>
              </div>
            </div>
          )}

          {!showDefaults && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Berechnung mit Annahmen: {formatEur(Number(eigenkapital))} EK, {zinssatz}% Zins, {tilgung}% Tilgung
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick result */}
      {showResult && result && (
        <div className="max-w-2xl mx-auto">
          <QuickResult result={result} onDetails={handleDetails} />
        </div>
      )}

      {/* Existing projects */}
      {projects.length > 0 && (
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Ihre Projekte</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
              Alle anzeigen <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {projects.slice(0, 4).map((p) => (
              <Card
                key={p.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/projects/${p.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="font-medium truncate">{p.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatEur(p.kaufpreis)} &middot; {formatEur(p.monatsmieteKalt)}/Mon
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Features */}
      {!showResult && (
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <FeatureCard
            icon={BarChart3}
            title="Detailanalyse"
            description="Kaufnebenkosten, Cashflow, Steuer-Breakdown, AfA und alle relevanten KPIs."
          />
          <FeatureCard
            icon={SlidersHorizontal}
            title="Simulation"
            description="Kaufpreis, Miete, Zinsen, Tilgung per Regler verstellen. Ergebnisse in Echtzeit."
          />
          <FeatureCard
            icon={GitCompare}
            title="Vergleich"
            description="Projekte nebeneinander vergleichen. Immobilie vs. ETF vs. Alternativen."
          />
        </div>
      )}
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="p-5 text-center">
        <Icon className="h-8 w-8 text-primary mx-auto mb-3" />
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
