export interface ZinsbindungPeriod {
  afterYear: number    // e.g. 10 = change after year 10
  zinssatz: number     // new interest rate %
  tilgung: number      // new repayment rate %
}

export interface ModernisierungPosten {
  id: string
  bezeichnung: string
  kosten: number
  jahr: number              // after X years
  mietumlageProzent: number // % passable to tenant (§559 BGB, max 8% p.a.)
}

export interface NebenkostenPosten {
  id: string
  bezeichnung: string
  betrag: number            // EUR/month
  umlagefaehig: boolean     // passable to tenant?
}

export type PropertyType = 'wohnung' | 'haus'

export type Bundesland =
  | 'baden-wuerttemberg' | 'bayern' | 'berlin' | 'brandenburg'
  | 'bremen' | 'hamburg' | 'hessen' | 'mecklenburg-vorpommern'
  | 'niedersachsen' | 'nordrhein-westfalen' | 'rheinland-pfalz'
  | 'saarland' | 'sachsen' | 'sachsen-anhalt'
  | 'schleswig-holstein' | 'thueringen'

export interface Project {
  id: string
  name: string
  createdAt: string
  updatedAt: string

  // Basic property info
  propertyType: PropertyType
  address: string
  lat: number | null
  lng: number | null
  bundesland: Bundesland
  wohnflaeche: number
  baujahr: number
  anzahlEinheiten: number

  // Purchase
  kaufpreis: number
  grundstueckAnteil: number    // % of purchase price attributable to land
  maklerProvision: number      // %
  notarUndGrundbuch: number    // %

  // Financing
  eigenkapital: number
  zinssatz: number             // % annual interest rate
  tilgung: number              // % initial annual repayment rate
  zinsbindung: number          // years
  sondertilgung: number        // EUR annual
  zinsbindungPeriods: ZinsbindungPeriod[]  // rate changes after initial period

  // Usage mode
  nutzungsart: 'vermietung' | 'eigennutzung'
  ersparteMiete: number        // EUR/month (imputed rent savings for self-use)

  // Rental income
  monatsmieteKalt: number      // EUR
  mietausfallwagnis: number    // %
  nebenkostenProQm: number     // EUR/m²/month total Nebenkosten
  umlagefaehigAnteil: number   // % of Nebenkosten umlagefähig (0-100)

  // Ongoing costs
  instandhaltungProQm: number  // EUR/sqm/year
  verwaltungProEinheit: number // EUR/month per unit
  nichtUmlegbareNebenkosten: number  // EUR/month
  sonstigeKosten: number       // EUR/month

  // Tax
  persoenlicherSteuersatz: number  // % marginal rate (simplified)
  zuVersteuerndesEinkommen: number // EUR (for progressive calc)
  useProgressiveTax: boolean
  kirchensteuer: boolean
  kirchensteuersatz: number    // 8 or 9
  beweglicheGegenstaende: number   // EUR
  afaBeweglichJahre: number
  customAfaRate: number | null     // override AfA % (null = auto from baujahr)

  // Hausgeld model (for Wohnung/WEG)
  hausgeldModus: 'hausgeld' | 'einzelposten'
  hausgeldProMonat: number               // EUR/month
  hausgeldInstandhaltungAnteil: number   // % of hausgeld for Instandhaltungsrücklage
  hausgeldVerwaltungAnteil: number       // % of hausgeld for WEG-Verwaltung

  // Modernisierungen (zyklische Planung)
  modernisierungen: ModernisierungPosten[]

  // Custom Nebenkosten line items
  nebenkostenPosten: NebenkostenPosten[]

  // Market reference data
  marktKaufpreisProQm: number | null
  marktMietpreisProQm: number | null

  // Leistbarkeits-Check (Eigennutzung)
  nettoJahresgehalt: number
  monatlicheAusgaben: number

  // Property value growth
  wertsteigerung: number   // % p.a. property value appreciation

  // Investment comparison rates
  etfRendite: number       // % p.a.
  customRendite: number    // % p.a. (user-defined alternative)
  customInvestmentName: string

  // Portfolio
  isInPortfolio: boolean
}

export interface KaufnebenkostenResult {
  grunderwerbsteuer: number
  grunderwerbsteuerSatz: number
  notarkosten: number
  maklerkosten: number
  kaufnebenkostenGesamt: number
  gesamtkosten: number
}

export interface FinancingResult {
  darlehensBetrag: number
  monatlicheRate: number
  monatlicheZinsenStart: number
  monatlicheTilgungStart: number
  annuitaet: number
}

export interface RentalResult {
  jahresmieteKalt: number
  mietausfall: number
  nettomieteinnahmen: number
  nebenkostenGesamt: number
  umlagefaehigeNK: number
  nichtUmlagefaehigeNK: number
  warmmieteMonat: number
}

export interface OperatingCostResult {
  instandhaltungJahr: number
  verwaltungJahr: number
  nichtUmlegbarJahr: number
  sonstigeKostenJahr: number
  betriebskostenGesamt: number
}

export interface TaxResult {
  afaRate: number
  afaBetragJahr: number
  abschreibungBeweglichJahr: number
  absetzbarerZinsanteilJahr: number
  zuVersteuerndeEinkuenfteImmobilie: number
  steuerlicheAuswirkung: number
  soliBetrag: number
  kirchensteuerBetrag: number
  gesamtSteuerbelastungJahr: number
}

export interface KpiResult {
  bruttomietrendite: number
  nettomietrendite: number
  kaufpreisfaktor: number
  eigenkapitalrendite: number
  dscr: number
  monatlichCashflowVorSteuer: number
  monatlichCashflowNachSteuer: number
  jaehrlichCashflowVorSteuer: number
  jaehrlichCashflowNachSteuer: number
  cashOnCash: number
  vermoegenszuwachsMonatlich: number
  vermoegenszuwachsJaehrlich: number
  monatlicheKosten: number
  ersparteMieteJahr: number
  eigennutzungRendite: number
}

export interface YearlyProjection {
  year: number
  restschuld: number
  zinsenJahr: number
  tilgungJahr: number
  eigenkapitalImObjekt: number
  immobilienWert: number
  cashflowNachSteuer: number
  kumulierterCashflow: number
  steuerbelastungJahr: number
}

export interface InvestmentComparisonResult {
  immobilie: number[]
  etf: number[]
  custom: number[]
  years: number[]
  etfRendite: number
  customRendite: number
  customName: string
}

export interface CalculationResult {
  kaufnebenkosten: KaufnebenkostenResult
  financing: FinancingResult
  rental: RentalResult
  operatingCosts: OperatingCostResult
  tax: TaxResult
  kpis: KpiResult
  projection: YearlyProjection[]
  investmentComparison: InvestmentComparisonResult
}
