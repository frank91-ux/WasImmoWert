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
  resetPassword as supabaseResetPassword,
  updatePassword as supabaseUpdatePassword,
  fetchSubscription,
  updateSubscription,
  fetchProfile,
  deleteAccount as supabaseDeleteAccount,
} from '@/lib/supabase'

type AuthMode = 'authenticated' | 'skipped' | 'none'
type AuthProvider = 'local' | 'supabase'

export interface Subscription {
  tier: 'free' | 'pro' | 'lifetime'
  status: string
  currentPeriodEnd?: string | null
}

interface AuthState {
  email: string | null
  displayName: string | null
  firstName: string | null
  subscription: Subscription | null
  authMode: AuthMode
  provider: AuthProvider
  loading: boolean
  userId: string | null

  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, firstName?: string) => Promise<void>
  loginWithMagicLink: (email: string) => Promise<void>
  loginWithOAuth: (provider: 'google' | 'github') => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  skip: () => void
  logout: () => Promise<void>
  deleteAccount: () => Promise<void>
  setSubscription: (subscription: Subscription | null) => void
  activatePlan: (tier: 'free' | 'pro' | 'lifetime') => Promise<void>
  isAuthenticated: () => boolean
  initAuthListener: () => () => void
  loadSubscriptionFromDb: () => Promise<void>
}

const STORAGE_KEY = 'wasimmowert-auth'

function loadAuth(): {
  email: string | null
  authMode: AuthMode
  displayName: string | null
  firstName: string | null
  subscription: Subscription | null
  userId: string | null
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
        userId: parsed.userId ?? null,
      }
    }
  } catch { /* ignore */ }
  return {
    email: null,
    authMode: 'none',
    displayName: null,
    firstName: null,
    subscription: null,
    userId: null,
  }
}

function saveAuth(
  email: string | null,
  authMode: AuthMode,
  displayName: string | null = null,
  firstName: string | null = null,
  subscription: Subscription | null = null,
  userId: string | null = null
) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ email, authMode, displayName, firstName, subscription, userId })
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
  userId: initial.userId,

  login: async (email: string, password: string) => {
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
        const userId = data.user?.id ?? null
        saveAuth(userEmail, 'authenticated', name, firstName, get().subscription, userId)
        set({
          email: userEmail,
          displayName: name,
          firstName,
          authMode: 'authenticated',
          loading: false,
          userId,
        })
        toast.success('Erfolgreich angemeldet')
        // Load subscription from DB in background
        get().loadSubscriptionFromDb()
      } catch (err: unknown) {
        set({ loading: false })
        const message = err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen'
        if (message.includes('Invalid login credentials')) {
          toast.error('Ungültige E-Mail oder Passwort')
        } else if (message.includes('Email not confirmed')) {
          toast.error('Bitte bestätige zuerst deine E-Mail-Adresse')
        } else {
          toast.error(message)
        }
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

  register: async (email: string, password: string, firstName?: string) => {
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
      const cleanEmail = sanitizeEmail(email)
      const fullName = firstName ? firstName : cleanEmail.split('@')[0]
      const data = await signUpWithEmail(cleanEmail, password, {
        first_name: firstName || '',
        full_name: fullName,
      })
      set({ loading: false })
      if (data.user?.identities?.length === 0) {
        toast.error('Diese E-Mail ist bereits registriert')
      } else {
        toast.success('Registrierung erfolgreich! Bitte bestätige deine E-Mail.', {
          description: 'Wir haben dir einen Bestätigungs-Link gesendet.',
          duration: 6000,
        })
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
      toast.success('Magic Link gesendet!', {
        description: 'Prüfe deine E-Mail und klicke den Link zum Anmelden.',
        duration: 6000,
      })
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

  resetPassword: async (email: string) => {
    if (!useSupabase) {
      toast.error('Passwort-Reset benötigt Supabase-Konfiguration')
      return
    }
    set({ loading: true })
    try {
      await supabaseResetPassword(sanitizeEmail(email))
      set({ loading: false })
      toast.success('Passwort-Reset E-Mail gesendet!', {
        description: 'Prüfe deine E-Mail und folge dem Link zum Zurücksetzen.',
        duration: 6000,
      })
    } catch (err: unknown) {
      set({ loading: false })
      toast.error(err instanceof Error ? err.message : 'Fehler beim Senden')
    }
  },

  updatePassword: async (newPassword: string) => {
    if (!useSupabase) return
    set({ loading: true })
    try {
      await supabaseUpdatePassword(newPassword)
      set({ loading: false })
      toast.success('Passwort erfolgreich geändert!')
    } catch (err: unknown) {
      set({ loading: false })
      toast.error(err instanceof Error ? err.message : 'Fehler beim Ändern des Passworts')
    }
  },

  skip: () => {
    saveAuth(null, 'skipped')
    set({ email: null, displayName: null, firstName: null, subscription: null, authMode: 'skipped', userId: null })
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
      userId: null,
    })
    toast.success('Abgemeldet')
  },

  deleteAccount: async () => {
    if (useSupabase) {
      try {
        await supabaseDeleteAccount()
      } catch { /* ignore */ }
    }
    saveAuth(null, 'none')
    set({
      email: null,
      displayName: null,
      firstName: null,
      subscription: null,
      authMode: 'none',
      userId: null,
    })
  },

  setSubscription: (subscription: Subscription | null) => {
    const state = get()
    saveAuth(state.email, state.authMode, state.displayName, state.firstName, subscription, state.userId)
    set({ subscription })
  },

  activatePlan: async (tier: 'free' | 'pro' | 'lifetime') => {
    const state = get()
    const sub: Subscription = { tier, status: 'active' }

    // Update locally first for instant UI
    state.setSubscription(sub)

    // Sync to Supabase if configured
    if (useSupabase && state.userId) {
      try {
        const result = await updateSubscription(state.userId, { tier, status: 'active' })
        if (result?.current_period_end) {
          const updatedSub: Subscription = {
            tier,
            status: 'active',
            currentPeriodEnd: result.current_period_end,
          }
          state.setSubscription(updatedSub)
        }
      } catch {
        // Local update already done, cloud will sync later
      }
    }
  },

  isAuthenticated: () => get().authMode !== 'none',

  loadSubscriptionFromDb: async () => {
    if (!useSupabase) return
    const state = get()
    if (!state.userId) return

    try {
      const sub = await fetchSubscription(state.userId)
      if (sub) {
        const subscription: Subscription = {
          tier: sub.tier,
          status: sub.status,
          currentPeriodEnd: sub.current_period_end,
        }
        saveAuth(state.email, state.authMode, state.displayName, state.firstName, subscription, state.userId)
        set({ subscription })
      }
    } catch {
      // Subscription fetch failed, keep local data
    }
  },

  /**
   * Initialize Supabase auth state listener.
   * Returns cleanup function.
   */
  initAuthListener: () => {
    if (!useSupabase || !supabase) return () => {}

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          const email = session.user.email ?? ''
          const name = session.user.user_metadata?.full_name ?? email.split('@')[0]
          const firstName = session.user.user_metadata?.first_name ?? null
          const userId = session.user.id
          const currentSub = get().subscription
          saveAuth(email, 'authenticated', name, firstName, currentSub, userId)
          set({ email, displayName: name, firstName, authMode: 'authenticated', userId })

          // Load subscription + profile from DB
          try {
            const [sub, profile] = await Promise.all([
              fetchSubscription(userId),
              fetchProfile(userId),
            ])
            if (sub) {
              const dbSub: Subscription = {
                tier: sub.tier,
                status: sub.status,
                currentPeriodEnd: sub.current_period_end,
              }
              saveAuth(email, 'authenticated', profile?.display_name ?? name, profile?.first_name ?? firstName, dbSub, userId)
              set({
                subscription: dbSub,
                displayName: profile?.display_name ?? name,
                firstName: profile?.first_name ?? firstName,
              })
            }
          } catch {
            // DB fetch failed, keep local data
          }
        } else if (event === 'SIGNED_OUT') {
          saveAuth(null, 'none')
          set({
            email: null,
            displayName: null,
            firstName: null,
            subscription: null,
            authMode: 'none',
            userId: null,
          })
        }
      }
    )

    return () => subscription.unsubscribe()
  },
}))
