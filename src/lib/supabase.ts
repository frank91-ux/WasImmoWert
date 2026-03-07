/**
 * Supabase client configuration
 * Provides auth, database, and realtime sync capabilities
 */
import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase-types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Check if Supabase is configured.
 * Returns false if env vars are missing (app falls back to localStorage).
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

/**
 * Supabase client singleton.
 * Only created if environment variables are set.
 */
export const supabase = isSupabaseConfigured()
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

/* ─── Auth Helpers ─── */

export async function signUpWithEmail(email: string, password: string, metadata?: { first_name?: string; full_name?: string }) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}auth/callback`,
    },
  })
  if (error) throw error
  return data
}

export async function signInWithEmail(email: string, password: string) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

export async function signInWithMagicLink(email: string) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}auth/callback`,
    },
  })
  if (error) throw error
  return data
}

export async function signInWithOAuth(provider: 'google' | 'github') {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}auth/callback`,
    },
  })
  if (error) throw error
  return data
}

export async function resetPassword(email: string) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}auth/callback?type=recovery`,
  })
  if (error) throw error
  return data
}

export async function updatePassword(newPassword: string) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })
  if (error) throw error
  return data
}

export async function signOut() {
  if (!supabase) return
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function deleteAccount() {
  if (!supabase) throw new Error('Supabase not configured')
  // Delete user's data first (cascade will handle it via FK),
  // but we explicitly clear projects for safety
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  // Delete all user projects
  await supabase.from('projects').delete().eq('user_id', user.id)
  // Delete subscription
  await supabase.from('subscriptions').delete().eq('user_id', user.id)
  // Delete profile
  await supabase.from('profiles').delete().eq('user_id', user.id)

  // Note: actual user deletion requires admin/service role
  // For now, we sign out and the account remains but data is cleared
  await signOut()
}

/* ─── Profile Helpers ─── */

export async function fetchProfile(userId: string) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (error) return null
  return data
}

export async function updateProfile(userId: string, updates: { display_name?: string; first_name?: string; avatar_url?: string | null; settings?: Record<string, unknown> }) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

/* ─── Subscription Helpers ─── */

export async function fetchSubscription(userId: string) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (error) return null
  return data
}

export async function updateSubscription(userId: string, updates: { tier: 'free' | 'pro' | 'lifetime'; status?: string }) {
  if (!supabase) return null

  // Calculate period dates for demo
  const now = new Date()
  const periodEnd = new Date(now)
  if (updates.tier === 'pro') {
    periodEnd.setMonth(periodEnd.getMonth() + 1)
  } else if (updates.tier === 'lifetime') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 100)
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      tier: updates.tier,
      status: updates.status || 'active',
      current_period_start: now.toISOString(),
      current_period_end: updates.tier === 'free' ? null : periodEnd.toISOString(),
    }, { onConflict: 'user_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

/* ─── Project CRUD Helpers ─── */

export async function fetchProjects(userId: string) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function upsertProject(userId: string, project: Record<string, unknown>) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('projects')
    .upsert({
      ...project,
      user_id: userId,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteProjectFromDb(projectId: string) {
  if (!supabase) return
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
  if (error) throw error
}
