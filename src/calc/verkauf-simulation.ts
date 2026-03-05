import type { Project, CalculationResult } from './types'

export interface VerkaufTimepoint {
  year: number
  verkaufspreis: number
  notarkostenVerkauf: number
  restschuld: number
  gewinnBrutto: number
  spekulationssteuer: number
  gewinnNetto: number
  gesamtCashflowHaltedauer: number
  effektiveRenditePa: number
  eingesetztesEigenkapital: number
  modernisierungKumuliert: number
  istSteuerfrei: boolean
  steuerfreiGrund: string
}

/**
 * Calculate sale scenarios at different holding periods.
 */
export function calculateVerkaufSimulation(
  project: Project,
  result: CalculationResult,
  timepoints: number[] = [5, 10, 15, 20, 25]
): VerkaufTimepoint[] {
  const gesamtInvestition = result.kaufnebenkosten.gesamtkosten
  const eigenkapital = project.eigenkapital

  return timepoints
    .filter((y) => y <= result.projection.length)
    .map((year) => {
      const yearData = result.projection[year - 1]
      if (!yearData) return null

      const verkaufspreis = yearData.immobilienWert
      const notarkostenVerkauf = verkaufspreis * 0.015
      const restschuld = yearData.restschuld

      // Cumulative modernization costs
      const modernisierungKumuliert = (project.modernisierungen ?? [])
        .filter((m) => m.jahr <= year)
        .reduce((sum, m) => sum + m.kosten, 0)

      // Gross profit: sale price - purchase costs - remaining debt payoff - notary - modernizations
      const gewinnBrutto = verkaufspreis - gesamtInvestition - notarkostenVerkauf - modernisierungKumuliert

      // Spekulationssteuer per §23 EStG
      let spekulationssteuer = 0
      let istSteuerfrei = false
      let steuerfreiGrund = ''

      if (project.nutzungsart === 'eigennutzung') {
        // Eigennutzung: always tax-free (3-Kalenderjahre-Regel)
        istSteuerfrei = true
        steuerfreiGrund = 'Eigennutzung (§23 Abs. 1 Nr. 1 S. 3 EStG)'
      } else if (year >= 10) {
        // Vermietung after 10 years: tax-free
        istSteuerfrei = true
        steuerfreiGrund = 'Haltefrist > 10 Jahre (§23 Abs. 1 Nr. 1 EStG)'
      } else {
        // Vermietung before 10 years: taxable
        istSteuerfrei = false
        steuerfreiGrund = `Spekulationsfrist (${year} < 10 Jahre)`
        const steuerpflichtigerGewinn = Math.max(0, gewinnBrutto)
        // Freigrenze §23 Abs. 3 S. 5 EStG: 1.000€ (ab 2024)
        if (steuerpflichtigerGewinn > 1000) {
          spekulationssteuer = steuerpflichtigerGewinn * (project.persoenlicherSteuersatz / 100)
        }
      }

      const gewinnNetto = gewinnBrutto - spekulationssteuer
      const gesamtCashflowHaltedauer = yearData.kumulierterCashflow
      const nettoErloes = verkaufspreis - restschuld - notarkostenVerkauf - spekulationssteuer

      // Effektive Rendite p.a. (CAGR based on equity invested)
      const totalReturn = nettoErloes + gesamtCashflowHaltedauer
      const effektiveRenditePa = eigenkapital > 0
        ? (Math.pow(Math.max(0, totalReturn) / eigenkapital, 1 / year) - 1) * 100
        : 0

      return {
        year,
        verkaufspreis,
        notarkostenVerkauf,
        restschuld,
        gewinnBrutto,
        spekulationssteuer,
        gewinnNetto,
        gesamtCashflowHaltedauer,
        effektiveRenditePa,
        eingesetztesEigenkapital: eigenkapital,
        modernisierungKumuliert,
        istSteuerfrei,
        steuerfreiGrund,
      }
    })
    .filter((v): v is VerkaufTimepoint => v !== null)
}
