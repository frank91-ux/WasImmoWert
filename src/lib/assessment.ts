import type { CalculationResult } from '@/calc/types'
import { formatEur, formatPercent, formatFactor } from '@/lib/format'

export type Rating = 'good' | 'okay' | 'bad'

export interface Assessment {
  rating: Rating
  headline: string
  summary: string
  details: string[]
}

export function getAssessment(result: CalculationResult): Assessment {
  const { kpis } = result
  const cf = kpis.monatlichCashflowNachSteuer
  const rendite = kpis.bruttomietrendite
  const faktor = kpis.kaufpreisfaktor

  let score = 0
  const details: string[] = []

  // Cashflow
  if (cf >= 100) { score += 2; details.push(`Positiver Cashflow von ${formatEur(cf)}/Monat nach Steuern`) }
  else if (cf >= 0) { score += 1; details.push(`Knapp positiver Cashflow von ${formatEur(cf)}/Monat`) }
  else if (cf >= -200) { score += 0; details.push(`Leicht negativer Cashflow: ${formatEur(cf)}/Monat Zuschuss nötig`) }
  else { score -= 1; details.push(`Deutlich negativer Cashflow: ${formatEur(cf)}/Monat Zuschuss nötig`) }

  // Rendite
  if (rendite >= 5) { score += 2; details.push(`Bruttomietrendite von ${formatPercent(rendite)} ist sehr gut`) }
  else if (rendite >= 4) { score += 1; details.push(`Bruttomietrendite von ${formatPercent(rendite)} ist gut`) }
  else if (rendite >= 3) { score += 0; details.push(`Bruttomietrendite von ${formatPercent(rendite)} ist durchschnittlich`) }
  else { score -= 1; details.push(`Bruttomietrendite von ${formatPercent(rendite)} ist unterdurchschnittlich`) }

  // Kaufpreisfaktor
  if (faktor <= 20) { score += 2; details.push(`Kaufpreisfaktor ${formatFactor(faktor)} - sehr guter Preis`) }
  else if (faktor <= 25) { score += 1; details.push(`Kaufpreisfaktor ${formatFactor(faktor)} - fairer Preis`) }
  else if (faktor <= 30) { score += 0; details.push(`Kaufpreisfaktor ${formatFactor(faktor)} - eher teuer`) }
  else { score -= 1; details.push(`Kaufpreisfaktor ${formatFactor(faktor)} - sehr teuer`) }

  // EK-Rendite
  if (kpis.eigenkapitalrendite >= 8) { details.push(`Eigenkapitalrendite von ${formatPercent(kpis.eigenkapitalrendite)} inkl. Tilgung`) }
  else if (kpis.eigenkapitalrendite >= 4) { details.push(`Eigenkapitalrendite von ${formatPercent(kpis.eigenkapitalrendite)} inkl. Tilgung`) }
  else { details.push(`Eigenkapitalrendite von nur ${formatPercent(kpis.eigenkapitalrendite)} inkl. Tilgung`) }

  if (score >= 4) {
    return { rating: 'good', headline: 'Gutes Investment', summary: 'Diese Immobilie sieht nach einem rentablen Investment aus.', details }
  }
  if (score >= 1) {
    return { rating: 'okay', headline: 'Prüfenswert', summary: 'Diese Immobilie könnte sich lohnen, aber prüfen Sie die Details genau.', details }
  }
  return { rating: 'bad', headline: 'Eher ungünstig', summary: 'Bei den aktuellen Zahlen ist dieses Investment wenig attraktiv.', details }
}
