import type { ReactNode } from 'react'
import { Settings2 } from 'lucide-react'
import { useDashboardStore } from '@/store/useDashboardStore'
import { getWidgetsForSection } from '@/lib/widget-registry'

export interface SectionDef {
  id: string
  label: string
  icon: ReactNode
}

interface HorizontalTabBarProps {
  sections: SectionDef[]
  activeSection: string
  onSectionClick: (id: string) => void
}

export function HorizontalTabBar({ sections, activeSection, onSectionClick }: HorizontalTabBarProps) {
  const toggleWidgetDrawer = useDashboardStore((s) => s.toggleWidgetDrawer)

  // Only show widget gear if this section has configurable widgets
  const hasWidgets = getWidgetsForSection(activeSection).length > 0

  return (
    <div className="sticky top-0 z-30 bg-background border-b -mx-4 lg:-mx-6 px-4 lg:px-6">
      <div className="flex items-center">
        {/* Scrollable tab area */}
        <nav className="flex-1 flex gap-1 overflow-x-auto scrollbar-none py-1" role="tablist">
          {sections.map((section) => {
            const isActive = section.id === activeSection
            return (
              <button
                key={section.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onSectionClick(section.id)}
                className={`flex items-center gap-2 px-3 py-2.5 text-sm whitespace-nowrap rounded-md transition-colors relative shrink-0 ${
                  isActive
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">{section.icon}</span>
                <span>{section.label}</span>
                {/* Active indicator line */}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Widget settings button */}
        {hasWidgets && (
          <button
            onClick={toggleWidgetDrawer}
            className="shrink-0 ml-2 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Widgets konfigurieren"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
