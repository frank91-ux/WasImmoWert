import { useState } from 'react'
import type { CalculationResult, Project } from '@/calc/types'
import { KpiCard } from './KpiCard'
import { KpiInfoDialog } from './KpiInfoDialog'
import { formatEur, formatPercent, formatFactor } from '@/lib/format'
import { useUiStore } from '@/store/useUiStore'
import { KPI_THRESHOLDS, type KpiThreshold } from '@/i18n/kpiInfo'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, AlertTriangle } from 'lucide-react'
import { berechneMarktvergleich } from '@/data/marktdaten'

interface KpiOverviewProps {
  result: CalculationResult
  nutzungsart: 'vermietung' | 'eigennutzung'
  eigenkapital?: number
  gesamtkosten?: number
  project?: Project
}

interface CardDef {
  key: string
  proOnly: boolean
  showFor?: 'vermietung' | 'eigennutzung'
  label: string
  value: string
  tooltip: string
  trend: 'positive' | 'negative' | 'neutral'
  subtitle?: string
  example?: string
  gaugeValue?: number
  gaugeThreshold?: KpiThreshold
}

function SortableKpiCard({
  card,
  onInfoClick,
}: {
  card: CardDef
  onInfoClick: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.key,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group/kpi">
      <span
        className="absolute top-1.5 right-1.5 cursor-grab active:cursor-grabbing text-muted-foreground opacity-0 group-hover/kpi:opacity-60 transition-opacity z-10 p-0.5"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3 w-3" />
      </span>
      <KpiCard
        label={card.label}
        value={card.value}
        tooltip={card.tooltip}
        trend={card.trend}
        subtitle={card.subtitle}
        example={card.example}
        onClick={onInfoClick}
        gaugeValue={card.gaugeValue}
        gaugeThreshold={card.gaugeThreshold}
      />
    </div>
  )
}

export function KpiOverview({ result, nutzungsart, eigenkapital, gesamtkosten, project }: KpiOverviewProps) {
  const { mode, hiddenKpis, kpiCardOrder, setKpiCardOrder } = useUiStore()
  const isEigennutzung = nutzungsart === 'eigennutzung'
  const { kpis } = result
  const [infoKey, setInfoKey] = useState<string | null>(null)
  const [infoValue, setInfoValue] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const openInfo = (key: string, value: string) => {
    setInfoKey(key)
    setInfoValue(value)
  }

  // Marktvergleich
  const eigenPreisProQm = project && project.wohnflaeche > 0 ? project.kaufpreis / project.wohnflaeche : 0
  const eigenMieteProQm = project && project.wohnflaeche > 0 ? project.monatsmieteKalt / project.wohnflaeche : 0
  const markt = berechneMarktvergleich(eigenPreisProQm, eigenMieteProQm, project?.lat, project?.lng)

  const ekIsZero = eigenkapital !== undefined && eigenkapital === 0
  const ekIsGesamtsumme = eigenkapital !== undefined && gesamtkosten !== undefined && gesamtkosten > 0 && eigenkapital >= gesamtkosten

  // C16: Display "n/a" for extreme leverage values
  const ekRenditeExceeds = Math.abs(kpis.eigenkapitalrendite) > 100
  const cashOnCashExceeds = Math.abs(kpis.cashOnCash) > 100

  const cashflowTrend = kpis.monatlichCashflowNachSteuer >= 0 ? 'positive' as const : 'negative' as const

  const allCards: CardDef[] = [
    // Vermietung KPIs
    {
      key: 'cashflow',
      proOnly: false,
      showFor: 'vermietung' as const,
      label: 'Monatl. Cashflow',
      value: formatEur(kpis.monatlichCashflowNachSteuer),
      tooltip: 'cashflow',
      trend: cashflowTrend,
      subtitle: 'nach Steuern',
      example: `${formatEur(kpis.jaehrlichCashflowNachSteuer)}/Jahr = Miete − Kredit − Kosten − Steuern`,
    },
    {
      key: 'bruttomietrendite',
      proOnly: false,
      showFor: 'vermietung' as const,
      label: 'Bruttomietrendite',
      value: formatPercent(kpis.bruttomietrendite),
      tooltip: 'bruttomietrendite',
      trend: (kpis.bruttomietrendite >= 4 ? 'positive' : kpis.bruttomietrendite >= 3 ? 'neutral' : 'negative') as 'positive' | 'negative' | 'neutral',
      example: `${formatEur(result.rental.jahresmieteKalt)} Miete / ${formatEur(result.kaufnebenkosten.gesamtkosten - result.kaufnebenkosten.kaufnebenkostenGesamt)} Kaufpreis`,
      gaugeValue: kpis.bruttomietrendite,
      gaugeThreshold: KPI_THRESHOLDS.bruttomietrendite,
    },
    {
      key: 'kaufpreisfaktor',
      proOnly: false,
      showFor: 'vermietung' as const,
      label: 'Kaufpreisfaktor',
      value: formatFactor(kpis.kaufpreisfaktor),
      tooltip: 'kaufpreisfaktor',
      trend: (kpis.kaufpreisfaktor <= 20 ? 'positive' : kpis.kaufpreisfaktor <= 25 ? 'neutral' : 'negative') as 'positive' | 'negative' | 'neutral',
      example: `${formatFactor(kpis.kaufpreisfaktor)} = Kaufpreis / Jahresnettomiete`,
      gaugeValue: kpis.kaufpreisfaktor,
      gaugeThreshold: KPI_THRESHOLDS.kaufpreisfaktor,
    },
    {
      key: 'eigenkapitalrendite',
      proOnly: false,
      showFor: 'vermietung' as const,
      label: 'Eigenkapitalrendite',
      value: ekRenditeExceeds ? 'n/a' : formatPercent(kpis.eigenkapitalrendite),
      tooltip: 'eigenkapitalrendite',
      trend: ekRenditeExceeds ? 'neutral' as const : (kpis.eigenkapitalrendite >= 6 ? 'positive' : kpis.eigenkapitalrendite >= 3 ? 'neutral' : 'negative') as 'positive' | 'negative' | 'neutral',
      subtitle: ekRenditeExceeds ? 'nicht aussagekräftig' : 'inkl. Tilgung',
      example: '(Cashflow + Tilgung) / Eigenkapital',
      gaugeValue: ekRenditeExceeds ? undefined : kpis.eigenkapitalrendite,
      gaugeThreshold: ekRenditeExceeds ? undefined : KPI_THRESHOLDS.eigenkapitalrendite,
    },
    {
      key: 'dscr',
      proOnly: true,
      showFor: 'vermietung' as const,
      label: 'DSCR',
      value: kpis.dscr === Infinity ? '∞' : kpis.dscr.toFixed(2),
      tooltip: 'dscr',
      trend: (kpis.dscr >= 1.25 ? 'positive' : kpis.dscr >= 1.0 ? 'neutral' : 'negative') as 'positive' | 'negative' | 'neutral',
      example: `${formatEur(result.rental.nettomieteinnahmen - result.operatingCosts.betriebskostenGesamt)} NOI / ${formatEur(result.financing.annuitaet)} Kreditrate`,
      gaugeValue: kpis.dscr === Infinity ? undefined : kpis.dscr,
      gaugeThreshold: kpis.dscr === Infinity ? undefined : KPI_THRESHOLDS.dscr,
    },
    {
      key: 'nettomietrendite',
      proOnly: true,
      showFor: 'vermietung' as const,
      label: 'Nettomietrendite',
      value: formatPercent(kpis.nettomietrendite),
      tooltip: 'nettomietrendite',
      trend: (kpis.nettomietrendite >= 3 ? 'positive' : 'negative') as 'positive' | 'negative',
      example: '(Miete − Kosten) / Gesamtkosten',
      gaugeValue: kpis.nettomietrendite,
      gaugeThreshold: KPI_THRESHOLDS.nettomietrendite,
    },
    {
      key: 'cashOnCash',
      proOnly: true,
      showFor: 'vermietung' as const,
      label: 'Cash-on-Cash',
      value: cashOnCashExceeds ? 'n/a' : formatPercent(kpis.cashOnCash),
      tooltip: 'cashOnCash',
      trend: cashOnCashExceeds ? 'neutral' as const : (kpis.cashOnCash >= 0 ? 'positive' : 'negative') as 'positive' | 'negative',
      subtitle: cashOnCashExceeds ? 'nicht aussagekräftig' : 'ohne Tilgung',
      example: `${formatEur(kpis.jaehrlichCashflowNachSteuer)} / ${formatEur(result.financing.darlehensBetrag > 0 ? result.kaufnebenkosten.gesamtkosten - result.financing.darlehensBetrag : result.kaufnebenkosten.gesamtkosten)} EK`,
      gaugeValue: cashOnCashExceeds ? undefined : kpis.cashOnCash,
      gaugeThreshold: cashOnCashExceeds ? undefined : KPI_THRESHOLDS.cashOnCash,
    },
    {
      key: 'jaehrlichCashflowNachSteuer',
      proOnly: true,
      showFor: 'vermietung' as const,
      label: 'Cashflow nach Steuer',
      value: formatEur(kpis.jaehrlichCashflowNachSteuer),
      tooltip: 'cashflow',
      trend: (kpis.jaehrlichCashflowNachSteuer >= 0 ? 'positive' : 'negative') as 'positive' | 'negative',
      subtitle: 'pro Jahr',
      example: `${formatEur(kpis.monatlichCashflowNachSteuer)}/Mon × 12`,
    },
    // Eigennutzung KPIs
    {
      key: 'monatlicheKosten',
      proOnly: false,
      showFor: 'eigennutzung' as const,
      label: 'Monatliche Kosten',
      value: formatEur(kpis.monatlicheKosten),
      tooltip: 'monatlicheKosten',
      trend: 'neutral' as const,
      subtitle: 'Kredit + Betriebskosten',
      example: 'Kreditrate + Instandhaltung + Verwaltung + NK',
    },
    {
      key: 'ersparteMiete',
      proOnly: false,
      showFor: 'eigennutzung' as const,
      label: 'Ersparte Miete',
      value: formatEur(kpis.ersparteMieteJahr / 12),
      tooltip: 'ersparteMiete',
      trend: (kpis.ersparteMieteJahr > 0 ? 'positive' : 'neutral') as 'positive' | 'neutral',
      subtitle: 'monatlich',
      example: `${formatEur(kpis.ersparteMieteJahr)}/Jahr kalkulatorische Mietersparnis`,
    },
    {
      key: 'eigennutzungRendite',
      proOnly: false,
      showFor: 'eigennutzung' as const,
      label: 'Eigennutzung-Rendite',
      value: formatPercent(kpis.eigennutzungRendite),
      tooltip: 'eigennutzungRendite',
      trend: (kpis.eigennutzungRendite >= 3 ? 'positive' : kpis.eigennutzungRendite >= 0 ? 'neutral' : 'negative') as 'positive' | 'negative' | 'neutral',
      subtitle: 'auf Gesamtkapital',
      example: '(Ersparte Miete − Kosten + Tilgung + Wertsteigerung) / Gesamtkosten',
      gaugeValue: kpis.eigennutzungRendite,
      gaugeThreshold: KPI_THRESHOLDS.eigennutzungRendite,
    },
    // Leistbarkeit (Eigennutzung only)
    ...((isEigennutzung && project && project.nettoJahresgehalt > 0) ? (() => {
      const nettoMonat = project.nettoJahresgehalt / 12
      const belastungsquote = nettoMonat > 0 ? (kpis.monatlicheKosten / nettoMonat) * 100 : 0
      return [{
        key: 'leistbarkeit',
        proOnly: false,
        showFor: 'eigennutzung' as const,
        label: 'Leistbarkeit',
        value: `${belastungsquote.toFixed(0)}%`,
        tooltip: 'leistbarkeit',
        trend: (belastungsquote <= 30 ? 'positive' : belastungsquote <= 40 ? 'neutral' : 'negative') as 'positive' | 'negative' | 'neutral',
        subtitle: belastungsquote <= 30 ? 'Leistbar' : belastungsquote <= 40 ? 'Grenzwertig' : 'Überlastet',
        example: `${formatEur(kpis.monatlicheKosten)}/Mon bei ${formatEur(nettoMonat)}/Mon Netto`,
        gaugeValue: belastungsquote,
        gaugeThreshold: KPI_THRESHOLDS.leistbarkeit,
      }] as CardDef[]
    })() : []),
    // Marktvergleich (both modes)
    ...(markt.verfuegbar ? [{
      key: 'marktvergleich',
      proOnly: false,
      label: 'Preis vs. Markt',
      value: `${markt.abweichungKaufProzent > 0 ? '+' : ''}${markt.abweichungKaufProzent.toFixed(0)}%`,
      tooltip: 'marktvergleich',
      trend: (markt.preisLevel === 'guenstig' ? 'positive' : markt.preisLevel === 'teuer' ? 'negative' : 'neutral') as 'positive' | 'negative' | 'neutral',
      subtitle: markt.preisLevel === 'guenstig' ? 'unter Marktpreis' : markt.preisLevel === 'teuer' ? 'über Marktpreis' : 'im Marktdurchschnitt',
      example: `${eigenPreisProQm.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €/m² vs. Ø ${markt.durchschnittKauf.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €/m² Region`,
    }] as CardDef[] : []),
    // Both modes
    {
      key: 'vermoegenszuwachs',
      proOnly: false,
      label: 'Vermögenszuwachs',
      value: formatEur(kpis.vermoegenszuwachsMonatlich),
      tooltip: 'vermoegenszuwachs',
      trend: (kpis.vermoegenszuwachsMonatlich >= 0 ? 'positive' : 'negative') as 'positive' | 'negative',
      subtitle: 'monatlich',
      example: `${formatEur(kpis.vermoegenszuwachsJaehrlich)}/Jahr = Cashflow + Tilgung + Wertsteigerung`,
    },
  ]

  const visibleCards = allCards.filter(
    (card) => !hiddenKpis?.includes(card.key)
      && (!card.proOnly || mode === 'pro')
      && (!('showFor' in card) || !card.showFor || card.showFor === nutzungsart)
      && !(ekIsZero && (card.key === 'eigenkapitalrendite' || card.key === 'cashOnCash' || card.key === 'eigennutzungRendite'))
  )

  // Sort by kpiCardOrder
  const sortedCards = [...visibleCards].sort((a, b) => {
    const aIdx = kpiCardOrder.indexOf(a.key)
    const bIdx = kpiCardOrder.indexOf(b.key)
    // If not in order, push to end
    const aPos = aIdx === -1 ? 999 : aIdx
    const bPos = bIdx === -1 ? 999 : bIdx
    return aPos - bPos
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const currentOrder = sortedCards.map((c) => c.key)
    const oldIndex = currentOrder.indexOf(active.id as string)
    const newIndex = currentOrder.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    const newOrder = [...currentOrder]
    newOrder.splice(oldIndex, 1)
    newOrder.splice(newIndex, 0, active.id as string)
    // Merge with full kpiCardOrder to preserve hidden cards
    const fullOrder = [...newOrder]
    for (const key of kpiCardOrder) {
      if (!fullOrder.includes(key)) fullOrder.push(key)
    }
    setKpiCardOrder(fullOrder)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Kennzahlen</h3>

      {/* C16: Warning banners */}
      {ekIsZero && (
        <div className="flex items-center gap-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Vollfinanzierung – EK-abhängige Kennzahlen (EK-Rendite, Cash-on-Cash) nicht berechenbar
          </p>
        </div>
      )}
      {ekIsGesamtsumme && (
        <div className="flex items-center gap-2 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-3 py-2">
          <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Barkauf – Leverage-Kennzahlen (DSCR, EK-Rendite) nicht aussagekräftig
          </p>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortedCards.map((c) => c.key)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedCards.map((card) => (
              <SortableKpiCard
                key={card.key}
                card={card}
                onInfoClick={() => openInfo(card.key, card.value)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <KpiInfoDialog
        open={infoKey !== null}
        onOpenChange={(open) => { if (!open) setInfoKey(null) }}
        kpiKey={infoKey ?? ''}
        currentValue={infoValue}
        result={result}
        project={project}
      />
    </div>
  )
}
