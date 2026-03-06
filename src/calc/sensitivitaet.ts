import type { Project } from './types'
import { calculateAll } from './index'
import { formatEur } from '@/lib/format'

export interface SensitivitaetResult {
  parameter: string
  label: string
  baseValue: number
  cashflowMinus: number
  cashflowPlus: number
  delta: number
}

const VARIATION = 0.20 // +/- 20%

interface ParamDef {
  key: keyof Project
  label: string
  invert?: boolean // true = lower is better (e.g., costs)
}

const PARAMS: ParamDef[] = [
  { key: 'zinssatz', label: 'Zinssatz', invert: true },
  { key: 'monatsmieteKalt', label: 'Kaltmiete' },
  { key: 'kaufpreis', label: 'Kaufpreis', invert: true },
  { key: 'wertsteigerung', label: 'Wertsteigerung' },
  { key: 'eigenkapital', label: 'Eigenkapital' },
  { key: 'mietausfallwagnis', label: 'Leerstand', invert: true },
]

/** Keys irrelevant for Eigennutzung (no rental income, no vacancy) */
const EIGENNUTZUNG_EXCLUDED: Set<string> = new Set([
  'monatsmieteKalt',
  'mietausfallwagnis',
])

export function calculateSensitivitaet(project: Project): SensitivitaetResult[] {
  const baseResult = calculateAll(project)
  const params = project.nutzungsart === 'eigennutzung'
    ? PARAMS.filter((p) => !EIGENNUTZUNG_EXCLUDED.has(p.key))
    : PARAMS

  return params
    .map((param) => {
      const baseValue = project[param.key] as number
      if (typeof baseValue !== 'number') return null

      const valueMinus = baseValue * (1 - VARIATION)
      const valuePlus = baseValue * (1 + VARIATION)

      const projectMinus = { ...project, [param.key]: valueMinus }
      const projectPlus = { ...project, [param.key]: valuePlus }

      const resultMinus = calculateAll(projectMinus)
      const resultPlus = calculateAll(projectPlus)

      const cashflowMinus = resultMinus.kpis.jaehrlichCashflowNachSteuer
      const cashflowPlus = resultPlus.kpis.jaehrlichCashflowNachSteuer

      return {
        parameter: param.key,
        label: param.label,
        baseValue,
        cashflowMinus,
        cashflowPlus,
        delta: Math.abs(cashflowPlus - cashflowMinus),
      }
    })
    .filter((v): v is NonNullable<typeof v> => v !== null)
    .sort((a, b) => (b?.delta ?? 0) - (a?.delta ?? 0))
}

export interface SensitivitaetTipp {
  title: string
  description: string
  hint: string
  impactJahr: number      // EUR/Jahr Cashflow-Verbesserung
  category: 'steuer' | 'miete' | 'finanzierung' | 'kaufpreis'
}

// AfA rate based on Baujahr (duplicated from tax.ts to avoid circular dep)
function getAfaRate(baujahr: number): number {
  if (baujahr < 1925) return 2.5
  if (baujahr <= 2022) return 2.0
  return 3.0
}

export function generateTipps(project: Project): SensitivitaetTipp[] {
  const baseResult = calculateAll(project)
  const baseCashflow = baseResult.kpis.jaehrlichCashflowNachSteuer
  const tipps: SensitivitaetTipp[] = []

  function tryTipp(
    modify: Partial<Project>,
    title: string,
    description: (impact: number) => string,
    hint: string,
    category: SensitivitaetTipp['category'],
  ) {
    const modResult = calculateAll({ ...project, ...modify })
    const impact = modResult.kpis.jaehrlichCashflowNachSteuer - baseCashflow
    if (impact < 50) return // nur positive, spürbare Verbesserungen
    tipps.push({ title, description: description(impact), hint, impactJahr: impact, category })
  }

  // --- STEUER-TIPPS ---

  // 1. AfA per Gutachten erhöhen (+1 Prozentpunkt)
  const currentAfa = project.customAfaRate ?? getAfaRate(project.baujahr)
  const newAfa = currentAfa + 1
  tryTipp(
    { customAfaRate: newAfa },
    'AfA per Gutachten erhöhen',
    (impact) => `AfA von ${currentAfa.toFixed(1)}% auf ${newAfa.toFixed(1)}% erhöhen: +${formatEur(impact)}/Jahr`,
    'Ein Wertgutachten (ca. 500–1.500 €) kann den Gebäudeanteil und damit die Abschreibung erhöhen.',
    'steuer',
  )

  // 2. Grundstücksanteil per Gutachten senken (-10 Prozentpunkte)
  if (project.grundstueckAnteil > 15) {
    const newGrund = Math.max(5, project.grundstueckAnteil - 10)
    tryTipp(
      { grundstueckAnteil: newGrund },
      'Grundstücksanteil per Gutachten senken',
      (impact) => `Grundstücksanteil von ${project.grundstueckAnteil}% auf ${newGrund}%: +${formatEur(impact)}/Jahr`,
      'Höherer Gebäudeanteil = höhere AfA. Besonders lohnend bei Wohnungen, wo der Bodenanteil oft überschätzt wird.',
      'steuer',
    )
  }

  // 3. Bewegliche Gegenstände ausweisen (nur wenn aktuell 0)
  if (project.beweglicheGegenstaende === 0) {
    tryTipp(
      { beweglicheGegenstaende: 5000 },
      'Bewegliche Gegenstände ausweisen',
      (impact) => `5.000 € für Küche, Markise etc. separat abschreiben: +${formatEur(impact)}/Jahr`,
      `Einbauküche, Markisen, Spiegel etc. werden über ${project.afaBeweglichJahre} Jahre abgeschrieben statt über den langen AfA-Zeitraum.`,
      'steuer',
    )
  }

  // --- MIETE-TIPPS (nur bei Vermietung) ---

  if (project.nutzungsart === 'vermietung') {
    // 4. Kaltmiete erhöhen +10%
    const neueMiete = project.monatsmieteKalt * 1.1
    tryTipp(
      { monatsmieteKalt: neueMiete },
      'Kaltmiete um 10% erhöhen',
      (impact) => `Kaltmiete von ${formatEur(project.monatsmieteKalt)} auf ${formatEur(neueMiete)}: +${formatEur(impact)}/Jahr`,
      'Mögliche Hebel: möblierte Vermietung, Indexmietvertrag, Modernisierungsumlage (§559 BGB).',
      'miete',
    )

    // 5. Mietausfallwagnis senken (-1 Prozentpunkt)
    if (project.mietausfallwagnis > 1) {
      const neuerMietausfall = project.mietausfallwagnis - 1
      tryTipp(
        { mietausfallwagnis: neuerMietausfall },
        'Mietausfallwagnis senken',
        (impact) => `Mietausfallwagnis von ${project.mietausfallwagnis.toFixed(1)}% auf ${neuerMietausfall.toFixed(1)}%: +${formatEur(impact)}/Jahr`,
        'Realistisch bei guter Lage, hoher Nachfrage und solventen Mietern.',
        'miete',
      )
    }
  }

  // --- KAUFPREIS-TIPP ---

  // 6. Kaufpreis verhandeln -5%
  const neuerKaufpreis = project.kaufpreis * 0.95
  tryTipp(
    { kaufpreis: neuerKaufpreis },
    'Kaufpreis verhandeln',
    (impact) => `5% Verhandlungserfolg (${formatEur(project.kaufpreis)} → ${formatEur(neuerKaufpreis)}): +${formatEur(impact)}/Jahr`,
    'Senkt gleichzeitig Kaufnebenkosten und Darlehenssumme. Verhandlungsspielraum bei längerer Vermarktungsdauer.',
    'kaufpreis',
  )

  // --- FINANZIERUNG-TIPPS ---

  // 7. Mehr Eigenkapital (+10.000 €)
  const neuesEK = project.eigenkapital + 10000
  tryTipp(
    { eigenkapital: neuesEK },
    'Mehr Eigenkapital einsetzen',
    (impact) => `Mit ${formatEur(10000)} mehr Eigenkapital (${formatEur(project.eigenkapital)} → ${formatEur(neuesEK)}): +${formatEur(impact)}/Jahr`,
    'Senkt die Darlehenssumme und damit die monatliche Zinsbelastung.',
    'finanzierung',
  )

  // 8. Tilgung senken (-0,5 Prozentpunkte)
  if (project.tilgung > 1) {
    const neueTilgung = project.tilgung - 0.5
    tryTipp(
      { tilgung: neueTilgung },
      'Tilgung reduzieren',
      (impact) => `Tilgung von ${project.tilgung.toFixed(1)}% auf ${neueTilgung.toFixed(1)}%: +${formatEur(impact)}/Jahr`,
      'Verbessert kurzfristig den Cashflow, erhöht aber die Restschuld. Differenz alternativ in ETF investieren.',
      'finanzierung',
    )
  }

  return tipps.sort((a, b) => b.impactJahr - a.impactJahr).slice(0, 3)
}
