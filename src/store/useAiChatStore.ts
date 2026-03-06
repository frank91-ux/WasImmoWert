import { create } from 'zustand'
import type { ScenarioAdjustment } from '@/calc/types'

export interface InlineCalculation {
  title: string
  entries: { label: string; value: string }[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  parameterChanges?: Record<string, number | string>
  inlineCalculation?: InlineCalculation
  scenarioAdjustments?: ScenarioAdjustment[]
  timestamp: number
}

interface AiChatState {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  apiKey: string | null

  addMessage: (msg: ChatMessage) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearMessages: () => void
  loadApiKey: () => void
  setApiKey: (key: string) => void
  removeApiKey: () => void
}

const API_KEY_STORAGE = 'wasimmowert-anthropic-key'
const ENV_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY ?? ''

export const useAiChatStore = create<AiChatState>((set) => ({
  messages: [],
  isLoading: false,
  error: null,
  apiKey: ENV_API_KEY || null,

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setLoading: (loading) => set(loading ? { isLoading: true, error: null } : { isLoading: false }),
  setError: (error) => set({ error }),
  clearMessages: () => set({ messages: [] }),

  loadApiKey: () => {
    if (ENV_API_KEY) return // already initialized with env key

    try {
      const key = localStorage.getItem(API_KEY_STORAGE)
      set({ apiKey: key })
    } catch {
      /* localStorage unavailable */
    }
  },

  setApiKey: (key) => {
    try {
      localStorage.setItem(API_KEY_STORAGE, key)
    } catch {
      /* ignore */
    }
    set({ apiKey: key })
  },

  removeApiKey: () => {
    if (ENV_API_KEY) return // can't remove env key

    try {
      localStorage.removeItem(API_KEY_STORAGE)
    } catch {
      /* ignore */
    }
    set({ apiKey: null })
  },
}))
