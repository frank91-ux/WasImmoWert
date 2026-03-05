import { create } from 'zustand'
import type { Bundesland } from '@/calc/types'
import { DEFAULT_VALUES } from '@/calc/defaults'

type Mode = 'beginner' | 'pro'
type Theme = 'light' | 'dark' | 'system'

export interface ProjectDefaults {
  zinssatz: number
  tilgung: number
  eigenkapital: number
  maklerProvision: number
  notarUndGrundbuch: number
  instandhaltungProQm: number
  verwaltungProEinheit: number
  mietausfallwagnis: number
  steuersatz: number
}

const INITIAL_PROJECT_DEFAULTS: ProjectDefaults = {
  zinssatz: DEFAULT_VALUES.zinssatz,
  tilgung: DEFAULT_VALUES.tilgung,
  eigenkapital: 50000,
  maklerProvision: DEFAULT_VALUES.maklerProvision,
  notarUndGrundbuch: DEFAULT_VALUES.notarUndGrundbuch,
  instandhaltungProQm: DEFAULT_VALUES.instandhaltungProQm,
  verwaltungProEinheit: DEFAULT_VALUES.verwaltungProEinheit,
  mietausfallwagnis: DEFAULT_VALUES.mietausfallwagnis,
  steuersatz: DEFAULT_VALUES.persoenlicherSteuersatz,
}

export const DEFAULT_CHART_ORDER = [
  'kpiOverview',
  'leistbarkeitsCheck',
  'pieCharts',
  'cashflowTable',
  'kaufnebenkostenBreakdown',
  'taxBreakdown',
  'tilgungsplanChart',
  'cashflowEquityCharts',
  'investmentComparison',
]

export const DEFAULT_KPI_ORDER = [
  'cashflow',
  'bruttomietrendite',
  'kaufpreisfaktor',
  'eigenkapitalrendite',
  'dscr',
  'nettomietrendite',
  'cashOnCash',
  'jaehrlichCashflowNachSteuer',
  'monatlicheKosten',
  'ersparteMiete',
  'eigennutzungRendite',
  'vermoegenszuwachs',
]

type DashboardView = 'grid' | 'list'

interface UiState {
  mode: Mode
  theme: Theme
  sidebarOpen: boolean
  hiddenKpis: string[]
  defaultBundesland: Bundesland
  defaultProjectionYears: number
  primaryKpi: string
  projectDefaults: ProjectDefaults
  chartOrder: string[]
  kpiCardOrder: string[]
  dashboardView: DashboardView
  setMode: (mode: Mode) => void
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleKpiVisibility: (kpiKey: string) => void
  setDefaultBundesland: (bl: Bundesland) => void
  setDefaultProjectionYears: (y: number) => void
  setPrimaryKpi: (kpi: string) => void
  setProjectDefault: <K extends keyof ProjectDefaults>(key: K, value: ProjectDefaults[K]) => void
  setChartOrder: (order: string[]) => void
  setKpiCardOrder: (order: string[]) => void
  setDashboardView: (view: DashboardView) => void
}

const STORAGE_KEY = 'wasimmowert-ui'

interface StoredSettings {
  mode: Mode
  theme: Theme
  hiddenKpis: string[]
  defaultBundesland: Bundesland
  defaultProjectionYears: number
  primaryKpi: string
  projectDefaults?: ProjectDefaults
  chartOrder?: string[]
  kpiCardOrder?: string[]
  dashboardView?: DashboardView
}

function loadUiSettings(): StoredSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      const parsed = JSON.parse(data)
      return {
        mode: parsed.mode || 'beginner',
        theme: parsed.theme || 'system',
        hiddenKpis: parsed.hiddenKpis || [],
        defaultBundesland: parsed.defaultBundesland || 'berlin',
        defaultProjectionYears: parsed.defaultProjectionYears || 30,
        primaryKpi: parsed.primaryKpi || 'cashflow',
        projectDefaults: parsed.projectDefaults ?? undefined,
        chartOrder: parsed.chartOrder ?? undefined,
        kpiCardOrder: parsed.kpiCardOrder ?? undefined,
        dashboardView: parsed.dashboardView ?? undefined,
      }
    }
    return { mode: 'beginner', theme: 'system', hiddenKpis: [], defaultBundesland: 'berlin', defaultProjectionYears: 30, primaryKpi: 'cashflow' }
  } catch {
    return { mode: 'beginner', theme: 'system', hiddenKpis: [], defaultBundesland: 'berlin', defaultProjectionYears: 30, primaryKpi: 'cashflow' }
  }
}

function saveUiSettings(settings: Partial<StoredSettings>) {
  try {
    const current = loadUiSettings()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...settings }))
  } catch {
    // ignore
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

const initial = loadUiSettings()
applyTheme(initial.theme)

export const useUiStore = create<UiState>((set, get) => ({
  mode: initial.mode,
  theme: initial.theme,
  sidebarOpen: true,
  hiddenKpis: initial.hiddenKpis,
  defaultBundesland: initial.defaultBundesland,
  defaultProjectionYears: initial.defaultProjectionYears,
  primaryKpi: initial.primaryKpi,
  projectDefaults: initial.projectDefaults
    ? { ...INITIAL_PROJECT_DEFAULTS, ...initial.projectDefaults }
    : { ...INITIAL_PROJECT_DEFAULTS },
  chartOrder: initial.chartOrder ?? [...DEFAULT_CHART_ORDER],
  kpiCardOrder: initial.kpiCardOrder ?? [...DEFAULT_KPI_ORDER],
  dashboardView: initial.dashboardView ?? 'grid',

  setMode: (mode) => {
    saveUiSettings({ mode })
    set({ mode })
  },

  setTheme: (theme) => {
    applyTheme(theme)
    saveUiSettings({ theme })
    set({ theme })
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleKpiVisibility: (kpiKey) => {
    const current = get().hiddenKpis
    const updated = current.includes(kpiKey)
      ? current.filter((k) => k !== kpiKey)
      : [...current, kpiKey]
    saveUiSettings({ hiddenKpis: updated })
    set({ hiddenKpis: updated })
  },

  setDefaultBundesland: (bl) => {
    saveUiSettings({ defaultBundesland: bl })
    set({ defaultBundesland: bl })
  },

  setDefaultProjectionYears: (y) => {
    saveUiSettings({ defaultProjectionYears: y })
    set({ defaultProjectionYears: y })
  },

  setPrimaryKpi: (kpi) => {
    saveUiSettings({ primaryKpi: kpi })
    set({ primaryKpi: kpi })
  },

  setProjectDefault: (key, value) => {
    const updated = { ...get().projectDefaults, [key]: value }
    saveUiSettings({ projectDefaults: updated })
    set({ projectDefaults: updated })
  },

  setChartOrder: (order) => {
    saveUiSettings({ chartOrder: order })
    set({ chartOrder: order })
  },

  setKpiCardOrder: (order) => {
    saveUiSettings({ kpiCardOrder: order })
    set({ kpiCardOrder: order })
  },

  setDashboardView: (view) => {
    saveUiSettings({ dashboardView: view })
    set({ dashboardView: view })
  },
}))
