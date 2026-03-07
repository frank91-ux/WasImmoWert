import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useProjectStore } from '@/store/useProjectStore'
import { useCalculation } from '@/hooks/useCalculation'
import { EigennutzungSetupDialog } from '@/components/inputs/EigennutzungSetupDialog'
import { ParameterSlider } from '@/components/simulation/ParameterSlider'
import { KpiOverview } from '@/components/results/KpiOverview'
import { LeistbarkeitsCheck } from '@/components/results/LeistbarkeitsCheck'
import { CashflowTab } from '@/components/tabs/CashflowTab'
import { SteuerSimulationTab } from '@/components/tabs/SteuerSimulationTab'
import { WeitereSimulationenTab } from '@/components/tabs/WeitereSimulationenTab'
import { EmpfehlungTab } from '@/components/tabs/EmpfehlungTab'
import { MarktvergleichTab } from '@/components/tabs/MarktvergleichTab'
import { KiBeraterTab } from '@/components/tabs/KiBeraterTab'
import { EtvProtokolleTab } from '@/components/tabs/EtvProtokolleTab'
import { HorizontalTabBar, type SectionDef } from '@/components/layout/HorizontalTabBar'
import { DashboardSection } from '@/components/dashboard/DashboardSection'
import { WidgetDrawer } from '@/components/dashboard/WidgetDrawer'
import { BUNDESLAND_LABELS } from '@/calc/grunderwerbsteuer'
import { RentabilitaetBadge } from '@/components/results/RentabilitaetBadge'
import { RentabilitaetDialog } from '@/components/results/RentabilitaetDialog'
import { calculateRentabilitaet } from '@/calc/rentabilitaet'
import { berechneMarktvergleich } from '@/data/marktdaten'
import { ProjectHeaderKpis } from '@/components/results/ProjectHeaderKpis'
import { GrunddatenEditDialog } from '@/components/inputs/GrunddatenEditDialog'
import { MapPreview } from '@/components/shared/MapPreview'
import { MonthlyCashflowChart } from '@/components/charts/MonthlyCashflowChart'
import { WertentwicklungChart } from '@/components/charts/WertentwicklungChart'
import { InvestmentComparisonChart } from '@/components/charts/InvestmentComparisonChart'
import { ThreeYearCostChart } from '@/components/charts/ThreeYearCostChart'
import { CashflowChart } from '@/components/charts/CashflowChart'
import { TilgungsplanChart } from '@/components/charts/TilgungsplanChart'
import { EquityGrowthChart } from '@/components/charts/EquityGrowthChart'
import { FinancingPieChart } from '@/components/charts/FinancingPieChart'
import { CostBreakdownPieChart } from '@/components/charts/CostBreakdownPieChart'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatEur } from '@/lib/format'
import {
  Pencil,
  LayoutDashboard,
  Wallet,
  FileText,
  BarChart3,
  MapPin,
  Star,
  Bot,
  Briefcase,
  ClipboardList,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Project } from '@/calc/types'

const TAB_IDS = [
  'uebersicht',
  'cashflow',
  'steuer',
  'simulationen',
  'marktvergleich',
  'empfehlung',
  'ki-berater',
  'etv-protokolle',
] as const

type TabId = (typeof TAB_IDS)[number]

const SECTIONS: SectionDef[] = [
  { id: 'uebersicht', label: 'Übersicht', icon: <LayoutDashboard /> },
  { id: 'cashflow', label: 'Cashflow', icon: <Wallet /> },
  { id: 'steuer', label: 'Steuer', icon: <FileText /> },
  { id: 'simulationen', label: 'Simulationen', icon: <BarChart3 /> },
  { id: 'marktvergleich', label: 'Marktvergleich', icon: <MapPin /> },
  { id: 'empfehlung', label: 'Empfehlung', icon: <Star /> },
  { id: 'ki-berater', label: 'KI-Berater', icon: <Bot /> },
  { id: 'etv-protokolle', label: 'ETV-Protokolle', icon: <ClipboardList /> },
]

export function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { projects, loaded, loadProjects, updateProject, setActiveProject, togglePortfolio } = useProjectStore()

  // Tab state — read initial tab from URL
  const initialTab = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState<TabId>(
    initialTab && TAB_IDS.includes(initialTab as TabId) ? (initialTab as TabId) : 'uebersicht',
  )

  // Sync tab to URL
  useEffect(() => {
    if (activeTab !== 'uebersicht') {
      setSearchParams({ tab: activeTab }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
  }, [activeTab, setSearchParams])

  // Dialogs
  const [showEigennutzungSetup, setShowEigennutzungSetup] = useState(false)
  const [showRentabilitaet, setShowRentabilitaet] = useState(false)
  const [showGrunddaten, setShowGrunddaten] = useState(false)

  useEffect(() => {
    if (!loaded) loadProjects()
  }, [loaded, loadProjects])

  const project = projects.find((p) => p.id === id)
  const result = useCalculation(project ?? null)

  useEffect(() => {
    if (project) setActiveProject(project.id)
  }, [project, setActiveProject])

  const markt = useMemo(() => {
    if (!project || !project.wohnflaeche || project.wohnflaeche <= 0) return undefined
    const preisProQm = project.kaufpreis / project.wohnflaeche
    const mieteProQm = project.monatsmieteKalt / project.wohnflaeche
    return berechneMarktvergleich(preisProQm, mieteProQm, project.lat, project.lng)
  }, [project])

  const rentabilitaet = useMemo(
    () => result && project ? calculateRentabilitaet(result.kpis, project.nutzungsart, project, markt) : null,
    [result, project, markt],
  )

  if (!loaded) return null

  if (!project || !result || !rentabilitaet) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">Projekt nicht gefunden</p>
        <Button variant="link" onClick={() => navigate('/')}>Zurück zum Dashboard</Button>
      </div>
    )
  }

  const handleChange = (updates: Partial<Project>) => {
    updateProject(project.id, updates)
  }

  const handleEigennutzungToggle = () => {
    if (project.nutzungsart === 'eigennutzung') return
    setShowEigennutzungSetup(true)
  }

  const handleEigennutzungSetup = (data: { ersparteMiete: number; nettoJahresgehalt: number; monatlicheAusgaben: number }) => {
    handleChange({
      nutzungsart: 'eigennutzung',
      ersparteMiete: data.ersparteMiete,
      nettoJahresgehalt: data.nettoJahresgehalt,
      monatlicheAusgaben: data.monatlicheAusgaben,
    })
    setShowEigennutzungSetup(false)
  }

  const ekSliderMax = result.kaufnebenkosten.gesamtkosten

  // Widget renderer for DashboardSection
  const renderWidget = (widgetId: string) => {
    switch (widgetId) {
      case 'kpiOverview':
        return (
          <>
            <KpiOverview
              result={result}
              nutzungsart={project.nutzungsart}
              eigenkapital={project.eigenkapital}
              gesamtkosten={result.kaufnebenkosten.gesamtkosten}
              project={project}
            />
            {project.nutzungsart === 'eigennutzung' && (
              <LeistbarkeitsCheck project={project} result={result} onChange={handleChange} />
            )}
          </>
        )
      case 'schnellregler':
        return (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Schnellregler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ParameterSlider
                label="Kaufpreis"
                value={project.kaufpreis}
                min={50000}
                max={20000000}
                step={5000}
                unit="€"
                scale="log"
                onChange={(v) => handleChange({ kaufpreis: v })}
                formatValue={(v) => formatEur(v)}
              />
              <ParameterSlider
                label="Eigenkapital"
                value={project.eigenkapital}
                min={0}
                max={ekSliderMax}
                step={5000}
                unit="€"
                tooltip="eigenkapital"
                onChange={(v) => handleChange({ eigenkapital: v })}
                formatValue={(v) => formatEur(v)}
              />
              <ParameterSlider
                label="Zinssatz"
                value={project.zinssatz}
                min={0.5}
                max={8}
                step={0.1}
                unit="%"
                tooltip="zinssatz"
                onChange={(v) => handleChange({ zinssatz: v })}
                formatValue={(v) => `${v.toFixed(1)} %`}
              />
              <ParameterSlider
                label="Tilgung"
                value={project.tilgung}
                min={1}
                max={10}
                step={0.1}
                unit="%"
                tooltip="tilgung"
                onChange={(v) => handleChange({ tilgung: v })}
                formatValue={(v) => `${v.toFixed(1)} %`}
              />
              {project.nutzungsart === 'vermietung' ? (
                <ParameterSlider
                  label="Kaltmiete"
                  value={project.monatsmieteKalt}
                  min={100}
                  max={10000}
                  step={10}
                  unit="€/Mon"
                  onChange={(v) => handleChange({ monatsmieteKalt: v })}
                  formatValue={(v) => `${v.toLocaleString('de-DE')} €/Mon`}
                />
              ) : (
                <ParameterSlider
                  label="Ersparte Miete"
                  value={project.ersparteMiete}
                  min={0}
                  max={5000}
                  step={10}
                  unit="€/Mon"
                  onChange={(v) => handleChange({ ersparteMiete: v })}
                  formatValue={(v) => `${v.toLocaleString('de-DE')} €/Mon`}
                />
              )}
              <ParameterSlider
                label="Wertsteigerung"
                value={project.wertsteigerung}
                min={-5}
                max={8}
                step={0.5}
                unit="% p.a."
                tooltip="wertsteigerung"
                onChange={(v) => handleChange({ wertsteigerung: v })}
                formatValue={(v) => `${v.toFixed(1)} % p.a.`}
              />
            </CardContent>
          </Card>
        )
      case 'monthlyCashflow':
        return <MonthlyCashflowChart result={result} nutzungsart={project.nutzungsart} />
      case 'wertentwicklung':
        return <WertentwicklungChart projection={result.projection} />
      case 'investmentComparison':
        return (
          <InvestmentComparisonChart
            comparison={result.investmentComparison}
            eigenkapital={project.eigenkapital}
            etfRendite={project.etfRendite}
          />
        )
      case 'threeYearCost':
        return <ThreeYearCostChart result={result} nutzungsart={project.nutzungsart} />
      case 'cashflowChart':
        return (
          <CashflowChart
            result={result}
            nutzungsart={project.nutzungsart}
            zinsbindung={project.zinsbindung}
            zinsbindungPeriods={project.zinsbindungPeriods}
          />
        )
      case 'tilgungsplan':
        return (
          <TilgungsplanChart
            projection={result.projection}
            zinsbindung={project.zinsbindung}
            zinsbindungPeriods={project.zinsbindungPeriods}
          />
        )
      case 'equityGrowth':
        return (
          <EquityGrowthChart
            projection={result.projection}
            zinsbindung={project.zinsbindung}
            zinsbindungPeriods={project.zinsbindungPeriods}
          />
        )
      case 'financingPie':
        return (
          <FinancingPieChart
            result={result}
            kaufpreis={project.kaufpreis}
            eigenkapital={project.eigenkapital}
          />
        )
      case 'costBreakdownPie':
        return <CostBreakdownPieChart result={result} />
      case 'grunddaten':
        return (
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowGrunddaten(true)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                Grunddaten
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                {project.address && (
                  <div>
                    <span className="text-muted-foreground">Adresse</span>
                    <p className="font-medium truncate">{project.address}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Immobilientyp</span>
                  <p className="font-medium">{project.propertyType === 'wohnung' ? 'Wohnung' : 'Haus'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Bundesland</span>
                  <p className="font-medium">{BUNDESLAND_LABELS[project.bundesland]}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Wohnfläche</span>
                  <p className="font-medium">{project.wohnflaeche} m²</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Baujahr</span>
                  <p className="font-medium">{project.baujahr}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      case 'mapPreview':
        return project.lat != null && project.lng != null
          ? <MapPreview lat={project.lat} lng={project.lng} />
          : null
      default:
        return null
    }
  }

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId as TabId)
    // Scroll to top of content area when switching tabs
    const main = document.querySelector('main')
    if (main) main.scrollTo({ top: 0, behavior: 'instant' })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <button
              className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              onClick={() => setShowGrunddaten(true)}
              aria-label="Grunddaten bearbeiten"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
          <RentabilitaetBadge score={rentabilitaet} onClick={() => setShowRentabilitaet(true)} />
          <ProjectHeaderKpis kpis={result.kpis} nutzungsart={project.nutzungsart} result={result} project={project} />
          <div className="flex rounded-md overflow-hidden border">
            <button
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                project.nutzungsart === 'vermietung'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
              onClick={() => handleChange({ nutzungsart: 'vermietung' })}
            >
              Vermietung
            </button>
            <button
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                project.nutzungsart === 'eigennutzung'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
              onClick={handleEigennutzungToggle}
            >
              Eigennutzung
            </button>
          </div>
          <Button
            size="sm"
            variant={project.isInPortfolio ? 'default' : 'outline'}
            onClick={() => {
              togglePortfolio(project.id)
              toast.success(project.isInPortfolio ? 'Zurück zu Projekte verschoben' : 'Zum Portfolio hinzugefügt')
            }}
            className="gap-1.5"
          >
            <Briefcase className="h-3.5 w-3.5" />
            {project.isInPortfolio ? 'Im Portfolio' : 'Zum Portfolio'}
          </Button>
        </div>
      </div>

      {/* Horizontal Tab Navigation */}
      <HorizontalTabBar
        sections={SECTIONS}
        activeSection={activeTab}
        onSectionClick={handleTabClick}
      />

      {/* Active Tab Content — only the active tab is rendered */}
      <div className="pt-2">
        {activeTab === 'uebersicht' && (
          <DashboardSection renderWidget={renderWidget} />
        )}

        {activeTab === 'cashflow' && (
          <CashflowTab project={project} result={result} onChange={handleChange} />
        )}

        {activeTab === 'steuer' && (
          project.nutzungsart === 'eigennutzung' ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                Steuer-Simulation ist nur für Vermietungsobjekte verfügbar.
              </CardContent>
            </Card>
          ) : (
            <SteuerSimulationTab project={project} result={result} onChange={handleChange} />
          )
        )}

        {activeTab === 'simulationen' && (
          <WeitereSimulationenTab project={project} result={result} onChange={handleChange} />
        )}

        {activeTab === 'marktvergleich' && (
          <MarktvergleichTab project={project} result={result} />
        )}

        {activeTab === 'empfehlung' && (
          <EmpfehlungTab project={project} result={result} />
        )}

        {activeTab === 'ki-berater' && (
          <KiBeraterTab project={project} result={result} onChange={handleChange} />
        )}

        {activeTab === 'etv-protokolle' && (
          <EtvProtokolleTab project={project} />
        )}
      </div>

      {/* Widget Panel (Slide-Over) */}
      <WidgetDrawer activeSection={activeTab} />

      {/* Dialogs */}
      <EigennutzungSetupDialog
        open={showEigennutzungSetup}
        onOpenChange={setShowEigennutzungSetup}
        onSubmit={handleEigennutzungSetup}
        onCancel={() => {/* stays on vermietung */}}
        initialErsparteMiete={project.ersparteMiete}
        initialGehalt={project.nettoJahresgehalt}
        initialAusgaben={project.monatlicheAusgaben}
      />

      <RentabilitaetDialog
        open={showRentabilitaet}
        onOpenChange={setShowRentabilitaet}
        score={rentabilitaet}
        nutzungsart={project.nutzungsart}
      />

      <GrunddatenEditDialog
        open={showGrunddaten}
        onOpenChange={setShowGrunddaten}
        project={project}
        onChange={handleChange}
      />
    </div>
  )
}
