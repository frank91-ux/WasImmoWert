import type { Project, CalculationResult, ScenarioAdjustment } from '@/calc/types'
import type { EtvProtokoll } from '@/store/useEtvStore'

export interface InlineCalculationEntry {
  label: string
  value: string
}

export interface AiResponse {
  message: string
  parameterChanges?: Record<string, number>
  inlineCalculation?: {
    title: string
    entries: InlineCalculationEntry[]
  }
  scenarioAdjustments?: ScenarioAdjustment[]
}

// Whitelist of parameters the AI may change
const ALLOWED_PARAMS = new Set([
  'kaufpreis', 'eigenkapital', 'zinssatz', 'tilgung', 'monatsmieteKalt',
  'sondertilgung', 'wertsteigerung', 'persoenlicherSteuersatz',
  'mietausfallwagnis', 'instandhaltungProQm', 'maklerProvision',
  'nebenkostenProQm', 'umlagefaehigAnteil', 'ersparteMiete',
  'verwaltungProEinheit', 'nichtUmlegbareNebenkosten',
])

function buildEtvContext(protokolle: EtvProtokoll[]): string {
  if (protokolle.length === 0) return ''

  const parts = protokolle.map((p) => {
    const lines: string[] = []
    lines.push(`--- Protokoll: ${p.dateiName} (${p.datum}) ---`)
    lines.push(`Objekt: ${p.objekt}`)
    lines.push(`Verwaltung: ${p.verwaltung}`)
    if (p.zusammenfassung) lines.push(`Zusammenfassung: ${p.zusammenfassung}`)

    if (p.warnungen.length > 0) {
      lines.push(`Warnhinweise: ${p.warnungen.join('; ')}`)
    }

    for (const b of p.beschluesse) {
      const stimmen = b.jaStimmen != null ? ` (JA:${b.jaStimmen}/NEIN:${b.neinStimmen}/Enth:${b.enthaltungen})` : ''
      const kosten = b.kostenRelevant && b.betrag != null ? ` [${b.betrag} EUR]` : ''
      lines.push(`${b.topNummer} ${b.titel}: ${b.ergebnis}${stimmen}${kosten} — ${b.antrag}`)
    }

    if (p.wirtschaftsplan) {
      const wp = p.wirtschaftsplan
      lines.push(`Wirtschaftsplan ${wp.jahr}: Ausgaben ${wp.ausgabenGesamt} EUR, Rücklage ${wp.ruecklageGesamt} EUR${wp.hausgeldMonatlich != null ? `, Hausgeld ${wp.hausgeldMonatlich} EUR/Mon` : ''}`)
      for (const k of wp.kostenPositionen) {
        lines.push(`  - ${k.bezeichnung}: ${k.gesamtkosten} EUR (Anteil: ${k.anteilEigentümer ?? '?'} EUR, ${k.verteilschluessel})`)
      }
    }

    return lines.join('\n')
  })

  return `\n\nEIGENTÜMERVERSAMMLUNGS-PROTOKOLLE (ETV):
Der Nutzer hat ${protokolle.length} ETV-Protokoll(e) hochgeladen. Du kannst auf diese Daten verweisen, Risiken bewerten, Kosten aus Wirtschaftsplänen analysieren und den Nutzer beraten.

${parts.join('\n\n')}`
}

function buildSystemPrompt(project: Project, result: CalculationResult, etvProtokolle?: EtvProtokoll[]): string {
  const projektDaten = {
    name: project.name,
    nutzungsart: project.nutzungsart,
    propertyType: project.propertyType,
    wohnflaeche: project.wohnflaeche,
    baujahr: project.baujahr,
    bundesland: project.bundesland,
    adresse: project.address || 'nicht angegeben',
    kaufpreis: project.kaufpreis,
    eigenkapital: project.eigenkapital,
    zinssatz: project.zinssatz,
    tilgung: project.tilgung,
    zinsbindung: project.zinsbindung,
    sondertilgung: project.sondertilgung,
    monatsmieteKalt: project.monatsmieteKalt,
    ersparteMiete: project.ersparteMiete,
    mietausfallwagnis: project.mietausfallwagnis,
    instandhaltungProQm: project.instandhaltungProQm,
    nebenkostenProQm: project.nebenkostenProQm,
    umlagefaehigAnteil: project.umlagefaehigAnteil,
    verwaltungProEinheit: project.verwaltungProEinheit,
    maklerProvision: project.maklerProvision,
    notarUndGrundbuch: project.notarUndGrundbuch,
    wertsteigerung: project.wertsteigerung,
    persoenlicherSteuersatz: project.persoenlicherSteuersatz,
  }

  const kennzahlen = {
    bruttomietrendite: `${result.kpis.bruttomietrendite.toFixed(2)}%`,
    nettomietrendite: `${result.kpis.nettomietrendite.toFixed(2)}%`,
    kaufpreisfaktor: result.kpis.kaufpreisfaktor.toFixed(1),
    eigenkapitalrendite: `${result.kpis.eigenkapitalrendite.toFixed(2)}%`,
    monatlichCashflowNachSteuer: `${result.kpis.monatlichCashflowNachSteuer.toFixed(0)} EUR/Mon`,
    vermoegenszuwachsMonatlich: `${result.kpis.vermoegenszuwachsMonatlich.toFixed(0)} EUR/Mon`,
    dscr: result.kpis.dscr.toFixed(2),
  }

  const finanzierung = {
    darlehensBetrag: Math.round(result.financing.darlehensBetrag),
    monatlicheRate: Math.round(result.financing.monatlicheRate),
    zinsenJahr1: Math.round(result.projection[0]?.zinsenJahr ?? 0),
    tilgungJahr1: Math.round(result.projection[0]?.tilgungJahr ?? 0),
  }

  const betriebskosten = {
    betriebskostenGesamt: Math.round(result.operatingCosts.betriebskostenGesamt),
    nettomieteinnahmen: Math.round(result.rental.nettomieteinnahmen),
  }

  const kaufnebenkosten = {
    grunderwerbsteuer: Math.round(result.kaufnebenkosten.grunderwerbsteuer),
    notar: Math.round(result.kaufnebenkosten.notarUndGrundbuch),
    makler: Math.round(result.kaufnebenkosten.maklerProvision),
    kaufnebenkostenGesamt: Math.round(result.kaufnebenkosten.kaufnebenkosten),
    gesamtkosten: Math.round(result.kaufnebenkosten.gesamtkosten),
  }

  const steuer = {
    steuerbelastungJahr1: Math.round(result.projection[0]?.steuerbelastungJahr ?? 0),
  }

  // Kompakte Projektion
  const projektion = result.projection
    .filter((y) => [1, 3, 5, 10, 15, 20, 25, 30].includes(y.year))
    .map((y) => ({
      jahr: y.year,
      restschuld: Math.round(y.restschuld),
      eigenkapital: Math.round(y.eigenkapitalImObjekt),
      immobilienWert: Math.round(y.immobilienWert),
      cashflowJahr: Math.round(y.cashflowNachSteuer),
      kumuliert: Math.round(y.kumulierterCashflow),
      zinsenJahr: Math.round(y.zinsenJahr),
      tilgungJahr: Math.round(y.tilgungJahr),
      steuerJahr: Math.round(y.steuerbelastungJahr),
    }))

  return `Du bist ein KI-Berater für Immobilien-Investments in der App "WasImmoWert".
Du analysierst die vorliegenden Projektdaten und berechneten Kennzahlen und kannst eigene Berechnungen durchführen.
Du kannst auch komplexe Mehrjahres-Szenarien simulieren, die über die normalen Regler hinausgehen.

STRIKTE REGELN:
- Antworte IMMER auf Deutsch
- Halte Antworten prägnant aber informativ (max. 200 Wörter pro Antwort)
- Formatiere Geldbeträge mit Punkt als Tausendertrennzeichen (z.B. 280.000 EUR)
- Du darfst KEINE externen Marktdaten oder Vergleichswerte nutzen
- WICHTIG: Dein "message"-Feld muss normaler Fließtext auf Deutsch sein. KEIN Code, KEIN JSON, KEINE technischen Variablennamen
- Nutze **fett** für wichtige Zahlen und Ergebnisse
- Nutze Aufzählungen mit "- " für Listen
- Schreibe wie ein freundlicher Finanzberater, nicht wie ein Programmierer

BERECHNUNGSFORMELN (nutze diese für eigene Berechnungen):
- Annuität (monatlich) = Darlehensbetrag × (Zinssatz + Tilgung) / 100 / 12
- Bruttomietrendite = (Jahresmiete / Kaufpreis) × 100
- Nettomietrendite = ((Jahresmiete - Betriebskosten) / Gesamtkosten) × 100
- Kaufpreisfaktor = Kaufpreis / Jahresmiete
- Eigenkapitalrendite = ((Cashflow + Tilgung + Wertsteigerung) / Eigenkapital) × 100
- DSCR = Nettomieteinnahmen / (Zinsen + Tilgung)
- AfA linear: Gebäudeanteil × AfA-Satz (2% oder 2.5% je nach Baujahr)
- Wertsteigerung = Immobilienwert × (1 + Wertsteigerung/100)^Jahre

AKTUELLE PROJEKTDATEN:
${JSON.stringify(projektDaten, null, 2)}

FINANZIERUNG:
${JSON.stringify(finanzierung, null, 2)}

BETRIEBSKOSTEN & MIETE:
${JSON.stringify(betriebskosten, null, 2)}

KAUFNEBENKOSTEN:
${JSON.stringify(kaufnebenkosten, null, 2)}

STEUER:
${JSON.stringify(steuer, null, 2)}

BERECHNETE KENNZAHLEN:
${JSON.stringify(kennzahlen, null, 2)}

PROJEKTION (ausgewählte Jahre):
${JSON.stringify(projektion, null, 2)}

ANTWORTFORMAT — antworte IMMER als valides JSON:
{
  "message": "Deine Antwort auf Deutsch...",
  "parameterChanges": { "kaufpreis": 280000 },
  "inlineCalculation": {
    "title": "Renovierung 50.000 EUR",
    "entries": [
      { "label": "Zusätzliche Kreditrate", "value": "250 EUR/Mon" },
      { "label": "Neuer Cashflow", "value": "-150 EUR/Mon" }
    ]
  },
  "scenarioAdjustments": [
    {
      "label": "Sonderumlage ab Jahr 4",
      "type": "kredit",
      "fromYear": 4,
      "toYear": 30,
      "kreditSumme": 15000,
      "kreditZins": 4.5,
      "kreditTilgung": 3
    }
  ]
}

WANN WELCHES FELD NUTZEN:
- "parameterChanges": NUR wenn der User explizit einen Parameter ändern will (z.B. "setze Kaufpreis auf 300.000")
- "inlineCalculation": Für hypothetische Berechnungen und Was-wäre-wenn-Szenarien. Zeige die Rechenschritte als Tabelle. Ändere dabei KEINE Parameter.
- "scenarioAdjustments": Für komplexe Mehrjahres-Szenarien die NICHT über einfache Parameteränderungen abgebildet werden können. Die Ergebnisse werden live in den Cashflow- und Wertentwicklungs-Charts angezeigt.
- Alle Felder sind optional. Kombiniere "message" + "scenarioAdjustments" + "inlineCalculation" wenn sinnvoll.

SZENARIO-TYPEN für scenarioAdjustments:
1. "expense" — Zusätzliche jährliche Kosten, NICHT steuerlich absetzbar (z.B. Sonderumlage, Reparatur)
   Pflichtfelder: label, type, fromYear, toYear, annualAmount (EUR/Jahr, IMMER positiv!)
2. "income" — Änderung der jährlichen Mieteinnahmen. POSITIVER Wert = mehr Einnahmen, NEGATIVER Wert = Mietausfall/Leerstand!
   Pflichtfelder: label, type, fromYear, toYear, annualAmount (EUR/Jahr, NEGATIV bei Mietausfall!)
   WICHTIG: Bei komplettem Mietausfall = annualAmount: -(Nettomieteinnahmen pro Jahr). Steuereffekte werden automatisch berechnet.
3. "kredit" — Zusätzlicher Kredit (z.B. Modernisierung). Zinsen steuerlich absetzbar, Tilgung nicht.
   Pflichtfelder: label, type, fromYear, toYear, kreditSumme, kreditZins, kreditTilgung

KRITISCHE REGELN:
- Mietausfall/Leerstand: IMMER type="income" mit NEGATIVEM annualAmount! Berechne: annualAmount = -(Nettomieteinnahmen pro Jahr aus Projektdaten)
- Erstelle NUR EIN Szenario pro Ereignis. NIEMALS doppelte oder widersprüchliche Szenarien!
- Mieterhöhung: type="income" mit POSITIVEM annualAmount
- Der Steuersatz des Users (${project.persoenlicherSteuersatz}%) wird automatisch berücksichtigt

BEISPIELE:
- "Leerstand/Mietausfall im Jahr 3": EIN scenarioAdjustment: type="income", fromYear=3, toYear=3, annualAmount=-(Nettomieteinnahmen, berechne exakt aus Projektdaten)
- "Nebenkosten verdoppeln ab Jahr 3": type="expense", fromYear=3, toYear=30, annualAmount=(aktuelle jährliche Nebenkosten)
- "Sonderumlage 15k mit Kredit": type="kredit", fromYear=4, kreditSumme=15000. Frage nach Zinssatz/Tilgung wenn nicht angegeben!
- "Mieterhöhung 200 EUR/Monat ab Jahr 5": type="income", fromYear=5, toYear=30, annualAmount=2400
- "Mieterhöhung 10% ab Jahr 4": type="income", fromYear=4, toYear=30, annualAmount=(Nettomieteinnahmen × 0.10)
- "Modernisierung 500k + Mieterhöhung 10%": ZWEI Szenarien: ein "kredit" + ein "income"

RÜCKFRAGEN-REGEL:
Wenn der User ein Szenario anfragt aber wichtige Daten fehlen (z.B. Kreditkonditionen, genaue Beträge, Zeitraum), stelle ZUERST eine Rückfrage im "message"-Feld. Gib KEIN scenarioAdjustments-Array zurück bis alle nötigen Daten vorhanden sind.

ERLAUBTE PARAMETER für parameterChanges:
${Array.from(ALLOWED_PARAMS).join(', ')}

Wenn der User nach einer Modernisierung fragt, prüfe ob es über scenarioAdjustments (Kredit + Zeitraum) oder parameterChanges (einfache Änderung) besser abbildbar ist. Bevorzuge scenarioAdjustments für zeitlich begrenzte oder zukunftsbezogene Szenarien.${buildEtvContext(etvProtokolle ?? [])}`
}

function sanitizeParameterChanges(changes: Record<string, unknown>): Record<string, number> | undefined {
  const sanitized: Record<string, number> = {}
  let hasValidChanges = false

  for (const [key, value] of Object.entries(changes)) {
    if (ALLOWED_PARAMS.has(key) && typeof value === 'number' && isFinite(value)) {
      sanitized[key] = value
      hasValidChanges = true
    }
  }

  return hasValidChanges ? sanitized : undefined
}

function sanitizeInlineCalculation(
  calc: unknown,
): { title: string; entries: { label: string; value: string }[] } | undefined {
  if (!calc || typeof calc !== 'object') return undefined
  const obj = calc as Record<string, unknown>
  if (typeof obj.title !== 'string') return undefined
  if (!Array.isArray(obj.entries)) return undefined

  const entries: { label: string; value: string }[] = []
  for (const entry of obj.entries) {
    if (entry && typeof entry === 'object' && 'label' in entry && 'value' in entry) {
      entries.push({
        label: String((entry as Record<string, unknown>).label),
        value: String((entry as Record<string, unknown>).value),
      })
    }
  }

  return entries.length > 0 ? { title: obj.title, entries } : undefined
}

function sanitizeScenarioAdjustments(
  adjustments: unknown,
): ScenarioAdjustment[] | undefined {
  if (!Array.isArray(adjustments)) return undefined

  const sanitized: ScenarioAdjustment[] = []
  for (const raw of adjustments) {
    if (!raw || typeof raw !== 'object') continue
    const a = raw as Record<string, unknown>

    const type = a.type as string
    if (!['expense', 'income', 'kredit'].includes(type)) continue

    const fromYear = typeof a.fromYear === 'number' ? Math.max(1, Math.min(30, Math.round(a.fromYear))) : null
    if (fromYear === null) continue

    const toYear = typeof a.toYear === 'number' ? Math.max(fromYear, Math.min(30, Math.round(a.toYear))) : 30

    const adj: ScenarioAdjustment = {
      id: crypto.randomUUID(),
      label: typeof a.label === 'string' ? a.label : `Szenario ab Jahr ${fromYear}`,
      type: type as 'expense' | 'income' | 'kredit',
      fromYear,
      toYear,
    }

    if (type === 'expense' || type === 'income') {
      adj.annualAmount = typeof a.annualAmount === 'number' && isFinite(a.annualAmount) ? a.annualAmount : 0
    }

    if (type === 'kredit') {
      adj.kreditSumme = typeof a.kreditSumme === 'number' && isFinite(a.kreditSumme) ? a.kreditSumme : 0
      adj.kreditZins = typeof a.kreditZins === 'number' && isFinite(a.kreditZins) ? a.kreditZins : 3
      adj.kreditTilgung = typeof a.kreditTilgung === 'number' && isFinite(a.kreditTilgung) ? a.kreditTilgung : 2
    }

    sanitized.push(adj)
  }

  return sanitized.length > 0 ? sanitized : undefined
}

/**
 * Ensure messages alternate between user and assistant roles.
 * Consecutive same-role messages are merged (required by Anthropic API).
 */
function ensureAlternatingRoles(
  messages: { role: 'user' | 'assistant'; content: string }[],
): { role: 'user' | 'assistant'; content: string }[] {
  const result: { role: 'user' | 'assistant'; content: string }[] = []
  for (const msg of messages) {
    if (result.length > 0 && result[result.length - 1].role === msg.role) {
      result[result.length - 1] = {
        role: msg.role,
        content: result[result.length - 1].content + '\n\n' + msg.content,
      }
    } else {
      result.push({ ...msg })
    }
  }
  return result
}

export async function sendChatMessage(
  apiKey: string,
  project: Project,
  result: CalculationResult,
  messages: { role: 'user' | 'assistant'; content: string }[],
  etvProtokolle?: EtvProtokoll[],
): Promise<AiResponse> {
  const systemPrompt = buildSystemPrompt(project, result, etvProtokolle)
  const sanitizedMessages = ensureAlternatingRoles(messages)

  let response: Response
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 4096,
        system: systemPrompt,
        messages: sanitizedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    })
  } catch (err) {
    throw new Error(
      `Netzwerkfehler — überprüfe deine Internetverbindung. (${err instanceof Error ? err.message : 'fetch failed'})`,
    )
  }

  if (!response.ok) {
    if (response.status === 401) throw new Error('Ungültiger API-Key. Bitte überprüfe deinen Anthropic API-Key.')
    if (response.status === 429) throw new Error('Rate-Limit erreicht. Bitte warte einen Moment.')
    if (response.status === 529) throw new Error('API ist überlastet. Bitte versuche es gleich nochmal.')
    const errorBody = await response.text().catch(() => '')
    // Try to extract Anthropic's error message from JSON response
    let errorMessage = errorBody.slice(0, 300)
    try {
      const parsed = JSON.parse(errorBody)
      if (parsed.error?.message) errorMessage = parsed.error.message
    } catch { /* use raw body */ }
    throw new Error(`API-Fehler (${response.status}): ${errorMessage}`)
  }

  const data = await response.json()
  const text: string = data.content?.[0]?.text ?? ''

  if (!text) {
    throw new Error('Leere Antwort von der API erhalten. Bitte versuche es erneut.')
  }

  // Try to parse JSON response
  try {
    // Handle potential markdown code blocks and whitespace
    let jsonStr = text.trim()
    // Remove markdown code fences
    jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?\s*```\s*$/i, '').trim()
    // Sometimes AI wraps in extra text before/after JSON
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }
    const parsed = JSON.parse(jsonStr)
    // Decode escaped newlines/tabs that the AI may produce as literal sequences
    const rawMsg = typeof parsed.message === 'string' ? parsed.message : text
    const cleanMsg = rawMsg.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '')
    return {
      message: cleanMsg,
      parameterChanges: parsed.parameterChanges
        ? sanitizeParameterChanges(parsed.parameterChanges)
        : undefined,
      inlineCalculation: parsed.inlineCalculation
        ? sanitizeInlineCalculation(parsed.inlineCalculation)
        : undefined,
      scenarioAdjustments: parsed.scenarioAdjustments
        ? sanitizeScenarioAdjustments(parsed.scenarioAdjustments)
        : undefined,
    }
  } catch {
    // If AI didn't return valid JSON, clean up the text and treat as message
    // Remove any JSON artifacts that leaked into the text
    let cleanText = text
      .replace(/^```(?:json)?\s*\n?/gi, '')
      .replace(/\n?\s*```\s*$/gi, '')
      .replace(/^\s*\{\s*"message"\s*:\s*"/i, '')
      .replace(/"\s*\}\s*$/i, '')
      .trim()
    // If still looks like raw JSON, try to extract the message field
    if (cleanText.startsWith('{') && cleanText.includes('"message"')) {
      try {
        const obj = JSON.parse(cleanText)
        if (obj.message) cleanText = obj.message
      } catch { /* keep cleanText as is */ }
    }
    const finalMsg = (cleanText || text).replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '')
    return { message: finalMsg }
  }
}
