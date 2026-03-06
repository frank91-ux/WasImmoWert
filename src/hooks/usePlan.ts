import { useAuthStore } from '@/store/useAuthStore'
import { useProjectStore } from '@/store/useProjectStore'

export type PlanTier = 'free' | 'pro' | 'lifetime'

export interface PlanInfo {
  tier: PlanTier
  canCreateProject: boolean
  maxProjects: number
  hasTaxModule: boolean
  hasAiChat: boolean
  hasExport: boolean
  hasAllCharts: boolean
  hasSensitivity: boolean
  hasComparison: boolean
  isPro: boolean
}

export function usePlan(): PlanInfo {
  const subscription = useAuthStore((s) => s.subscription)
  const projects = useProjectStore((s) => s.projects)

  const tier: PlanTier = subscription?.tier ?? 'free'
  const isPro = tier === 'pro' || tier === 'lifetime'
  const maxProjects = isPro ? Infinity : 3

  return {
    tier,
    canCreateProject: projects.length < maxProjects,
    maxProjects,
    hasTaxModule: isPro,
    hasAiChat: isPro,
    hasExport: isPro,
    hasAllCharts: isPro,
    hasSensitivity: isPro,
    hasComparison: isPro,
    isPro,
  }
}
