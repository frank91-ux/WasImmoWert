import { toast } from 'sonner'

export type StripePlan = 'pro_monthly' | 'lifetime'

export async function createCheckoutSession(plan: StripePlan): Promise<void> {
  // Placeholder - will be replaced with real Stripe integration
  toast.info('Stripe-Integration wird bald verfügbar sein. Danke für dein Interesse!')
  console.log('[Stripe] Checkout session requested for plan:', plan)
}

export async function getSubscriptionStatus(): Promise<{
  tier: 'free' | 'pro' | 'lifetime'
  status: 'active' | 'cancelled' | 'past_due' | null
  currentPeriodEnd: string | null
}> {
  // Placeholder - reads from local state / Supabase
  return {
    tier: 'free',
    status: null,
    currentPeriodEnd: null,
  }
}

export async function cancelSubscription(): Promise<void> {
  toast.info('Kündigung wird bald über Stripe möglich sein.')
}
