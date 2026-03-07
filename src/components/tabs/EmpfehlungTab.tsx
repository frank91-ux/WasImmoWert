import { useMemo } from 'react'
import type { Project, CalculationResult } from '@/calc/types'
import { generateTipps } from '@/calc/sensitivitaet'
import { BUNDESLAND_LABELS } from '@/calc/grunderwerbsteuer'
import { formatEur, formatPercent, formatFactor } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, TrendingUp, CheckCircle2, XCircle, AlertTriangle, MapPin } from 'lucide-react'
import { berechneMarktvergleich } from '@/data/marktdaten'

interface EmpfehlungTabProps {
  project: Project
  result: CalculationResult
}

export function EmpfehlungTab({ project, result }: EmpfehlungTabProps) {
  const { kpis, financing, kaufnebenkosten, tax } = result

  const tipps = useMemo(() => generateTipps(project), [project])

  const isEigennutzung = project.nutzungsart === 'eigennutzung'
  const pricePerSqm = project.wohnflaeche > 0 ? project.kaufpreis / project.wohnflaeche : 0
  const mietpreisProQm = project.wohnflaeche > 0 ? project.monatsmieteKalt / project.wohnflaeche : 0
  const ekPercent = kaufnebenkosten.gesamtkosten > 0 ? (project.eigenkapital / kaufnebenkosten.gesamtkosten) * 100 : 0
  const zinsenMonat = financing.monatlicheZinsenStart
  const tilgungMonat = financing.monatlicheTilgungStart

  // Marktvergleich
  const markt = berechneMarktvergleich(pricePerSqm, mietpreisProQm, project.lat, project.lng)

  // Kaufempfehlung berechnen (gewichtetes Scoring)
  const empfehlung = useMemo(() => {
    const punkte: { label: string; positiv: boolean; text: string; gewicht: number }[] = []

    // --- Gemeinsame Kriterien (Vermietung & Eigennutzung) ---

    // 1. Marktpreis
    if (markt.verfuegbar) {
      if (markt.preisLevel === 'guenstig') {
        punkte.push({ label: 'Kaufpreis', positiv: true, gewicht: 1, text: `${Math.abs(markt.abweichungKaufProzent).toFixed(0)}% unter Marktdurchschnitt (${formatEur(markt.durchschnittKauf)}/m²)` })
      } else if (markt.preisLevel === 'teuer') {
        punkte.push({ label: 'Kaufpreis', positiv: false, gewicht: 1, text: `${markt.abweichungKaufProzent.toFixed(0)}% über Marktdurchschnitt (${formatEur(markt.durchschnittKauf)}/m²)` })
      } else {
        punkte.push({ label: 'Kaufpreis', positiv: true, gewicht: 1, text: `im Marktdurchschnitt (±${Math.abs(markt.abweichungKaufProzent).toFixed(0)}%)` })
      }
    }

    // 2. Finanzierungsstrategie (EK-Quote + Vollfinanzierung)
    const isVollfinanzierung = ekPercent < 5
    if (kaufnebenkosten.gesamtkosten > 0) {
      if (isVollfinanzierung) {
        // Vollfinanzierung: Bewertung nach Vermögensaufbau vs. Zuschussbedarf
        if (kpis.vermoegenszuwachsMonatlich > 0 && kpis.monatlichCashflowNachSteuer > -300) {
          punkte.push({ label: 'Finanzierung', positiv: true, gewicht: 1, text: `Vollfinanzierung: ${formatEur(kpis.vermoegenszuwachsMonatlich)}/Mon Vermögensaufbau ohne Kapitaleinsatz` })
        } else {
          punkte.push({ label: 'Finanzierung', positiv: false, gewicht: 1, text: `Vollfinanzierung mit hohem Zuschussbedarf (${formatEur(kpis.monatlichCashflowNachSteuer)}/Mon)` })
        }
      } else if (ekPercent >= 20) {
        punkte.push({ label: 'Eigenkapital', positiv: true, gewicht: 1, text: `${ekPercent.toFixed(0)}% der Gesamtkosten — solide Basis` })
      } else {
        punkte.push({ label: 'Eigenkapital', positiv: false, gewicht: 1, text: `${ekPercent.toFixed(0)}% der Gesamtkosten — unter 20%, erhöhtes Risiko` })
      }
    }

    if (!isEigennutzung) {
      // --- Vermietung-spezifische Kriterien (verschärft) ---

      // 3. Bruttomietrendite (verschärft: erst ab 4% positiv)
      if (kpis.bruttomietrendite >= 5) {
        punkte.push({ label: 'Bruttomietrendite', positiv: true, gewicht: 1, text: `${formatPercent(kpis.bruttomietrendite)} — sehr gut (≥ 5%)` })
      } else if (kpis.bruttomietrendite >= 4) {
        punkte.push({ label: 'Bruttomietrendite', positiv: true, gewicht: 1, text: `${formatPercent(kpis.bruttomietrendite)} — solide` })
      } else {
        punkte.push({ label: 'Bruttomietrendite', positiv: false, gewicht: 1, text: `${formatPercent(kpis.bruttomietrendite)} — unter 4%, schwache Rendite` })
      }

      // 4. Cashflow (bei Vollfinanzierung: leicht negativer Cashflow mit starkem Vermögensaufbau ist OK)
      if (kpis.monatlichCashflowNachSteuer >= 0) {
        punkte.push({ label: 'Cashflow', positiv: true, gewicht: 1, text: `${formatEur(kpis.monatlichCashflowNachSteuer)}/Mon positiv` })
      } else if (isVollfinanzierung && kpis.monatlichCashflowNachSteuer > -200 && kpis.vermoegenszuwachsMonatlich > Math.abs(kpis.monatlichCashflowNachSteuer) * 2) {
        // Vollfinanzierung + leicht negativ + Vermögensaufbau > 2× Zuschuss → akzeptabel
        punkte.push({ label: 'Cashflow', positiv: true, gewicht: 1, text: `${formatEur(kpis.monatlichCashflowNachSteuer)}/Mon — geringer Zuschuss bei ${formatEur(kpis.vermoegenszuwachsMonatlich)}/Mon Vermögensaufbau` })
      } else {
        punkte.push({ label: 'Cashflow', positiv: false, gewicht: 1, text: `${formatEur(kpis.monatlichCashflowNachSteuer)}/Mon negativ — Zuschussbedarf` })
      }

      // 5. Kaufpreisfaktor (verschärft: nur ≤ 22 positiv)
      if (kpis.kaufpreisfaktor <= 20) {
        punkte.push({ label: 'Kaufpreisfaktor', positiv: true, gewicht: 1, text: `${formatFactor(kpis.kaufpreisfaktor)} — sehr gut (≤ 20)` })
      } else if (kpis.kaufpreisfaktor <= 22) {
        punkte.push({ label: 'Kaufpreisfaktor', positiv: true, gewicht: 1, text: `${formatFactor(kpis.kaufpreisfaktor)} — akzeptabel` })
      } else {
        punkte.push({ label: 'Kaufpreisfaktor', positiv: false, gewicht: 1, text: `${formatFactor(kpis.kaufpreisfaktor)} — über 22, teuer` })
      }

      // 6. Vermögenszuwachs (mit Zuschuss-Verhältnis bei negativem Cashflow)
      if (kpis.vermoegenszuwachsMonatlich > 200) {
        if (kpis.monatlichCashflowNachSteuer < 0) {
          const hebelFaktor = kpis.vermoegenszuwachsMonatlich / Math.abs(kpis.monatlichCashflowNachSteuer)
          punkte.push({ label: 'Vermögensaufbau', positiv: true, gewicht: 1, text: `${formatEur(kpis.vermoegenszuwachsMonatlich)}/Mon (${hebelFaktor.toFixed(1)}× des Zuschusses)` })
        } else {
          punkte.push({ label: 'Vermögensaufbau', positiv: true, gewicht: 1, text: `${formatEur(kpis.vermoegenszuwachsMonatlich)}/Mon — deutlicher Aufbau` })
        }
      } else if (kpis.vermoegenszuwachsMonatlich > 0) {
        punkte.push({ label: 'Vermögensaufbau', positiv: false, gewicht: 1, text: `${formatEur(kpis.vermoegenszuwachsMonatlich)}/Mon — gering` })
      } else {
        punkte.push({ label: 'Vermögensaufbau', positiv: false, gewicht: 1, text: `${formatEur(kpis.vermoegenszuwachsMonatlich)}/Mon — negativ` })
      }
    } else {
      // --- Eigennutzung-spezifische Kriterien ---

      // 3. Leistbarkeit (HOHE Gewichtung: ×2)
      if (project.nettoJahresgehalt > 0) {
        const nettoMonat = project.nettoJahresgehalt / 12
        const belastungsquote = nettoMonat > 0 ? (kpis.monatlicheKosten / nettoMonat) * 100 : 100

        if (belastungsquote <= 30) {
          punkte.push({ label: 'Leistbarkeit', positiv: true, gewicht: 2, text: `${belastungsquote.toFixed(0)}% Belastungsquote — leistbar (≤ 30%)` })
        } else if (belastungsquote <= 40) {
          punkte.push({ label: 'Leistbarkeit', positiv: false, gewicht: 2, text: `${belastungsquote.toFixed(0)}% Belastungsquote — grenzwertig (max. 30% empf.)` })
        } else {
          punkte.push({ label: 'Leistbarkeit', positiv: false, gewicht: 2, text: `${belastungsquote.toFixed(0)}% Belastungsquote — Überlastung! (> 40%)` })
        }
      }

      // 4. Kosten vs. Ersparte Miete
      const ersparteMieteMonat = kpis.ersparteMieteJahr / 12
      if (ersparteMieteMonat > 0) {
        if (kpis.monatlicheKosten <= ersparteMieteMonat * 1.1) {
          punkte.push({ label: 'Kosten vs. Miete', positiv: true, gewicht: 1, text: `${formatEur(kpis.monatlicheKosten)}/Mon Kosten ≤ ${formatEur(ersparteMieteMonat)}/Mon ersparte Miete` })
        } else {
          punkte.push({ label: 'Kosten vs. Miete', positiv: false, gewicht: 1, text: `${formatEur(kpis.monatlicheKosten)}/Mon Kosten > ${formatEur(ersparteMieteMonat)}/Mon ersparte Miete` })
        }
      }

      // 5. Eigennutzung-Rendite
      if (kpis.eigennutzungRendite >= 3) {
        punkte.push({ label: 'Eigennutzung-Rendite', positiv: true, gewicht: 1, text: `${formatPercent(kpis.eigennutzungRendite)} — guter Wertzuwachs` })
      } else if (kpis.eigennutzungRendite >= 1) {
        punkte.push({ label: 'Eigennutzung-Rendite', positiv: false, gewicht: 1, text: `${formatPercent(kpis.eigennutzungRendite)} — geringer Wertzuwachs` })
      } else {
        punkte.push({ label: 'Eigennutzung-Rendite', positiv: false, gewicht: 1, text: `${formatPercent(kpis.eigennutzungRendite)} — Wertminderung` })
      }

      // 6. Vermögenszuwachs
      if (kpis.vermoegenszuwachsMonatlich > 100) {
        punkte.push({ label: 'Vermögensaufbau', positiv: true, gewicht: 1, text: `${formatEur(kpis.vermoegenszuwachsMonatlich)}/Mon` })
      } else if (kpis.vermoegenszuwachsMonatlich > 0) {
        punkte.push({ label: 'Vermögensaufbau', positiv: false, gewicht: 1, text: `${formatEur(kpis.vermoegenszuwachsMonatlich)}/Mon — gering` })
      } else {
        punkte.push({ label: 'Vermögensaufbau', positiv: false, gewicht: 1, text: `${formatEur(kpis.vermoegenszuwachsMonatlich)}/Mon — negativ` })
      }
    }

    // Gewichtetes Scoring
    let positivGewicht = 0
    let totalGewicht = 0
    for (const p of punkte) {
      totalGewicht += p.gewicht
      if (p.positiv) positivGewicht += p.gewicht
    }
    const ratio = totalGewicht > 0 ? positivGewicht / totalGewicht : 0

    let gesamturteil: 'empfehlung' | 'bedingt' | 'vorsicht'
    if (ratio >= 0.75) gesamturteil = 'empfehlung'
    else if (ratio >= 0.45) gesamturteil = 'bedingt'
    else gesamturteil = 'vorsicht'

    return { punkte, gesamturteil, positivGewicht, totalGewicht }
  }, [markt, kpis, isEigennutzung, project, kaufnebenkosten, ekPercent])

  const urteilConfig = {
    empfehlung: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10 border-success/30', label: 'Kaufempfehlung', text: 'Die Kennzahlen sprechen überwiegend für dieses Investment.' },
    bedingt: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800', label: 'Bedingte Empfehlung', text: 'Das Investment hat Potenzial, aber auch Schwächen. Optimierung empfohlen.' },
    vorsicht: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30', label: 'Vorsicht geboten', text: 'Mehrere Kennzahlen zeigen Risiken. Sorgfältige Prüfung notwendig.' },
  }
  const urteil = urteilConfig[empfehlung.gesamturteil]
  const UrteilIcon = urteil.icon

  return (
    <div className="space-y-6">
      {/* Kaufempfehlung */}
      <Card className={`border ${urteil.bg}`}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <UrteilIcon className={`h-6 w-6 ${urteil.color} shrink-0 mt-0.5`} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-bold text-lg ${urteil.color}`}>{urteil.label}</h3>
                <span className="text-xs text-muted-foreground">({empfehlung.positivGewicht}/{empfehlung.totalGewicht} Punkte positiv)</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{urteil.text}</p>
              <div className="space-y-1.5">
                {empfehlung.punkte.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {p.positiv ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                    )}
                    <span className="font-medium">{p.label}{p.gewicht > 1 ? ` (×${p.gewicht})` : ''}:</span>
                    <span className="text-muted-foreground">{p.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Faktenübersicht */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Faktenübersicht</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Objekt & Lage */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Objekt & Lage</h4>
            <ul className="space-y-1 text-sm">
              <li>
                {project.propertyType === 'wohnung' ? 'Wohnung' : 'Haus'} in {BUNDESLAND_LABELS[project.bundesland]}, {project.wohnflaeche} m², Baujahr {project.baujahr}
              </li>
              <li>
                Kaufpreis: <span className="font-semibold">{formatEur(project.kaufpreis)}</span>
                {pricePerSqm > 0 && <span className="text-muted-foreground"> ({formatEur(pricePerSqm)}/m²)</span>}
              </li>
              {markt.verfuegbar && (
                <li className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span>
                    Marktvergleich:{' '}
                    <span className={`font-semibold ${markt.preisLevel === 'guenstig' ? 'text-success' : markt.preisLevel === 'teuer' ? 'text-destructive' : 'text-foreground'}`}>
                      {markt.abweichungKaufProzent > 0 ? '+' : ''}{markt.abweichungKaufProzent.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground"> vs. Ø {formatEur(markt.durchschnittKauf)}/m² Region</span>
                  </span>
                </li>
              )}
              {!isEigennutzung && (
                <li>
                  Bruttomietrendite: <span className="font-semibold">{formatPercent(kpis.bruttomietrendite)}</span>
                  {' '}&bull;{' '}Kaufpreisfaktor: <span className="font-semibold">{formatFactor(kpis.kaufpreisfaktor)}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Finanzierung */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Finanzierung</h4>
            <ul className="space-y-1 text-sm">
              <li>
                Eigenkapital: <span className="font-semibold">{formatEur(project.eigenkapital)}</span>
                <span className="text-muted-foreground"> ({ekPercent.toFixed(0)}% der Gesamtkosten)</span>
              </li>
              {financing.darlehensBetrag > 0 && (
                <>
                  <li>
                    Darlehen: <span className="font-semibold">{formatEur(financing.darlehensBetrag)}</span>
                    <span className="text-muted-foreground"> bei {project.zinssatz.toFixed(1)}% Zins, {project.tilgung.toFixed(1)}% Tilgung</span>
                  </li>
                  <li>
                    Kreditrate: <span className="font-semibold">{formatEur(financing.monatlicheRate)}/Mon</span>
                    <span className="text-muted-foreground"> (davon {formatEur(zinsenMonat)} Zinsen, {formatEur(tilgungMonat)} Tilgung)</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Cashflow & Rendite */}
          <div>
            <h4 className="text-sm font-semibold mb-2">
              {isEigennutzung ? 'Kosten & Rendite' : 'Cashflow & Rendite'}
            </h4>
            <ul className="space-y-1 text-sm">
              {isEigennutzung ? (
                <>
                  <li>
                    Monatliche Kosten: <span className="font-semibold">{formatEur(kpis.monatlicheKosten)}/Mon</span>
                  </li>
                  <li>
                    Ersparte Miete: <span className="font-semibold">{formatEur(kpis.ersparteMieteJahr / 12)}/Mon</span>
                  </li>
                  {project.nettoJahresgehalt > 0 && (() => {
                    const nettoMonat = project.nettoJahresgehalt / 12
                    const belastungsquote = nettoMonat > 0 ? (kpis.monatlicheKosten / nettoMonat) * 100 : 0
                    return (
                      <li>
                        Belastungsquote:{' '}
                        <span className={`font-semibold ${belastungsquote <= 30 ? 'text-success' : belastungsquote <= 40 ? 'text-amber-500' : 'text-destructive'}`}>
                          {belastungsquote.toFixed(0)}%
                        </span>
                        <span className="text-muted-foreground"> des Nettoeinkommens ({formatEur(nettoMonat)}/Mon)</span>
                      </li>
                    )
                  })()}
                  <li>
                    Eigennutzung-Rendite: <span className="font-semibold">{formatPercent(kpis.eigennutzungRendite)}</span>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    Monatlicher Cashflow:{' '}
                    <span className={`font-semibold ${kpis.monatlichCashflowNachSteuer >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatEur(kpis.monatlichCashflowNachSteuer)}/Mon
                    </span>
                    <span className="text-muted-foreground"> (nach Steuer)</span>
                  </li>
                  <li>
                    Vermögenszuwachs:{' '}
                    <span className={`font-semibold ${kpis.vermoegenszuwachsMonatlich >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatEur(kpis.vermoegenszuwachsMonatlich)}/Mon
                    </span>
                    <span className="text-muted-foreground"> (Tilgung + Wertzuwachs − Cashflow-Verlust)</span>
                  </li>
                  <li>
                    Eigenkapitalrendite: <span className="font-semibold">{formatPercent(kpis.eigenkapitalrendite)}</span>
                    <span className="text-muted-foreground"> (inkl. Tilgung)</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Steuereffekt (Vermietung only) */}
          {!isEigennutzung && tax.gesamtSteuerbelastungJahr !== 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Steuereffekt</h4>
              <ul className="space-y-1 text-sm">
                <li>
                  {tax.gesamtSteuerbelastungJahr < 0 ? (
                    <>Steuerersparnis: <span className="font-semibold text-success">{formatEur(Math.abs(tax.gesamtSteuerbelastungJahr))}/Jahr</span>
                    <span className="text-muted-foreground"> → effektiv nur {formatEur(Math.abs(kpis.monatlichCashflowNachSteuer - kpis.monatlichCashflowVorSteuer))}/Mon Entlastung</span></>
                  ) : (
                    <>Zusätzliche Steuerlast: <span className="font-semibold text-destructive">{formatEur(tax.gesamtSteuerbelastungJahr)}/Jahr</span>
                    <span className="text-muted-foreground"> ({formatEur(tax.gesamtSteuerbelastungJahr / 12)}/Mon)</span></>
                  )}
                </li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Optimierungstipps */}
      {tipps.length > 0 && !isEigennutzung && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Optimierungstipps
              <span className="text-xs font-normal text-muted-foreground ml-auto">
                Ranking nach Cashflow-Verbesserung
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tipps.map((tipp, i) => {
                const impactMonat = tipp.impactJahr / 12
                const laufzeit = 30
                const impactLaufzeit = tipp.impactJahr * laufzeit
                const catColors: Record<string, string> = {
                  steuer: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
                  miete: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
                  finanzierung: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                  kaufpreis: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
                }
                const catLabels: Record<string, string> = {
                  steuer: 'Steuer', miete: 'Miete', finanzierung: 'Finanzierung', kaufpreis: 'Kaufpreis',
                }
                return (
                  <div key={i} className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold text-muted-foreground/60">#{i + 1}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${catColors[tipp.category]}`}>
                        {catLabels[tipp.category]}
                      </span>
                    </div>
                    <h4 className="font-semibold text-sm mb-0.5">{tipp.title}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{tipp.description}</p>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="rounded-md bg-success/10 px-2 py-1.5 text-center">
                        <div className="text-xs text-muted-foreground">Monat</div>
                        <div className="text-sm font-bold text-success tabular-nums">+{formatEur(impactMonat)}</div>
                      </div>
                      <div className="rounded-md bg-success/10 px-2 py-1.5 text-center">
                        <div className="text-xs text-muted-foreground">Jahr</div>
                        <div className="text-sm font-bold text-success tabular-nums">+{formatEur(tipp.impactJahr)}</div>
                      </div>
                      <div className="rounded-md bg-success/10 px-2 py-1.5 text-center">
                        <div className="text-xs text-muted-foreground">{laufzeit} Jahre</div>
                        <div className="text-sm font-bold text-success tabular-nums">+{formatEur(impactLaufzeit)}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{tipp.hint}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
