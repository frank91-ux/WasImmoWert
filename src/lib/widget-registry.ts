export interface WidgetDefinition {
  id: string
  title: string
  description: string
  category: 'kpi' | 'chart' | 'table' | 'card'
  defaultSection: string
}

/**
 * All available widgets that can be added to dashboard sections.
 * The KPI widget (kpiOverview) is always shown and not removable.
 */
export const WIDGET_REGISTRY: WidgetDefinition[] = [
  // KPI
  {
    id: 'kpiOverview',
    title: 'KPI-Übersicht',
    description: 'Die wichtigsten Kennzahlen auf einen Blick',
    category: 'kpi',
    defaultSection: 'uebersicht',
  },
  {
    id: 'schnellregler',
    title: 'Schnellregler',
    description: 'Kaufpreis, Eigenkapital, Zinssatz, Tilgung, Miete schnell anpassen',
    category: 'card',
    defaultSection: 'uebersicht',
  },
  // Charts
  {
    id: 'monthlyCashflow',
    title: 'Monatlicher Cashflow',
    description: 'Aufschlüsselung von Mieteinnahmen, NK, Zinsen, Tilgung, Steuer',
    category: 'chart',
    defaultSection: 'uebersicht',
  },
  {
    id: 'wertentwicklung',
    title: 'Wertentwicklung',
    description: 'Immobilienwert, Restschuld und Eigenkapital über 30 Jahre',
    category: 'chart',
    defaultSection: 'uebersicht',
  },
  {
    id: 'investmentComparison',
    title: 'Investment-Vergleich',
    description: 'Immobilie vs. ETF-Investment über 30 Jahre',
    category: 'chart',
    defaultSection: 'uebersicht',
  },
  {
    id: 'threeYearCost',
    title: '3-Jahres-Kosten',
    description: 'Cashflow-Aufschlüsselung und Kreditstruktur für Jahr 1-3',
    category: 'chart',
    defaultSection: 'uebersicht',
  },
  {
    id: 'cashflowChart',
    title: 'Cashflow-Entwicklung (10J)',
    description: 'Monatlicher Cashflow als Stacked-Bar über 10 Jahre',
    category: 'chart',
    defaultSection: 'uebersicht',
  },
  {
    id: 'tilgungsplan',
    title: 'Tilgungsplan',
    description: 'Restschuld und Zins-/Tilgungsverlauf über die gesamte Laufzeit',
    category: 'chart',
    defaultSection: 'uebersicht',
  },
  {
    id: 'equityGrowth',
    title: 'Eigenkapital-Wachstum',
    description: 'Entwicklung des Eigenkapitals im Objekt über die Jahre',
    category: 'chart',
    defaultSection: 'uebersicht',
  },
  {
    id: 'financingPie',
    title: 'Finanzierungsstruktur',
    description: 'Kreisdiagramm: Eigenkapital, Darlehen, Kaufnebenkosten',
    category: 'chart',
    defaultSection: 'uebersicht',
  },
  {
    id: 'costBreakdownPie',
    title: 'Kostenaufteilung',
    description: 'Kreisdiagramm: Monatliche Kostenstruktur (Zinsen, Tilgung, NK...)',
    category: 'chart',
    defaultSection: 'uebersicht',
  },
  // Cards
  {
    id: 'grunddaten',
    title: 'Grunddaten',
    description: 'Adresse, Bundesland, Wohnfläche, Baujahr und Immobilientyp',
    category: 'card',
    defaultSection: 'uebersicht',
  },
  {
    id: 'mapPreview',
    title: 'Kartenvorschau',
    description: 'Google Maps Ansicht der Immobilienadresse',
    category: 'card',
    defaultSection: 'uebersicht',
  },
]

/**
 * Default widgets for the Übersicht section.
 * Compact start: KPIs + 3 charts
 */
export const DEFAULT_OVERVIEW_WIDGETS = [
  'kpiOverview',
  'schnellregler',
  'monthlyCashflow',
  'wertentwicklung',
  'investmentComparison',
]

export function getWidgetById(id: string): WidgetDefinition | undefined {
  return WIDGET_REGISTRY.find((w) => w.id === id)
}
