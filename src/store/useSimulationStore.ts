import { create } from 'zustand'
import type { Project } from '@/calc/types'

type SimulationOverrides = Partial<Pick<Project,
  'kaufpreis' | 'monatsmieteKalt' | 'zinssatz' | 'tilgung' |
  'eigenkapital' | 'persoenlicherSteuersatz' | 'instandhaltungProQm' |
  'verwaltungProEinheit' | 'mietausfallwagnis' | 'maklerProvision' |
  'notarUndGrundbuch' | 'grundstueckAnteil' | 'sondertilgung' |
  'nichtUmlegbareNebenkosten' | 'zuVersteuerndesEinkommen' |
  'beweglicheGegenstaende' | 'etfRendite' | 'customRendite' | 'wertsteigerung' |
  'zinsbindungPeriods' | 'customAfaRate' | 'nebenkostenProQm' | 'umlagefaehigAnteil' |
  'nutzungsart' | 'ersparteMiete'
>>

interface SimulationState {
  overrides: SimulationOverrides
  active: boolean
  setOverride: <K extends keyof SimulationOverrides>(key: K, value: SimulationOverrides[K]) => void
  resetOverrides: () => void
  setActive: (active: boolean) => void
  getSimulatedProject: (project: Project) => Project
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  overrides: {},
  active: false,

  setOverride: (key, value) => {
    set((state) => ({
      overrides: { ...state.overrides, [key]: value },
    }))
  },

  resetOverrides: () => set({ overrides: {} }),

  setActive: (active) => set({ active, overrides: active ? get().overrides : {} }),

  getSimulatedProject: (project) => {
    const { overrides } = get()
    return { ...project, ...overrides }
  },
}))
