import type { EtvProtokoll, EtvBeschluss, EtvWirtschaftsplan } from '@/store/useEtvStore'

/**
 * Convert a File (PDF or image) to a base64 data URL for the Anthropic vision API.
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip data URL prefix to get raw base64
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function mediaType(file: File): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' | 'application/pdf' {
  if (file.type === 'application/pdf') return 'application/pdf'
  if (file.type === 'image/png') return 'image/png'
  if (file.type === 'image/webp') return 'image/webp'
  if (file.type === 'image/gif') return 'image/gif'
  return 'image/jpeg'
}

const ETV_SYSTEM_PROMPT = `Du bist ein Experte für die Analyse von Eigentümerversammlungsprotokollen (ETV-Protokolle) und Wirtschaftsplänen von Wohnungseigentümergemeinschaften (WEG) in Deutschland.

Deine Aufgabe: Analysiere das hochgeladene Dokument und extrahiere alle relevanten Informationen strukturiert.

REGELN:
- Analysiere ALLE Tagesordnungspunkte (TOPs) mit Abstimmungsergebnissen
- Erkenne Wirtschaftspläne/Einzelwirtschaftspläne und extrahiere Kostenpositionen
- Identifiziere kostenrelevante Beschlüsse (Sanierungen, Reparaturen, Sonderumlagen)
- Erkenne Warnzeichen für Investoren (hohe Sonderumlagen, Streit, abgelehnte Anträge, Instandhaltungsstau)
- Wenn Abstimmungsergebnisse nicht vorhanden sind, setze ja/nein/enthaltungen auf null
- Kategorisiere jeden TOP: "verwaltung", "finanzen", "instandhaltung", oder "sonstiges"
- Schreibe eine kurze Zusammenfassung (max. 3 Sätze) aus Investorensicht
- Liste konkrete Warnungen auf, die für einen Käufer/Investor relevant sind

ANTWORTFORMAT — antworte als valides JSON:
{
  "datum": "15.09.2022",
  "objekt": "Schützenstraße 6-6c, Bamberg",
  "verwaltung": "Gewobau Bamberg eG",
  "anwesenheit": "765,531/1012,465stel",
  "beschluesse": [
    {
      "topNummer": "TOP 1",
      "titel": "Neubestellung einer Verwaltung",
      "antrag": "Kurze Beschreibung des Antrags...",
      "jaStimmen": 25,
      "neinStimmen": 0,
      "enthaltungen": 1,
      "ergebnis": "einstimmig angenommen",
      "kategorie": "verwaltung",
      "kostenRelevant": true,
      "betrag": 7900
    }
  ],
  "wirtschaftsplan": {
    "jahr": 2022,
    "ausgabenGesamt": 84487,
    "ruecklageGesamt": 30000,
    "hausgeldMonatlich": 274,
    "kostenPositionen": [
      { "bezeichnung": "Heizungskosten", "gesamtkosten": 27000, "anteilEigentümer": 772.57, "verteilschluessel": "Heizk. lt. EAD" },
      { "bezeichnung": "Verwaltungskosten", "gesamtkosten": 7350, "anteilEigentümer": 216.18, "verteilschluessel": "Anz.Wohnungen" }
    ]
  },
  "zusammenfassung": "Die ETV vom 15.09.2022 verlief geordnet...",
  "warnungen": ["Balkonsanierung WE Irmler: 14.050 EUR aus Erhaltungsrücklage", "Durchfeuchtete Wand in Wohnung Freudensprung muss überprüft werden"]
}`

/**
 * Analyse an ETV Protokoll file (PDF or image) using the Anthropic Vision API.
 */
export async function analyseEtvProtokoll(
  apiKey: string,
  files: File[],
): Promise<Omit<EtvProtokoll, 'id' | 'dateiName' | 'uploadedAt'>> {
  // Build content blocks: text prompt + all file images/PDFs
  const contentBlocks: Array<
    | { type: 'text'; text: string }
    | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
    | { type: 'document'; source: { type: 'base64'; media_type: 'application/pdf'; data: string } }
  > = []

  for (const file of files) {
    const base64 = await fileToBase64(file)
    const mt = mediaType(file)

    if (mt === 'application/pdf') {
      contentBlocks.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64 },
      })
    } else {
      contentBlocks.push({
        type: 'image',
        source: { type: 'base64', media_type: mt, data: base64 },
      })
    }
  }

  contentBlocks.push({
    type: 'text',
    text: 'Analysiere dieses Eigentümerversammlungsprotokoll / diese ETV-Unterlagen vollständig. Extrahiere alle Tagesordnungspunkte, Abstimmungsergebnisse, Kosten und den Wirtschaftsplan falls vorhanden. Antworte als JSON gemäß dem Systemformat.',
  })

  let response: Response
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'anthropic-beta': 'pdfs-2024-09-25',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 8192,
        system: ETV_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: contentBlocks }],
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
    let errorMessage = errorBody.slice(0, 300)
    try {
      const parsed = JSON.parse(errorBody)
      if (parsed.error?.message) errorMessage = parsed.error.message
    } catch { /* use raw body */ }
    throw new Error(`API-Fehler (${response.status}): ${errorMessage}`)
  }

  const data = await response.json()
  const text: string = data.content?.[0]?.text ?? ''

  if (!text) throw new Error('Leere Antwort von der API. Bitte versuche es erneut.')

  // Parse JSON response
  let jsonStr = text.trim()
  jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?\s*```\s*$/i, '').trim()
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
  if (jsonMatch) jsonStr = jsonMatch[0]

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    throw new Error('KI-Antwort konnte nicht als JSON geparst werden. Bitte versuche es erneut.')
  }

  // Sanitise beschluesse
  const beschluesse: EtvBeschluss[] = Array.isArray(parsed.beschluesse)
    ? parsed.beschluesse.map((b: Record<string, unknown>) => ({
        topNummer: String(b.topNummer ?? ''),
        titel: String(b.titel ?? ''),
        antrag: String(b.antrag ?? ''),
        jaStimmen: typeof b.jaStimmen === 'number' ? b.jaStimmen : null,
        neinStimmen: typeof b.neinStimmen === 'number' ? b.neinStimmen : null,
        enthaltungen: typeof b.enthaltungen === 'number' ? b.enthaltungen : null,
        ergebnis: String(b.ergebnis ?? ''),
        kategorie: (['verwaltung', 'finanzen', 'instandhaltung', 'sonstiges'] as const).includes(
          b.kategorie as 'verwaltung',
        )
          ? (b.kategorie as 'verwaltung' | 'finanzen' | 'instandhaltung' | 'sonstiges')
          : 'sonstiges',
        kostenRelevant: Boolean(b.kostenRelevant),
        betrag: typeof b.betrag === 'number' ? b.betrag : null,
      }))
    : []

  // Sanitise wirtschaftsplan
  let wirtschaftsplan: EtvWirtschaftsplan | null = null
  if (parsed.wirtschaftsplan && typeof parsed.wirtschaftsplan === 'object') {
    const wp = parsed.wirtschaftsplan as Record<string, unknown>
    wirtschaftsplan = {
      jahr: typeof wp.jahr === 'number' ? wp.jahr : 0,
      ausgabenGesamt: typeof wp.ausgabenGesamt === 'number' ? wp.ausgabenGesamt : 0,
      ruecklageGesamt: typeof wp.ruecklageGesamt === 'number' ? wp.ruecklageGesamt : 0,
      hausgeldMonatlich: typeof wp.hausgeldMonatlich === 'number' ? wp.hausgeldMonatlich : null,
      kostenPositionen: Array.isArray(wp.kostenPositionen)
        ? wp.kostenPositionen.map((k: Record<string, unknown>) => ({
            bezeichnung: String(k.bezeichnung ?? ''),
            gesamtkosten: typeof k.gesamtkosten === 'number' ? k.gesamtkosten : 0,
            anteilEigentümer: typeof k.anteilEigentümer === 'number' ? k.anteilEigentümer : null,
            verteilschluessel: String(k.verteilschluessel ?? ''),
          }))
        : [],
    }
  }

  return {
    datum: String(parsed.datum ?? ''),
    objekt: String(parsed.objekt ?? ''),
    verwaltung: String(parsed.verwaltung ?? ''),
    anwesenheit: String(parsed.anwesenheit ?? ''),
    beschluesse,
    wirtschaftsplan,
    zusammenfassung: String(parsed.zusammenfassung ?? '').replace(/\\n/g, '\n'),
    warnungen: Array.isArray(parsed.warnungen)
      ? parsed.warnungen.map((w: unknown) => String(w).replace(/\\n/g, '\n'))
      : [],
  }
}
