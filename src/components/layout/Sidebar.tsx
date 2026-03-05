import { useState, useRef, useEffect, useCallback } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Plus, Building2, GitCompare, LayoutDashboard, FolderOpen,
  GripVertical, Pencil, Copy, Trash2, Settings, Search,
  TrendingUp, DollarSign, BarChart3, MapPin, ChevronLeft,
  ChevronRight as ChevronRightIcon,
  PieChart, Receipt, FileText, LineChart, Briefcase,
} from 'lucide-react'
import { SettingsPanel } from '@/components/shared/SettingsPanel'
import { cn } from '@/lib/utils'
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
import type { Project } from '@/calc/types'

/* ─── Context Menu ─── */
interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  projectId: string
}

/* ─── Sortable Project Item ─── */
interface SortableProjectItemProps {
  project: Project
  isActive: boolean
  onClick: () => void
  onContextMenu: (e: React.MouseEvent) => void
  isRenaming: boolean
  renameValue: string
  onRenameChange: (v: string) => void
  onRenameSubmit: () => void
  onRenameCancel: () => void
  collapsed: boolean
}

function SortableProjectItem({
  project,
  isActive,
  onClick,
  onContextMenu,
  isRenaming,
  renameValue,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
  collapsed,
}: SortableProjectItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
  })
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isRenaming])

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <li ref={setNodeRef} style={style}>
      <button
        className={cn(
          'sidebar-nav-item group',
          isActive && 'active'
        )}
        onClick={onClick}
        onContextMenu={onContextMenu}
        title={collapsed ? project.name : undefined}
      >
        {!collapsed && (
          <span
            className="cursor-grab active:cursor-grabbing p-0.5 opacity-0 group-hover:opacity-70 transition-opacity shrink-0"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </span>
        )}
        <Building2 className="h-4 w-4 shrink-0" />
        {!collapsed && (
          isRenaming ? (
            <input
              ref={inputRef}
              className="flex-1 bg-white/10 border border-white/20 rounded px-1 py-0 text-sm min-w-0 text-white"
              value={renameValue}
              onChange={(e) => onRenameChange(e.target.value)}
              onBlur={onRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onRenameSubmit()
                if (e.key === 'Escape') onRenameCancel()
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate">{project.name}</span>
          )
        )}
      </button>
    </li>
  )
}

/* ─── Sidebar ─── */
export function Sidebar() {
  const { projects, activeProjectId, setActiveProject, addProject, updateProject, duplicateProject, deleteProject, reorderProjects } = useProjectStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { id: currentId } = useParams()

  const [collapsed, setCollapsed] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Context menu state
  const [ctxMenu, setCtxMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, projectId: '' })

  // Rename state
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Sensors with distance constraint to distinguish click vs drag
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // Close context menu on outside click
  useEffect(() => {
    if (!ctxMenu.visible) return
    const handler = () => setCtxMenu((prev) => ({ ...prev, visible: false }))
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [ctxMenu.visible])

  const handleNewProject = () => {
    navigate('/projects/new')
  }

  const handleProjectClick = (id: string) => {
    if (renamingId) return
    setActiveProject(id)
    navigate(`/projects/${id}`)
  }

  const handleContextMenu = useCallback((e: React.MouseEvent, projectId: string) => {
    e.preventDefault()
    setCtxMenu({ visible: true, x: e.clientX, y: e.clientY, projectId })
  }, [])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = projects.findIndex((p) => p.id === active.id)
    const newIndex = projects.findIndex((p) => p.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const newOrder = [...projects.map((p) => p.id)]
    newOrder.splice(oldIndex, 1)
    newOrder.splice(newIndex, 0, active.id as string)
    reorderProjects(newOrder)
  }

  // Context menu actions
  const startRename = () => {
    const project = projects.find((p) => p.id === ctxMenu.projectId)
    if (!project) return
    setRenamingId(project.id)
    setRenameValue(project.name)
    setCtxMenu((prev) => ({ ...prev, visible: false }))
  }

  const handleRenameSubmit = () => {
    if (renamingId && renameValue.trim()) {
      updateProject(renamingId, { name: renameValue.trim() })
    }
    setRenamingId(null)
    setRenameValue('')
  }

  const handleRenameCancel = () => {
    setRenamingId(null)
    setRenameValue('')
  }

  const handleDuplicate = () => {
    const dup = duplicateProject(ctxMenu.projectId)
    setCtxMenu((prev) => ({ ...prev, visible: false }))
    if (dup) navigate(`/projects/${dup.id}`)
  }

  const handleDeleteClick = () => {
    setConfirmDeleteId(ctxMenu.projectId)
    setCtxMenu((prev) => ({ ...prev, visible: false }))
  }

  const confirmDelete = () => {
    if (confirmDeleteId) {
      deleteProject(confirmDeleteId)
      if (currentId === confirmDeleteId) navigate('/')
    }
    setConfirmDeleteId(null)
  }

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

  const filteredProjects = searchQuery
    ? projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : projects

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 h-16 shrink-0', collapsed && 'justify-center px-2')}>
        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-bold text-sm text-white truncate">Was-Immo-Wert</div>
            <div className="text-xs text-sidebar-foreground/60 truncate">Immobilien Analyse</div>
          </div>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 mb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-sidebar-foreground/40" />
            <input
              type="text"
              placeholder="Suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-8 pr-3 rounded-lg bg-sidebar-muted/50 border border-white/10 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-auto px-2 space-y-4">
        {/* PROJEKTE section — ganz oben */}
        {projects.length > 0 && (
          <>
            {!collapsed && (
              <div className="px-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-sidebar-foreground/40">
                Projekte
              </div>
            )}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={filteredProjects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                <ul className="space-y-0.5">
                  {filteredProjects.map((p) => (
                    <SortableProjectItem
                      key={p.id}
                      project={p}
                      isActive={currentId === p.id || activeProjectId === p.id}
                      onClick={() => handleProjectClick(p.id)}
                      onContextMenu={(e) => handleContextMenu(e, p.id)}
                      isRenaming={renamingId === p.id}
                      renameValue={renameValue}
                      onRenameChange={setRenameValue}
                      onRenameSubmit={handleRenameSubmit}
                      onRenameCancel={handleRenameCancel}
                      collapsed={collapsed}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          </>
        )}

        {/* ÜBERSICHT section */}
        {!collapsed && (
          <div className="px-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-sidebar-foreground/40">
            Übersicht
          </div>
        )}
        <div className="space-y-0.5">
          <button
            className={cn('sidebar-nav-item', isActive('/projects') && location.pathname === '/projects' && 'active')}
            onClick={() => navigate('/projects')}
            title={collapsed ? 'Dashboard' : undefined}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Dashboard</span>}
          </button>
          <button
            className={cn('sidebar-nav-item', isActive('/projects/new') && 'active')}
            onClick={() => navigate('/projects/new')}
            title={collapsed ? 'Bewertung' : undefined}
          >
            <TrendingUp className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Bewertung</span>}
          </button>
          <button
            className={cn('sidebar-nav-item', isActive('/compare') && 'active')}
            onClick={() => navigate('/compare')}
            title={collapsed ? 'Vergleichen' : undefined}
          >
            <GitCompare className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Vergleichen</span>}
          </button>
        </div>

        {/* FINANZEN section */}
        {!collapsed && (
          <div className="px-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-sidebar-foreground/40">
            Finanzen
          </div>
        )}
        <div className="space-y-0.5">
          <button
            className={cn('sidebar-nav-item', isActive('/portfolio') && 'active')}
            onClick={() => navigate('/portfolio')}
            title={collapsed ? 'Portfolio' : undefined}
          >
            <Briefcase className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Portfolio</span>}
          </button>
          {!collapsed && projects.filter((p) => p.isInPortfolio).length > 0 && (
            <ul className="ml-2 space-y-0.5">
              {projects.filter((p) => p.isInPortfolio).map((p) => (
                <li key={p.id}>
                  <button
                    className={cn(
                      'sidebar-nav-item text-xs py-1.5',
                      currentId === p.id && 'active',
                    )}
                    onClick={() => { setActiveProject(p.id); navigate(`/projects/${p.id}`) }}
                  >
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{p.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            className="sidebar-nav-item"
            onClick={() => navigate('/projects')}
            title={collapsed ? 'Einnahmen' : undefined}
          >
            <DollarSign className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Einnahmen</span>}
          </button>
          <button
            className="sidebar-nav-item"
            onClick={() => navigate('/projects')}
            title={collapsed ? 'Ausgaben' : undefined}
          >
            <Receipt className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Ausgaben</span>}
          </button>
        </div>
      </nav>

      {/* New project button */}
      <div className="px-3 py-2">
        <Button
          onClick={handleNewProject}
          className={cn(
            'w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0',
            collapsed && 'px-0'
          )}
          size="sm"
        >
          <Plus className="h-4 w-4" />
          {!collapsed && <span>Neues Projekt</span>}
        </Button>
      </div>

      {/* Bottom: Settings + Collapse */}
      <div className="border-t border-white/10 p-2 space-y-0.5">
        <button
          className="sidebar-nav-item"
          onClick={() => setSettingsOpen(true)}
          title={collapsed ? 'Einstellungen' : undefined}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Einstellungen</span>}
        </button>
        <button
          className="sidebar-nav-item"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Sidebar erweitern' : 'Sidebar minimieren'}
        >
          {collapsed ? (
            <ChevronRightIcon className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span>Minimieren</span>
            </>
          )}
        </button>
      </div>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Context Menu */}
      {ctxMenu.visible && (
        <div
          className="fixed z-50 min-w-[160px] bg-popover border rounded-lg shadow-lg py-1"
          style={{ left: ctxMenu.x, top: ctxMenu.y }}
        >
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
            onClick={startRename}
          >
            <Pencil className="h-3.5 w-3.5" />
            Umbenennen
          </button>
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
            onClick={handleDuplicate}
          >
            <Copy className="h-3.5 w-3.5" />
            Duplizieren
          </button>
          <div className="border-t my-1" />
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-left text-red-600"
            onClick={handleDeleteClick}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Löschen
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-popover border rounded-lg shadow-lg p-5 max-w-sm mx-4 space-y-3">
            <h3 className="font-semibold text-sm">Projekt löschen?</h3>
            <p className="text-sm text-muted-foreground">
              Möchten Sie dieses Projekt wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setConfirmDeleteId(null)}>
                Abbrechen
              </Button>
              <Button size="sm" variant="destructive" onClick={confirmDelete}>
                Löschen
              </Button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
