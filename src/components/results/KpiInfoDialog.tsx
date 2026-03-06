import { useState } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { FormulaDisplay, type FormulaNode } from '@/components/shared/FormulaDisplay'
import { KPI_INFO } from '@/i18n/kpiInfo'
import type { CalculationResult, Project } from '@/calc/types'
import { formatEur } from '@/lib/format'

function getFormulaNode(kpiKey: string, result?: CalculationResult, project?: Project): FormulaNode | null {
  const r = result
  const p = project

  switch (kpiKey) {
    case 'bruttomietrendite':
      return {
        type: 'fraction',
        top: 'Jahreskaltmiete',
        bottom: 'Kaufpreis',
        topValue: r ? formatEur(r.rental.jahresmieteKalt) : undefined,
        bottomValue: p ? formatEur(p.kaufpreis) : undefined,
      }
    case 'eigenkapitalrendite':
      return {
        type: 'fraction',
        top: 'Cashflow + Tilgung',
        bottom: 'Eigenkapital',
        topValue: r && p ? formatEur(r.kpis.jaehrlichCashflowNachSteuer + (r.financing.annuitaet - (r.financing.darlehensBetrag > 0
          ? r.financing.annuitaet * (p.zinssatz / (p.zinssatz + p.tilgung))
          : 0))) : undefined,
        bottomValue: p ? formatEur(p.eigenkapital) : undefined,
      }
    case 'kaufpreisfaktor':
      return {
        type: 'fraction',
        top: 'Kaufpreis',
        bottom: 'Jahresnettomiete',
        topValue: p ? formatEur(p.kaufpreis) : undefined,
        bottomValue: r ? formatEur(r.rental.nettomieteinnahmen) : undefined,
      }
    case 'dscr':
      return {
        type: 'fraction',
        top: 'NOI (Netto-Betriebsergebnis)',
        bottom: 'Jährliche Kreditrate',
        topValue: r ? formatEur(r.rental.nettomieteinnahmen - r.operatingCosts.betriebskostenGesamt) : undefined,
        bottomValue: r ? formatEur(r.financing.annuitaet) : undefined,
      }
    case 'nettomietrendite':
      return {
        type: 'fraction',
        top: 'Miete − Betriebskosten',
        bottom: 'Gesamtkosten',
        topValue: r ? formatEur(r.rental.nettomieteinnahmen - r.operatingCosts.betriebskostenGesamt) : undefined,
        bottomValue: r ? formatEur(r.kaufnebenkosten.gesamtkosten) : undefined,
      }
    case 'cashOnCash':
      return {
        type: 'fraction',
        top: 'Jährlicher Cashflow nach Steuer',
        bottom: 'Eigenkapital',
        topValue: r ? formatEur(r.kpis.jaehrlichCashflowNachSteuer) : undefined,
        bottomValue: p ? formatEur(p.eigenkapital) : undefined,
      }
    case 'eigennutzungRendite':
      return {
        type: 'fraction',
        top: 'Ersparte Miete − Kosten + Tilgung + Wertsteigerung',
        bottom: 'Gesamtkosten',
        topValue: r && p ? formatEur(
          p.ersparteMiete * 12
          - r.operatingCosts.betriebskostenGesamt
          - r.financing.annuitaet
          + (r.financing.annuitaet - (r.financing.darlehensBetrag > 0
            ? r.financing.annuitaet * (p.zinssatz / (p.zinssatz + p.tilgung))
            : 0))
          + p.kaufpreis * (p.wertsteigerung / 100)
        ) : undefined,
        bottomValue: r ? formatEur(r.kaufnebenkosten.gesamtkosten) : undefined,
      }
    case 'vermoegenszuwachs':
      return {
        type: 'sum',
        parts: [
          'Cashflow',
          'Tilgung',
          'Wertsteigerung',
        ],
        partValues: r && p ? [
          formatEur(r.kpis.jaehrlichCashflowNachSteuer),
          formatEur(r.financing.annuitaet - (r.financing.darlehensBetrag > 0
            ? r.financing.annuitaet * (p.zinssatz / (p.zinssatz + p.tilgung))
            : 0)),
          formatEur(p.kaufpreis * (p.wertsteigerung / 100)),
        ] : undefined,
      }
    case 'cashflow':
    case 'jaehrlichCashflowNachSteuer':
      return {
        type: 'sum',
        parts: [
          'Nettomiete',
          '− Betriebskosten',
          '− Kreditrate',
          '− Steuern',
        ],
        partValues: r ? [
          formatEur(r.rental.nettomieteinnahmen),
          formatEur(-r.operatingCosts.betriebskostenGesamt),
          formatEur(-r.financing.annuitaet),
          formatEur(-r.tax.gesamtSteuerbelastungJahr),
        ] : undefined,
      }
    case 'monatlicheKosten':
      return {
        type: 'sum',
        parts: [
          'Kreditrate',
          'Betriebskosten/12',
        ],
        partValues: r ? [
          formatEur(r.financing.monatlicheRate),
          formatEur(r.operatingCosts.betriebskostenGesamt / 12),
        ] : undefined,
      }
    case 'ersparteMiete':
      return {
        type: 'text',
        content: p ? `Vergleichbare Marktmiete: ${formatEur(p.ersparteMiete)}/Mon × 12 = ${formatEur(p.ersparteMiete * 12)}/Jahr` : 'Vergleichbare Marktmiete × 12',
      }
    case 'leistbarkeit':
      return {
        type: 'fraction',
        top: 'Monatliche Immobilienkosten',
        bottom: 'Monatliches Nettoeinkommen',
        topValue: r ? formatEur(r.financing.monatlicheRate + r.operatingCosts.betriebskostenGesamt / 12) : undefined,
        bottomValue: p && (p as Record<string, unknown>).nettoJahresgehalt
          ? formatEur(((p as Record<string, unknown>).nettoJahresgehalt as number) / 12)
          : undefined,
      }
    case 'marktvergleich':
      return {
        type: 'fraction',
        top: 'Eigener Preis/m² − Ø Regionspreis/m²',
        bottom: 'Ø Regionspreis/m²',
        topValue: p && p.wohnflaeche > 0
          ? `${formatEur(p.kaufpreis / p.wohnflaeche)}/m²`
          : undefined,
      }
    case 'steuerEffekt':
      return {
        type: 'sum',
        parts: [
          'Mieteinnahmen',
          '− Absetzbare Zinsen',
          '− Gebäude-AfA',
          '− Betriebskosten',
          '= Zu verst. Einkünfte',
          '× Steuersatz',
        ],
        partValues: r ? [
          formatEur(r.rental.nettomieteinnahmen),
          formatEur(-r.tax.absetzbarerZinsanteilJahr),
          formatEur(-r.tax.afaBetragJahr),
          formatEur(-r.operatingCosts.betriebskostenGesamt),
          formatEur(r.tax.zuVersteuerndeEinkuenfteImmobilie),
          `${p?.persoenlicherSteuersatz ?? 0}% → ${formatEur(r.tax.gesamtSteuerbelastungJahr)}`,
        ] : undefined,
      }
    case 'afaBetrag': {
      const gebaeudeAnteil = p ? (100 - p.grundstueckAnteil) / 100 : 0
      const gebaeudeWert = p ? p.kaufpreis * gebaeudeAnteil : 0
      return {
        type: 'fraction',
        top: 'Gebäudewert',
        bottom: '100 ÷ AfA-Satz (Jahre)',
        topValue: p ? formatEur(gebaeudeWert) : undefined,
        bottomValue: r ? `AfA ${r.tax.afaRate}% → ${formatEur(r.tax.afaBetragJahr)}/Jahr` : undefined,
      }
    }
    case 'effSteuersatz':
      return {
        type: 'text',
        content: p
          ? `Persönlicher Grenzsteuersatz: ${p.persoenlicherSteuersatz}%. Bei jedem Euro absetzbarer Kosten sparst du ${(p.persoenlicherSteuersatz / 100).toFixed(2)} € Steuern.`
          : 'Persönlicher Grenzsteuersatz',
      }
    default:
      return null
  }
}

interface KpiInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  kpiKey: string
  currentValue?: string
  result?: CalculationResult
  project?: Project
}

export function KpiInfoDialog({ open, onOpenChange, kpiKey, currentValue, result, project }: KpiInfoDialogProps) {
  const [tab, setTab] = useState('erklaerung')
  const info = KPI_INFO[kpiKey]

  if (!info) return null

  const formulaNode = getFormulaNode(kpiKey, result, project)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>{info.label}</DialogTitle>
      </DialogHeader>
      <DialogContent onClose={() => onOpenChange(false)}>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="erklaerung">Erklärung</TabsTrigger>
            <TabsTrigger value="einfach">Einfach erklärt</TabsTrigger>
          </TabsList>

          <TabsContent value="erklaerung">
            <div className="space-y-4 mt-4">
              {currentValue && (
                <div className="rounded-md bg-primary/10 p-3">
                  <span className="text-sm font-medium">Aktueller Wert: </span>
                  <span className="text-lg font-bold text-primary">{currentValue}</span>
                </div>
              )}
              <div>
                <h4 className="text-sm font-semibold mb-1">Was bedeutet das?</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{info.description}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">Formel</h4>
                {formulaNode ? (
                  <FormulaDisplay formula={formulaNode} result={currentValue} className="w-full justify-center" />
                ) : (
                  <div className="text-sm bg-muted/50 rounded-lg p-3 text-foreground/80">
                    {info.formula}
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">Bewertung</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2 items-start">
                    <span className="text-success font-semibold shrink-0 w-16">Gut:</span>
                    <span className="text-muted-foreground">{info.interpretation.gut}</span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <span className="text-foreground font-semibold shrink-0 w-16">Mittel:</span>
                    <span className="text-muted-foreground">{info.interpretation.mittel}</span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <span className="text-destructive font-semibold shrink-0 w-16">Schlecht:</span>
                    <span className="text-muted-foreground">{info.interpretation.schlecht}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="einfach">
            <div className="mt-4 space-y-3">
              <h4 className="text-base font-semibold">{info.metaphor.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {info.metaphor.text}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
