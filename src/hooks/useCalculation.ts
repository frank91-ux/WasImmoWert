import { useMemo } from 'react'
import type { Project, CalculationResult } from '@/calc/types'
import { calculateAll } from '@/calc'

export function useCalculation(project: Project | null | undefined): CalculationResult | null {
  return useMemo(() => {
    if (!project) return null
    return calculateAll(project)
  }, [
    project?.kaufpreis,
    project?.monatsmieteKalt,
    project?.zinssatz,
    project?.tilgung,
    project?.eigenkapital,
    project?.wohnflaeche,
    project?.bundesland,
    project?.baujahr,
    project?.maklerProvision,
    project?.notarUndGrundbuch,
    project?.grundstueckAnteil,
    project?.mietausfallwagnis,
    project?.instandhaltungProQm,
    project?.verwaltungProEinheit,
    project?.anzahlEinheiten,
    project?.nichtUmlegbareNebenkosten,
    project?.sonstigeKosten,
    project?.sondertilgung,
    project?.persoenlicherSteuersatz,
    project?.zuVersteuerndesEinkommen,
    project?.useProgressiveTax,
    project?.kirchensteuer,
    project?.kirchensteuersatz,
    project?.beweglicheGegenstaende,
    project?.afaBeweglichJahre,
    project?.wertsteigerung,
    project?.etfRendite,
    project?.customRendite,
    project?.customInvestmentName,
    project?.nebenkostenProQm,
    project?.umlagefaehigAnteil,
    project?.nutzungsart,
    project?.ersparteMiete,
  ])
}
