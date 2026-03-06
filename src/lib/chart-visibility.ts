/**
 * Chart & Widget visibility based on Nutzungsart.
 *
 * Eigennutzung hides rental-specific widgets:
 * - monthlyCashflow (Miet-Cashflow)
 * - cashflowChart (Cashflow over 10 years)
 * - costBreakdownPie (monatliche Kosten-Aufteilung with Mieteinnahmen)
 * - investmentComparison (Investment-Vergleich – mainly relevant for Vermietung)
 * - sim-mietsteigerung (Mietsteigerungs-Simulation)
 *
 * All other widgets remain visible for both Nutzungsarten.
 */

const HIDDEN_FOR_EIGENNUTZUNG = new Set([
  'monthlyCashflow',
  'cashflowChart',
  'costBreakdownPie',
  'investmentComparison',
  'sim-mietsteigerung',
])

export type Nutzungsart = 'vermietung' | 'eigennutzung'

/**
 * Returns true if the widget should be visible for the given Nutzungsart.
 */
export function isWidgetVisible(widgetId: string, nutzungsart: Nutzungsart): boolean {
  if (nutzungsart === 'eigennutzung') {
    return !HIDDEN_FOR_EIGENNUTZUNG.has(widgetId)
  }
  return true
}

/**
 * Filters a list of widget IDs, keeping only those visible for the given Nutzungsart.
 */
export function filterVisibleWidgets(widgetIds: string[], nutzungsart: Nutzungsart): string[] {
  return widgetIds.filter((id) => isWidgetVisible(id, nutzungsart))
}
