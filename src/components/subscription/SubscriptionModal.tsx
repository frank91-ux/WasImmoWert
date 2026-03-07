import { useAuthStore } from '@/store/useAuthStore'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Check, Crown, Sparkles, Zap } from 'lucide-react'

interface SubscriptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedPlan: 'free' | 'pro' | 'lifetime'
}

const PLANS = {
  free: {
    name: 'Free',
    price: '0 €',
    period: '',
    features: ['3 Projekte', 'Basis-Kennzahlen', 'Marktvergleich'],
    icon: Sparkles,
  },
  pro: {
    name: 'Professional',
    price: '9,99 €',
    period: '/Monat',
    features: [
      'Unbegrenzte Projekte',
      'Steuer-Simulation (§32a EStG)',
      'KI-Berater',
      'PDF-Export',
      'Sensitivitätsanalyse',
      'Vergleichs-Tool',
    ],
    icon: Zap,
  },
  lifetime: {
    name: 'Lifetime',
    price: '99,99 €',
    period: 'einmalig',
    features: [
      'Alle Pro-Features',
      'Lebenslanger Zugang',
      'Alle zukünftigen Updates',
      'Priority Support',
    ],
    icon: Crown,
  },
}

export function SubscriptionModal({
  open,
  onOpenChange,
  selectedPlan,
}: SubscriptionModalProps) {
  const activatePlan = useAuthStore((state) => state.activatePlan)

  const plan = PLANS[selectedPlan]
  const PlanIcon = plan.icon

  const handleActivate = async () => {
    await activatePlan(selectedPlan)

    const planName = plan.name
    toast.success(`${planName} Plan aktiviert!`, {
      description: selectedPlan === 'free'
        ? 'Dein kostenloser Plan ist aktiv.'
        : 'Dein Abonnement wurde erfolgreich aktiviert. (Demo-Modus — Stripe kommt bald)',
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 brand-gradient rounded-full blur-md opacity-50" />
              <div className="relative brand-gradient p-2 rounded-full">
                <PlanIcon className="w-5 h-5 text-white" />
              </div>
            </div>
            {plan.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Price Section */}
          <div className="text-center py-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {plan.price}
              </span>
              {plan.period && (
                <span className="text-sm text-gray-600">{plan.period}</span>
              )}
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Funktionen
            </p>
            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0">
                    <div className="flex items-center justify-center h-5 w-5 rounded-full brand-gradient">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  <span className="text-sm text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Plan Description */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded border border-gray-200">
            {selectedPlan === 'free' && (
              'Perfekt für den Start. Teste alle Basis-Funktionen kostenlos.'
            )}
            {selectedPlan === 'pro' && (
              'Die beste Wahl für professionelle Immobilienanalysen. Voller Zugriff auf alle Tools.'
            )}
            {selectedPlan === 'lifetime' && (
              'Einmalige Zahlung. Unbegrenzter Zugang für immer. Beste langfristige Investition.'
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleActivate}
            className="flex-1 btn-brand"
          >
            Aktivieren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
