import { create } from 'zustand'
import type { Project, ScenarioAdjustment } from '@/calc/types'

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
  scenarioAdjustments: ScenarioAdjustment[]

  setOverride: <K extends keyof SimulationOverrides>(key: K, value: SimulationOverrides[K]) => void
  resetOverrides: () => void
  setActive: (active: boolean) => void
  getSimulatedProject: (project: Project) => Project

  addScenarioAdjustment: (adj: ScenarioAdjustment) => void
  removeScenarioAdjustment: (id: string) => void
  clearScenarioAdjustments: () => void
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  overrides: {},
  active: false,
  scenarioAdjustments: [],

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

  addScenarioAdjustment: (adj) => {
    set((state) => {
      // Deduplicate: replace existing scenario with same or very similar label
      const normalise = (s: string) => s.toLowerCase().replace(/[^a-zäöü0-9]/g, '')
      const adjNorm = normalise(adj.label)
      const filtered = state.scenarioAdjustments.filter((a) => {
        const aNorm = normalise(a.label)
        return aNorm !== adjNorm && !aNorm.includes(adjNorm) && !adjNorm.includes(aNorm)
      })
      return { scenarioAdjustments: [...filtered, adj] }
    })
  },

  removeScenarioAdjustment: (id) => {
    set((state) => ({
      scenarioAdjustments: state.scenarioAdjustments.filter((a) => a.id !== id),
    }))
  },

  clearScenarioAdjustments: () => set({ scenarioAdjustments: [] }),
}))
