import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { LayoutGrid, Table2 } from 'lucide-react'

export type ViewMode = 'grid' | 'table'
export type FilterPreset = 'all' | 'positive-cashflow' | 'rendite-4' | 'eigennutzung' | 'vermietung'

interface ProjectFilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  filter: FilterPreset
  onFilterChange: (value: FilterPreset) => void
  view: ViewMode
  onViewChange: (value: ViewMode) => void
}

const filterOptions = [
  { value: 'all', label: 'Alle Projekte' },
  { value: 'positive-cashflow', label: 'Positiver Cashflow' },
  { value: 'rendite-4', label: 'Rendite > 4%' },
  { value: 'eigennutzung', label: 'Eigennutzung' },
  { value: 'vermietung', label: 'Vermietung' },
]

export function ProjectFilterBar({ search, onSearchChange, filter, onFilterChange, view, onViewChange }: ProjectFilterBarProps) {
  return (
    <div className="flex items-center gap-3">
      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Suchen..."
        className="max-w-xs h-9"
      />
      <Select
        value={filter}
        onChange={(e) => onFilterChange(e.target.value as FilterPreset)}
        options={filterOptions}
        className="h-9 w-48"
      />
      <div className="flex rounded-md overflow-hidden border ml-auto">
        <button
          className={`p-1.5 transition-colors ${view === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
          onClick={() => onViewChange('grid')}
          aria-label="Grid-Ansicht"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
        <button
          className={`p-1.5 transition-colors ${view === 'table' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
          onClick={() => onViewChange('table')}
          aria-label="Tabellen-Ansicht"
        >
          <Table2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
