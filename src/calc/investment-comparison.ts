import type { Project, YearlyProjection, InvestmentComparisonResult } from './types'
import { DEFAULT_VALUES } from './defaults'

/**
 * Compare real estate investment to ETF and a custom alternative.
 *
 * Scenario: User invests eigenkapital in the property.
 * Alternative: Invest eigenkapital in ETF or custom investment instead.
 *
 * If the property has negative monthly cashflow, that deficit is also
 * "invested" in the alternatives (since you'd have that money
 * if you hadn't bought the property).
 */
export function calculateInvestmentComparison(
  project: Project,
  projection: YearlyProjection[],
  years: number = DEFAULT_VALUES.projectionYears
): InvestmentComparisonResult {
  const etfReturn = (project.etfRendite ?? DEFAULT_VALUES.etfRendite) / 100
  const customReturn = (project.customRendite ?? DEFAULT_VALUES.customRendite) / 100

  const immobilie: number[] = []
  const etf: number[] = []
  const custom: number[] = []
  const yearsArray: number[] = []

  let etfValue = project.eigenkapital
  let customValue = project.eigenkapital

  for (let i = 0; i < years; i++) {
    const yearData = projection[i]

    // RE: equity in property + cumulative cashflow
    const immoValue = yearData
      ? yearData.eigenkapitalImObjekt + yearData.kumulierterCashflow
      : immobilie[i - 1] ?? project.eigenkapital

    // Monthly negative cashflow = opportunity cost
    const annualCashflow = yearData?.cashflowNachSteuer ?? 0
    const monthlyDeficit = annualCashflow < 0 ? Math.abs(annualCashflow) / 12 : 0

    // ETF/Custom: compound growth + monthly deficit contributions
    if (monthlyDeficit > 0) {
      for (let m = 0; m < 12; m++) {
        etfValue = etfValue * (1 + etfReturn / 12) + monthlyDeficit
        customValue = customValue * (1 + customReturn / 12) + monthlyDeficit
      }
    } else {
      etfValue = etfValue * (1 + etfReturn)
      customValue = customValue * (1 + customReturn)
    }

    immobilie.push(Math.round(immoValue))
    etf.push(Math.round(etfValue))
    custom.push(Math.round(customValue))
    yearsArray.push(i + 1)
  }

  return {
    immobilie,
    etf,
    custom,
    years: yearsArray,
    etfRendite: project.etfRendite ?? DEFAULT_VALUES.etfRendite,
    customRendite: project.customRendite ?? DEFAULT_VALUES.customRendite,
    customName: project.customInvestmentName || 'Anderes Investment',
  }
}
