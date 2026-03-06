export interface StadtteilDaten {
  name: string
  stadt: string
  lat: number
  lng: number
  kaufpreisProQm: number   // €/m² Wohnungen
  mietpreisProQm: number   // €/m² Kaltmiete
  trendKauf?: number       // % YoY
  trendMiete?: number      // % YoY
}

// Hardkodierte Marktdaten (Quellen: immowelt, ImmoScout24, Engel & Völkers — Stand 2025)
export const MARKTDATEN: StadtteilDaten[] = [
  // --- Herzogenaurach (Kreis Erlangen-Höchstadt) ---
  { name: 'Zentrum',       stadt: 'Herzogenaurach', lat: 49.5683, lng: 10.8863, kaufpreisProQm: 3888, mietpreisProQm: 11.80, trendKauf: 5.3, trendMiete: 3.3 },
  { name: 'Herzo Base',    stadt: 'Herzogenaurach', lat: 49.5855, lng: 10.8720, kaufpreisProQm: 4415, mietpreisProQm: 13.00, trendKauf: 6.0, trendMiete: 2.5 },
  { name: 'Steinbach',     stadt: 'Herzogenaurach', lat: 49.5540, lng: 10.9000, kaufpreisProQm: 3634, mietpreisProQm: 10.50, trendKauf: 3.0, trendMiete: 2.0 },
  { name: 'Niederndorf',   stadt: 'Herzogenaurach', lat: 49.5750, lng: 10.8700, kaufpreisProQm: 3700, mietpreisProQm: 11.00, trendKauf: 4.0, trendMiete: 2.5 },
  { name: 'Haundorf',      stadt: 'Herzogenaurach', lat: 49.5600, lng: 10.8650, kaufpreisProQm: 3550, mietpreisProQm: 10.80, trendKauf: 2.5, trendMiete: 1.8 },

  // --- Erlangen ---
  { name: 'Altstadt/Mitte', stadt: 'Erlangen', lat: 49.5960, lng: 11.0050, kaufpreisProQm: 5729, mietpreisProQm: 13.46, trendKauf: 1.0, trendMiete: 4.1 },
  { name: 'Erlangen-Nord',  stadt: 'Erlangen', lat: 49.6100, lng: 11.0030, kaufpreisProQm: 6484, mietpreisProQm: 12.95, trendKauf: 3.1, trendMiete: 2.0 },
  { name: 'Erlangen-Süd',   stadt: 'Erlangen', lat: 49.5800, lng: 11.0080, kaufpreisProQm: 4500, mietpreisProQm: 12.50, trendKauf: 0.5, trendMiete: 3.0 },
  { name: 'Rathsberg',      stadt: 'Erlangen', lat: 49.5950, lng: 11.0250, kaufpreisProQm: 4800, mietpreisProQm: 12.84, trendKauf: 1.5, trendMiete: 2.5 },
  { name: 'Tennenlohe',     stadt: 'Erlangen', lat: 49.5700, lng: 11.0300, kaufpreisProQm: 3602, mietpreisProQm: 11.00, trendKauf: 0.8, trendMiete: 1.5 },
  { name: 'Büchenbach',     stadt: 'Erlangen', lat: 49.5850, lng: 10.9850, kaufpreisProQm: 4200, mietpreisProQm: 12.00, trendKauf: 1.2, trendMiete: 3.5 },
  { name: 'Neuses',         stadt: 'Erlangen', lat: 49.6000, lng: 10.9750, kaufpreisProQm: 3848, mietpreisProQm: 11.50, trendKauf: 0.5, trendMiete: 2.0 },
  { name: 'Frauenaurach',   stadt: 'Erlangen', lat: 49.5850, lng: 10.9600, kaufpreisProQm: 4100, mietpreisProQm: 11.80, trendKauf: 1.2, trendMiete: 1.2 },

  // --- Fürth ---
  { name: 'Fürth (Gesamt)',  stadt: 'Fürth',  lat: 49.4771, lng: 10.9887, kaufpreisProQm: 2450, mietpreisProQm: 10.30, trendKauf: 4.3, trendMiete: 3.0 },

  // --- Nürnberg ---
  { name: 'Nürnberg (Gesamt)', stadt: 'Nürnberg', lat: 49.4543, lng: 11.0746, kaufpreisProQm: 3450, mietpreisProQm: 11.10, trendKauf: -1.4, trendMiete: 1.8 },

  // --- Forchheim ---
  { name: 'Forchheim (Gesamt)', stadt: 'Forchheim', lat: 49.7188, lng: 11.0680, kaufpreisProQm: 3250, mietpreisProQm: 9.80, trendKauf: 1.6, trendMiete: 2.0 },

  // --- Bayreuth ---
  { name: 'Bayreuth (Gesamt)', stadt: 'Bayreuth', lat: 49.9456, lng: 11.5713, kaufpreisProQm: 3450, mietpreisProQm: 9.60, trendKauf: 6.2, trendMiete: 3.0 },

  // --- München ---
  { name: 'München (Gesamt)',           stadt: 'München', lat: 48.1351, lng: 11.5820, kaufpreisProQm: 8200, mietpreisProQm: 20.30, trendKauf: 1.2, trendMiete: 1.5 },
  { name: 'Aubing-Lochhausen-Langwied', stadt: 'München', lat: 48.1498, lng: 11.4236, kaufpreisProQm: 9100, mietpreisProQm: 22.20, trendKauf: 1.5, trendMiete: 2.0 },
  { name: 'Bogenhausen',                stadt: 'München', lat: 48.1519, lng: 11.6117, kaufpreisProQm: 8800, mietpreisProQm: 21.10, trendKauf: 1.0, trendMiete: 1.5 },
  { name: 'Maxvorstadt',                stadt: 'München', lat: 48.1530, lng: 11.5680, kaufpreisProQm: 11850, mietpreisProQm: 28.40, trendKauf: 2.0, trendMiete: 2.5 },
  { name: 'Obermenzing',                stadt: 'München', lat: 48.1627, lng: 11.4687, kaufpreisProQm: 10150, mietpreisProQm: 24.20, trendKauf: 1.5, trendMiete: 2.0 },
  { name: 'Pasing-Obermenzing',         stadt: 'München', lat: 48.1488, lng: 11.4500, kaufpreisProQm: 9600, mietpreisProQm: 24.80, trendKauf: 1.3, trendMiete: 1.8 },
  { name: 'Ramersdorf-Perlach',         stadt: 'München', lat: 48.1010, lng: 11.6200, kaufpreisProQm: 8400, mietpreisProQm: 20.80, trendKauf: 0.8, trendMiete: 1.5 },
  { name: 'Schwabing-West',             stadt: 'München', lat: 48.1600, lng: 11.5660, kaufpreisProQm: 10650, mietpreisProQm: 26.10, trendKauf: 1.8, trendMiete: 2.2 },
  { name: 'Solln',                      stadt: 'München', lat: 48.0794, lng: 11.5324, kaufpreisProQm: 10750, mietpreisProQm: 25.20, trendKauf: 2.0, trendMiete: 2.0 },
  { name: 'Trudering-Riem',             stadt: 'München', lat: 48.1200, lng: 11.6500, kaufpreisProQm: 8600, mietpreisProQm: 20.60, trendKauf: 1.0, trendMiete: 1.5 },
]

// Farbskala: Preis → Farbe
const KAUF_STUFEN: [number, string][] = [
  [3000, '#22c55e'],  // grün — günstig
  [4000, '#84cc16'],  // gelbgrün
  [5500, '#eab308'],  // gelb
  [8000, '#f97316'],  // orange
  [10000, '#ef4444'], // rot — teuer
  [Infinity, '#991b1b'], // dunkelrot — Premium (München-Zentrum)
]

const MIETE_STUFEN: [number, string][] = [
  [10, '#22c55e'],    // grün — günstig
  [12, '#84cc16'],    // gelbgrün
  [15, '#eab308'],    // gelb
  [20, '#f97316'],    // orange
  [25, '#ef4444'],    // rot — teuer
  [Infinity, '#991b1b'], // dunkelrot — Premium
]

export function getPreisfarbe(preis: number, typ: 'kauf' | 'miete'): string {
  const stufen = typ === 'kauf' ? KAUF_STUFEN : MIETE_STUFEN
  for (const [grenze, farbe] of stufen) {
    if (preis < grenze) return farbe
  }
  return stufen[stufen.length - 1][1]
}

export const LEGENDE_KAUF = [
  { label: '< 3.000 €', farbe: '#22c55e' },
  { label: '3.000–4.000 €', farbe: '#84cc16' },
  { label: '4.000–5.500 €', farbe: '#eab308' },
  { label: '5.500–8.000 €', farbe: '#f97316' },
  { label: '8.000–10.000 €', farbe: '#ef4444' },
  { label: '> 10.000 €', farbe: '#991b1b' },
]

// --- Bundesland-Level Durchschnittsdaten (Mock, Stand 2025) ---

export interface BundeslandMarktdaten {
  kaufpreisProQm: number   // €/m² Wohnungen (Durchschnitt)
  mietpreisProQm: number   // €/m² Kaltmiete (Durchschnitt)
  trendKauf: number        // % YoY Kaufpreis
  trendMiete: number       // % YoY Miete
}

const BUNDESLAND_MARKTDATEN: Record<string, BundeslandMarktdaten> = {
  'bayern':                { kaufpreisProQm: 4850, mietpreisProQm: 12.80, trendKauf: 2.5, trendMiete: 3.0 },
  'berlin':                { kaufpreisProQm: 4600, mietpreisProQm: 11.90, trendKauf: 1.8, trendMiete: 4.2 },
  'baden-wuerttemberg':    { kaufpreisProQm: 4200, mietpreisProQm: 11.50, trendKauf: 1.5, trendMiete: 2.8 },
  'brandenburg':           { kaufpreisProQm: 2800, mietpreisProQm: 8.20,  trendKauf: 3.5, trendMiete: 4.0 },
  'bremen':                { kaufpreisProQm: 2400, mietpreisProQm: 8.90,  trendKauf: 1.0, trendMiete: 2.5 },
  'hamburg':               { kaufpreisProQm: 5600, mietpreisProQm: 13.50, trendKauf: 1.2, trendMiete: 3.5 },
  'hessen':                { kaufpreisProQm: 3800, mietpreisProQm: 11.00, trendKauf: 1.0, trendMiete: 2.5 },
  'mecklenburg-vorpommern':{ kaufpreisProQm: 2200, mietpreisProQm: 7.50,  trendKauf: 4.0, trendMiete: 3.0 },
  'niedersachsen':         { kaufpreisProQm: 2600, mietpreisProQm: 8.50,  trendKauf: 1.5, trendMiete: 2.0 },
  'nordrhein-westfalen':   { kaufpreisProQm: 2900, mietpreisProQm: 9.20,  trendKauf: 0.8, trendMiete: 2.5 },
  'rheinland-pfalz':       { kaufpreisProQm: 2300, mietpreisProQm: 8.00,  trendKauf: 1.0, trendMiete: 1.8 },
  'saarland':              { kaufpreisProQm: 1800, mietpreisProQm: 7.20,  trendKauf: 0.5, trendMiete: 1.5 },
  'sachsen':               { kaufpreisProQm: 2500, mietpreisProQm: 7.80,  trendKauf: 3.0, trendMiete: 3.5 },
  'sachsen-anhalt':        { kaufpreisProQm: 1600, mietpreisProQm: 6.50,  trendKauf: 2.5, trendMiete: 2.0 },
  'schleswig-holstein':    { kaufpreisProQm: 3000, mietpreisProQm: 9.50,  trendKauf: 2.0, trendMiete: 2.5 },
  'thueringen':            { kaufpreisProQm: 1700, mietpreisProQm: 6.80,  trendKauf: 1.5, trendMiete: 2.0 },
}

const DEFAULT_MARKT: BundeslandMarktdaten = {
  kaufpreisProQm: 3200,
  mietpreisProQm: 9.50,
  trendKauf: 1.5,
  trendMiete: 2.5,
}

/**
 * Returns average market data for a given Bundesland.
 * Falls back to national average if Bundesland is unknown.
 */
export function getMarktdatenForBundesland(bundesland: string): BundeslandMarktdaten {
  return BUNDESLAND_MARKTDATEN[bundesland] ?? DEFAULT_MARKT
}

export const LEGENDE_MIETE = [
  { label: '< 10 €', farbe: '#22c55e' },
  { label: '10–12 €', farbe: '#84cc16' },
  { label: '12–15 €', farbe: '#eab308' },
  { label: '15–20 €', farbe: '#f97316' },
  { label: '20–25 €', farbe: '#ef4444' },
  { label: '> 25 €', farbe: '#991b1b' },
]

// --- Marktvergleich-Funktionen ---

export interface MarktvergleichResult {
  durchschnittKauf: number      // Ø Kaufpreis/m² der Region
  durchschnittMiete: number     // Ø Mietpreis/m² der Region
  abweichungKaufProzent: number // % Abweichung (negativ = günstiger)
  abweichungKaufAbsolut: number // €/m² Abweichung
  abweichungMieteProzent: number
  abweichungMieteAbsolut: number
  preisLevel: 'guenstig' | 'fair' | 'teuer'  // Bewertung
  verfuegbar: boolean           // Marktdaten verfügbar?
}

/** Haversine distance in km between two lat/lng pairs */
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const MARKT_RADIUS_KM = 8

/**
 * Berechnet den Marktvergleich für ein Projekt basierend auf den Regionaldaten.
 * Wenn Koordinaten übergeben werden, werden nur nahegelegene Stadtteile (≤8km) berücksichtigt.
 */
export function berechneMarktvergleich(
  kaufpreisProQm: number,
  mietpreisProQm: number,
  lat?: number | null,
  lng?: number | null,
): MarktvergleichResult {
  if (MARKTDATEN.length === 0 || kaufpreisProQm <= 0) {
    return {
      durchschnittKauf: 0,
      durchschnittMiete: 0,
      abweichungKaufProzent: 0,
      abweichungKaufAbsolut: 0,
      abweichungMieteProzent: 0,
      abweichungMieteAbsolut: 0,
      preisLevel: 'fair',
      verfuegbar: false,
    }
  }

  // Filter by proximity if coordinates available
  const relevantDaten = (lat != null && lng != null)
    ? MARKTDATEN.filter(d => haversine(lat, lng, d.lat, d.lng) <= MARKT_RADIUS_KM)
    : MARKTDATEN
  const data = relevantDaten.length > 0 ? relevantDaten : MARKTDATEN

  const durchschnittKauf = data.reduce((s, d) => s + d.kaufpreisProQm, 0) / data.length
  const durchschnittMiete = data.reduce((s, d) => s + d.mietpreisProQm, 0) / data.length

  const abweichungKaufAbsolut = kaufpreisProQm - durchschnittKauf
  const abweichungKaufProzent = durchschnittKauf > 0 ? (abweichungKaufAbsolut / durchschnittKauf) * 100 : 0

  const abweichungMieteAbsolut = mietpreisProQm - durchschnittMiete
  const abweichungMieteProzent = durchschnittMiete > 0 ? (abweichungMieteAbsolut / durchschnittMiete) * 100 : 0

  // Bewertung: < -5% = günstig, -5% bis +10% = fair, > +10% = teuer
  const preisLevel: MarktvergleichResult['preisLevel'] =
    abweichungKaufProzent < -5 ? 'guenstig'
    : abweichungKaufProzent > 10 ? 'teuer'
    : 'fair'

  return {
    durchschnittKauf,
    durchschnittMiete,
    abweichungKaufProzent,
    abweichungKaufAbsolut,
    abweichungMieteProzent,
    abweichungMieteAbsolut,
    preisLevel,
    verfuegbar: true,
  }
}
