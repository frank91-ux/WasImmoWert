import type { Project, CalculationResult } from './types'
import { calculateKaufnebenkosten } from './kaufnebenkosten'
import { calculateFinancing, calculateAmortizationSchedule } from './financing'
import { calculateRentalIncome } from './rental'
import { calculateOperatingCosts } from './operating-costs'
import { calculateTax } from './tax'
import { calculateKpis } from './kpis'
import { calculateProjection } from './projection'
import { calculateInvestmentComparison } from './investment-comparison'

export function calculateAll(project: Project): CalculationResult {
  const kaufnebenkosten = calculateKaufnebenkosten(project)
  const financing = calculateFinancing(project, kaufnebenkosten)
  const rental = calculateRentalIncome(project)
  const operatingCosts = calculateOperatingCosts(project, rental)

  // Compute actual Year 1 interest from amortization schedule
  let yearOneInterest: number | undefined
  if (financing.darlehensBetrag > 0) {
    const schedule = calculateAmortizationSchedule(
      financing.darlehensBetrag,
      project.zinssatz,
      financing.monatlicheRate,
      project.sondertilgung,
      1
    )
    yearOneInterest = schedule
      .filter((m) => m.month <= 12)
      .reduce((sum, m) => sum + m.zinsen, 0)
  }

  const tax = calculateTax(project, financing, rental, operatingCosts, yearOneInterest)
  const kpis = calculateKpis(project, kaufnebenkosten, financing, rental, operatingCosts, tax, yearOneInterest)
  const projection = calculateProjection(project, kaufnebenkosten, financing, rental, operatingCosts, tax)
  const investmentComparison = calculateInvestmentComparison(project, projection)

  return {
    kaufnebenkosten,
    financing,
    rental,
    operatingCosts,
    tax,
    kpis,
    projection,
    investmentComparison,
  }
}

export * from './types'
export { createDefaultProject, DEFAULT_VALUES } from './defaults'
export { BUNDESLAND_LABELS, GRUNDERWERBSTEUER_SAETZE } from './grunderwerbsteuer'
export { calculateTaxForYear } from './tax'
