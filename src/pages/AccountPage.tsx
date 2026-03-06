import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/useAuthStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Download,
  Trash2,
  LogOut,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'

/* ─── Confirmation Dialog Component ─── */
function ConfirmationDialog({
  title,
  message,
  confirmText = 'Bestätigen',
  cancelText = 'Abbrechen',
  isDangerous = false,
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDangerous?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-start gap-3">
            {isDangerous ? (
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            ) : (
              <CheckCircle className="h-5 w-5 text-teal-500 mt-0.5 flex-shrink-0" />
            )}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-foreground/70">{message}</p>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 sm:flex-none"
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              className={isDangerous
                ? 'flex-1 sm:flex-none bg-red-500 hover:bg-red-600 text-white'
                : 'flex-1 sm:flex-none bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white'
              }
            >
              {confirmText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ─── Avatar Component ─── */
function Avatar({ name, email }: { name: string; email: string }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
      {initials}
    </div>
  )
}

/* ─── Plan Badge ─── */
function PlanBadge({ tier }: { tier: 'free' | 'pro' | 'lifetime' }) {
  const badgeConfig = {
    free: { label: 'Kostenlos', className: 'bg-gray-100 text-gray-800' },
    pro: { label: 'Pro', className: 'bg-teal-100 text-teal-800' },
    lifetime: { label: 'Lifetime', className: 'bg-amber-100 text-amber-800' },
  }

  const config = badgeConfig[tier]
  return <Badge className={config.className}>{config.label}</Badge>
}

/* ─── Feature List ─── */
function FeatureList({ tier }: { tier: 'free' | 'pro' | 'lifetime' }) {
  const features = {
    free: [
      'Bis zu 5 Projekte',
      'Basis-Analysen',
      'Kostenlos',
    ],
    pro: [
      'Unbegrenzte Projekte',
      'Erweiterte Analysen',
      'Prioritäts-Support',
      'API-Zugang',
      'Monatlich kündbar',
    ],
    lifetime: [
      'Unbegrenzte Projekte',
      'Alle Pro-Features',
      'Zukünftige Updates',
      'Premium-Support',
      'Einmalige Zahlung',
    ],
  }

  const list = features[tier]

  return (
    <ul className="space-y-2">
      {list.map((feature, idx) => (
        <li key={idx} className="flex items-center gap-2 text-sm text-foreground/80">
          <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-600" />
          {feature}
        </li>
      ))}
    </ul>
  )
}

/* ─── Main Account Page ─── */
export default function AccountPage() {
  const navigate = useNavigate()
  const { email, firstName, subscription, setSubscription, logout } = useAuthStore()
  const [cancelDialog, setCancelDialog] = useState(false)
  const [deleteAccountDialog, setDeleteAccountDialog] = useState(false)
  const [exportingData, setExportingData] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

  const displayName = firstName || 'Nutzer'
  const displayEmail = email || 'keine-email@gesetzt.de'
  const currentTier = subscription?.tier || 'free'

  const handleCancelSubscription = () => {
    setCancelDialog(true)
  }

  const confirmCancelSubscription = () => {
    setSubscription({ tier: 'free', status: 'active' })
    setCancelDialog(false)
    toast.success('Plan gekündigt. Dein Account wurde auf Kostenlos zurückgesetzt.')
  }

  const handleExportData = async () => {
    setExportingData(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setExportingData(false)
    toast.success('Deine Daten wurden exportiert und als ZIP-Datei heruntergeladen.')
  }

  const handleDeleteAccount = () => {
    setDeleteAccountDialog(true)
  }

  const confirmDeleteAccount = async () => {
    setDeletingAccount(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setDeletingAccount(false)
    setDeleteAccountDialog(false)
    toast.error('Dein Account und alle Daten wurden gelöscht. Du wirst abgemeldet...')
    // Simulate logout after deletion
    setTimeout(() => {
      logout()
      navigate('/')
    }, 2000)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const handleChangePlan = () => {
    navigate('/#preise')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Mein Account</h1>
          <p className="text-foreground/60">
            Verwalte dein Profil, Abo und Kontoeinstellungen
          </p>
        </div>

        {/* Profile Card */}
        <Card className="overflow-hidden border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Profil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar name={displayName} email={displayEmail} />
                <div>
                  <p className="text-lg font-semibold text-foreground">{displayName}</p>
                  <p className="text-sm text-foreground/60">{displayEmail}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Card */}
        <Card className="overflow-hidden border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Abonnement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Plan */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <p className="text-sm text-foreground/60 mb-1">Aktueller Plan</p>
                <p className="text-xl font-semibold text-foreground capitalize">{currentTier}</p>
              </div>
              <PlanBadge tier={currentTier} />
            </div>

            {/* Next Billing Date */}
            <div className="pb-4 border-b border-slate-200">
              <p className="text-sm text-foreground/60 mb-1">Nächste Abrechnung</p>
              <p className="text-foreground font-medium">
                {currentTier === 'free'
                  ? 'Kostenlos - keine Abrechnung'
                  : currentTier === 'lifetime'
                    ? 'Keine Abrechnung (Lebenszeit-Lizenz)'
                    : '6. April 2026'}
              </p>
            </div>

            {/* Features */}
            <div className="py-2">
              <p className="text-sm text-foreground/60 mb-3">Inkludierte Features</p>
              <FeatureList tier={currentTier} />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleChangePlan}
                className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white"
              >
                Plan wechseln
              </Button>
              {currentTier === 'pro' && (
                <Button
                  onClick={handleCancelSubscription}
                  variant="outline"
                  className="flex-1"
                >
                  Kündigen
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data Management Section */}
        <Card className="overflow-hidden border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Datenverwaltung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-foreground/60">
              Exportiere deine Daten oder lösche deinen Account.
            </p>

            {/* Export Button */}
            <Button
              onClick={handleExportData}
              disabled={exportingData}
              variant="outline"
              className="w-full justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              {exportingData ? 'Wird exportiert...' : 'Daten exportieren'}
            </Button>

            {/* Delete Account Button */}
            <Button
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
              variant="outline"
              className="w-full justify-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              {deletingAccount ? 'Wird gelöscht...' : 'Account löschen'}
            </Button>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full justify-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Abmelden
        </Button>

        {/* Footer Info */}
        <div className="text-center text-xs text-foreground/50 pt-4">
          <p>Benötigst du Hilfe? Kontaktiere unseren Support: support@wasimmowert.de</p>
        </div>
      </div>

      {/* Cancel Subscription Confirmation Dialog */}
      {cancelDialog && (
        <ConfirmationDialog
          title="Plan kündigen?"
          message="Dein Pro-Abo wird sofort gekündigt und dein Account wird auf den kostenlosen Plan zurückgesetzt. Du behältst Zugriff auf alle deine Projekte, aber mit den Einschränkungen des kostenlosen Plans."
          confirmText="Ja, kündigen"
          cancelText="Abbrechen"
          onConfirm={confirmCancelSubscription}
          onCancel={() => setCancelDialog(false)}
        />
      )}

      {/* Delete Account Confirmation Dialog */}
      {deleteAccountDialog && (
        <ConfirmationDialog
          title="Account endgültig löschen?"
          message="Dies kann nicht rückgängig gemacht werden. Dein Account und alle deine Projekte und Daten werden dauerhaft gelöscht. Bitte exportiere deine Daten vorher, wenn du sie benötigst."
          confirmText="Ja, Account löschen"
          cancelText="Abbrechen"
          isDangerous
          onConfirm={confirmDeleteAccount}
          onCancel={() => setDeleteAccountDialog(false)}
        />
      )}
    </div>
  )
}
