import type { Project, RentalResult, OperatingCostResult } from './types'

export function calculateOperatingCosts(project: Project, rental: RentalResult): OperatingCostResult {
  let instandhaltungJahr: number
  let verwaltungJahr: number

  if (project.hausgeldModus === 'hausgeld' && project.hausgeldProMonat > 0) {
    // Hausgeld mode: derive Instandhaltung and Verwaltung from monthly Hausgeld
    const hausgeldJahr = project.hausgeldProMonat * 12
    instandhaltungJahr = hausgeldJahr * (project.hausgeldInstandhaltungAnteil / 100)
    verwaltungJahr = hausgeldJahr * (project.hausgeldVerwaltungAnteil / 100)
  } else {
    // Einzelposten mode: use individual fields
    instandhaltungJahr = project.instandhaltungProQm * project.wohnflaeche
    verwaltungJahr = project.verwaltungProEinheit * project.anzahlEinheiten * 12
  }

  const nichtUmlegbarJahr = rental.nichtUmlagefaehigeNK + (project.nichtUmlegbareNebenkosten * 12)
  const sonstigeKostenJahr = project.sonstigeKosten * 12

  // Custom Nebenkosten line items (non-umlagefähig portion only — umlagefähig covered by rental)
  const customNkNichtUmlagefaehigJahr = (project.nebenkostenPosten ?? [])
    .filter((p) => !p.umlagefaehig)
    .reduce((sum, p) => sum + p.betrag * 12, 0)

  const betriebskostenGesamt = instandhaltungJahr + verwaltungJahr + nichtUmlegbarJahr + sonstigeKostenJahr + customNkNichtUmlagefaehigJahr

  return {
    instandhaltungJahr,
    verwaltungJahr,
    nichtUmlegbarJahr,
    sonstigeKostenJahr,
    betriebskostenGesamt,
  }
}
