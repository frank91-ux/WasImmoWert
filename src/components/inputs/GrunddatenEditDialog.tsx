import { useState, useCallback } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { AddressAutocomplete, type PlaceResult } from '@/components/shared/AddressAutocomplete'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { BUNDESLAND_LABELS } from '@/calc/grunderwerbsteuer'
import type { Project, Bundesland, PropertyType } from '@/calc/types'

interface GrunddatenEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project
  onChange: (updates: Partial<Project>) => void
}

const bundeslandOptions = (Object.keys(BUNDESLAND_LABELS) as Bundesland[]).map((key) => ({
  value: key,
  label: BUNDESLAND_LABELS[key],
}))

export function GrunddatenEditDialog({ open, onOpenChange, project, onChange }: GrunddatenEditDialogProps) {
  const [name, setName] = useState(project.name)
  const [address, setAddress] = useState(project.address)
  const [lat, setLat] = useState<number | null>(project.lat)
  const [lng, setLng] = useState<number | null>(project.lng)
  const [propertyType, setPropertyType] = useState<PropertyType>(project.propertyType)
  const [bundesland, setBundesland] = useState<Bundesland>(project.bundesland)
  const [wohnflaeche, setWohnflaeche] = useState(project.wohnflaeche)
  const [baujahr, setBaujahr] = useState(project.baujahr)

  const handlePlaceSelect = useCallback((place: PlaceResult) => {
    setAddress(place.address)
    setLat(place.lat)
    setLng(place.lng)
  }, [])

  // Sync when dialog opens with new project data
  const handleOpenChange = (o: boolean) => {
    if (o) {
      setName(project.name)
      setAddress(project.address)
      setLat(project.lat)
      setLng(project.lng)
      setPropertyType(project.propertyType)
      setBundesland(project.bundesland)
      setWohnflaeche(project.wohnflaeche)
      setBaujahr(project.baujahr)
    }
    onOpenChange(o)
  }

  const handleSave = () => {
    onChange({ name, address, lat, lng, propertyType, bundesland, wohnflaeche, baujahr })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogHeader>
        <DialogTitle>Grunddaten bearbeiten</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Projektname</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">Adresse</Label>
            <AddressAutocomplete
              value={address}
              onChange={setAddress}
              onPlaceSelect={handlePlaceSelect}
              placeholder="Straße, Stadt"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Immobilientyp</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as PropertyType)}
              >
                <option value="wohnung">Wohnung</option>
                <option value="haus">Haus</option>
              </select>
            </div>
            <div>
              <Label className="mb-1.5 block">Bundesland</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={bundesland}
                onChange={(e) => setBundesland(e.target.value as Bundesland)}
              >
                {bundeslandOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Wohnfläche (m²)</Label>
              <Input
                type="number"
                value={wohnflaeche}
                onChange={(e) => setWohnflaeche(Number(e.target.value))}
                min={1}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Baujahr</Label>
              <Input
                type="number"
                value={baujahr}
                onChange={(e) => setBaujahr(Number(e.target.value))}
                min={1800}
                max={2030}
              />
            </div>
          </div>
        </div>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
        <Button onClick={handleSave}>Speichern</Button>
      </DialogFooter>
    </Dialog>
  )
}
