export interface WidgetDefinition {
  id: string
  title: string
  description: string
  category: 'kpi' | 'chart' | 'table' | 'card' | 'simulation'
  section: string
  /** Which Nutzungsarten this widget is relevant for. Omit = both. */
  showFor?: ('vermietung' | 'eigennutzung')[]
}

// ─── Übersicht-Widgets ───────────────────────────────────────────

const UEBERSICHT_WIDGETS: WidgetDefinition[] = [
  {
    id: 'kpiOverview',
    title: 'KPI-Übersicht',
    description: 'Die wichtigsten Kennzahlen auf einen Blick: Cashflow, Bruttorendite, Kaufpreisfaktor und mehr',
    category: 'kpi',
    section: 'uebersicht',
  },
  {
    id: 'schnellregler',
    title: 'Schnellregler',
    description: 'Kaufpreis, Eigenkapital, Zinssatz, Tilgung und Miete per Schieberegler schnell anpassen',
    category: 'card',
    section: 'uebersicht',
  },
  {
    id: 'monthlyCashflow',
    title: 'Monatlicher Cashflow',
    description: 'Gestapeltes Balkendiagramm mit Aufschlüsselung: Mieteinnahmen, Nebenkosten, Zinsen, Tilgung, Steuer',
    category: 'chart',
    section: 'uebersicht',
    showFor: ['vermietung'],
  },
  {
    id: 'wertentwicklung',
    title: 'Wertentwicklung',
    description: 'Liniendiagramm: Immobilienwert, Restschuld und Eigenkapital über 30 Jahre',
    category: 'chart',
    section: 'uebersicht',
  },
  {
    id: 'investmentComparison',
    title: 'Investment-Vergleich',
    description: 'Vergleich: Immobilien-Investment vs. ETF-Anlage (5% p.a.) über 30 Jahre',
    category: 'chart',
    section: 'uebersicht',
    showFor: ['vermietung'],
  },
  {
    id: 'threeYearCost',
    title: '3-Jahres-Kosten',
    description: 'Cashflow-Aufschlüsselung und Kreditstruktur (Zins + Tilgung) für die ersten 3 Jahre',
    category: 'chart',
    section: 'uebersicht',
  },
  {
    id: 'cashflowChart',
    title: 'Cashflow-Entwicklung (10J)',
    description: 'Stacked-Bar-Diagramm: Monatlicher Cashflow aufgeschlüsselt über 10 Jahre',
    category: 'chart',
    section: 'uebersicht',
    showFor: ['vermietung'],
  },
  {
    id: 'tilgungsplan',
    title: 'Tilgungsplan',
    description: 'Restschuld-Verlauf und Aufteilung Zins/Tilgung über die gesamte Kreditlaufzeit',
    category: 'chart',
    section: 'uebersicht',
  },
  {
    id: 'equityGrowth',
    title: 'Eigenkapital-Wachstum',
    description: 'Entwicklung des Eigenkapitals im Objekt durch Tilgung und Wertsteigerung',
    category: 'chart',
    section: 'uebersicht',
  },
  {
    id: 'financingPie',
    title: 'Finanzierungsstruktur',
    description: 'Kreisdiagramm: Aufteilung in Eigenkapital, Darlehen und Kaufnebenkosten',
    category: 'chart',
    section: 'uebersicht',
  },
  {
    id: 'costBreakdownPie',
    title: 'Kostenaufteilung',
    description: 'Kreisdiagramm: Monatliche Kosten aufgeschlüsselt nach Zinsen, Tilgung, NK etc.',
    category: 'chart',
    section: 'uebersicht',
    showFor: ['vermietung'],
  },
  {
    id: 'grunddaten',
    title: 'Grunddaten',
    description: 'Übersichtskarte mit Adresse, Bundesland, Wohnfläche, Baujahr und Immobilientyp',
    category: 'card',
    section: 'uebersicht',
  },
  {
    id: 'mapPreview',
    title: 'Kartenvorschau',
    description: 'Google Maps Kartenansicht der Immobilienadresse',
    category: 'card',
    section: 'uebersicht',
  },
]

// ─── Simulationen-Widgets ────────────────────────────────────────

const SIMULATIONEN_WIDGETS: WidgetDefinition[] = [
  {
    id: 'sim-verkauf',
    title: 'Verkaufs-Simulation',
    description: 'Simuliert den Verkauf der Immobilie zu verschiedenen Zeitpunkten und zeigt den Gewinn/Verlust',
    category: 'simulation',
    section: 'simulationen',
  },
  {
    id: 'sim-zins',
    title: 'Zins-Simulation',
    description: 'Wie verändert sich dein Cashflow bei steigenden oder fallenden Zinsen?',
    category: 'simulation',
    section: 'simulationen',
  },
  {
    id: 'sim-mietsteigerung',
    title: 'Mietsteigerungs-Simulation',
    description: 'Auswirkung verschiedener Mietsteigerungsraten auf den langfristigen Cashflow',
    category: 'simulation',
    section: 'simulationen',
    showFor: ['vermietung'],
  },
  {
    id: 'sim-anschluss',
    title: 'Anschlussfinanzierung',
    description: 'Berechnung der Restschuld und neuen Rate nach Ablauf der Zinsbindung',
    category: 'simulation',
    section: 'simulationen',
  },
  {
    id: 'sim-tilgungsplan',
    title: 'Tilgungsplan-Chart',
    description: 'Detaillierter Tilgungsverlauf mit Zins- und Tilgungsanteilen über die Laufzeit',
    category: 'chart',
    section: 'simulationen',
  },
  {
    id: 'sim-threeYearCost',
    title: '3-Jahres-Kosten',
    description: 'Gestapelte Balken: Cashflow-Komponenten und Kreditstruktur für Jahr 1-3',
    category: 'chart',
    section: 'simulationen',
  },
  {
    id: 'sim-cashflowEquity',
    title: 'Cashflow + Eigenkapital',
    description: 'Zwei Charts nebeneinander: Cashflow-Entwicklung und Eigenkapital-Wachstum',
    category: 'chart',
    section: 'simulationen',
  },
  {
    id: 'sim-investmentComp',
    title: 'Investment-Vergleich',
    description: 'Immobilie vs. ETF-Anlage: Vermögensentwicklung über 30 Jahre verglichen',
    category: 'chart',
    section: 'simulationen',
  },
]

// ─── Aggregierte Registry ────────────────────────────────────────

export const WIDGET_REGISTRY: WidgetDefinition[] = [
  ...UEBERSICHT_WIDGETS,
  ...SIMULATIONEN_WIDGETS,
]

/**
 * Widgets grouped by section.
 * Only sections with configurable widgets are listed.
 */
export const SECTION_WIDGETS: Record<string, WidgetDefinition[]> = {
  uebersicht: UEBERSICHT_WIDGETS,
  simulationen: SIMULATIONEN_WIDGETS,
}

/**
 * Default enabled widgets per section.
 * Minimal selection — users can add more via the right sidebar.
 */
export const DEFAULT_SECTION_WIDGETS: Record<string, string[]> = {
  uebersicht: ['kpiOverview', 'schnellregler'],
  simulationen: ['sim-verkauf', 'sim-zins', 'sim-mietsteigerung', 'sim-anschluss'],
}

export function getWidgetById(id: string): WidgetDefinition | undefined {
  return WIDGET_REGISTRY.find((w) => w.id === id)
}

export function getWidgetsForSection(sectionId: string): WidgetDefinition[] {
  return SECTION_WIDGETS[sectionId] ?? []
}

/**
 * Returns widgets for a section filtered by Nutzungsart.
 * Widgets without `showFor` are always included.
 */
export function getVisibleWidgetsForSection(
  sectionId: string,
  nutzungsart: 'vermietung' | 'eigennutzung',
): WidgetDefinition[] {
  return getWidgetsForSection(sectionId).filter(
    (w) => !w.showFor || w.showFor.includes(nutzungsart),
  )
}

/**
 * Checks if a widget ID should be visible for the given Nutzungsart.
 */
export function isWidgetVisibleForNutzungsart(
  widgetId: string,
  nutzungsart: 'vermietung' | 'eigennutzung',
): boolean {
  const widget = getWidgetById(widgetId)
  if (!widget) return true
  return !widget.showFor || widget.showFor.includes(nutzungsart)
}
