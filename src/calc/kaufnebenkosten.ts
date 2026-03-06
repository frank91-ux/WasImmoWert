import Decimal from 'decimal.js'
import type { Project, KaufnebenkostenResult } from './types'
import { getGrunderwerbsteuerSatz } from './grunderwerbsteuer'

export function calculateKaufnebenkosten(project: Project): KaufnebenkostenResult {
  const kaufpreis = new Decimal(project.kaufpreis || 0)
  const satz = getGrunderwerbsteuerSatz(project.bundesland)

  const notarPct = isFinite(project.notarUndGrundbuch) ? project.notarUndGrundbuch : 1.5
  const maklerPct = isFinite(project.maklerProvision) ? project.maklerProvision : 0

  // Bewegliche Gegenstände reduzieren die Bemessungsgrundlage für Notar & Grunderwerbsteuer
  const beweglich = new Decimal(project.beweglicheGegenstaende || 0)
  const bemessungsgrundlage = Decimal.max(0, kaufpreis.minus(beweglich))

  const grunderwerbsteuer = bemessungsgrundlage.times(new Decimal(satz).dividedBy(100)).toNumber()
  const notarkosten = bemessungsgrundlage.times(new Decimal(notarPct).dividedBy(100)).toNumber()
  const maklerkosten = kaufpreis.times(new Decimal(maklerPct).dividedBy(100)).toNumber()

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
