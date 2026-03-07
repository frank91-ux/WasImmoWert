import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '@/components/shared/Logo'
import { FeatureIcon } from '@/components/shared/FeatureIcon'
import { PricingSection } from '@/components/pricing/PricingSection'
import { LoginDialog } from '@/components/auth/LoginDialog'
import { SubscriptionModal } from '@/components/subscription/SubscriptionModal'
import { AddressAutocomplete, type PlaceResult } from '@/components/shared/AddressAutocomplete'
import { useAuthStore } from '@/store/useAuthStore'
import { useProjectStore } from '@/store/useProjectStore'
import { calculateAll } from '@/calc'
import { createDefaultProject } from '@/calc/defaults'
import { getMarktdatenForBundesland } from '@/data/marktdaten'
import { BUNDESLAND_LABELS } from '@/calc/grunderwerbsteuer'
import {
  BarChart3, Calculator, FileText, LineChart, Bot,
  Shield, CreditCard, Clock, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Minus, Lock, ArrowRight,
  MapPin, Ruler, Calendar, Building2, Menu, X,
  Zap, SlidersHorizontal, Sparkles,
} from 'lucide-react'
import type { Bundesland } from '@/calc/types'

/* ────────────────── Quick-Assessment Form ────────────────── */

interface QuickFormData {
  adresse: string
  bundesland: Bundesland
  wohnflaeche: number
  baujahr: number
  zustand: 'gut' | 'mittel' | 'renovierung'
  kaufpreis: number
  kaltmiete: number
  eigenkapital: number
  zinssatz: number
  tilgung: number
  maklerProvision: number
}

const BUNDESLAENDER: { value: Bundesland; label: string }[] = [
  { value: 'bayern', label: 'Bayern' },
  { value: 'berlin', label: 'Berlin' },
  { value: 'baden-wuerttemberg', label: 'Baden-Württemberg' },
  { value: 'brandenburg', label: 'Brandenburg' },
  { value: 'bremen', label: 'Bremen' },
  { value: 'hamburg', label: 'Hamburg' },
  { value: 'hessen', label: 'Hessen' },
  { value: 'mecklenburg-vorpommern', label: 'Mecklenburg-Vorp.' },
  { value: 'niedersachsen', label: 'Niedersachsen' },
  { value: 'nordrhein-westfalen', label: 'Nordrhein-Westfalen' },
  { value: 'rheinland-pfalz', label: 'Rheinland-Pfalz' },
  { value: 'saarland', label: 'Saarland' },
  { value: 'sachsen', label: 'Sachsen' },
  { value: 'sachsen-anhalt', label: 'Sachsen-Anhalt' },
  { value: 'schleswig-holstein', label: 'Schleswig-Holstein' },
  { value: 'thueringen', label: 'Thüringen' },
]

/* ────────────────── FAQ Data ────────────────── */

const FAQ_ITEMS = [
  {
    q: 'Wie genau ist die Bewertung?',
    a: 'Unsere Berechnung basiert auf dem deutschen Steuerrecht (§32a EStG, AfA), realen Finanzierungsmodellen und regionalen Marktdaten. Die Ergebnisse sind eine fundierte Einschätzung – kein Gutachten, aber präziser als Excel-Schätzungen.',
  },
  {
    q: 'Welche Daten nutzt WasImmoWert?',
    a: 'Wir verarbeiten nur die Angaben, die du eingibst: Adresse, Kaufpreis, Miete, Finanzierung. Deine Daten werden DSGVO-konform gespeichert und niemals an Dritte weitergegeben.',
  },
  {
    q: 'Kann ich mehrere Szenarien vergleichen?',
    a: 'Ja! Mit dem Pro-Plan kannst du unbegrenzt Projekte anlegen und direkt nebeneinander vergleichen – z.B. unterschiedliche Zinssätze, Kaufpreise oder Mietannahmen.',
  },
  {
    q: 'Ist das für Eigennutzer oder Investoren?',
    a: 'Beides! WasImmoWert erkennt automatisch, ob du vermieten oder selbst einziehen willst, und zeigt dir nur die relevanten Kennzahlen und Steuereffekte.',
  },
  {
    q: 'Sind meine Daten sicher?',
    a: 'Ja. Wir nutzen Ende-zu-Ende-verschlüsselte Verbindungen, speichern Daten DSGVO-konform in der EU und erheben nur das Minimum: E-Mail, Vorname und Passwort.',
  },
  {
    q: 'Kann ich den Dienst jederzeit kündigen?',
    a: 'Natürlich. Der Pro-Plan ist monatlich kündbar, und du kannst jederzeit deine Daten exportieren oder dein Konto löschen.',
  },
]

/* ────────────────── Component ────────────────── */

export default function PublicHomePage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { addProject, setActiveProject } = useProjectStore()
  const [loginOpen, setLoginOpen] = useState(false)
  const [subscriptionOpen, setSubscriptionOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'lifetime'>('pro')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [assessmentResult, setAssessmentResult] = useState<{
    cashflow: number
    kaufpreisfaktor: number
    einschaetzung: 'gut' | 'ok' | 'schlecht'
    vergleichsmiete: number
    kaufpreisProQm: number
  } | null>(null)

  const [form, setForm] = useState<QuickFormData>({
    adresse: '',
    bundesland: 'bayern',
    wohnflaeche: 80,
    baujahr: 1990,
    zustand: 'gut',
    kaufpreis: 300000,
    kaltmiete: 1000,
    eigenkapital: 50000,
    zinssatz: 3.5,
    tilgung: 2,
    maklerProvision: 3.57,
  })
  const [showAdvanced, setShowAdvanced] = useState(false)

  const resultRef = useRef<HTMLDivElement>(null)

  const handlePlaceSelect = useCallback((place: PlaceResult) => {
    setForm((prev) => ({ ...prev, adresse: place.address }))
    if (place.state) {
      const match = Object.entries(BUNDESLAND_LABELS).find(
        ([, label]) => label.toLowerCase() === place.state!.toLowerCase()
      )
      if (match) setForm((prev) => ({ ...prev, bundesland: match[0] as Bundesland }))
    }
  }, [])

  const handleQuickAssessment = () => {
    const project = createDefaultProject()
    project.kaufpreis = form.kaufpreis
    project.monatsmieteKalt = form.kaltmiete
    project.wohnflaeche = form.wohnflaeche
    project.baujahr = form.baujahr
    project.bundesland = form.bundesland
    project.address = form.adresse
    project.eigenkapital = form.eigenkapital
    project.zinssatz = form.zinssatz
    project.tilgung = form.tilgung
    project.maklerProvision = form.maklerProvision

    const result = calculateAll(project)
    const markt = getMarktdatenForBundesland(form.bundesland)

    const cashflow = result.kpis.monatlichCashflowNachSteuer
    const faktor = result.kpis.kaufpreisfaktor

    let einschaetzung: 'gut' | 'ok' | 'schlecht' = 'ok'
    if (cashflow > 0 && faktor < 25) einschaetzung = 'gut'
    else if (cashflow < -200 || faktor > 35) einschaetzung = 'schlecht'

    setAssessmentResult({
      cashflow: Math.round(cashflow),
      kaufpreisfaktor: Math.round(faktor * 10) / 10,
      einschaetzung,
      vergleichsmiete: markt.mietpreisProQm,
      kaufpreisProQm: markt.kaufpreisProQm,
    })
    setShowResults(true)
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  /** Creates a project from form data and navigates to it */
  const createProjectAndNavigate = () => {
    const project = addProject({
      kaufpreis: form.kaufpreis,
      monatsmieteKalt: form.kaltmiete,
      wohnflaeche: form.wohnflaeche,
      baujahr: form.baujahr,
      bundesland: form.bundesland,
      address: form.adresse,
      eigenkapital: form.eigenkapital,
      zinssatz: form.zinssatz,
      tilgung: form.tilgung,
      maklerProvision: form.maklerProvision,
    })
    setActiveProject(project.id)
    navigate(`/projects/${project.id}`)
  }

  const handleStartFull = () => {
    if (isAuthenticated()) {
      createProjectAndNavigate()
    } else {
      // Show login dialog – after successful auth, project will be created
      setLoginOpen(true)
    }
  }

  /** Called after successful login/register/skip from the LoginDialog */
  const handleAuthSuccess = () => {
    createProjectAndNavigate()
  }

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      {/* ═══ NAVIGATION ═══ */}
      <nav className="sticky top-0 z-50 bg-white/95 dark:bg-background/95 backdrop-blur border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo size="md" />

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button onClick={() => scrollTo('funktionen')} className="text-muted-foreground hover:text-foreground transition-colors">Funktionen</button>
            <button onClick={() => scrollTo('preise')} className="text-muted-foreground hover:text-foreground transition-colors">Preise</button>
            <button onClick={() => scrollTo('faq')} className="text-muted-foreground hover:text-foreground transition-colors">FAQ</button>
            {isAuthenticated() ? (
              <button onClick={() => navigate('/projects')} className="text-primary font-semibold">Zum Dashboard</button>
            ) : (
              <button onClick={() => setLoginOpen(true)} className="text-muted-foreground hover:text-foreground transition-colors">Anmelden</button>
            )}
            <button onClick={() => scrollTo('hero-form')} className="btn-brand px-4 py-2 rounded-xl text-sm">
              Kostenlos starten
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border px-4 py-4 space-y-3 bg-white dark:bg-background">
            <button onClick={() => scrollTo('funktionen')} className="block w-full text-left text-sm font-medium">Funktionen</button>
            <button onClick={() => scrollTo('preise')} className="block w-full text-left text-sm font-medium">Preise</button>
            <button onClick={() => scrollTo('faq')} className="block w-full text-left text-sm font-medium">FAQ</button>
            <button onClick={() => scrollTo('hero-form')} className="block w-full btn-brand py-2.5 rounded-xl text-sm text-center">Kostenlos starten</button>
          </div>
        )}
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="pt-16 pb-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-4">
            Immobilie bewerten in 60 Sekunden –{' '}
            <span className="brand-gradient-text">Marktvergleich, Cashflow & Steuer</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Ersteinschätzung und Marktvergleich sofort – ohne E-Mail, ohne Anmeldung.
            Professionelle Steuer-Simulation und volle Transparenz mit der Pro-Version.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground mb-8">
            <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-blue-500" /> Sofort & kostenlos</span>
            <span className="flex items-center gap-1.5"><Calculator className="h-4 w-4 text-blue-500" /> §32a EStG Steuerberechnung</span>
            <span className="flex items-center gap-1.5"><SlidersHorizontal className="h-4 w-4 text-blue-500" /> Interaktive Regler</span>
          </div>
        </div>
      </section>

      {/* ═══ QUICK FORM ═══ */}
      <section id="hero-form" className="pb-6 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                <MapPin className="h-3 w-3 inline mr-1" />Adresse / PLZ / Stadt
              </label>
              <AddressAutocomplete
                value={form.adresse}
                onChange={(val) => setForm({ ...form, adresse: val })}
                onPlaceSelect={handlePlaceSelect}
                placeholder="z.B. Hauptstr. 12, 80331 München"
                className="h-[42px]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                <Ruler className="h-3 w-3 inline mr-1" />Wohnfläche m²
              </label>
              <input
                type="number"
                value={form.wohnflaeche}
                onChange={(e) => setForm({ ...form, wohnflaeche: +e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                <Calendar className="h-3 w-3 inline mr-1" />Baujahr
              </label>
              <input
                type="number"
                value={form.baujahr}
                onChange={(e) => setForm({ ...form, baujahr: +e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Bundesland</label>
              <select
                value={form.bundesland}
                onChange={(e) => setForm({ ...form, bundesland: e.target.value as Bundesland })}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {BUNDESLAENDER.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Kaufpreis €</label>
              <input
                type="number"
                value={form.kaufpreis}
                onChange={(e) => setForm({ ...form, kaufpreis: +e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Kaltmiete €/Mon.</label>
              <input
                type="number"
                value={form.kaltmiete}
                onChange={(e) => setForm({ ...form, kaltmiete: +e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Expandable Advanced Settings */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mx-auto mb-3"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Erweiterte Einstellungen
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {showAdvanced && (
            <div className="grid sm:grid-cols-4 gap-3 mb-4 animate-in fade-in slide-in-from-top-2 duration-200 border-t pt-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Eigenkapital €</label>
                <input
                  type="number"
                  value={form.eigenkapital}
                  onChange={(e) => setForm({ ...form, eigenkapital: +e.target.value })}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Zinssatz %</label>
                <input
                  type="number"
                  value={form.zinssatz}
                  onChange={(e) => setForm({ ...form, zinssatz: +e.target.value })}
                  step={0.1}
                  min={0}
                  max={15}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Tilgung %</label>
                <input
                  type="number"
                  value={form.tilgung}
                  onChange={(e) => setForm({ ...form, tilgung: +e.target.value })}
                  step={0.1}
                  min={0}
                  max={15}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Makler-Prov. %</label>
                <input
                  type="number"
                  value={form.maklerProvision}
                  onChange={(e) => setForm({ ...form, maklerProvision: +e.target.value })}
                  step={0.01}
                  min={0}
                  max={10}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <button onClick={handleQuickAssessment} className="w-full btn-brand py-3 rounded-xl text-base">
            Kostenlos bewerten
          </button>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-blue-500" /> DSGVO-konform</span>
            <span className="flex items-center gap-1"><CreditCard className="h-3.5 w-3.5 text-blue-500" /> Keine Kreditkarte</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-blue-500" /> 60 Sekunden</span>
          </div>
        </div>
      </section>

      {/* ═══ QUICK ASSESSMENT RESULTS ═══ */}
      {showResults && assessmentResult && (
        <section ref={resultRef} className="py-8 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            {/* Assessment Badge */}
            <div className={`text-center mb-6 p-4 rounded-2xl border ${
              assessmentResult.einschaetzung === 'gut' ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' :
              assessmentResult.einschaetzung === 'schlecht' ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800' :
              'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800'
            }`}>
              <div className="flex items-center justify-center gap-2 mb-1">
                {assessmentResult.einschaetzung === 'gut' && <TrendingUp className="h-5 w-5 text-emerald-600" />}
                {assessmentResult.einschaetzung === 'ok' && <Minus className="h-5 w-5 text-amber-600" />}
                {assessmentResult.einschaetzung === 'schlecht' && <TrendingDown className="h-5 w-5 text-red-600" />}
                <span className="font-bold text-lg">
                  {assessmentResult.einschaetzung === 'gut' ? 'Gute Investition' :
                   assessmentResult.einschaetzung === 'schlecht' ? 'Eher kritisch' : 'Durchschnittlich'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Erste Einschätzung basierend auf deinen Angaben</p>
            </div>

            {/* KPI Grid - 2 visible, 2 locked */}
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {/* Visible KPIs */}
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Monatlicher Cashflow</p>
                <p className={`text-2xl font-bold ${assessmentResult.cashflow >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {assessmentResult.cashflow >= 0 ? '+' : ''}{assessmentResult.cashflow} €
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Kaufpreisfaktor</p>
                <p className="text-2xl font-bold">{assessmentResult.kaufpreisfaktor}×</p>
                <p className="text-xs text-muted-foreground">{assessmentResult.kaufpreisfaktor < 25 ? 'Unter 25 ist gut' : 'Über 25 ist teuer'}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Vergleichsmiete (Region)</p>
                <p className="text-2xl font-bold">{assessmentResult.vergleichsmiete.toFixed(1)} €/m²</p>
                <p className="text-xs text-muted-foreground">Deine Miete: {(form.kaltmiete / form.wohnflaeche).toFixed(1)} €/m²</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Kaufpreis pro m² (Region)</p>
                <p className="text-2xl font-bold">{assessmentResult.kaufpreisProQm.toLocaleString('de-DE')} €</p>
                <p className="text-xs text-muted-foreground">Dein Preis: {Math.round(form.kaufpreis / form.wohnflaeche).toLocaleString('de-DE')} €/m²</p>
              </div>
            </div>

            {/* Locked KPIs */}
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {['Eigenkapitalrendite', 'Steuer-Effekt (AfA)'].map((label) => (
                <div key={label} className="bg-card border border-border rounded-xl p-4 relative overflow-hidden">
                  <div className="absolute inset-0 backdrop-blur-sm bg-white/60 dark:bg-black/60 z-10 flex flex-col items-center justify-center">
                    <Lock className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-xs font-medium text-muted-foreground">Anmelden für Details</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className="text-2xl font-bold text-muted-foreground/30">12,4%</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={handleStartFull} className="flex-1 btn-brand py-3 rounded-xl text-base flex items-center justify-center gap-2">
                <ArrowRight className="h-4 w-4" /> Kostenlose Detailanalyse starten
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ═══ STATS BAR ═══ */}
      <section className="py-8 px-4 sm:px-6 border-y border-border bg-muted/30">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" /> 60 Sekunden
            </p>
            <p className="text-sm text-muted-foreground">bis zur Bewertung</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" /> Marktwert + Cashflow
            </p>
            <p className="text-sm text-muted-foreground">in einem Report</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" /> Klare Regler
            </p>
            <p className="text-sm text-muted-foreground">& Szenarien</p>
          </div>
        </div>
      </section>

      {/* ═══ WHY WASIMMOWERT ═══ */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Warum WasImmoWert?</h2>
          <p className="text-muted-foreground">Entwickelt von Investoren für Investoren</p>
        </div>
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Zap, title: 'Sofort & kostenlos', desc: 'Ersteinschätzung in 60 Sekunden – ohne Anmeldung, ohne E-Mail, ohne Kreditkarte.' },
            { icon: Calculator, title: 'Steuer-Simulation', desc: 'Echte deutsche Steuerberechnung: AfA, §32a EStG, Soli-Gleitzone, Grunderwerbsteuer nach Bundesland.' },
            { icon: SlidersHorizontal, title: 'Interaktive Regler', desc: 'Kaufpreis, Zinsen, Miete und EK per Schieberegler anpassen – Ergebnis in Echtzeit.' },
            { icon: Sparkles, title: 'KI-Berater', desc: 'Frage den KI-Berater nach Optimierungstipps, Szenarien oder Steuerstrategien für dein Objekt.' },
          ].map((item) => (
            <div key={item.title} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-lg brand-gradient flex items-center justify-center mb-3">
                <item.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ TRUST SECTION ═══ */}
      <section className="py-10 px-4 sm:px-6 bg-muted/30 border-y border-border/50">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-3xl font-bold text-primary">16</p>
            <p className="text-sm text-muted-foreground">Bundesländer mit regionalen Marktdaten</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary">30+ Jahre</p>
            <p className="text-sm text-muted-foreground">Cashflow- & Vermögensprognose</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary">§32a EStG</p>
            <p className="text-sm text-muted-foreground">Deutsche Steuerberechnung auf Profi-Niveau</p>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">So funktioniert's</h2>
          <p className="text-muted-foreground">In drei einfachen Schritten zur Immobilienbewertung</p>
        </div>
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-8">
          {[
            { step: '1', title: 'Daten eingeben', desc: 'Adresse, Kaufpreis und Miete – mehr brauchst du nicht für die erste Einschätzung.' },
            { step: '2', title: 'Regler bewegen', desc: 'Kaufpreis, Zinsen, Miete anpassen und sofort sehen, wie sich die Kennzahlen verändern.' },
            { step: '3', title: 'Report erhalten', desc: 'Cashflow, Steuereffekte, Renditen – alles auf einen Blick mit klaren Empfehlungen.' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="h-12 w-12 rounded-full brand-gradient text-white font-bold text-lg flex items-center justify-center mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="funktionen" className="py-16 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Alles was du brauchst</h2>
          <p className="text-muted-foreground">Von der Schnellbewertung bis zur detaillierten Steuer-Simulation</p>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          <FeatureIcon icon={TrendingUp} label="Marktwert-Spanne" />
          <FeatureIcon icon={Calculator} label="Cashflow-Rechnung" />
          <FeatureIcon icon={FileText} label="Steuer-Simulation" />
          <FeatureIcon icon={LineChart} label="Interaktive Grafiken" />
          <FeatureIcon icon={Bot} label="KI-Berater" />
        </div>
      </section>

      {/* ═══ PRODUCT SHOWCASE ═══ */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          {/* Screenshot placeholder */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-border overflow-hidden p-4">
            <div className="rounded-lg bg-card border border-border p-4 space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
                <span className="text-xs text-muted-foreground ml-2">WasImmoWert Dashboard</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {['Cashflow +320€', 'Rendite 5,2%', 'Faktor 22,1', 'AfA -4.800€'].map((v) => (
                  <div key={v} className="rounded-lg bg-muted/50 p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">{v.split(' ')[0]}</p>
                    <p className="text-sm font-bold">{v.split(' ').slice(1).join(' ')}</p>
                  </div>
                ))}
              </div>
              <div className="h-24 rounded-lg bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-200/30 flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-blue-500/40" />
              </div>
            </div>
          </div>

          {/* Feature list */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Marktwert-Spanne & Annahmen</h2>
            <p className="text-muted-foreground mb-6">Alle wichtigen Kennzahlen in einem übersichtlichen Dashboard</p>
            <ul className="space-y-3">
              {[
                'Marktwert-Spanne & Annahmen',
                'Monatlicher Cashflow',
                'Steuer-Effekt (AfA)',
                'Szenarien im Vergleich',
                'Cashflow-Rechnung über 30 Jahre',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm">
                  <div className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <svg className="h-3 w-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex gap-3 mt-6">
              <button onClick={() => scrollTo('hero-form')} className="btn-brand px-5 py-2.5 rounded-xl text-sm">
                Jetzt kostenlos starten
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <PricingSection onSelectPlan={(plan) => {
        if (plan === 'free') {
          scrollTo('hero-form')
        } else {
          if (isAuthenticated()) {
            setSelectedPlan(plan)
            setSubscriptionOpen(true)
          } else {
            setLoginOpen(true)
          }
        }
      }} />

      {/* ═══ FAQ ═══ */}
      <section id="faq" className="py-16 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Häufige Fragen</h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item) => (
              <FaqItem key={item.q} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-border py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-4 gap-8">
          <div>
            <Logo size="sm" className="mb-3" />
            <p className="text-xs text-muted-foreground">
              Immobilienbewertung mit Cashflow-Analyse, Steuer-Simulation und KI-Beratung.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Produkt</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><button onClick={() => scrollTo('funktionen')} className="hover:text-foreground transition-colors">Funktionen</button></li>
              <li><button onClick={() => scrollTo('preise')} className="hover:text-foreground transition-colors">Preise</button></li>
              <li><button onClick={() => scrollTo('faq')} className="hover:text-foreground transition-colors">FAQ</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Rechtliches</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><a href="/legal/datenschutz" className="hover:text-foreground transition-colors">Datenschutz</a></li>
              <li><a href="/legal/impressum" className="hover:text-foreground transition-colors">Impressum</a></li>
              <li><a href="/legal/agb" className="hover:text-foreground transition-colors">AGB</a></li>
              <li><a href="/legal/cookies" className="hover:text-foreground transition-colors">Cookie-Einstellungen</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Kontakt</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><a href="/help/kontakt" className="hover:text-foreground transition-colors">Kontaktformular</a></li>
              <li><a href="/help/support" className="hover:text-foreground transition-colors">Support</a></li>
              <li><a href="/help/feedback" className="hover:text-foreground transition-colors">Feedback</a></li>
              <li><a href="/help/presse" className="hover:text-foreground transition-colors">Presse</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} WasImmoWert. Alle Rechte vorbehalten.</p>
          <div className="flex gap-4 mt-2 sm:mt-0">
            <a href="/legal/datenschutz" className="hover:text-foreground">Datenschutz</a>
            <a href="/legal/agb" className="hover:text-foreground">AGB</a>
            <a href="/legal/impressum" className="hover:text-foreground">Impressum</a>
          </div>
        </div>
      </footer>

      {/* Login Dialog – after auth, create project and navigate */}
      <LoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSuccess={handleAuthSuccess}
        subtitle="Melde dich kostenlos an, um deine Detailanalyse zu sehen und dein Projekt zu speichern. Deine eingegebenen Daten werden automatisch übernommen."
      />

      {/* Subscription Modal */}
      <SubscriptionModal
        open={subscriptionOpen}
        onOpenChange={setSubscriptionOpen}
        selectedPlan={selectedPlan}
      />
    </div>
  )
}

/* ─── FAQ Accordion Item ─── */
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-5 py-4 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        <span>{question}</span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  )
}
