import Decimal from 'decimal.js'
import type { Project, FinancingResult, RentalResult, OperatingCostResult, TaxResult } from './types'

/**
 * German income tax per §32a EStG (2025 Grundtarif).
 * Five-zone progressive formula using decimal.js for precision.
 */
export function calculateEinkommensteuer(zvE: number): number {
  if (zvE <= 0) return 0
  if (zvE <= 12096) return 0

  const z = new Decimal(zvE)

  if (zvE <= 17443) {
    const y = z.minus(12096).dividedBy(10000)
    // (922.98 * y + 1400) * y
    return y.times(922.98).plus(1400).times(y).floor().toNumber()
  }
  if (zvE <= 68480) {
    const y2 = z.minus(17443).dividedBy(10000)
    // (181.19 * z + 2397) * z + 1025.38
    return y2.times(181.19).plus(2397).times(y2).plus(1025.38).floor().toNumber()
  }
  if (zvE <= 277825) {
    // 0.42 * zvE - 10602.13
    return z.times(0.42).minus(10602.13).floor().toNumber()
  }
  // 0.45 * zvE - 18936.88
  return z.times(0.45).minus(18936.88).floor().toNumber()
}

/**
 * Solidaritätszuschlag with proper Gleitzone (§4 SolzG).
 * - ESt ≤ 18,130: Soli = 0
 * - ESt 18,131–33,710: Soli = min(11.9% × (ESt − 18,130), 5.5% × ESt)
 * - ESt > 33,710: Soli = 5.5% × ESt
 */
export function calculateSoli(einkommensteuer: number): number {
  if (einkommensteuer <= 18130) return 0
  const est = new Decimal(einkommensteuer)
  const gleitzoneSoli = est.minus(18130).times(0.119)
  const fullSoli = est.times(0.055)
  return Decimal.min(gleitzoneSoli, fullSoli).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber()
}

/**
 * AfA rate based on year of construction.
 */
export function calculateAfaRate(baujahr: number): number {
  if (baujahr < 1925) return 2.5
  if (baujahr <= 2022) return 2.0
  return 3.0
}

const ZERO_TAX: TaxResult = {
  afaRate: 0, afaBetragJahr: 0, abschreibungBeweglichJahr: 0,
  absetzbarerZinsanteilJahr: 0, zuVersteuerndeEinkuenfteImmobilie: 0,
  steuerlicheAuswirkung: 0, soliBetrag: 0, kirchensteuerBetrag: 0,
  gesamtSteuerbelastungJahr: 0,
}

export function calculateTax(
  project: Project,
  financing: FinancingResult,
  rental: RentalResult,
  operatingCosts: OperatingCostResult,
  actualYearOneInterest?: number
): TaxResult {
  // Eigennutzung: no rental tax deductions
  if (project.nutzungsart === 'eigennutzung') return ZERO_TAX

  const kaufpreis = new Decimal(project.kaufpreis)
  const grundstueckAnteil = new Decimal(project.grundstueckAnteil).dividedBy(100)

  // Building value for depreciation (excluding land portion)
  const gebaeudeWert = kaufpreis.times(new Decimal(1).minus(grundstueckAnteil))
  const afaRate = project.customAfaRate ?? calculateAfaRate(project.baujahr)
  const afaBetragJahr = gebaeudeWert.times(new Decimal(afaRate).dividedBy(100)).toNumber()

  // Movable assets depreciation (Year 1)
  const abschreibungBeweglichJahr =
    project.beweglicheGegenstaende > 0 && project.afaBeweglichJahre > 0
      ? new Decimal(project.beweglicheGegenstaende).dividedBy(project.afaBeweglichJahre).toNumber()
      : 0

  // Year 1 interest: use actual value if provided, otherwise approximate
  let annualInterestPortion: number
  if (actualYearOneInterest !== undefined) {
    annualInterestPortion = actualYearOneInterest
  } else if (financing.darlehensBetrag > 0) {
    const zinssatz = new Decimal(project.zinssatz)
    const tilgung = new Decimal(project.tilgung)
    annualInterestPortion = new Decimal(financing.annuitaet)
      .times(zinssatz.dividedBy(zinssatz.plus(tilgung)))
      .toNumber()
  } else {
    annualInterestPortion = 0
  }

  // Taxable rental income = rental income - all deductible expenses
  const zuVersteuerndeEinkuenfteImmobilie = new Decimal(rental.nettomieteinnahmen)
    .minus(operatingCosts.betriebskostenGesamt)
    .minus(annualInterestPortion)
    .minus(afaBetragJahr)
    .minus(abschreibungBeweglichJahr)
    .toNumber()

  let steuerlicheAuswirkung: number
  let soliBetrag: number
  let kirchensteuerBetrag: number

  if (project.useProgressiveTax) {
    const estOhne = calculateEinkommensteuer(project.zuVersteuerndesEinkommen)
    const estMit = calculateEinkommensteuer(
      new Decimal(project.zuVersteuerndesEinkommen).plus(zuVersteuerndeEinkuenfteImmobilie).toNumber()
    )
    steuerlicheAuswirkung = new Decimal(estMit).minus(estOhne).toNumber()
    soliBetrag = new Decimal(calculateSoli(estMit)).minus(calculateSoli(estOhne)).toNumber()
  } else {
    steuerlicheAuswirkung = new Decimal(zuVersteuerndeEinkuenfteImmobilie)
      .times(new Decimal(project.persoenlicherSteuersatz).dividedBy(100))
      .toNumber()
    soliBetrag = new Decimal(steuerlicheAuswirkung).times(0.055).toNumber()
  }

  kirchensteuerBetrag = project.kirchensteuer
    ? new Decimal(steuerlicheAuswirkung).times(new Decimal(project.kirchensteuersatz).dividedBy(100)).toNumber()
    : 0

  const gesamtSteuerbelastungJahr = new Decimal(steuerlicheAuswirkung)
    .plus(soliBetrag)
    .plus(kirchensteuerBetrag)
    .toNumber()

  return {
    afaRate,
    afaBetragJahr,
    abschreibungBeweglichJahr,
    absetzbarerZinsanteilJahr: annualInterestPortion,
    zuVersteuerndeEinkuenfteImmobilie,
    steuerlicheAuswirkung,
    soliBetrag,
    kirchensteuerBetrag,
    gesamtSteuerbelastungJahr,
  }
}

/**
 * Calculate tax for a specific year of the projection.
 * Uses actual yearly interest from amortization schedule and handles
 * movable asset depreciation expiry.
 */
export function calculateTaxForYear(
  project: Project,
  actualYearlyInterest: number,
  rental: RentalResult,
  operatingCosts: OperatingCostResult,
  yearNumber: number
): TaxResult {
  if (project.nutzungsart === 'eigennutzung') return ZERO_TAX

  const kaufpreis = new Decimal(project.kaufpreis)
  const grundstueckAnteil = new Decimal(project.grundstueckAnteil).dividedBy(100)

  const gebaeudeWert = kaufpreis.times(new Decimal(1).minus(grundstueckAnteil))
  const afaRate = project.customAfaRate ?? calculateAfaRate(project.baujahr)
  const afaBetragJahr = gebaeudeWert.times(new Decimal(afaRate).dividedBy(100)).toNumber()

  // Movable assets depreciation expires after afaBeweglichJahre
  const abschreibungBeweglichJahr =
    project.beweglicheGegenstaende > 0
    && project.afaBeweglichJahre > 0
    && yearNumber <= project.afaBeweglichJahre
      ? new Decimal(project.beweglicheGegenstaende).dividedBy(project.afaBeweglichJahre).toNumber()
      : 0

  const zuVersteuerndeEinkuenfteImmobilie = new Decimal(rental.nettomieteinnahmen)
    .minus(operatingCosts.betriebskostenGesamt)
    .minus(actualYearlyInterest)
    .minus(afaBetragJahr)
    .minus(abschreibungBeweglichJahr)
    .toNumber()

  let steuerlicheAuswirkung: number
  let soliBetrag: number
  let kirchensteuerBetrag: number

  if (project.useProgressiveTax) {
    const estOhne = calculateEinkommensteuer(project.zuVersteuerndesEinkommen)
    const estMit = calculateEinkommensteuer(
      new Decimal(project.zuVersteuerndesEinkommen).plus(zuVersteuerndeEinkuenfteImmobilie).toNumber()
    )
    steuerlicheAuswirkung = new Decimal(estMit).minus(estOhne).toNumber()
    soliBetrag = new Decimal(calculateSoli(estMit)).minus(calculateSoli(estOhne)).toNumber()
  } else {
    steuerlicheAuswirkung = new Decimal(zuVersteuerndeEinkuenfteImmobilie)
      .times(new Decimal(project.persoenlicherSteuersatz).dividedBy(100))
      .toNumber()
    soliBetrag = new Decimal(steuerlicheAuswirkung).times(0.055).toNumber()
  }

  kirchensteuerBetrag = project.kirchensteuer
    ? new Decimal(steuerlicheAuswirkung).times(new Decimal(project.kirchensteuersatz).dividedBy(100)).toNumber()
    : 0

  const gesamtSteuerbelastungJahr = new Decimal(steuerlicheAuswirkung)
    .plus(soliBetrag)
    .plus(kirchensteuerBetrag)
    .toNumber()

  return {
    afaRate,
    afaBetragJahr,
    abschreibungBeweglichJahr,
    absetzbarerZinsanteilJahr: actualYearlyInterest,
    zuVersteuerndeEinkuenfteImmobilie,
    steuerlicheAuswirkung,
    soliBetrag,
    kirchensteuerBetrag,
    gesamtSteuerbelastungJahr,
  }
}
