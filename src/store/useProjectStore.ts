import { create } from 'zustand'
import { toast } from 'sonner'
import type { Project } from '@/calc/types'
import { createDefaultProject, DEFAULT_VALUES } from '@/calc/defaults'
import { useUiStore } from './useUiStore'
import { sanitizeText } from '@/lib/sanitize'
import {
  isSupabaseConfigured,
  fetchProjects as fetchProjectsFromDb,
  upsertProject as upsertProjectToDb,
  deleteProjectFromDb,
  getCurrentUser,
} from '@/lib/supabase'

const STORAGE_KEY = 'wasimmowert-projects'
const SETTINGS_KEY = 'wasimmowert-settings'

interface ProjectState {
  projects: Project[]
  activeProjectId: string | null
  loaded: boolean
  syncing: boolean

  loadProjects: () => Promise<void>
  addProject: (overrides?: Partial<Project>) => Project
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  duplicateProject: (id: string) => Project | null
  reorderProjects: (orderedIds: string[]) => void
  setActiveProject: (id: string | null) => void
  getProject: (id: string) => Project | undefined
  togglePortfolio: (id: string) => void
  getPortfolioProjects: () => Project[]
  syncToCloud: () => Promise<void>
}

function saveToStorage(projects: Project[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
  } catch {
    // Storage full or unavailable
  }
}

function migrateProject(p: Record<string, unknown>): Project {
  return {
    ...createDefaultProject(),
    ...(p as Partial<Project>),
    etfRendite: (p.etfRendite as number) ?? DEFAULT_VALUES.etfRendite,
    customRendite: (p.customRendite as number) ?? DEFAULT_VALUES.customRendite,
    customInvestmentName: (p.customInvestmentName as string) ?? 'Anderes Investment',
    wertsteigerung: (p.wertsteigerung as number) ?? DEFAULT_VALUES.wertsteigerung,
    customAfaRate: (p.customAfaRate as number | null) ?? null,
    zinsbindungPeriods: (p.zinsbindungPeriods as Project['zinsbindungPeriods']) ?? [],
    nebenkostenProQm: (p.nebenkostenProQm as number) ?? 0,
    umlagefaehigAnteil: (p.umlagefaehigAnteil as number) ?? 70,
    nutzungsart: (p.nutzungsart as Project['nutzungsart']) ?? 'vermietung',
    ersparteMiete: (p.ersparteMiete as number) ?? 0,
    hausgeldModus: (p.hausgeldModus as Project['hausgeldModus']) ?? 'einzelposten',
    hausgeldProMonat: (p.hausgeldProMonat as number) ?? DEFAULT_VALUES.hausgeldProMonat,
    hausgeldInstandhaltungAnteil: (p.hausgeldInstandhaltungAnteil as number) ?? DEFAULT_VALUES.hausgeldInstandhaltungAnteil,
    hausgeldVerwaltungAnteil: (p.hausgeldVerwaltungAnteil as number) ?? DEFAULT_VALUES.hausgeldVerwaltungAnteil,
    modernisierungen: (p.modernisierungen as Project['modernisierungen']) ?? [],
    lat: (p.lat as number | null) ?? null,
    lng: (p.lng as number | null) ?? null,
    nettoJahresgehalt: (p.nettoJahresgehalt as number) ?? 0,
    monatlicheAusgaben: (p.monatlicheAusgaben as number) ?? 0,
    isInPortfolio: (p.isInPortfolio as boolean) ?? false,
  }
}

function loadFromStorage(): Project[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    const projects = JSON.parse(data)
    return projects.map(migrateProject)
  } catch {
    return []
  }
}

function saveSettings(activeId: string | null) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ activeProjectId: activeId }))
  } catch { /* ignore */ }
}

function loadSettings(): { activeProjectId: string | null } {
  try {
    const data = localStorage.getItem(SETTINGS_KEY)
    return data ? JSON.parse(data) : { activeProjectId: null }
  } catch {
    return { activeProjectId: null }
  }
}

const useSupabase = isSupabaseConfigured()

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  activeProjectId: null,
  loaded: false,
  syncing: false,

  loadProjects: async () => {
    // Always load from localStorage first (fast)
    const localProjects = loadFromStorage()
    const settings = loadSettings()
    set({ projects: localProjects, activeProjectId: settings.activeProjectId, loaded: true })

    // If Supabase is configured, sync from cloud
    if (useSupabase) {
      try {
        const user = await getCurrentUser()
        if (user) {
          const cloudProjects = await fetchProjectsFromDb(user.id)
          if (cloudProjects.length > 0) {
            const migrated = cloudProjects.map((cp) =>
              migrateProject({ ...(cp.data as Record<string, unknown>), id: cp.id, name: cp.name })
            )
            // Merge: cloud projects take priority, add local-only projects
            const cloudIds = new Set(migrated.map((p) => p.id))
            const mergedProjects = [
              ...migrated,
              ...localProjects.filter((lp) => !cloudIds.has(lp.id)),
            ]
            saveToStorage(mergedProjects)
            set({ projects: mergedProjects })
          }
        }
      } catch {
        // Cloud sync failed silently, local data still available
      }
    }
  },

  addProject: (overrides) => {
    const { defaultBundesland } = useUiStore.getState()

    // Sanitize user inputs
    const sanitized = {
      bundesland: defaultBundesland,
      ...overrides,
      ...(overrides?.name ? { name: sanitizeText(overrides.name) } : {}),
      ...(overrides?.address ? { address: sanitizeText(overrides.address) } : {}),
    }

    const project = createDefaultProject(sanitized)
    const projects = [...get().projects, project]
    saveToStorage(projects)
    set({ projects, activeProjectId: project.id })
    saveSettings(project.id)

    toast.success('Projekt erstellt', {
      description: project.name,
    })

    // Async cloud sync
    if (useSupabase) {
      getCurrentUser().then((user) => {
        if (user) {
          upsertProjectToDb(user.id, {
            id: project.id,
            name: project.name,
            data: project as unknown as Record<string, unknown>,
          }).catch(() => {})
        }
      })
    }

    return project
  },

  updateProject: (id, updates) => {
    // Sanitize text inputs
    const sanitized = { ...updates }
    if (sanitized.name) sanitized.name = sanitizeText(sanitized.name)
    if (sanitized.address) sanitized.address = sanitizeText(sanitized.address)

    const projects = get().projects.map((p) =>
      p.id === id ? { ...p, ...sanitized, updatedAt: new Date().toISOString() } : p
    )
    saveToStorage(projects)
    set({ projects })

    // Async cloud sync (debounced by caller)
    if (useSupabase) {
      const updatedProject = projects.find((p) => p.id === id)
      if (updatedProject) {
        getCurrentUser().then((user) => {
          if (user) {
            upsertProjectToDb(user.id, {
              id: updatedProject.id,
              name: updatedProject.name,
              data: updatedProject as unknown as Record<string, unknown>,
            }).catch(() => {})
          }
        })
      }
    }
  },

  deleteProject: (id) => {
    const project = get().projects.find((p) => p.id === id)
    const projects = get().projects.filter((p) => p.id !== id)
    const activeProjectId = get().activeProjectId === id
      ? (projects[0]?.id ?? null)
      : get().activeProjectId
    saveToStorage(projects)
    saveSettings(activeProjectId)
    set({ projects, activeProjectId })

    toast.success('Projekt gelöscht', {
      description: project?.name,
    })

    // Cloud delete
    if (useSupabase) {
      deleteProjectFromDb(id).catch(() => {})
    }
  },

  duplicateProject: (id) => {
    const original = get().projects.find((p) => p.id === id)
    if (!original) return null
    const duplicate = createDefaultProject({
      ...original,
      name: `${original.name} (Kopie)`,
    })
    const projects = [...get().projects, duplicate]
    saveToStorage(projects)
    set({ projects, activeProjectId: duplicate.id })
    saveSettings(duplicate.id)

    toast.success('Projekt dupliziert', {
      description: duplicate.name,
    })

    // Cloud sync
    if (useSupabase) {
      getCurrentUser().then((user) => {
        if (user) {
          upsertProjectToDb(user.id, {
            id: duplicate.id,
            name: duplicate.name,
            data: duplicate as unknown as Record<string, unknown>,
          }).catch(() => {})
        }
      })
    }

    return duplicate
  },

  reorderProjects: (orderedIds) => {
    const projectMap = new Map(get().projects.map((p) => [p.id, p]))
    const projects = orderedIds
      .map((id) => projectMap.get(id))
      .filter((p): p is Project => p !== undefined)
    saveToStorage(projects)
    set({ projects })
  },

  setActiveProject: (id) => {
    saveSettings(id)
    set({ activeProjectId: id })
  },

  getProject: (id) => {
    return get().projects.find((p) => p.id === id)
  },

  togglePortfolio: (id) => {
    const project = get().projects.find((p) => p.id === id)
    if (!project) return
    const updated = !project.isInPortfolio
    get().updateProject(id, { isInPortfolio: updated })
    toast.success(updated ? 'Zum Portfolio hinzugefügt' : 'Aus Portfolio entfernt', {
      description: project.name,
    })
  },

  getPortfolioProjects: () => {
    return get().projects.filter((p) => p.isInPortfolio)
  },

  syncToCloud: async () => {
    if (!useSupabase) return
    const user = await getCurrentUser()
    if (!user) return

    set({ syncing: true })
    try {
      const projects = get().projects
      for (const project of projects) {
        await upsertProjectToDb(user.id, {
          id: project.id,
          name: project.name,
          data: project as unknown as Record<string, unknown>,
        })
      }
      toast.success(`${projects.length} Projekte synchronisiert`)
    } catch {
      toast.error('Cloud-Sync fehlgeschlagen')
    } finally {
      set({ syncing: false })
    }
  },
}))
