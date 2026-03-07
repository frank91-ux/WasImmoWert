import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { useProjectStore } from '@/store/useProjectStore'
import { useUiStore } from '@/store/useUiStore'
import { AddressAutocomplete, type PlaceResult } from '@/components/shared/AddressAutocomplete'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RentabilitaetBadge } from '@/components/results/RentabilitaetBadge'
import { calculateAll } from '@/calc'
import { calculateRentabilitaet } from '@/calc/rentabilitaet'
import { createDefaultProject } from '@/calc/defaults'
import { formatEur, formatPercent } from '@/lib/format'
import { ChevronDown, ArrowRight, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function NewProjectPage() {
  const navigate = useNavigate()
  const { addProject } = useProjectStore()
  const { defaultBundesland } = useUiStore()

  const [address, setAddress] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [kaufpreis, setKaufpreis] = useState('')
  const [miete, setMiete] = useState('')
  const [qm, setQm] = useState('')
  const [showDefaults, setShowDefaults] = useState(false)
  const [eigenkapital, setEigenkapital] = useState('50000')
  const [zinssatz, setZinssatz] = useState('3.5')
  const [tilgung, setTilgung] = useState('2')

  const canCreate = Number(kaufpreis) > 0 && Number(qm) > 0

  const preview = useMemo(() => {
    if (!canCreate || Number(miete) <= 0) return null
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
    const result = calculateAll(project)
    const score = calculateRentabilitaet(result.kpis, 'vermietung')
    return { result, score }
  }, [address, kaufpreis, miete, qm, eigenkapital, zinssatz, tilgung, canCreate, defaultBundesland])

  const handlePlaceSelect = useCallback((place: PlaceResult) => {
    setAddress(place.address)
    setLat(place.lat)
    setLng(place.lng)
  }, [])

  const handleCreate = () => {
    const project = addProject({
      name: (address ? address.split(',').slice(0, 2).map(s => s.trim()).join(', ') : '') || `Immobilie ${formatEur(Number(kaufpreis))}`,
      address,
      lat,
      lng,
      kaufpreis: Number(kaufpreis),
      monatsmieteKalt: Number(miete) || 0,
      wohnflaeche: Number(qm),
      eigenkapital: Number(eigenkapital),
      zinssatz: Number(zinssatz),
      tilgung: Number(tilgung),
    })
    navigate(`/projects/${project.id}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canCreate) handleCreate()
  }

  return (
    <motion.div className="space-y-6 max-w-2xl mx-auto" initial="hidden" animate="visible" variants={staggerContainer}>
      <motion.div className="space-y-1" variants={fadeInUp}>
        <h1 className="text-2xl font-bold">Neues Projekt</h1>
        <p className="text-muted-foreground text-sm">
          Geben Sie die Eckdaten ein. Alle weiteren Details können Sie anschließend bearbeiten.
        </p>
      </motion.div>

      <Card className="border-2">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label className="mb-1.5 block text-sm font-medium">Adresse / Projektname</Label>
              <AddressAutocomplete
                value={address}
                onChange={setAddress}
                onPlaceSelect={handlePlaceSelect}
                placeholder="z.B. ETW Berlin Neukölln, Hauptstr. 12"
                className="h-11"
                autoFocus
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm font-medium">Kaufpreis</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={kaufpreis}
                  onChange={(e) => setKaufpreis(e.target.value)}
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
                  onChange={(e) => setMiete(e.target.value)}
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
                  onChange={(e) => setQm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="70"
                  className="h-11 pr-8"
                  min={1}
                />
                <span className="absolute right-3 top-3 text-sm text-muted-foreground pointer-events-none">m²</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mt-3 mx-auto transition-colors"
            onClick={() => setShowDefaults(!showDefaults)}
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform', showDefaults && 'rotate-180')} />
            Finanzierung anpassen
          </button>

          {showDefaults && (
            <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t animate-in fade-in slide-in-from-top-2 duration-200">
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
            <p className="text-xs text-muted-foreground mt-3 text-center">
              {formatEur(Number(eigenkapital))} EK, {zinssatz}% Zins, {tilgung}% Tilgung
            </p>
          )}
        </CardContent>
      </Card>

      {/* Live preview */}
      {preview && (
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-muted-foreground">Vorschau</h3>
              <RentabilitaetBadge score={preview.score} compact />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <PreviewMetric
                label="Cashflow"
                value={formatEur(preview.result.kpis.monatlichCashflowNachSteuer)}
                negative={preview.result.kpis.monatlichCashflowNachSteuer < 0}
              />
              <PreviewMetric
                label="Bruttorendite"
                value={formatPercent(preview.result.kpis.bruttomietrendite)}
              />
              <PreviewMetric
                label="EK-Rendite"
                value={formatPercent(preview.result.kpis.eigenkapitalrendite)}
              />
              <PreviewMetric
                label="Vermögenszuw."
                value={formatEur(preview.result.kpis.vermoegenszuwachsMonatlich)}
                negative={preview.result.kpis.vermoegenszuwachsMonatlich < 0}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        size="lg"
        className="w-full"
        disabled={!canCreate}
        onClick={handleCreate}
      >
        <Building2 className="h-4 w-4" />
        Projekt anlegen & Details bearbeiten
        <ArrowRight className="h-4 w-4" />
      </Button>
    </motion.div>
  )
}

function PreviewMetric({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-sm font-semibold tabular-nums ${negative ? 'text-destructive' : ''}`}>{value}</div>
    </div>
  )
}
