import Decimal from 'decimal.js'
import type { Project, KaufnebenkostenResult } from './types'
import { getGrunderwerbsteuerSatz } from './grunderwerbsteuer'

export function calculateKaufnebenkosten(project: Project): KaufnebenkostenResult {
  const kaufpreis = new Decimal(project.kaufpreis)
  const satz = getGrunderwerbsteuerSatz(project.bundesland)

  const grunderwerbsteuer = kaufpreis.times(new Decimal(satz).dividedBy(100)).toNumber()
  const notarkosten = kaufpreis.times(new Decimal(project.notarUndGrundbuch).dividedBy(100)).toNumber()
  const maklerkosten = kaufpreis.times(new Decimal(project.maklerProvision).dividedBy(100)).toNumber()

  const kaufnebenkostenGesamt = new Decimal(grunderwerbsteuer)
    .plus(notarkosten)
    .plus(maklerkosten)
    .toNumber()

  const gesamtkosten = kaufpreis.plus(kaufnebenkostenGesamt).toNumber()

  return {
    grunderwerbsteuer,
    grunderwerbsteuerSatz: satz,
    notarkosten,
    maklerkosten,
    kaufnebenkostenGesamt,
    gesamtkosten,
  }
}
