import { create } from 'zustand'
import { toast } from 'sonner'
import { LoginSchema } from '@/lib/schemas'
import { sanitizeEmail } from '@/lib/sanitize'
import {
  isSupabaseConfigured,
  supabase,
  signInWithEmail,
  signUpWithEmail,
  signInWithMagicLink,
  signInWithOAuth,
  signOut as supabaseSignOut,
} from '@/lib/supabase'

type AuthMode = 'authenticated' | 'skipped' | 'none'
type AuthProvider = 'local' | 'supabase'

interface Subscription {
  tier: 'free' | 'pro' | 'lifetime'
  status: string
}

interface AuthState {
  email: string | null
  displayName: string | null
  firstName: string | null
  subscription: Subscription | null
  authMode: AuthMode
  provider: AuthProvider
  loading: boolean

  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  loginWithMagicLink: (email: string) => Promise<void>
  loginWithOAuth: (provider: 'google' | 'github') => Promise<void>
  skip: () => void
  logout: () => Promise<void>
  setSubscription: (subscription: Subscription | null) => void
  isAuthenticated: () => boolean
  initAuthListener: () => () => void
}

const STORAGE_KEY = 'wasimmowert-auth'

function loadAuth(): {
  email: string | null
  authMode: AuthMode
  displayName: string | null
  firstName: string | null
  subscription: Subscription | null
} {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      const parsed = JSON.parse(data)
      return {
        email: parsed.email ?? null,
        authMode: parsed.authMode ?? 'none',
        displayName: parsed.displayName ?? null,
        firstName: parsed.firstName ?? null,
        subscription: parsed.subscription ?? null,
      }
    }
  } catch { /* ignore */ }
  return {
    email: null,
    authMode: 'none',
    displayName: null,
    firstName: null,
    subscription: null,
  }
}

function saveAuth(
  email: string | null,
  authMode: AuthMode,
  displayName: string | null = null,
  firstName: string | null = null,
  subscription: Subscription | null = null
) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ email, authMode, displayName, firstName, subscription })
    )
  } catch { /* ignore */ }
}

const initial = loadAuth()
const useSupabase = isSupabaseConfigured()

export const useAuthStore = create<AuthState>((set, get) => ({
  email: initial.email,
  displayName: initial.displayName,
  firstName: initial.firstName,
  subscription: initial.subscription,
  authMode: initial.authMode,
  provider: useSupabase ? 'supabase' : 'local',
  loading: false,

  login: async (email: string, password: string) => {
    // Validate with Zod
    const result = LoginSchema.safeParse({ email, password })
    if (!result.success) {
      const firstError = result.error.errors[0]?.message || 'Ungültige Eingabe'
      toast.error(firstError)
      return
    }

    const cleanEmail = sanitizeEmail(email)

    if (useSupabase) {
      set({ loading: true })
      try {
        const data = await signInWithEmail(cleanEmail, password)
        const userEmail = data.user?.email ?? cleanEmail
        const name = data.user?.user_metadata?.full_name ?? userEmail.split('@')[0]
        const firstName = data.user?.user_metadata?.first_name ?? null
        saveAuth(userEmail, 'authenticated', name, firstName)
        set({
          email: userEmail,
          displayName: name,
          firstName,
          authMode: 'authenticated',
          loading: false,
        })
        toast.success('Erfolgreich angemeldet')
      } catch (err: unknown) {
        set({ loading: false })
        const message = err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen'
        toast.error(message)
      }
    } else {
      // Local fallback
      const firstName = cleanEmail.split('@')[0]
      saveAuth(cleanEmail, 'authenticated', firstName, firstName)
      set({
        email: cleanEmail,
        displayName: firstName,
        firstName,
        authMode: 'authenticated',
      })
      toast.success('Angemeldet (lokal)')
    }
  },

  register: async (email: string, password: string) => {
    if (!useSupabase) {
      toast.error('Registrierung benötigt Supabase-Konfiguration')
      return
    }

    const result = LoginSchema.safeParse({ email, password })
    if (!result.success) {
      toast.error(result.error.errors[0]?.message || 'Ungültige Eingabe')
      return
    }

    set({ loading: true })
    try {
      const data = await signUpWithEmail(sanitizeEmail(email), password)
      set({ loading: false })
      if (data.user?.identities?.length === 0) {
        toast.error('Diese E-Mail ist bereits registriert')
      } else {
        toast.success('Registrierung erfolgreich! Bitte E-Mail bestätigen.')
      }
    } catch (err: unknown) {
      set({ loading: false })
      toast.error(err instanceof Error ? err.message : 'Registrierung fehlgeschlagen')
    }
  },

  loginWithMagicLink: async (email: string) => {
    if (!useSupabase) return
    set({ loading: true })
    try {
      await signInWithMagicLink(sanitizeEmail(email))
      set({ loading: false })
      toast.success('Magic Link gesendet! Prüfe deine E-Mail.')
    } catch (err: unknown) {
      set({ loading: false })
      toast.error(err instanceof Error ? err.message : 'Fehler beim Senden')
    }
  },

  loginWithOAuth: async (provider: 'google' | 'github') => {
    if (!useSupabase) return
    try {
      await signInWithOAuth(provider)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'OAuth-Fehler')
    }
  },

  skip: () => {
    saveAuth(null, 'skipped')
    set({ email: null, displayName: null, firstName: null, subscription: null, authMode: 'skipped' })
  },

  logout: async () => {
    if (useSupabase) {
      try {
        await supabaseSignOut()
      } catch { /* ignore */ }
    }
    saveAuth(null, 'none')
    set({
      email: null,
      displayName: null,
      firstName: null,
      subscription: null,
      authMode: 'none',
    })
    toast.success('Abgemeldet')
  },

  setSubscription: (subscription: Subscription | null) => {
    const state = get()
    saveAuth(state.email, state.authMode, state.displayName, state.firstName, subscription)
    set({ subscription })
  },

  isAuthenticated: () => get().authMode !== 'none',

  /**
   * Initialize Supabase auth state listener.
   * Returns cleanup function.
   */
  initAuthListener: () => {
    if (!useSupabase || !supabase) return () => {}

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const email = session.user.email ?? ''
          const name = session.user.user_metadata?.full_name ?? email.split('@')[0]
          const firstName = session.user.user_metadata?.first_name ?? null
          saveAuth(email, 'authenticated', name, firstName)
          set({ email, displayName: name, firstName, authMode: 'authenticated' })
        } else if (event === 'SIGNED_OUT') {
          saveAuth(null, 'none')
          set({
            email: null,
            displayName: null,
            firstName: null,
            subscription: null,
            authMode: 'none',
          })
        }
      }
    )

    return () => subscription.unsubscribe()
  },
}))
