import { useState, type ReactNode } from 'react'
import { useDashboardStore } from '@/store/useDashboardStore'
import { AddWidgetPopup } from './AddWidgetPopup'
import { Button } from '@/components/ui/button'
import { GripVertical, X, Plus, RotateCcw } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortableWidget({
  id,
  children,
  onRemove,
  isRemovable,
}: {
  id: string
  children: ReactNode
  onRemove: () => void
  isRemovable: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group/widget">
      {/* Drag handle + remove button */}
      <div className="absolute top-2 right-2 z-10 flex gap-0.5 opacity-0 group-hover/widget:opacity-100 transition-opacity">
        <span
          className="cursor-grab active:cursor-grabbing text-muted-foreground p-1 rounded hover:bg-muted"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </span>
        {isRemovable && (
          <button
            onClick={onRemove}
            className="text-muted-foreground p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
            title="Widget entfernen"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

interface DashboardSectionProps {
  /** Function that renders a widget by ID */
  renderWidget: (widgetId: string) => ReactNode | null
}

export function DashboardSection({ renderWidget }: DashboardSectionProps) {
  const { overviewWidgets, addWidget, removeWidget, reorderWidgets, resetToDefaults } = useDashboardStore()
  const [addPopupOpen, setAddPopupOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = overviewWidgets.indexOf(active.id as string)
    const newIndex = overviewWidgets.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    const newOrder = [...overviewWidgets]
    newOrder.splice(oldIndex, 1)
    newOrder.splice(newIndex, 0, active.id as string)
    reorderWidgets(newOrder)
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={overviewWidgets} strategy={verticalListSortingStrategy}>
          <div className="space-y-6">
            {overviewWidgets.map((widgetId) => {
              const content = renderWidget(widgetId)
              if (!content) return null
              return (
                <SortableWidget
                  key={widgetId}
                  id={widgetId}
                  onRemove={() => removeWidget(widgetId)}
                  isRemovable={widgetId !== 'kpiOverview'}
                >
                  {content}
                </SortableWidget>
              )
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add widget + Reset buttons */}
      <div className="flex items-center gap-2 pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAddPopupOpen(true)}
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Widget hinzufügen
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetToDefaults}
          className="gap-1.5 text-muted-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Zurücksetzen
        </Button>
      </div>

      <AddWidgetPopup
        open={addPopupOpen}
        onOpenChange={setAddPopupOpen}
        existingWidgets={overviewWidgets}
        onAdd={addWidget}
      />
    </>
  )
}
