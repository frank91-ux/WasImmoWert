import type { Project, CalculationResult } from '@/calc/types'

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
}

// Whitelist of parameters the AI may change
const ALLOWED_PARAMS = new Set([
  'kaufpreis', 'eigenkapital', 'zinssatz', 'tilgung', 'monatsmieteKalt',
  'sondertilgung', 'wertsteigerung', 'persoenlicherSteuersatz',
  'mietausfallwagnis', 'instandhaltungProQm', 'maklerProvision',
  'nebenkostenProQm', 'umlagefaehigAnteil', 'ersparteMiete',
  'verwaltungProEinheit', 'nichtUmlegbareNebenkosten',
])

function buildSystemPrompt(project: Project, result: CalculationResult): string {
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

STRIKTE REGELN:
- Antworte IMMER auf Deutsch
- Halte Antworten prägnant aber informativ
- Formatiere Geldbeträge mit Punkt als Tausendertrennzeichen (z.B. 280.000 EUR)
- Du darfst KEINE externen Marktdaten oder Vergleichswerte nutzen

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
  }
}

WANN WELCHES FELD NUTZEN:
- "parameterChanges": NUR wenn der User explizit einen Parameter ändern will (z.B. "setze Kaufpreis auf 300.000")
- "inlineCalculation": Für hypothetische Berechnungen und Was-wäre-wenn-Szenarien (z.B. "Was kostet eine Renovierung für 50k?", "Was passiert bei 4% Zinsen nach Zinsbindung?"). Zeige die Rechenschritte als Tabelle. Ändere dabei KEINE Parameter.
- Beide Felder sind optional. Nutze "inlineCalculation" wenn du eine Berechnung durchführst, ohne die Projekt-Parameter zu ändern.

ERLAUBTE PARAMETER für parameterChanges:
${Array.from(ALLOWED_PARAMS).join(', ')}

Wenn der User nach einer Modernisierung fragt, führe eine inlineCalculation durch und zeige die finanziellen Auswirkungen. Ändere die Parameter nur wenn er es explizit wünscht.`
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
): Promise<AiResponse> {
  const systemPrompt = buildSystemPrompt(project, result)
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
    // Handle potential markdown code blocks
    const jsonStr = text.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
    const parsed = JSON.parse(jsonStr)
    return {
      message: typeof parsed.message === 'string' ? parsed.message : text,
      parameterChanges: parsed.parameterChanges
        ? sanitizeParameterChanges(parsed.parameterChanges)
        : undefined,
      inlineCalculation: parsed.inlineCalculation
        ? sanitizeInlineCalculation(parsed.inlineCalculation)
        : undefined,
    }
  } catch {
    // If AI didn't return valid JSON, treat entire text as message
    return { message: text }
  }
}
