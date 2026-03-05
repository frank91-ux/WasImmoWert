import Decimal from 'decimal.js'
import type { Project, KaufnebenkostenResult, FinancingResult, ZinsbindungPeriod } from './types'

export function calculateFinancing(
  project: Project,
  kaufnebenkosten: KaufnebenkostenResult
): FinancingResult {
  const gesamtkosten = new Decimal(kaufnebenkosten.gesamtkosten)
  const eigenkapital = new Decimal(project.eigenkapital)
  const darlehensBetrag = Decimal.max(0, gesamtkosten.minus(eigenkapital)).toNumber()

  if (darlehensBetrag === 0) {
    return {
      darlehensBetrag: 0,
      monatlicheRate: 0,
      monatlicheZinsenStart: 0,
      monatlicheTilgungStart: 0,
      annuitaet: 0,
    }
  }

  const darlehen = new Decimal(darlehensBetrag)
  const zinssatz = new Decimal(project.zinssatz)
  const tilgung = new Decimal(project.tilgung)

  // German annuity model: constant annual payment = loan * (interest% + repayment%)
  const annuitaetensatz = zinssatz.plus(tilgung).dividedBy(100)
  const annuitaet = darlehen.times(annuitaetensatz).toNumber()
  const monatlicheRate = darlehen.times(annuitaetensatz).dividedBy(12).toNumber()

  // Month 1 split
  const monatszins = zinssatz.dividedBy(100).dividedBy(12)
  const monatlicheZinsenStart = darlehen.times(monatszins).toNumber()
  const monatlicheTilgungStart = new Decimal(monatlicheRate).minus(monatlicheZinsenStart).toNumber()

  return {
    darlehensBetrag,
    monatlicheRate,
    monatlicheZinsenStart,
    monatlicheTilgungStart,
    annuitaet,
  }
}

export interface AmortizationMonth {
  month: number
  restschuld: number
  zinsen: number
  tilgung: number
  sondertilgung: number
}

export function calculateAmortizationSchedule(
  darlehensBetrag: number,
  zinssatz: number,
  monatlicheRate: number,
  sondertilgungJahr: number,
  years: number,
  zinsbindungPeriods: ZinsbindungPeriod[] = []
): AmortizationMonth[] {
  const schedule: AmortizationMonth[] = []
  let restschuld = new Decimal(darlehensBetrag)
  let currentZins = new Decimal(zinssatz)
  let currentRate = new Decimal(monatlicheRate)
  let monatszins = currentZins.dividedBy(100).dividedBy(12)
  const monthlyExtra = new Decimal(sondertilgungJahr).dividedBy(12)

  // Sort periods by afterYear ascending
  const sortedPeriods = [...zinsbindungPeriods].sort((a, b) => a.afterYear - b.afterYear)

  for (let month = 1; month <= years * 12 && restschuld.greaterThan(0); month++) {
    // Check if a rate change happens at this month boundary (start of a new year)
    if ((month - 1) % 12 === 0) {
      const yearStart = (month - 1) / 12 + 1
      const period = sortedPeriods.find((p) => p.afterYear === yearStart - 1)
      if (period) {
        currentZins = new Decimal(period.zinssatz)
        monatszins = currentZins.dividedBy(100).dividedBy(12)
        // Recalculate rate based on remaining balance and new rates
        const newAnnuitaetensatz = new Decimal(period.zinssatz).plus(period.tilgung).dividedBy(100).dividedBy(12)
        currentRate = restschuld.times(newAnnuitaetensatz)
      }
    }

    const zinsen = restschuld.times(monatszins)
    let tilgung = currentRate.minus(zinsen)
    let sondertilgung = monthlyExtra

    // Don't overpay
    if (tilgung.plus(sondertilgung).greaterThan(restschuld)) {
      tilgung = Decimal.min(tilgung, restschuld)
      sondertilgung = Decimal.max(0, restschuld.minus(tilgung))
    }

    restschuld = Decimal.max(0, restschuld.minus(tilgung).minus(sondertilgung))

    schedule.push({
      month,
      restschuld: restschuld.toDecimalPlaces(2).toNumber(),
      zinsen: zinsen.toDecimalPlaces(2).toNumber(),
      tilgung: tilgung.toDecimalPlaces(2).toNumber(),
      sondertilgung: sondertilgung.toDecimalPlaces(2).toNumber(),
    })
  }

  return schedule
}
