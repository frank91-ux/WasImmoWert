import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Toaster } from '@/components/ui/toaster'
import { CookieBanner } from '@/components/shared/CookieBanner'

// Eager-loaded pages
import PublicHomePage from '@/pages/PublicHomePage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ProjectPage } from '@/pages/ProjectPage'
import { NewProjectPage } from '@/pages/NewProjectPage'

// Lazy-loaded pages
const SimulationPage = lazy(() => import('@/pages/SimulationPage').then(m => ({ default: m.SimulationPage })))
const ComparisonPage = lazy(() => import('@/pages/ComparisonPage').then(m => ({ default: m.ComparisonPage })))
const PortfolioPage = lazy(() => import('@/pages/PortfolioPage').then(m => ({ default: m.PortfolioPage })))
const BewertungenDashboard = lazy(() => import('@/pages/BewertungenDashboard').then(m => ({ default: m.BewertungenDashboard })))
const AccountPage = lazy(() => import('@/pages/AccountPage'))
const AuthCallbackPage = lazy(() => import('@/pages/AuthCallbackPage'))

// Legal pages (lazy)
const DatenschutzPage = lazy(() => import('@/pages/legal/DatenschutzPage'))
const ImpressumPage = lazy(() => import('@/pages/legal/ImpressumPage'))
const AgbPage = lazy(() => import('@/pages/legal/AgbPage'))
const CookiePage = lazy(() => import('@/pages/legal/CookiePage'))

// Help pages (lazy)
const KontaktPage = lazy(() => import('@/pages/help/KontaktPage'))
const SupportPage = lazy(() => import('@/pages/help/SupportPage'))
const FeedbackPage = lazy(() => import('@/pages/help/FeedbackPage'))
const PressePage = lazy(() => import('@/pages/help/PressePage'))
const PricingPage = lazy(() => import('@/pages/PricingPage'))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public route – SaaS landing page */}
          <Route path="/" element={<PublicHomePage />} />

          {/* Legal pages */}
          <Route path="/legal/datenschutz" element={<DatenschutzPage />} />
          <Route path="/legal/impressum" element={<ImpressumPage />} />
          <Route path="/legal/agb" element={<AgbPage />} />
          <Route path="/legal/cookies" element={<CookiePage />} />

          {/* Help pages */}
          <Route path="/help/kontakt" element={<KontaktPage />} />
          <Route path="/help/support" element={<SupportPage />} />
          <Route path="/help/feedback" element={<FeedbackPage />} />
          <Route path="/help/presse" element={<PressePage />} />

          {/* Pricing page (public) */}
          <Route path="/pricing" element={<PricingPage />} />

          {/* Auth callback (email confirmation, password reset, OAuth) */}
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Protected routes – require auth or skip */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/app" element={<Navigate to="/projects" replace />} />
              <Route path="/projects" element={<DashboardPage />} />
              <Route path="/projects/new" element={<NewProjectPage />} />
              <Route path="/projects/:id" element={<ProjectPage />} />
              <Route path="/projects/:id/simulation" element={<SimulationPage />} />
              <Route path="/bewertungen" element={<BewertungenDashboard />} />
              <Route path="/compare" element={<ComparisonPage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/account" element={<AccountPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toaster />
      <CookieBanner />
    </BrowserRouter>
  )
}
