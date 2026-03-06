import type { Project, KaufnebenkostenResult, FinancingResult, RentalResult, OperatingCostResult, TaxResult, YearlyProjection } from './types'
import { calculateAmortizationSchedule } from './financing'
import { calculateTaxForYear } from './tax'

/**
 * Sum of modernization costs due in a specific year.
 */
function getModernisierungKosten(project: Project, year: number): number {
  if (!project.modernisierungen || project.modernisierungen.length === 0) return 0
  return project.modernisierungen
    .filter((m) => m.jahr === year)
    .reduce((sum, m) => sum + m.kosten, 0)
}

export function calculateProjection(
  project: Project,
  _kaufnebenkosten: KaufnebenkostenResult,
  financing: FinancingResult,
  rental: RentalResult,
  operatingCosts: OperatingCostResult,
  _tax: TaxResult,
  years: number = 30
): YearlyProjection[] {
  const appreciation = (project.wertsteigerung ?? 2) / 100

  if (financing.darlehensBetrag === 0) {
    let kumulierterCashflow = 0
    return Array.from({ length: years }, (_, i) => {
      const yearNum = i + 1
      const yearTax = calculateTaxForYear(project, 0, rental, operatingCosts, yearNum)
      const immobilienWert = project.kaufpreis * Math.pow(1 + appreciation, yearNum)
      const modernisierungKosten = getModernisierungKosten(project, yearNum)
      const annualCashflow = rental.nettomieteinnahmen
        - operatingCosts.betriebskostenGesamt
        - yearTax.gesamtSteuerbelastungJahr
        - modernisierungKosten
      kumulierterCashflow += annualCashflow
      return {
        year: yearNum,
        restschuld: 0,
        zinsenJahr: 0,
        tilgungJahr: 0,
        eigenkapitalImObjekt: immobilienWert,
        immobilienWert,
        cashflowNachSteuer: annualCashflow,
        kumulierterCashflow,
        steuerbelastungJahr: yearTax.gesamtSteuerbelastungJahr,
      }
    })
  }

  const schedule = calculateAmortizationSchedule(
    financing.darlehensBetrag,
    project.zinssatz,
    financing.monatlicheRate,
    project.sondertilgung,
    years,
    project.zinsbindungPeriods ?? []
  )

  const projection: YearlyProjection[] = []
  let kumulierterCashflow = 0

  for (let year = 1; year <= years; year++) {
    const immobilienWert = project.kaufpreis * Math.pow(1 + appreciation, year)

    const yearMonths = schedule.filter(
      (m) => m.month > (year - 1) * 12 && m.month <= year * 12
    )

    const zinsenJahr = yearMonths.reduce((sum, m) => sum + m.zinsen, 0)
    const tilgungJahr = yearMonths.reduce((sum, m) => sum + m.tilgung + m.sondertilgung, 0)
    const restschuld = yearMonths.length > 0
      ? yearMonths[yearMonths.length - 1].restschuld
      : 0
    const payments = yearMonths.reduce(
      (sum, m) => sum + m.zinsen + m.tilgung + m.sondertilgung, 0
    )

    // Per-year tax with ACTUAL interest from amortization schedule
    const yearTax = calculateTaxForYear(
      project, zinsenJahr, rental, operatingCosts, year
    )

    const modernisierungKosten = getModernisierungKosten(project, year)

    const cashflowNachSteuer =
      rental.nettomieteinnahmen
      - operatingCosts.betriebskostenGesamt
      - payments
      - yearTax.gesamtSteuerbelastungJahr
      - modernisierungKosten

    kumulierterCashflow += cashflowNachSteuer
    const eigenkapitalImObjekt = immobilienWert - restschuld

    projection.push({
      year,
      restschuld,
      zinsenJahr,
      tilgungJahr,
      eigenkapitalImObjekt,
      immobilienWert,
      cashflowNachSteuer,
      kumulierterCashflow,
      steuerbelastungJahr: yearTax.gesamtSteuerbelastungJahr,
    })
  }

  return projection
}
