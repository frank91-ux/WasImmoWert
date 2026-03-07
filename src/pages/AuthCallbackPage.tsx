import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, AlertCircle, KeyRound, Home } from 'lucide-react'
import { toast } from 'sonner'

type CallbackState = 'loading' | 'password-reset' | 'success' | 'error'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [state, setState] = useState<CallbackState>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [updating, setUpdating] = useState(false)
  const updatePassword = useAuthStore((s) => s.updatePassword)

  useEffect(() => {
    const handleCallback = async () => {
      if (!supabase) {
        setState('error')
        setErrorMessage('Supabase ist nicht konfiguriert.')
        return
      }

      try {
        // Supabase automatically handles the token exchange via detectSessionInUrl
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          setState('error')
          setErrorMessage(error.message)
          return
        }

        if (!session) {
          // No session yet — might still be processing
          // Wait a moment and check again
          await new Promise(r => setTimeout(r, 1500))
          const { data: { session: retrySession } } = await supabase.auth.getSession()
          if (!retrySession) {
            setState('error')
            setErrorMessage('Sitzung konnte nicht hergestellt werden. Bitte versuche es erneut.')
            return
          }
        }

        // Check if this is a password recovery flow
        const type = searchParams.get('type')
        if (type === 'recovery') {
          setState('password-reset')
          return
        }

        // Check for Supabase hash params (email confirmation, magic link)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const authType = hashParams.get('type')

        if (authType === 'recovery') {
          setState('password-reset')
          return
        }

        // Successful login/confirmation
        setState('success')
        toast.success('Erfolgreich authentifiziert!')

        // Redirect to app after a short delay
        setTimeout(() => {
          navigate('/projects', { replace: true })
        }, 1500)
      } catch {
        setState('error')
        setErrorMessage('Ein unerwarteter Fehler ist aufgetreten.')
      }
    }

    handleCallback()
  }, [navigate, searchParams])

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      toast.error('Passwort muss mindestens 6 Zeichen lang sein')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwörter stimmen nicht überein')
      return
    }

    setUpdating(true)
    try {
      await updatePassword(newPassword)
      setState('success')
      toast.success('Passwort wurde erfolgreich geändert!')
      setTimeout(() => {
        navigate('/projects', { replace: true })
      }, 2000)
    } catch {
      toast.error('Fehler beim Ändern des Passworts')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl brand-gradient flex items-center justify-center">
              <Home className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-xl">
            {state === 'loading' && 'Wird verarbeitet...'}
            {state === 'password-reset' && 'Neues Passwort setzen'}
            {state === 'success' && 'Erfolgreich!'}
            {state === 'error' && 'Fehler'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {state === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Deine Authentifizierung wird verarbeitet...
              </p>
            </div>
          )}

          {/* Password Reset Form */}
          {state === 'password-reset' && (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="flex justify-center mb-2">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <KeyRound className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Gib dein neues Passwort ein.
              </p>
              <div>
                <label className="text-sm font-medium block mb-1.5">Neues Passwort</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mindestens 6 Zeichen"
                  minLength={6}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Passwort bestätigen</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Passwort wiederholen"
                  minLength={6}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={updating}
                className="w-full btn-brand"
              >
                {updating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                Passwort ändern
              </Button>
            </form>
          )}

          {/* Success State */}
          {state === 'success' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-sm text-muted-foreground">
                Du wirst weitergeleitet...
              </p>
              <Button
                onClick={() => navigate('/projects', { replace: true })}
                variant="outline"
                className="mt-2"
              >
                Zum Dashboard
              </Button>
            </div>
          )}

          {/* Error State */}
          {state === 'error' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-sm text-red-600 text-center">
                {errorMessage || 'Ein Fehler ist aufgetreten.'}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => navigate('/', { replace: true })}
                  variant="outline"
                >
                  Zur Startseite
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  className="btn-brand"
                >
                  Erneut versuchen
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
