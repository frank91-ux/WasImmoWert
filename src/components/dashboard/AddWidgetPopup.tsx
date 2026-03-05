import { WIDGET_REGISTRY, type WidgetDefinition } from '@/lib/widget-registry'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, BarChart3, PieChart, LayoutGrid, CreditCard } from 'lucide-react'

interface AddWidgetPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingWidgets: string[]
  onAdd: (widgetId: string) => void
}

const CATEGORY_ICONS: Record<string, typeof BarChart3> = {
  kpi: LayoutGrid,
  chart: BarChart3,
  table: PieChart,
  card: CreditCard,
}

const CATEGORY_LABELS: Record<string, string> = {
  kpi: 'KPI',
  chart: 'Chart',
  table: 'Tabelle',
  card: 'Karte',
}

export function AddWidgetPopup({ open, onOpenChange, existingWidgets, onAdd }: AddWidgetPopupProps) {
  const availableWidgets = WIDGET_REGISTRY.filter((w) => !existingWidgets.includes(w.id))

  const groupedWidgets = availableWidgets.reduce<Record<string, WidgetDefinition[]>>(
    (acc, w) => {
      if (!acc[w.category]) acc[w.category] = []
      acc[w.category].push(w)
      return acc
    },
    {},
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Widget hinzufügen</DialogTitle>
        </DialogHeader>

        {availableWidgets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Alle verfügbaren Widgets sind bereits hinzugefügt.
          </p>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedWidgets).map(([category, widgets]) => {
              const Icon = CATEGORY_ICONS[category] || BarChart3
              return (
                <div key={category}>
                  <div className="flex items-center gap-1.5 mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />
                    {CATEGORY_LABELS[category] || category}
                  </div>
                  <div className="space-y-2">
                    {widgets.map((widget) => (
                      <div
                        key={widget.id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-colors group cursor-pointer"
                        onClick={() => {
                          onAdd(widget.id)
                          onOpenChange(false)
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{widget.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{widget.description}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
