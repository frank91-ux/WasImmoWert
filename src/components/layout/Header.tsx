import { useState, useRef, useEffect } from 'react'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { ModeToggle } from '@/components/shared/ModeToggle'
import {
  Home, Menu, X, Plus, Building2, FolderOpen, GitCompare, LogOut,
  Search, Bell, Moon, Sun, User, UserCircle, CreditCard, Settings,
} from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useProjectStore } from '@/store/useProjectStore'
import { useAuthStore } from '@/store/useAuthStore'
import { cn } from '@/lib/utils'

function getPageTitle(pathname: string) {
  if (pathname === '/projects') return { title: 'Übersicht', subtitle: 'Immobilien Investment Analyse' }
  if (pathname === '/projects/new') return { title: 'Neue Bewertung', subtitle: 'Immobilie schnell bewerten' }
  if (pathname.startsWith('/projects/') && pathname.includes('/simulation'))
    return { title: 'Simulation', subtitle: 'Szenarien & Prognosen' }
  if (pathname.startsWith('/projects/'))
    return { title: 'Projektdetails', subtitle: 'Analyse & Kennzahlen' }
  if (pathname === '/compare') return { title: 'Vergleich', subtitle: 'Projekte gegenüberstellen' }
  return { title: 'Übersicht', subtitle: 'Immobilien Investment Analyse' }
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)

  // Close account dropdown on outside click
  useEffect(() => {
    if (!accountMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [accountMenuOpen])
  const navigate = useNavigate()
  const location = useLocation()
  const { projects, addProject } = useProjectStore()
  const { email, authMode, logout } = useAuthStore()

  const { title, subtitle } = getPageTitle(location.pathname)

  const handleNav = (path: string) => {
    setMobileMenuOpen(false)
    navigate(path)
  }

  const handleNewProject = () => {
    setMobileMenuOpen(false)
    navigate('/projects/new')
  }

  const displayName = email ? email.split('@')[0] : 'Nutzer'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6 gap-4">
        {/* Left: Mobile menu + Page title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            className="lg:hidden p-1.5 rounded-md hover:bg-muted"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Logo for mobile */}
          <Link to="/" className="lg:hidden flex items-center gap-2 font-bold text-lg">
            <div className="h-7 w-7 rounded-md brand-gradient flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
          </Link>

          {/* Page title - desktop */}
          <div className="hidden lg:block min-w-0">
            <h1 className="text-lg font-semibold leading-tight">{title}</h1>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Immobilie suchen..."
              className={cn(
                'w-full h-9 pl-9 pr-3 rounded-lg border bg-muted/50 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all',
                searchFocused && 'bg-background'
              )}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          <button
            className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Benachrichtigungen"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
          </button>

          <ThemeToggle />

          <div className="hidden sm:block h-6 w-px bg-border mx-1" />

          {/* User avatar + dropdown */}
          <div className="relative" ref={accountMenuRef}>
            <button
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setAccountMenuOpen(!accountMenuOpen)}
            >
              <div className="h-8 w-8 rounded-full brand-gradient flex items-center justify-center text-xs font-bold text-white">
                {initials}
              </div>
              {authMode === 'authenticated' && email && (
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-medium leading-tight">{displayName}</div>
                  <div className="text-[10px] text-muted-foreground leading-tight">Investor</div>
                </div>
              )}
            </button>

            {accountMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border bg-card shadow-lg py-1.5 z-50">
                <div className="px-3 py-2 border-b mb-1">
                  <div className="text-sm font-medium">{displayName}</div>
                  {email && <div className="text-xs text-muted-foreground">{email}</div>}
                </div>
                <button
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-muted transition-colors"
                  onClick={() => { setAccountMenuOpen(false); navigate('/account') }}
                >
                  <UserCircle className="h-4 w-4 text-muted-foreground" /> Mein Konto
                </button>
                <button
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-muted transition-colors"
                  onClick={() => { setAccountMenuOpen(false); navigate('/account') }}
                >
                  <CreditCard className="h-4 w-4 text-muted-foreground" /> Plan verwalten
                </button>
                <button
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-muted transition-colors"
                  onClick={() => { setAccountMenuOpen(false); navigate('/account') }}
                >
                  <Settings className="h-4 w-4 text-muted-foreground" /> Einstellungen
                </button>
                <div className="border-t mt-1 pt-1">
                  <button
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    onClick={() => { setAccountMenuOpen(false); logout(); navigate('/') }}
                  >
                    <LogOut className="h-4 w-4" /> Abmelden
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={cn(
        'lg:hidden border-t bg-background overflow-hidden transition-all',
        mobileMenuOpen ? 'max-h-[28rem]' : 'max-h-0 border-t-0'
      )}>
        <nav className="p-4 space-y-1">
          {/* Mobile search */}
          <div className="relative mb-3 md:hidden">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Immobilie suchen..."
              className="w-full h-10 pl-9 pr-3 rounded-lg border bg-muted/50 text-sm"
            />
          </div>

          <button
            className="flex items-center gap-2 w-full rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            onClick={() => handleNav('/projects')}
          >
            <Building2 className="h-4 w-4 text-primary" /> Dashboard
          </button>
          <button
            className="flex items-center gap-2 w-full rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            onClick={() => handleNav('/projects')}
          >
            <FolderOpen className="h-4 w-4" /> Alle Projekte
          </button>
          <button
            className="flex items-center gap-2 w-full rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            onClick={() => handleNav('/compare')}
          >
            <GitCompare className="h-4 w-4" /> Vergleichen
          </button>
          <button
            className="flex items-center gap-2 w-full rounded-lg px-3 py-2.5 text-sm font-medium btn-brand"
            onClick={handleNewProject}
          >
            <Plus className="h-4 w-4" /> Neues Projekt
          </button>
          {projects.length > 0 && (
            <>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pt-3 px-3">
                Projekte
              </div>
              {projects.map((p) => (
                <button
                  key={p.id}
                  className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm hover:bg-muted truncate transition-colors"
                  onClick={() => handleNav(`/projects/${p.id}`)}
                >
                  {p.name}
                </button>
              ))}
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
