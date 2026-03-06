import { create } from 'zustand'

/* ─── Types for parsed ETV Protokoll ─── */

export interface EtvBeschluss {
  topNummer: string               // e.g. "TOP 1", "1."
  titel: string                   // Title of the agenda item
  antrag: string                  // Motion text
  jaStimmen: number | null
  neinStimmen: number | null
  enthaltungen: number | null
  ergebnis: string                // "einstimmig angenommen", "abgelehnt", etc.
  kategorie: 'verwaltung' | 'finanzen' | 'instandhaltung' | 'sonstiges'
  kostenRelevant: boolean
  betrag: number | null           // EUR if cost-relevant
}

export interface EtvKosten {
  bezeichnung: string
  gesamtkosten: number
  anteilEigentümer: number | null
  verteilschluessel: string       // "1000stel MEA", "Anz.Wohnungen", etc.
}

export interface EtvWirtschaftsplan {
  jahr: number
  ausgabenGesamt: number
  ruecklageGesamt: number
  hausgeldMonatlich: number | null
  kostenPositionen: EtvKosten[]
}

export interface EtvProtokoll {
  id: string
  dateiName: string
  datum: string                   // Date of the meeting
  objekt: string                  // Property address/name
  verwaltung: string              // Management company
  anwesenheit: string             // Attendance info
  beschluesse: EtvBeschluss[]
  wirtschaftsplan: EtvWirtschaftsplan | null
  zusammenfassung: string         // AI-generated summary
  warnungen: string[]             // Warnings/concerns for investor
  uploadedAt: number
}

/* ─── Store ─── */

interface EtvState {
  protokolle: Record<string, EtvProtokoll[]>  // keyed by projectId
  isAnalysing: boolean
  error: string | null

  addProtokoll: (projectId: string, p: EtvProtokoll) => void
  removeProtokoll: (projectId: string, protokollId: string) => void
  setAnalysing: (v: boolean) => void
  setError: (e: string | null) => void
}

export const useEtvStore = create<EtvState>((set) => ({
  protokolle: {},
  isAnalysing: false,
  error: null,

  addProtokoll: (projectId, p) =>
    set((s) => ({
      protokolle: {
        ...s.protokolle,
        [projectId]: [...(s.protokolle[projectId] ?? []), p],
      },
    })),

  removeProtokoll: (projectId, protokollId) =>
    set((s) => ({
      protokolle: {
        ...s.protokolle,
        [projectId]: (s.protokolle[projectId] ?? []).filter((p) => p.id !== protokollId),
      },
    })),

  setAnalysing: (v) => set(v ? { isAnalysing: true, error: null } : { isAnalysing: false }),
  setError: (e) => set({ error: e, isAnalysing: false }),
}))
