import { useEffect } from 'react'
import { useDashboardStore } from '@/store/useDashboardStore'
import { getWidgetsForSection, type WidgetDefinition } from '@/lib/widget-registry'
import { Switch } from '@/components/ui/switch'
import { Tooltip } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Info, RotateCcw, X } from 'lucide-react'

const SECTION_LABELS: Record<string, string> = {
  uebersicht: 'Übersicht',
  cashflow: 'Cashflow',
  steuer: 'Steuer',
  simulationen: 'Simulationen',
  marktvergleich: 'Marktvergleich',
  empfehlung: 'Empfehlung',
  'ki-berater': 'KI-Berater',
}

const CATEGORY_LABELS: Record<string, string> = {
  kpi: 'Kennzahlen',
  chart: 'Diagramme',
  card: 'Karten',
  simulation: 'Simulationen',
  table: 'Tabellen',
}

const CATEGORY_ORDER = ['kpi', 'simulation', 'chart', 'card', 'table']

interface WidgetDrawerProps {
  activeSection: string
}

export function WidgetDrawer({ activeSection }: WidgetDrawerProps) {
  const {
    widgetDrawerOpen,
    toggleWidgetDrawer,
    getWidgetsForSection: getEnabledWidgets,
    toggleWidget,
    resetSection,
  } = useDashboardStore()

  const availableWidgets = getWidgetsForSection(activeSection)
  const enabledWidgets = getEnabledWidgets(activeSection)
  const hasWidgets = availableWidgets.length > 0

  // Group by category
  const grouped = CATEGORY_ORDER
    .map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat] ?? cat,
      widgets: availableWidgets.filter((w) => w.category === cat),
    }))
    .filter((g) => g.widgets.length > 0)

  // Close on Escape
  useEffect(() => {
    if (!widgetDrawerOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') toggleWidgetDrawer()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [widgetDrawerOpen, toggleWidgetDrawer])

  if (!widgetDrawerOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] transition-opacity"
        onClick={toggleWidgetDrawer}
        aria-hidden
      />

      {/* Slide-over panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-[300px] max-w-[85vw] bg-card border-l shadow-xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <div>
            <h2 className="text-sm font-semibold">Widgets</h2>
            <p className="text-[11px] text-muted-foreground">
              {SECTION_LABELS[activeSection] ?? activeSection}
            </p>
          </div>
          <button
            onClick={toggleWidgetDrawer}
            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {!hasWidgets ? (
            <p className="text-xs text-muted-foreground py-2">
              Für diesen Tab gibt es keine konfigurierbaren Widgets.
            </p>
          ) : (
            <>
              {grouped.map((group) => (
                <div key={group.category}>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {group.widgets.map((widget) => (
                      <WidgetRow
                        key={widget.id}
                        widget={widget}
                        isEnabled={enabledWidgets.includes(widget.id)}
                        onToggle={() => toggleWidget(activeSection, widget.id)}
                        isLocked={widget.id === 'kpiOverview'}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        {hasWidgets && (
          <div className="px-4 py-3 border-t shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => resetSection(activeSection)}
              className="w-full gap-1.5 text-muted-foreground text-xs"
            >
              <RotateCcw className="h-3 w-3" />
              Zurücksetzen
            </Button>
          </div>
        )}
      </div>
    </>
  )
}

function WidgetRow({
  widget,
  isEnabled,
  onToggle,
  isLocked,
}: {
  widget: WidgetDefinition
  isEnabled: boolean
  onToggle: () => void
  isLocked: boolean
}) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-1 rounded-md hover:bg-muted/50 transition-colors group">
      <Switch
        checked={isEnabled}
        onCheckedChange={onToggle}
        disabled={isLocked}
        className="shrink-0"
      />
      <span className="text-xs font-medium flex-1 min-w-0 truncate">
        {widget.title}
      </span>
      <Tooltip content={widget.description}>
        <span className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-help">
          <Info className="h-3.5 w-3.5" />
        </span>
      </Tooltip>
    </div>
  )
}
