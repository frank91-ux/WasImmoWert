import type { Project, RentalResult } from './types'

export function calculateRentalIncome(project: Project): RentalResult {
  let nebenkostenGesamt: number
  let umlagefaehigeNK: number
  let nichtUmlagefaehigeNK: number

  if (project.hausgeldModus === 'hausgeld' && project.propertyType === 'wohnung' && project.hausgeldProMonat > 0) {
    // Hausgeld mode: total from hausgeld, split via umlagefaehigAnteil
    const hausgeldJahr = project.hausgeldProMonat * 12
    nebenkostenGesamt = hausgeldJahr
    umlagefaehigeNK = hausgeldJahr * (project.umlagefaehigAnteil / 100)
    nichtUmlagefaehigeNK = hausgeldJahr - umlagefaehigeNK
  } else {
    // Einzelposten mode
    const nebenkostenMonat = project.nebenkostenProQm * project.wohnflaeche
    nebenkostenGesamt = nebenkostenMonat * 12
    umlagefaehigeNK = nebenkostenGesamt * (project.umlagefaehigAnteil / 100)
    nichtUmlagefaehigeNK = nebenkostenGesamt - umlagefaehigeNK
  }

  // Eigennutzung: no rental income, all NK borne by owner
  if (project.nutzungsart === 'eigennutzung') {
    return {
      jahresmieteKalt: 0,
      mietausfall: 0,
      nettomieteinnahmen: 0,
      nebenkostenGesamt,
      umlagefaehigeNK: 0,
      nichtUmlagefaehigeNK: nebenkostenGesamt,
      warmmieteMonat: 0,
    }
  }

  // Custom Nebenkosten: umlagefähige items add to warmmiete
  const customNkUmlagefaehigMonat = (project.nebenkostenPosten ?? [])
    .filter((p) => p.umlagefaehig)
    .reduce((sum, p) => sum + p.betrag, 0)

  const jahresmieteKalt = project.monatsmieteKalt * 12
  const mietausfall = jahresmieteKalt * (project.mietausfallwagnis / 100)
  const nettomieteinnahmen = jahresmieteKalt - mietausfall
  const warmmieteMonat = project.monatsmieteKalt + (umlagefaehigeNK / 12) + customNkUmlagefaehigMonat

  return {
    jahresmieteKalt,
    mietausfall,
    nettomieteinnahmen,
    nebenkostenGesamt,
    umlagefaehigeNK,
    nichtUmlagefaehigeNK,
    warmmieteMonat,
  }
}
