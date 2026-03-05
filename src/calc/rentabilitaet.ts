import type { KpiResult, Project } from './types'

export interface RentabilitaetBreakdown {
  kpiKey: string
  label: string
  rawValue: number
  normalizedScore: number
  baseWeight: number
  contextMultiplier: number
  contextReason: string
  weight: number          // final (normalized)
}

export interface RentabilitaetScore {
  score: number          // 0-10
  grade: string          // A-F
  label: string          // "Ausgezeichnet" etc.
  color: string          // Tailwind color class
  breakdown: RentabilitaetBreakdown[]
}

/** Linear interpolation: maps value from [min, max] to [0, 10], clamped */
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 5
  return Math.max(0, Math.min(10, ((value - min) / (max - min)) * 10))
}

/** Inverted normalization: lower values get higher scores */
function normalizeInverted(value: number, bestLow: number, worstHigh: number): number {
  return normalize(value, worstHigh, bestLow)
}

function gradeFromScore(score: number): { grade: string; label: string; color: string } {
  if (score >= 8.5) return { grade: 'A+', label: 'Ausgezeichnet', color: 'text-emerald-600' }
  if (score >= 7) return { grade: 'A', label: 'Sehr gut', color: 'text-emerald-500' }
  if (score >= 5.5) return { grade: 'B', label: 'Gut', color: 'text-green-500' }
  if (score >= 4) return { grade: 'C', label: 'Befriedigend', color: 'text-yellow-500' }
  if (score >= 2.5) return { grade: 'D', label: 'Ausreichend', color: 'text-orange-500' }
  return { grade: 'F', label: 'Mangelhaft', color: 'text-red-500' }
}

interface ContextMultiplier {
  multiplier: number
  reason: string
}

function getContextMultiplier(
  kpiKey: string,
  project?: Project
): ContextMultiplier {
  if (!project) return { multiplier: 1, reason: '' }

  const ws = project.wertsteigerung ?? 2
  const ekQuote = project.eigenkapital / (project.kaufpreis || 1)
  const zins = project.zinssatz

  switch (kpiKey) {
    case 'kaufpreisfaktor':
      // High appreciation → factor less important
      if (ws >= 3) return { multiplier: 0.5, reason: 'Hohe Wertsteigerung reduziert Bedeutung' }
      if (ws <= 0) return { multiplier: 1.5, reason: 'Negative Wertsteigerung erhöht Bedeutung' }
      break

    case 'eigenkapitalrendite':
      // High equity → leverage KPIs less meaningful
      if (ekQuote > 0.5) return { multiplier: 0.6, reason: 'Hohe EK-Quote reduziert Hebel-Relevanz' }
      if (ekQuote < 0.1) return { multiplier: 1.3, reason: 'Geringe EK-Quote erhöht Hebel-Relevanz' }
      break

    case 'dscr':
      // High interest → DSCR more critical
      if (zins >= 4) return { multiplier: 1.5, reason: 'Hoher Zins macht DSCR kritischer' }
      if (zins <= 2) return { multiplier: 0.7, reason: 'Niedriger Zins reduziert DSCR-Relevanz' }
      // High equity → DSCR less important
      if (ekQuote > 0.5) return { multiplier: 0.5, reason: 'Hohe EK-Quote reduziert DSCR-Relevanz' }
      break

    case 'monatlichCashflowNachSteuer':
      // High interest → cashflow more important
      if (zins >= 4) return { multiplier: 1.3, reason: 'Hoher Zins macht Cashflow kritischer' }
      break

    case 'vermoegenszuwachsMonatlich':
      // High appreciation → wealth growth more meaningful
      if (ws >= 3) return { multiplier: 1.3, reason: 'Hohe Wertsteigerung erhöht Bedeutung' }
      if (ws <= 0) return { multiplier: 0.7, reason: 'Negative Wertsteigerung reduziert Bedeutung' }
      break
  }

  return { multiplier: 1, reason: '' }
}

export function calculateRentabilitaet(
  kpis: KpiResult,
  nutzungsart: 'vermietung' | 'eigennutzung',
  project?: Project
): RentabilitaetScore {
  type RawBreakdown = {
    kpiKey: string
    label: string
    rawValue: number
    normalizedScore: number
    baseWeight: number
  }

  const raw: RawBreakdown[] = []

  if (nutzungsart === 'vermietung') {
    raw.push(
      {
        kpiKey: 'monatlichCashflowNachSteuer',
        label: 'Cashflow/Mon',
        rawValue: kpis.monatlichCashflowNachSteuer,
        normalizedScore: normalize(kpis.monatlichCashflowNachSteuer, -500, 500),
        baseWeight: 0.25,
      },
      {
        kpiKey: 'eigenkapitalrendite',
        label: 'EK-Rendite',
        rawValue: kpis.eigenkapitalrendite,
        normalizedScore: normalize(kpis.eigenkapitalrendite, 0, 10),
        baseWeight: 0.20,
      },
      {
        kpiKey: 'bruttomietrendite',
        label: 'Bruttorendite',
        rawValue: kpis.bruttomietrendite,
        normalizedScore: normalize(kpis.bruttomietrendite, 0, 6),
        baseWeight: 0.15,
      },
      {
        kpiKey: 'dscr',
        label: 'DSCR',
        rawValue: kpis.dscr === Infinity ? 10 : kpis.dscr,
        normalizedScore: normalize(kpis.dscr === Infinity ? 2 : kpis.dscr, 0.5, 1.5),
        baseWeight: 0.15,
      },
      {
        kpiKey: 'kaufpreisfaktor',
        label: 'Kaufpreisfaktor',
        rawValue: kpis.kaufpreisfaktor,
        normalizedScore: normalizeInverted(kpis.kaufpreisfaktor === Infinity ? 40 : kpis.kaufpreisfaktor, 15, 35),
        baseWeight: 0.10,
      },
      {
        kpiKey: 'vermoegenszuwachsMonatlich',
        label: 'Vermögenszuwachs',
        rawValue: kpis.vermoegenszuwachsMonatlich,
        normalizedScore: normalize(kpis.vermoegenszuwachsMonatlich, -500, 800),
        baseWeight: 0.15,
      },
    )
  } else {
    // Eigennutzung scoring
    raw.push(
      {
        kpiKey: 'eigennutzungRendite',
        label: 'Eigennutzung-Rendite',
        rawValue: kpis.eigennutzungRendite,
        normalizedScore: normalize(kpis.eigennutzungRendite, -2, 6),
        baseWeight: 0.35,
      },
      {
        kpiKey: 'kostenVsErsparnis',
        label: 'Kosten vs. Ersparnis',
        rawValue: kpis.monatlicheKosten > 0 ? (kpis.ersparteMieteJahr / 12) / kpis.monatlicheKosten : 0,
        normalizedScore: normalize(
          kpis.monatlicheKosten > 0 ? (kpis.ersparteMieteJahr / 12) / kpis.monatlicheKosten : 0,
          0, 2
        ),
        baseWeight: 0.30,
      },
      {
        kpiKey: 'vermoegenszuwachsMonatlich',
        label: 'Vermögenszuwachs',
        rawValue: kpis.vermoegenszuwachsMonatlich,
        normalizedScore: normalize(kpis.vermoegenszuwachsMonatlich, -500, 800),
        baseWeight: 0.35,
      },
    )
  }

  // Apply context multipliers
  const withMultipliers = raw.map((b) => {
    const ctx = getContextMultiplier(b.kpiKey, project)
    return { ...b, contextMultiplier: ctx.multiplier, contextReason: ctx.reason, adjustedWeight: b.baseWeight * ctx.multiplier }
  })

  // Normalize weights to sum to 1
  const totalWeight = withMultipliers.reduce((s, b) => s + b.adjustedWeight, 0)
  const breakdown: RentabilitaetBreakdown[] = withMultipliers.map((b) => ({
    kpiKey: b.kpiKey,
    label: b.label,
    rawValue: b.rawValue,
    normalizedScore: b.normalizedScore,
    baseWeight: b.baseWeight,
    contextMultiplier: b.contextMultiplier,
    contextReason: b.contextReason,
    weight: totalWeight > 0 ? b.adjustedWeight / totalWeight : b.baseWeight,
  }))

  const score = breakdown.reduce((sum, b) => sum + b.normalizedScore * b.weight, 0)
  const { grade, label, color } = gradeFromScore(score)

  return { score, grade, label, color, breakdown }
}
