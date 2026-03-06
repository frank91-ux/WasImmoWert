import type { ReactNode } from 'react'
import { useDashboardStore } from '@/store/useDashboardStore'
import { GripVertical, X } from 'lucide-react'
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
  const { getWidgetsForSection, toggleWidget, reorderWidgets } = useDashboardStore()
  const enabledWidgets = getWidgetsForSection('uebersicht')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = enabledWidgets.indexOf(active.id as string)
    const newIndex = enabledWidgets.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    const newOrder = [...enabledWidgets]
    newOrder.splice(oldIndex, 1)
    newOrder.splice(newIndex, 0, active.id as string)
    reorderWidgets('uebersicht', newOrder)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={enabledWidgets} strategy={verticalListSortingStrategy}>
        <div className="space-y-6">
          {enabledWidgets.map((widgetId) => {
            const content = renderWidget(widgetId)
            if (!content) return null
            return (
              <SortableWidget
                key={widgetId}
                id={widgetId}
                onRemove={() => toggleWidget('uebersicht', widgetId)}
                isRemovable={widgetId !== 'kpiOverview'}
              >
                {content}
              </SortableWidget>
            )
          })}
        </div>
      </SortableContext>
    </DndContext>
  )
}
