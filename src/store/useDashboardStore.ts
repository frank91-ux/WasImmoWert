import { create } from 'zustand'
import { DEFAULT_SECTION_WIDGETS } from '@/lib/widget-registry'

const STORAGE_KEY = 'wasimmowert-dashboard'

interface DashboardState {
  /** Enabled widget IDs per section */
  sectionWidgets: Record<string, string[]>

  /** Whether the right widget drawer is open */
  widgetDrawerOpen: boolean

  getWidgetsForSection: (sectionId: string) => string[]
  toggleWidget: (sectionId: string, widgetId: string) => void
  reorderWidgets: (sectionId: string, orderedIds: string[]) => void
  resetSection: (sectionId: string) => void
  resetToDefaults: () => void
  toggleWidgetDrawer: () => void
  setWidgetDrawerOpen: (open: boolean) => void
}

interface StorageData {
  sectionWidgets?: Record<string, string[]>
  widgetDrawerOpen?: boolean
  // Legacy format
  overviewWidgets?: string[]
}

function loadFromStorage(): { sectionWidgets: Record<string, string[]>; widgetDrawerOpen: boolean } {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) {
      return { sectionWidgets: { ...DEFAULT_SECTION_WIDGETS }, widgetDrawerOpen: true }
    }
    const parsed: StorageData = JSON.parse(data)

    // Migrate from old format: { overviewWidgets: [...] }
    if (parsed.overviewWidgets && !parsed.sectionWidgets) {
      const migrated = {
        ...DEFAULT_SECTION_WIDGETS,
        uebersicht: parsed.overviewWidgets,
      }
      return { sectionWidgets: migrated, widgetDrawerOpen: true }
    }

    if (parsed.sectionWidgets) {
      return {
        sectionWidgets: parsed.sectionWidgets,
        widgetDrawerOpen: parsed.widgetDrawerOpen ?? true,
      }
    }

    return { sectionWidgets: { ...DEFAULT_SECTION_WIDGETS }, widgetDrawerOpen: true }
  } catch {
    return { sectionWidgets: { ...DEFAULT_SECTION_WIDGETS }, widgetDrawerOpen: true }
  }
}

function saveToStorage(sectionWidgets: Record<string, string[]>, widgetDrawerOpen: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sectionWidgets, widgetDrawerOpen }))
  } catch {
    // Storage full or unavailable
  }
}

const initial = loadFromStorage()

export const useDashboardStore = create<DashboardState>((set, get) => ({
  sectionWidgets: initial.sectionWidgets,
  widgetDrawerOpen: initial.widgetDrawerOpen,

  getWidgetsForSection: (sectionId) => {
    return get().sectionWidgets[sectionId] ?? DEFAULT_SECTION_WIDGETS[sectionId] ?? []
  },

  toggleWidget: (sectionId, widgetId) => {
    const current = get().getWidgetsForSection(sectionId)
    const isEnabled = current.includes(widgetId)

    // Prevent removing mandatory widgets
    if (isEnabled && widgetId === 'kpiOverview') return

    const updated = isEnabled
      ? current.filter((id) => id !== widgetId)
      : [...current, widgetId]

    const newSectionWidgets = { ...get().sectionWidgets, [sectionId]: updated }
    saveToStorage(newSectionWidgets, get().widgetDrawerOpen)
    set({ sectionWidgets: newSectionWidgets })
  },

  reorderWidgets: (sectionId, orderedIds) => {
    const newSectionWidgets = { ...get().sectionWidgets, [sectionId]: orderedIds }
    saveToStorage(newSectionWidgets, get().widgetDrawerOpen)
    set({ sectionWidgets: newSectionWidgets })
  },

  resetSection: (sectionId) => {
    const defaults = DEFAULT_SECTION_WIDGETS[sectionId] ?? []
    const newSectionWidgets = { ...get().sectionWidgets, [sectionId]: defaults }
    saveToStorage(newSectionWidgets, get().widgetDrawerOpen)
    set({ sectionWidgets: newSectionWidgets })
  },

  resetToDefaults: () => {
    const defaults = { ...DEFAULT_SECTION_WIDGETS }
    saveToStorage(defaults, get().widgetDrawerOpen)
    set({ sectionWidgets: defaults })
  },

  toggleWidgetDrawer: () => {
    const newOpen = !get().widgetDrawerOpen
    saveToStorage(get().sectionWidgets, newOpen)
    set({ widgetDrawerOpen: newOpen })
  },

  setWidgetDrawerOpen: (open) => {
    saveToStorage(get().sectionWidgets, open)
    set({ widgetDrawerOpen: open })
  },
}))
