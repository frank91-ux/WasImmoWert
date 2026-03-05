import Decimal from 'decimal.js'
import type {
  Project, KaufnebenkostenResult, FinancingResult,
  RentalResult, OperatingCostResult, TaxResult, KpiResult
} from './types'

export function calculateKpis(
  project: Project,
  kaufnebenkosten: KaufnebenkostenResult,
  financing: FinancingResult,
  rental: RentalResult,
  operatingCosts: OperatingCostResult,
  tax: TaxResult,
  yearOneInterest?: number
): KpiResult {
  const kaufpreis = new Decimal(project.kaufpreis)
  const eigenkapital = new Decimal(project.eigenkapital)
  const gesamtkosten = new Decimal(kaufnebenkosten.gesamtkosten)

  // Gross rental yield: annual cold rent / purchase price
  const bruttomietrendite = kaufpreis.greaterThan(0)
    ? new Decimal(rental.jahresmieteKalt).dividedBy(kaufpreis).times(100).toNumber()
    : 0

  // Net rental yield: (annual rent - costs) / total costs
  const nettomietrendite = gesamtkosten.greaterThan(0)
    ? new Decimal(rental.nettomieteinnahmen)
        .minus(operatingCosts.betriebskostenGesamt)
        .dividedBy(gesamtkosten)
        .times(100)
        .toNumber()
    : 0

  // Price multiple: how many years of rent equal the purchase price
  const kaufpreisfaktor = rental.nettomieteinnahmen > 0
    ? kaufpreis.dividedBy(rental.nettomieteinnahmen).toNumber()
    : 0

  // Annual cashflow before tax
  const jaehrlichCashflowVorSteuer = new Decimal(rental.nettomieteinnahmen)
    .minus(operatingCosts.betriebskostenGesamt)
    .minus(financing.annuitaet)
    .toNumber()

  // Annual cashflow after tax
  const jaehrlichCashflowNachSteuer = new Decimal(jaehrlichCashflowVorSteuer)
    .minus(tax.gesamtSteuerbelastungJahr)
    .toNumber()

  // Return on equity: (cashflow + principal repayment) / equity
  // Includes Tilgung as it builds equity in the property
  let annualTilgung: number
  if (financing.darlehensBetrag > 0) {
    if (yearOneInterest !== undefined) {
      annualTilgung = new Decimal(financing.annuitaet).minus(yearOneInterest).toNumber()
    } else {
      const zinssatz = new Decimal(project.zinssatz)
      const tilgung = new Decimal(project.tilgung)
      annualTilgung = new Decimal(financing.annuitaet)
        .minus(
          new Decimal(financing.annuitaet).times(zinssatz.dividedBy(zinssatz.plus(tilgung)))
        )
        .toNumber()
    }
  } else {
    annualTilgung = 0
  }

  const eigenkapitalrendite = eigenkapital.greaterThan(0)
    ? new Decimal(jaehrlichCashflowNachSteuer)
        .plus(annualTilgung)
        .dividedBy(eigenkapital)
        .times(100)
        .toNumber()
    : 0

  // Debt Service Coverage Ratio
  const noi = new Decimal(rental.nettomieteinnahmen).minus(operatingCosts.betriebskostenGesamt)
  const dscr = financing.annuitaet > 0
    ? noi.dividedBy(financing.annuitaet).toNumber()
    : Infinity

  // Cash on Cash Return (cashflow only, no equity buildup)
  const cashOnCash = eigenkapital.greaterThan(0)
    ? new Decimal(jaehrlichCashflowNachSteuer).dividedBy(eigenkapital).times(100).toNumber()
    : 0

  // Vermögenszuwachs: Cashflow + Tilgung + Wertsteigerung
  const wertsteigerungJahr = kaufpreis.times(new Decimal(project.wertsteigerung).dividedBy(100)).toNumber()
  const vermoegenszuwachsJaehrlich = new Decimal(jaehrlichCashflowNachSteuer)
    .plus(annualTilgung)
    .plus(wertsteigerungJahr)
    .toNumber()
  const vermoegenszuwachsMonatlich = new Decimal(vermoegenszuwachsJaehrlich).dividedBy(12).toNumber()

  // Eigennutzung-specific KPIs
  const monatlicheKosten = project.nutzungsart === 'eigennutzung'
    ? new Decimal(operatingCosts.betriebskostenGesamt).dividedBy(12).plus(financing.monatlicheRate).toNumber()
    : 0
  const ersparteMieteJahr = new Decimal(project.ersparteMiete).times(12).toNumber()

  // Eigennutzungsrendite auf Gesamtkapital-Basis (ohne Leverage-Effekt)
  const eigennutzungRendite = gesamtkosten.greaterThan(0) && project.nutzungsart === 'eigennutzung'
    ? new Decimal(ersparteMieteJahr)
        .minus(operatingCosts.betriebskostenGesamt)
        .minus(financing.annuitaet)
        .plus(annualTilgung)
        .plus(wertsteigerungJahr)
        .dividedBy(gesamtkosten)
        .times(100)
        .toNumber()
    : 0

  return {
    bruttomietrendite,
    nettomietrendite,
    kaufpreisfaktor,
    eigenkapitalrendite,
    dscr,
    monatlichCashflowVorSteuer: new Decimal(jaehrlichCashflowVorSteuer).dividedBy(12).toNumber(),
    monatlichCashflowNachSteuer: new Decimal(jaehrlichCashflowNachSteuer).dividedBy(12).toNumber(),
    jaehrlichCashflowVorSteuer,
    jaehrlichCashflowNachSteuer,
    cashOnCash,
    vermoegenszuwachsMonatlich,
    vermoegenszuwachsJaehrlich,
    monatlicheKosten,
    ersparteMieteJahr,
    eigennutzungRendite,
  }
}
