/**
 * Precise financial math utilities using decimal.js
 * Avoids floating point errors in currency and percentage calculations
 */
import Decimal from 'decimal.js'

// Configure decimal.js for financial calculations
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
})

/* ─── Core Operations ─── */

/** Add two monetary values precisely */
export function moneyAdd(a: number, b: number): number {
  return new Decimal(a).plus(b).toNumber()
}

/** Subtract two monetary values precisely */
export function moneySub(a: number, b: number): number {
  return new Decimal(a).minus(b).toNumber()
}

/** Multiply two values precisely (e.g., price * rate) */
export function moneyMul(a: number, b: number): number {
  return new Decimal(a).times(b).toNumber()
}

/** Divide two values precisely (e.g., price / area) */
export function moneyDiv(a: number, b: number): number {
  if (b === 0) return 0
  return new Decimal(a).dividedBy(b).toNumber()
}

/** Round to cents (2 decimal places) */
export function moneyRound(value: number): number {
  return new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber()
}

/** Round to a specific number of decimal places */
export function roundTo(value: number, places: number): number {
  return new Decimal(value).toDecimalPlaces(places, Decimal.ROUND_HALF_UP).toNumber()
}

/* ─── Percentage Operations ─── */

/** Calculate percentage: value * (percent / 100) */
export function percentOf(value: number, percent: number): number {
  return new Decimal(value).times(new Decimal(percent).dividedBy(100)).toNumber()
}

/** Calculate what percentage a is of b: (a / b) * 100 */
export function asPercent(a: number, b: number): number {
  if (b === 0) return 0
  return new Decimal(a).dividedBy(b).times(100).toNumber()
}

/* ─── Financial Functions ─── */

/**
 * Annuity calculation: monthly payment for a fixed-rate mortgage
 * @param principal - Loan amount
 * @param annualRate - Annual interest rate (%)
 * @param years - Loan term in years
 * @returns Monthly payment
 */
export function calculateAnnuity(principal: number, annualRate: number, years: number): number {
  const P = new Decimal(principal)
  const r = new Decimal(annualRate).dividedBy(100).dividedBy(12)
  const n = new Decimal(years).times(12)

  if (r.isZero()) {
    return P.dividedBy(n).toNumber()
  }

  // M = P * [r(1+r)^n] / [(1+r)^n - 1]
  const onePlusR = r.plus(1)
  const onePlusRPowN = onePlusR.pow(n)
  const numerator = P.times(r).times(onePlusRPowN)
  const denominator = onePlusRPowN.minus(1)

  return numerator.dividedBy(denominator).toDecimalPlaces(2).toNumber()
}

/**
 * Compound growth: final value after N years at a given rate
 * @param initial - Starting value
 * @param annualRate - Growth rate (%)
 * @param years - Number of years
 */
export function compoundGrowth(initial: number, annualRate: number, years: number): number {
  const rate = new Decimal(annualRate).dividedBy(100).plus(1)
  return new Decimal(initial).times(rate.pow(years)).toDecimalPlaces(2).toNumber()
}

/**
 * Sum an array of numbers precisely
 */
export function preciseSum(values: number[]): number {
  return values.reduce((sum, val) => new Decimal(sum).plus(val), new Decimal(0)).toNumber()
}

/**
 * Calculate the Internal Rate of Return (IRR) for a series of cashflows
 * Uses Newton's method
 * @param cashflows - Array of cashflows (first is usually negative = investment)
 * @param guess - Initial guess for IRR (default 10%)
 * @returns IRR as a percentage
 */
export function calculateIRR(cashflows: number[], guess: number = 10): number {
  const maxIterations = 100
  const tolerance = 0.0001

  let rate = new Decimal(guess).dividedBy(100)

  for (let i = 0; i < maxIterations; i++) {
    let npv = new Decimal(0)
    let dnpv = new Decimal(0) // derivative of NPV

    for (let j = 0; j < cashflows.length; j++) {
      const cf = new Decimal(cashflows[j])
      const factor = rate.plus(1).pow(j)
      npv = npv.plus(cf.dividedBy(factor))
      if (j > 0) {
        dnpv = dnpv.minus(cf.times(j).dividedBy(rate.plus(1).pow(j + 1)))
      }
    }

    if (dnpv.isZero()) break

    const newRate = rate.minus(npv.dividedBy(dnpv))

    if (newRate.minus(rate).abs().lessThan(tolerance)) {
      return newRate.times(100).toDecimalPlaces(2).toNumber()
    }

    rate = newRate
  }

  return rate.times(100).toDecimalPlaces(2).toNumber()
}
