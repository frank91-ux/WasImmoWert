import { create } from 'zustand'
import { DEFAULT_OVERVIEW_WIDGETS } from '@/lib/widget-registry'

const STORAGE_KEY = 'wasimmowert-dashboard'

interface DashboardState {
  /** Widget IDs for the Übersicht section */
  overviewWidgets: string[]

  addWidget: (widgetId: string) => void
  removeWidget: (widgetId: string) => void
  reorderWidgets: (orderedIds: string[]) => void
  resetToDefaults: () => void
}

function loadFromStorage(): string[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return DEFAULT_OVERVIEW_WIDGETS
    const parsed = JSON.parse(data)
    if (Array.isArray(parsed.overviewWidgets)) return parsed.overviewWidgets
    return DEFAULT_OVERVIEW_WIDGETS
  } catch {
    return DEFAULT_OVERVIEW_WIDGETS
  }
}

function saveToStorage(overviewWidgets: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ overviewWidgets }))
  } catch {
    // Storage full or unavailable
  }
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  overviewWidgets: loadFromStorage(),

  addWidget: (widgetId) => {
    const current = get().overviewWidgets
    if (current.includes(widgetId)) return
    const updated = [...current, widgetId]
    saveToStorage(updated)
    set({ overviewWidgets: updated })
  },

  removeWidget: (widgetId) => {
    // Prevent removing KPI overview
    if (widgetId === 'kpiOverview') return
    const updated = get().overviewWidgets.filter((id) => id !== widgetId)
    saveToStorage(updated)
    set({ overviewWidgets: updated })
  },

  reorderWidgets: (orderedIds) => {
    saveToStorage(orderedIds)
    set({ overviewWidgets: orderedIds })
  },

  resetToDefaults: () => {
    saveToStorage(DEFAULT_OVERVIEW_WIDGETS)
    set({ overviewWidgets: DEFAULT_OVERVIEW_WIDGETS })
  },
}))
