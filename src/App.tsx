import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { PublicLandingPage } from '@/pages/PublicLandingPage'
import { LandingPage } from '@/pages/LandingPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ProjectPage } from '@/pages/ProjectPage'
import { NewProjectPage } from '@/pages/NewProjectPage'
import { SimulationPage } from '@/pages/SimulationPage'
import { ComparisonPage } from '@/pages/ComparisonPage'
import { PortfolioPage } from '@/pages/PortfolioPage'
import { Toaster } from '@/components/ui/toaster'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route – customer journey wizard */}
        <Route path="/" element={<PublicLandingPage />} />

        {/* Protected routes – require auth or skip */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/app" element={<Navigate to="/projects" replace />} />
            <Route path="/projects" element={<DashboardPage />} />
            <Route path="/projects/new" element={<NewProjectPage />} />
            <Route path="/projects/:id" element={<ProjectPage />} />
            <Route path="/projects/:id/simulation" element={<SimulationPage />} />
            <Route path="/compare" element={<ComparisonPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}
