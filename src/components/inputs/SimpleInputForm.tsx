import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { AddressAutocomplete, type PlaceResult } from '@/components/shared/AddressAutocomplete'
import { CurrencyInput, PercentInput } from '@/components/shared/CurrencyInput'
import { CollapsibleSection } from '@/components/shared/CollapsibleSection'
import { ParameterSlider } from '@/components/simulation/ParameterSlider'
import type { Project, Bundesland, PropertyType, ModernisierungPosten, NebenkostenPosten } from '@/calc/types'
import { v4 as uuidv4 } from 'uuid'
import { Plus, Trash2 } from 'lucide-react'
import { BUNDESLAND_LABELS, GRUNDERWERBSTEUER_SAETZE } from '@/calc/grunderwerbsteuer'
import { calculateAfaRate } from '@/calc/tax'
import { useUiStore } from '@/store/useUiStore'

interface SimpleInputFormProps {
  project: Project
  onChange: (updates: Partial<Project>) => void
}

const bundeslandOptions = (Object.keys(BUNDESLAND_LABELS) as Bundesland[]).map((key) => ({
  value: key,
  label: `${BUNDESLAND_LABELS[key]} (${GRUNDERWERBSTEUER_SAETZE[key]}%)`,
}))

const propertyTypeOptions = [
  { value: 'wohnung', label: 'Wohnung' },
  { value: 'haus', label: 'Haus' },
]

export function SimpleInputForm({ project, onChange }: SimpleInputFormProps) {
  const { mode } = useUiStore()

  return (
    <div className="space-y-6">
      <CollapsibleSection title="Grunddaten" defaultOpen>
        <div>
          <Label className="mb-1.5 block">Projektname</Label>
          <Input
            value={project.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="z.B. ETW Berlin Neukölln"
          />
        </div>

        <div>
          <Label className="mb-1.5 block">Adresse</Label>
          <AddressAutocomplete
            value={project.address}
            onChange={(value) => onChange({ address: value })}
            onPlaceSelect={(place: PlaceResult) => {
              onChange({ address: place.address, lat: place.lat, lng: place.lng })
            }}
            placeholder="Straße, PLZ Ort"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1.5 block">Immobilientyp</Label>
            <Select
              value={project.propertyType}
              onChange={(e) => onChange({ propertyType: e.target.value as PropertyType })}
              options={propertyTypeOptions}
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Bundesland</Label>
            <Select
              value={project.bundesland}
              onChange={(e) => onChange({ bundesland: e.target.value as Bundesland })}
              options={bundeslandOptions}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <CurrencyInput
            label="Wohnfläche"
            value={project.wohnflaeche}
            onChange={(v) => onChange({ wohnflaeche: v })}
            suffix="m²"
            min={1}
          />
          <CurrencyInput
            label="Baujahr"
            value={project.baujahr}
            onChange={(v) => onChange({ baujahr: v })}
            suffix=""
            min={1800}
            max={2030}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Kauf & Finanzierung" defaultOpen>
        <CurrencyInput
          label="Kaufpreis"
          value={project.kaufpreis}
          onChange={(v) => onChange({ kaufpreis: v })}
          min={0}
          step={1000}
        />

        <CurrencyInput
          label="Eigenkapital"
          value={project.eigenkapital}
          onChange={(v) => onChange({ eigenkapital: v })}
          tooltip="eigenkapital"
          min={0}
          step={1000}
        />
        {project.eigenkapital > 0 && project.eigenkapital < 5000 && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Empfohlen: min. 5.000 € Eigenkapital
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <PercentInput
            label="Zinssatz"
            value={project.zinssatz}
            onChange={(v) => onChange({ zinssatz: v })}
            tooltip="zinssatz"
            min={0}
            max={15}
            step={0.1}
          />
          <PercentInput
            label="Tilgung"
            value={project.tilgung}
            onChange={(v) => onChange({ tilgung: v })}
            tooltip="tilgung"
            min={0}
            max={15}
            step={0.1}
          />
        </div>
      </CollapsibleSection>

      {project.nutzungsart === 'vermietung' ? (
        <CollapsibleSection title="Mieteinnahmen" defaultOpen>
          <CurrencyInput
            label="Monatliche Kaltmiete"
            value={project.monatsmieteKalt}
            onChange={(v) => onChange({ monatsmieteKalt: v })}
            min={0}
            step={10}
          />
          {project.address && (
            <p className="text-xs text-muted-foreground">
              Marktdaten finden Sie im{' '}
              <a
                href={`https://www.homeday.de/de/preisatlas/${project.address.split(' ').pop()?.toLowerCase() || ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Homeday Preisatlas
              </a>
            </p>
          )}
        </CollapsibleSection>
      ) : (
        <CollapsibleSection title="Ersparte Miete" defaultOpen>
          <CurrencyInput
            label="Kalkulatorische Miete"
            value={project.ersparteMiete}
            onChange={(v) => onChange({ ersparteMiete: v })}
            min={0}
            step={10}
          />
          <p className="text-xs text-muted-foreground">
            Miete, die Sie durch Eigennutzung einsparen (vergleichbare Marktmiete)
          </p>
        </CollapsibleSection>
      )}

      <CollapsibleSection title="Nebenkosten">
        {project.propertyType === 'wohnung' && (
          <div className="flex rounded-md overflow-hidden border mb-2">
            <button
              className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                project.hausgeldModus === 'hausgeld'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
              onClick={() => onChange({ hausgeldModus: 'hausgeld' })}
            >
              Hausgeld
            </button>
            <button
              className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                project.hausgeldModus === 'einzelposten'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
              onClick={() => onChange({ hausgeldModus: 'einzelposten' })}
            >
              Einzelposten
            </button>
          </div>
        )}

        {project.hausgeldModus === 'hausgeld' && project.propertyType === 'wohnung' ? (
          <>
            <CurrencyInput
              label="Hausgeld"
              value={project.hausgeldProMonat}
              onChange={(v) => onChange({ hausgeldProMonat: v })}
              min={0}
              step={10}
            />
            <div className="grid grid-cols-2 gap-3">
              <PercentInput
                label="Instandhaltungsrücklage"
                value={project.hausgeldInstandhaltungAnteil}
                onChange={(v) => onChange({ hausgeldInstandhaltungAnteil: v })}
                min={0}
                max={50}
              />
              <PercentInput
                label="WEG-Verwaltung"
                value={project.hausgeldVerwaltungAnteil}
                onChange={(v) => onChange({ hausgeldVerwaltungAnteil: v })}
                min={0}
                max={50}
              />
            </div>
            {project.hausgeldProMonat > 0 && (
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>
                  Rücklage: {Math.round(project.hausgeldProMonat * project.hausgeldInstandhaltungAnteil / 100).toLocaleString('de-DE')} €/Mon
                  {' · '}Verwaltung: {Math.round(project.hausgeldProMonat * project.hausgeldVerwaltungAnteil / 100).toLocaleString('de-DE')} €/Mon
                  {' · '}Umlagefähig: {Math.round(project.hausgeldProMonat * (100 - project.hausgeldInstandhaltungAnteil - project.hausgeldVerwaltungAnteil) / 100).toLocaleString('de-DE')} €/Mon
                </p>
                <p>Typisches Hausgeld: 2,50–4,50 €/m²/Mon. Davon ca. 70% umlagefähig.</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className={project.nutzungsart === 'vermietung' ? 'grid grid-cols-2 gap-3' : ''}>
              <CurrencyInput
                label="Nebenkosten"
                value={project.nebenkostenProQm}
                onChange={(v) => onChange({ nebenkostenProQm: v })}
                suffix="€/m²/Mon"
                min={0}
                step={0.5}
              />
              {project.nutzungsart === 'vermietung' && (
                <PercentInput
                  label="Umlagefähig"
                  value={project.umlagefaehigAnteil}
                  onChange={(v) => onChange({ umlagefaehigAnteil: v })}
                  min={0}
                  max={100}
                />
              )}
            </div>
            {project.nutzungsart === 'vermietung' && project.nebenkostenProQm > 0 && (
              <p className="text-xs text-muted-foreground">
                Warmmiete: {Math.round(project.monatsmieteKalt + project.nebenkostenProQm * project.wohnflaeche * (project.umlagefaehigAnteil / 100)).toLocaleString('de-DE')} €/Mon
              </p>
            )}
          </>
        )}

        {/* Custom Nebenkosten line items */}
        {(project.nebenkostenPosten ?? []).length > 0 && (
          <div className="space-y-2 mt-3">
            <Label className="text-xs text-muted-foreground block">Einzelposten</Label>
            {(project.nebenkostenPosten ?? []).map((posten) => {
              const updatePosten = (updates: Partial<NebenkostenPosten>) => {
                onChange({
                  nebenkostenPosten: (project.nebenkostenPosten ?? []).map((p) =>
                    p.id === posten.id ? { ...p, ...updates } : p
                  ),
                })
              }
              return (
                <div key={posten.id} className="flex items-center gap-2 bg-muted/50 rounded-md p-2">
                  <input
                    value={posten.bezeichnung}
                    onChange={(e) => updatePosten({ bezeichnung: e.target.value })}
                    className="text-sm bg-transparent border-b border-dashed border-muted-foreground/30 focus:border-primary outline-none flex-1 min-w-0 py-0.5"
                    placeholder="Bezeichnung"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      value={posten.betrag}
                      onChange={(e) => updatePosten({ betrag: Number(e.target.value) || 0 })}
                      className="w-16 text-sm text-right bg-transparent border-b border-dashed border-muted-foreground/30 focus:border-primary outline-none py-0.5"
                      min={0}
                      step={10}
                    />
                    <span className="text-xs text-muted-foreground">€/M</span>
                  </div>
                  <label className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={posten.umlagefaehig}
                      onChange={(e) => updatePosten({ umlagefaehig: e.target.checked })}
                      className="rounded border-muted-foreground/30"
                    />
                    Uml.
                  </label>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => onChange({
                      nebenkostenPosten: (project.nebenkostenPosten ?? []).filter((p) => p.id !== posten.id),
                    })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {[
            { bezeichnung: 'Hausgeld', betrag: 250, umlagefaehig: false },
            { bezeichnung: 'Rücklage', betrag: 50, umlagefaehig: false },
            { bezeichnung: 'Versicherung', betrag: 30, umlagefaehig: true },
          ].map((preset) => (
            <button
              key={preset.bezeichnung}
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border hover:bg-muted transition-colors"
              onClick={() => onChange({
                nebenkostenPosten: [
                  ...(project.nebenkostenPosten ?? []),
                  { id: uuidv4(), ...preset },
                ],
              })}
            >
              <Plus className="h-3 w-3" />
              {preset.bezeichnung} ({preset.betrag}€)
            </button>
          ))}
        </div>
        {(project.nebenkostenPosten ?? []).length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Gesamt: {(project.nebenkostenPosten ?? []).reduce((s, p) => s + p.betrag, 0).toLocaleString('de-DE')} €/Mon
            {' · '}Umlagefähig: {(project.nebenkostenPosten ?? []).filter((p) => p.umlagefaehig).reduce((s, p) => s + p.betrag, 0).toLocaleString('de-DE')} €/Mon
          </p>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Modernisierung">
        {project.modernisierungen.length > 0 && (
          <div className="space-y-3">
            {project.modernisierungen.map((mod) => {
              const updateMod = (updates: Partial<ModernisierungPosten>) => {
                onChange({
                  modernisierungen: project.modernisierungen.map((m) =>
                    m.id === mod.id ? { ...m, ...updates } : m
                  ),
                })
              }
              return (
                <div key={mod.id} className="space-y-2 bg-muted/50 rounded-md p-3">
                  <div className="flex items-center gap-2">
                    <input
                      value={mod.bezeichnung}
                      onChange={(e) => updateMod({ bezeichnung: e.target.value })}
                      className="font-medium text-sm bg-transparent border-b border-dashed border-muted-foreground/30 focus:border-primary outline-none flex-1 min-w-0 py-0.5"
                    />
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => onChange({
                        modernisierungen: project.modernisierungen.filter((m) => m.id !== mod.id),
                      })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <CurrencyInput
                      label="Kosten"
                      value={mod.kosten}
                      onChange={(v) => updateMod({ kosten: v })}
                      min={0}
                      step={1000}
                    />
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Jahr</Label>
                      <Input
                        type="number"
                        value={mod.jahr}
                        onChange={(e) => updateMod({ jahr: Number(e.target.value) || 1 })}
                        min={1}
                        max={50}
                        className="h-9"
                      />
                    </div>
                    <PercentInput
                      label="Umlage %"
                      value={mod.mietumlageProzent}
                      onChange={(v) => updateMod({ mietumlageProzent: v })}
                      max={11}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div className="flex flex-wrap gap-1.5">
          {[
            { bezeichnung: 'Dach', kosten: 30000, jahr: 25, mietumlageProzent: 8 },
            { bezeichnung: 'Heizung', kosten: 15000, jahr: 20, mietumlageProzent: 8 },
            { bezeichnung: 'Fenster', kosten: 12000, jahr: 15, mietumlageProzent: 8 },
            { bezeichnung: 'Bad', kosten: 10000, jahr: 20, mietumlageProzent: 8 },
          ].map((preset) => (
            <button
              key={preset.bezeichnung}
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border hover:bg-muted transition-colors"
              onClick={() => onChange({
                modernisierungen: [
                  ...project.modernisierungen,
                  { id: uuidv4(), ...preset },
                ],
              })}
            >
              <Plus className="h-3 w-3" />
              {preset.bezeichnung} ({(preset.kosten / 1000).toFixed(0)}k, {preset.jahr}J)
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Geplante Modernisierungen werden im Cashflow als Einmalkosten berücksichtigt.
          {project.nutzungsart === 'vermietung' && ' §559 BGB erlaubt Umlage von 8% der Kosten p.a. auf Mieter.'}
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="Abschreibung (AfA)">
        <ParameterSlider
          label="Gebäudeanteil"
          value={100 - project.grundstueckAnteil}
          min={50}
          max={95}
          step={1}
          unit="%"
          tooltip="grundstueckAnteil"
          onChange={(v) => onChange({ grundstueckAnteil: 100 - v })}
          formatValue={(v) => `${v} %`}
        />
        <ParameterSlider
          label={`AfA-Satz ${project.customAfaRate === null ? '(auto)' : ''}`}
          value={project.customAfaRate ?? calculateAfaRate(project.baujahr)}
          min={0}
          max={5}
          step={0.5}
          unit="%"
          tooltip="afaRate"
          onChange={(v) => onChange({ customAfaRate: v })}
          formatValue={(v) => `${v.toFixed(1)} %`}
        />
        {project.customAfaRate !== null && (
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => onChange({ customAfaRate: null })}
          >
            AfA-Satz automatisch berechnen (Baujahr {project.baujahr} → {calculateAfaRate(project.baujahr)}%)
          </button>
        )}
        <p className="text-xs text-muted-foreground leading-relaxed">
          Standard: 2% (Baujahr 1925–2022), 2,5% (vor 1925), 3% (ab 2023).
          Abweichender Satz durch Gutachten möglich.
        </p>
      </CollapsibleSection>

      {mode === 'pro' && (
        <>
          <CollapsibleSection title="Kaufnebenkosten">
            <div className="grid grid-cols-2 gap-3">
              <PercentInput
                label="Makler"
                value={project.maklerProvision}
                onChange={(v) => onChange({ maklerProvision: v })}
                tooltip="maklerProvision"
              />
              <PercentInput
                label="Notar & Grundbuch"
                value={project.notarUndGrundbuch}
                onChange={(v) => onChange({ notarUndGrundbuch: v })}
                tooltip="notarUndGrundbuch"
              />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Laufende Kosten">
            <div className="grid grid-cols-2 gap-3">
              <CurrencyInput
                label="Instandhaltung"
                value={project.instandhaltungProQm}
                onChange={(v) => onChange({ instandhaltungProQm: v })}
                tooltip="instandhaltung"
                suffix="€/m²/J"
              />
              <CurrencyInput
                label="Verwaltung"
                value={project.verwaltungProEinheit}
                onChange={(v) => onChange({ verwaltungProEinheit: v })}
                tooltip="verwaltung"
                suffix="€/Mon"
              />
            </div>
            {project.nutzungsart === 'vermietung' && (
              <PercentInput
                label="Mietausfallwagnis"
                value={project.mietausfallwagnis}
                onChange={(v) => onChange({ mietausfallwagnis: v })}
                tooltip="mietausfallwagnis"
              />
            )}
          </CollapsibleSection>

          <CollapsibleSection title="Steuern">
            <ParameterSlider
              label="Persönlicher Steuersatz"
              value={project.persoenlicherSteuersatz}
              onChange={(v) => onChange({ persoenlicherSteuersatz: v })}
              tooltip="persoenlicherSteuersatz"
              min={0}
              max={45}
              step={1}
              unit="%"
              formatValue={(v) => `${v} %`}
            />
            <ParameterSlider
              label="Bewegliche Gegenstände"
              value={project.beweglicheGegenstaende}
              onChange={(v) => onChange({ beweglicheGegenstaende: v })}
              tooltip="beweglicheGegenstaende"
              min={0}
              max={50000}
              step={500}
              unit="€"
              formatValue={(v) => `${v.toLocaleString('de-DE')} €`}
            />
            <ParameterSlider
              label="Sondertilgung pro Jahr"
              value={project.sondertilgung}
              onChange={(v) => onChange({ sondertilgung: v })}
              tooltip="sondertilgung"
              min={0}
              max={50000}
              step={500}
              unit="€/Jahr"
              formatValue={(v) => `${v.toLocaleString('de-DE')} €/Jahr`}
            />
          </CollapsibleSection>
        </>
      )}
    </div>
  )
}
