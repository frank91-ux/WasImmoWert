import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { useProjectStore } from '@/store/useProjectStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AddressAutocomplete, type PlaceResult } from '@/components/shared/AddressAutocomplete'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { calculateAll } from '@/calc'
import { createDefaultProject } from '@/calc/defaults'
import { getAssessment } from '@/lib/assessment'
import { BUNDESLAND_LABELS } from '@/calc/grunderwerbsteuer'
import { formatEur, formatPercent, formatFactor } from '@/lib/format'
import type { Bundesland } from '@/calc/types'
import { cn } from '@/lib/utils'
import {
  Home, Building2, MapPin, Ruler, Euro,
  ArrowRight, ArrowLeft, ChevronRight, ChevronDown,
  TrendingUp, TrendingDown, Minus, Lock, LogIn,
} from 'lucide-react'

const STEPS = ['Immobilientyp', 'Standort', 'Größe', 'Preis', 'Ergebnis']

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 max-w-2xl mx-auto">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center flex-1">
          <div className={`h-1.5 w-full rounded-full transition-colors ${
            i <= current ? 'bg-primary' : 'bg-muted'
          }`} />
        </div>
      ))}
    </div>
  )
}

export function PublicLandingPage() {
  const navigate = useNavigate()
  const { isAuthenticated, skip } = useAuthStore()
  const [step, setStep] = useState(0)

  // Wizard state
  const [propertyType, setPropertyType] = useState<'wohnung' | 'haus' | ''>('')
  const [bundesland, setBundesland] = useState<Bundesland>('bayern')
  const [address, setAddress] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [wohnflaeche, setWohnflaeche] = useState('')
  const [baujahr, setBaujahr] = useState('')
  const [kaufpreis, setKaufpreis] = useState('')
  const [kaltmiete, setKaltmiete] = useState('')
  const [eigenkapital, setEigenkapital] = useState('50000')
  const [zinssatz, setZinssatz] = useState('3.5')
  const [tilgung, setTilgung] = useState('2')
  const [showDefaults, setShowDefaults] = useState(false)

  const handlePlaceSelect = useCallback((place: PlaceResult) => {
    setAddress(place.address)
    setLat(place.lat)
    setLng(place.lng)
    // Auto-detect Bundesland from Google Places state name
    if (place.state) {
      const match = Object.entries(BUNDESLAND_LABELS).find(
        ([, label]) => label.toLowerCase() === place.state!.toLowerCase()
      )
      if (match) setBundesland(match[0] as Bundesland)
    }
  }, [])

  const bundeslandOptions = Object.entries(BUNDESLAND_LABELS).map(
    ([value, label]) => ({ value, label })
  )

  const canProceed = () => {
    switch (step) {
      case 0: return propertyType !== ''
      case 1: return true // Bundesland always has default
      case 2: return Number(wohnflaeche) > 0
      case 3: return Number(kaufpreis) > 0 && Number(kaltmiete) > 0
      default: return true
    }
  }

  const result = useMemo(() => {
    if (step < 4 || Number(kaufpreis) <= 0 || Number(kaltmiete) <= 0 || Number(wohnflaeche) <= 0) return null
    const project = createDefaultProject({
      address,
      kaufpreis: Number(kaufpreis),
      monatsmieteKalt: Number(kaltmiete),
      wohnflaeche: Number(wohnflaeche),
      bundesland,
      eigenkapital: Number(eigenkapital),
      zinssatz: Number(zinssatz),
      tilgung: Number(tilgung),
    })
    return calculateAll(project)
  }, [step, kaufpreis, kaltmiete, wohnflaeche, address, bundesland, eigenkapital, zinssatz, tilgung])

  const assessment = result ? getAssessment(result) : null

  const handleCTA = () => {
    if (!isAuthenticated()) {
      skip()
    }
    // F2: Create project with wizard data and navigate to it
    const { addProject } = useProjectStore.getState()
    const newProject = addProject({
      address,
      lat,
      lng,
      kaufpreis: Number(kaufpreis),
      monatsmieteKalt: Number(kaltmiete),
      wohnflaeche: Number(wohnflaeche),
      bundesland,
      baujahr: Number(baujahr) || undefined,
      eigenkapital: Number(eigenkapital),
      zinssatz: Number(zinssatz),
      tilgung: Number(tilgung),
      name: address || `${propertyType === 'wohnung' ? 'Wohnung' : 'Haus'} – ${BUNDESLAND_LABELS[bundesland]}`,
    })
    navigate(`/projects/${newProject.id}`)
  }

  const handleLogin = () => {
    navigate('/app')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-2.5 font-bold text-lg">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span>Was-Immo-Wert</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogin} className="rounded-lg">
            <LogIn className="h-4 w-4" />
            Anmelden
          </Button>
        </div>
      </header>

      {/* Progress */}
      <div className="px-4 pt-6 pb-4">
        <ProgressBar current={step} total={STEPS.length} />
        <p className="text-center text-xs text-muted-foreground mt-2">
          Schritt {step + 1} von {STEPS.length}: {STEPS[step]}
        </p>
      </div>

      {/* Step Content */}
      <main className="max-w-2xl mx-auto px-4 pb-8">
        {step === 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">Was möchten Sie bewerten?</h1>
              <p className="text-muted-foreground">Wählen Sie den Immobilientyp</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card
                className={`cursor-pointer transition-all hover:shadow-md ${
                  propertyType === 'wohnung' ? 'border-2 border-primary ring-2 ring-primary/20' : 'border-2 border-transparent'
                }`}
                onClick={() => { setPropertyType('wohnung'); setTimeout(() => setStep(1), 300) }}
              >
                <CardContent className="p-6 text-center">
                  <Building2 className="h-12 w-12 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold text-lg">Wohnung</h3>
                  <p className="text-sm text-muted-foreground mt-1">Eigentumswohnung</p>
                </CardContent>
              </Card>
              <Card
                className={`cursor-pointer transition-all hover:shadow-md ${
                  propertyType === 'haus' ? 'border-2 border-primary ring-2 ring-primary/20' : 'border-2 border-transparent'
                }`}
                onClick={() => { setPropertyType('haus'); setTimeout(() => setStep(1), 300) }}
              >
                <CardContent className="p-6 text-center">
                  <Home className="h-12 w-12 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold text-lg">Haus</h3>
                  <p className="text-sm text-muted-foreground mt-1">Einfamilien- / Mehrfamilienhaus</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2">
              <MapPin className="h-8 w-8 mx-auto text-primary" />
              <h1 className="text-2xl font-bold">Wo liegt die Immobilie?</h1>
              <p className="text-muted-foreground">Das Bundesland bestimmt die Grunderwerbsteuer</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="mb-1.5 block">Bundesland</Label>
                <Select
                  value={bundesland}
                  onChange={(e) => setBundesland(e.target.value as Bundesland)}
                  options={bundeslandOptions}
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Adresse (optional)</Label>
                <AddressAutocomplete
                  value={address}
                  onChange={setAddress}
                  onPlaceSelect={handlePlaceSelect}
                  placeholder="z.B. Hauptstr. 12, 10115 Berlin"
                  className="h-11"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2">
              <Ruler className="h-8 w-8 mx-auto text-primary" />
              <h1 className="text-2xl font-bold">Wie groß ist die Immobilie?</h1>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">Wohnfläche</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={wohnflaeche}
                    onChange={(e) => setWohnflaeche(e.target.value)}
                    placeholder="75"
                    className="h-11 pr-8"
                    min={1}
                  />
                  <span className="absolute right-3 top-3 text-sm text-muted-foreground">m²</span>
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block">Baujahr (optional)</Label>
                <Input
                  type="number"
                  value={baujahr}
                  onChange={(e) => setBaujahr(e.target.value)}
                  placeholder="1990"
                  className="h-11"
                  min={1800}
                  max={2030}
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2">
              <Euro className="h-8 w-8 mx-auto text-primary" />
              <h1 className="text-2xl font-bold">Was sind die Zahlen?</h1>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">Kaufpreis</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={kaufpreis}
                    onChange={(e) => setKaufpreis(e.target.value)}
                    placeholder="250.000"
                    className="h-11 pr-8"
                    min={0}
                    step={1000}
                  />
                  <span className="absolute right-3 top-3 text-sm text-muted-foreground">€</span>
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block">Kaltmiete / Monat</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={kaltmiete}
                    onChange={(e) => setKaltmiete(e.target.value)}
                    placeholder="800"
                    className="h-11 pr-8"
                    min={0}
                    step={10}
                  />
                  <span className="absolute right-3 top-3 text-sm text-muted-foreground">€</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mt-1 mx-auto transition-colors"
              onClick={() => setShowDefaults(!showDefaults)}
            >
              <ChevronDown className={cn('h-4 w-4 transition-transform', showDefaults && 'rotate-180')} />
              Finanzierung anpassen
            </button>

            {showDefaults && (
              <div className="grid grid-cols-3 gap-3 pt-3 border-t animate-in fade-in slide-in-from-top-2 duration-200">
                <div>
                  <Label className="mb-1 block text-xs">Eigenkapital</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={eigenkapital}
                      onChange={(e) => setEigenkapital(e.target.value)}
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
                      onChange={(e) => setZinssatz(e.target.value)}
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
                      onChange={(e) => setTilgung(e.target.value)}
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
              <p className="text-xs text-muted-foreground text-center">
                {formatEur(Number(eigenkapital))} EK, {zinssatz}% Zins, {tilgung}% Tilgung
              </p>
            )}
          </div>
        )}

        {step === 4 && result && assessment && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">Ihre Schnellbewertung</h1>
              <p className="text-muted-foreground">
                {propertyType === 'wohnung' ? 'Wohnung' : 'Haus'} · {address || BUNDESLAND_LABELS[bundesland]} · {wohnflaeche} m²
              </p>
            </div>

            {/* Assessment card */}
            <Card className={`border-2 ${
              assessment.rating === 'good' ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800'
              : assessment.rating === 'okay' ? 'border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800'
              : 'border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full p-2.5">
                    {assessment.rating === 'good' ? <TrendingUp className="h-6 w-6 text-emerald-600" /> :
                     assessment.rating === 'okay' ? <Minus className="h-6 w-6 text-amber-600" /> :
                     <TrendingDown className="h-6 w-6 text-red-600" />}
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold ${
                      assessment.rating === 'good' ? 'text-emerald-700 dark:text-emerald-400'
                      : assessment.rating === 'okay' ? 'text-amber-700 dark:text-amber-400'
                      : 'text-red-700 dark:text-red-400'
                    }`}>{assessment.headline}</h3>
                    <p className="text-muted-foreground">{assessment.summary}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* KPI grid – first 2 visible, last 2 blurred */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Cashflow/Mon</p>
                  <p className={`text-lg font-bold tabular-nums ${result.kpis.monatlichCashflowNachSteuer >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatEur(result.kpis.monatlichCashflowNachSteuer)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Bruttomietrendite</p>
                  <p className="text-lg font-bold tabular-nums">{formatPercent(result.kpis.bruttomietrendite)}</p>
                </CardContent>
              </Card>
              <Card className="relative overflow-hidden">
                <CardContent className="p-3 blur-sm select-none">
                  <p className="text-xs text-muted-foreground">Kaufpreisfaktor</p>
                  <p className="text-lg font-bold tabular-nums">{formatFactor(result.kpis.kaufpreisfaktor)}</p>
                </CardContent>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
              </Card>
              <Card className="relative overflow-hidden">
                <CardContent className="p-3 blur-sm select-none">
                  <p className="text-xs text-muted-foreground">EK-Rendite</p>
                  <p className="text-lg font-bold tabular-nums">{formatPercent(result.kpis.eigenkapitalrendite)}</p>
                </CardContent>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
              </Card>
            </div>

            {/* Detail bullets */}
            <Card>
              <CardContent className="p-5">
                <ul className="space-y-2">
                  {assessment.details.slice(0, 2).map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span>{d}</span>
                    </li>
                  ))}
                  {assessment.details.length > 2 && (
                    <li className="flex items-start gap-2 text-sm text-muted-foreground blur-[3px] select-none">
                      <ChevronRight className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{assessment.details[2]}</span>
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>

            {/* CTA */}
            <div className="space-y-3">
              <Button size="lg" className="w-full" onClick={handleCTA}>
                Kostenlose Detailanalyse starten
                <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Cashflow-Tabelle · Steuerberechnung · Simulation · Vergleiche & mehr
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {step > 0 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="h-4 w-4" />
              Zurück
            </Button>
          ) : <div />}
          {step < 4 && (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Weiter
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}
