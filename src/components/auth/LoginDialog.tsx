import { useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Home, LogIn, ArrowRight, UserPlus, Mail, Loader2,
  Github,
} from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/supabase'

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type TabMode = 'login' | 'register' | 'magic-link'

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const { login, register, loginWithMagicLink, loginWithOAuth, skip, loading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tab, setTab] = useState<TabMode>('login')
  const hasSupabase = isSupabaseConfigured()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim() && password.trim()) {
      await login(email.trim(), password.trim())
      if (useAuthStore.getState().authMode === 'authenticated') {
        onOpenChange(false)
      }
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim() && password.trim()) {
      await register(email.trim(), password.trim())
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      await loginWithMagicLink(email.trim())
    }
  }

  const handleSkip = () => {
    skip()
    onOpenChange(false)
  }

  const handleOAuth = async (provider: 'google' | 'github') => {
    await loginWithOAuth(provider)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Home className="h-4 w-4 text-white" />
            </div>
            <DialogTitle>WasImmoWert</DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Melden Sie sich an, um Ihre Projekte zu speichern und alle Funktionen zu nutzen.
          </p>
        </DialogHeader>

        {/* OAuth Buttons */}
        {hasSupabase && (
          <div className="space-y-2 mt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleOAuth('google')}
              disabled={loading}
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Mit Google anmelden
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleOAuth('github')}
              disabled={loading}
            >
              <Github className="h-4 w-4 mr-2" />
              Mit GitHub anmelden
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">oder</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
          <button
            className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
              tab === 'login' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
            }`}
            onClick={() => setTab('login')}
          >
            Anmelden
          </button>
          {hasSupabase && (
            <>
              <button
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                  tab === 'register' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                }`}
                onClick={() => setTab('register')}
              >
                Registrieren
              </button>
              <button
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                  tab === 'magic-link' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                }`}
                onClick={() => setTab('magic-link')}
              >
                Magic Link
              </button>
            </>
          )}
        </div>

        {/* Login Form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3 mt-3">
            <div>
              <label className="text-sm font-medium block mb-1.5">E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ihre@email.de"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Passwort</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-col p-0 pt-2">
              <Button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                Anmelden
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={handleSkip}>
                <ArrowRight className="h-4 w-4" />
                Direkt starten ohne Anmeldung
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* Register Form */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3 mt-3">
            <div>
              <label className="text-sm font-medium block mb-1.5">E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ihre@email.de"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Passwort (min. 6 Zeichen)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-col p-0 pt-2">
              <Button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Konto erstellen
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={handleSkip}>
                <ArrowRight className="h-4 w-4" />
                Direkt starten ohne Anmeldung
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* Magic Link Form */}
        {tab === 'magic-link' && (
          <form onSubmit={handleMagicLink} className="space-y-3 mt-3">
            <div>
              <label className="text-sm font-medium block mb-1.5">E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ihre@email.de"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Wir senden Ihnen einen Anmelde-Link per E-Mail. Kein Passwort nötig.
            </p>
            <DialogFooter className="flex-col gap-2 sm:flex-col p-0 pt-2">
              <Button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Magic Link senden
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={handleSkip}>
                <ArrowRight className="h-4 w-4" />
                Direkt starten ohne Anmeldung
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
