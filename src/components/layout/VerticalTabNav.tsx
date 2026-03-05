import type { ReactNode } from 'react'

export interface SectionDef {
  id: string
  label: string
  icon: ReactNode
}

interface VerticalTabNavProps {
  sections: SectionDef[]
  activeSection: string
  onSectionClick: (id: string) => void
}

export function VerticalTabNav({ sections, activeSection, onSectionClick }: VerticalTabNavProps) {
  return (
    <nav className="hidden lg:flex sticky top-4 flex-col gap-0.5 w-40 shrink-0 self-start">
      {sections.map((section) => {
        const isActive = section.id === activeSection
        return (
          <button
            key={section.id}
            onClick={() => onSectionClick(section.id)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left ${
              isActive
                ? 'bg-primary/10 text-primary font-medium shadow-sm'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">{section.icon}</span>
            <span className="truncate">{section.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
