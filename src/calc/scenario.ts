import type { YearlyProjection, ScenarioAdjustment } from './types'

/**
 * For a kredit-type adjustment, compute the annual payment (annuity),
 * the interest/tilgung split per year, and remaining balance per year.
 */
function computeKreditSchedule(adj: ScenarioAdjustment): {
  annualPayment: number
  balanceByYear: Map<number, number>
  interestByYear: Map<number, number>
  tilgungByYear: Map<number, number>
} {
  const summe = adj.kreditSumme ?? 0
  const zins = (adj.kreditZins ?? 3) / 100
  const tilgung = (adj.kreditTilgung ?? 2) / 100

  const monatlicheRate = summe * (zins + tilgung) / 12
  const annualPayment = monatlicheRate * 12

  const balanceByYear = new Map<number, number>()
  const interestByYear = new Map<number, number>()
  const tilgungByYear = new Map<number, number>()
  let balance = summe

  for (let year = adj.fromYear; year <= adj.toYear; year++) {
    if (balance <= 0) {
      balanceByYear.set(year, 0)
      interestByYear.set(year, 0)
      tilgungByYear.set(year, 0)
      continue
    }
    const yearInterest = balance * zins
    const yearTilgung = Math.min(annualPayment - yearInterest, balance)
    balance = Math.max(0, balance - yearTilgung)
    balanceByYear.set(year, balance)
    interestByYear.set(year, yearInterest)
    tilgungByYear.set(year, yearTilgung)
  }

  return { annualPayment, balanceByYear, interestByYear, tilgungByYear }
}

/**
 * Apply scenario adjustments on top of a base projection with proper
 * financial and tax logic.
 *
 * Tax treatment:
 * - Income changes affect taxable income → tax changes proportionally
 * - Kredit interest is tax-deductible → reduces tax burden
 * - Kredit tilgung is NOT tax-deductible
 * - Expense type: assumed NOT tax-deductible (Sonderumlagen, Reparaturen etc.)
 *
 * Returns extended projection with scenario deltas for chart rendering.
 * The base projection is NOT mutated.
 */
export function applyScenarioToProjection(
  baseProjection: YearlyProjection[],
  adjustments: ScenarioAdjustment[],
  steuersatz = 0
): YearlyProjection[] {
  if (adjustments.length === 0) return baseProjection

  const taxRate = steuersatz / 100 // Convert from % to decimal

  // Pre-compute kredit schedules
  const kreditSchedules = adjustments
    .filter((a) => a.type === 'kredit')
    .map((a) => ({ adj: a, ...computeKreditSchedule(a) }))

  let kumulierterCashflow = 0

  return baseProjection.map((entry) => {
    const year = entry.year

    // Track separate deltas for proper tax calculation
    let incomeDelta = 0         // Changes to rental/taxable income
    let nonDeductibleExpense = 0 // Expenses NOT tax-deductible
    let deductibleExpense = 0   // Expenses that ARE tax-deductible (kredit interest)
    let extraTilgung = 0        // Kredit tilgung (not deductible, but affects restschuld)
    let restschuldDelta = 0

    // Process income & expense adjustments
    for (const adj of adjustments) {
      if (year < adj.fromYear || year > adj.toYear) continue

      if (adj.type === 'expense') {
        // Expenses reduce cashflow — always positive means cost
        nonDeductibleExpense += Math.abs(adj.annualAmount ?? 0)
      } else if (adj.type === 'income') {
        // Income: positive = more income, negative = income loss (e.g. Mietausfall)
        // Do NOT use Math.abs — sign matters!
        incomeDelta += (adj.annualAmount ?? 0)
      }
    }

    // Kredit adjustments: interest is deductible, tilgung is not
    for (const ks of kreditSchedules) {
      if (year < ks.adj.fromYear || year > ks.adj.toYear) continue
      const balance = ks.balanceByYear.get(year) ?? 0
      const interest = ks.interestByYear.get(year) ?? 0
      const tilgung = ks.tilgungByYear.get(year) ?? 0

      if (interest > 0 || tilgung > 0 || year === ks.adj.fromYear) {
        deductibleExpense += interest
        extraTilgung += tilgung
      }
      restschuldDelta += balance
    }

    // Tax-adjusted calculation:
    // Change in taxable income = incomeDelta - deductibleExpense
    // Tax delta = taxableIncomeDelta × taxRate
    // After-tax cashflow delta = incomeDelta - nonDeductibleExpense - deductibleExpense - extraTilgung - taxDelta
    const taxableIncomeDelta = incomeDelta - deductibleExpense
    const taxDelta = taxableIncomeDelta * taxRate

    const cashflowDelta = incomeDelta - nonDeductibleExpense - deductibleExpense - extraTilgung - taxDelta

    const newCashflow = entry.cashflowNachSteuer + cashflowDelta
    kumulierterCashflow += newCashflow
    const newRestschuld = entry.restschuld + restschuldDelta
    const newSteuer = entry.steuerbelastungJahr + taxDelta

    return {
      ...entry,
      cashflowNachSteuer: newCashflow,
      kumulierterCashflow,
      restschuld: newRestschuld,
      eigenkapitalImObjekt: entry.immobilienWert - newRestschuld,
      steuerbelastungJahr: newSteuer,
      // Extra fields for chart rendering (duck-typed, won't break YearlyProjection)
      zinsenJahr: entry.zinsenJahr + deductibleExpense,
      tilgungJahr: entry.tilgungJahr + extraTilgung,
    } as YearlyProjection
  })
}
