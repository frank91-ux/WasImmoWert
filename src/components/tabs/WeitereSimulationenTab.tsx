import type { ReactNode } from 'react'
import type { Project, CalculationResult } from '@/calc/types'
import { useUiStore } from '@/store/useUiStore'
import { VerkaufSimulation } from '@/components/simulation/VerkaufSimulation'
import { ZinsSimulation } from '@/components/simulation/ZinsSimulation'
import { MietsteigerungSimulation } from '@/components/simulation/MietsteigerungSimulation'
import { AnschlussfinanzierungCard } from '@/components/simulation/AnschlussfinanzierungCard'
import { SimulationView } from '@/components/simulation/SimulationView'
import { CashflowChart } from '@/components/charts/CashflowChart'
import { ThreeYearCostChart } from '@/components/charts/ThreeYearCostChart'
import { InvestmentComparisonChart } from '@/components/charts/InvestmentComparisonChart'
import { EquityGrowthChart } from '@/components/charts/EquityGrowthChart'
import { TilgungsplanChart } from '@/components/charts/TilgungsplanChart'
import { GripVertical } from 'lucide-react'
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

function SortableChartItem({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <div ref={setNodeRef} style={style} className="relative group/chart">
      <span
        className="absolute top-2 right-2 cursor-grab active:cursor-grabbing text-muted-foreground opacity-0 group-hover/chart:opacity-60 transition-opacity z-10 p-1 rounded hover:bg-muted"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </span>
      {children}
    </div>
  )
}

interface WeitereSimulationenTabProps {
  project: Project
  result: CalculationResult
  onChange: (updates: Partial<Project>) => void
}

export function WeitereSimulationenTab({ project, result, onChange }: WeitereSimulationenTabProps) {
  const { chartOrder, setChartOrder } = useUiStore()

  const chartSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } })
  )

  const analyseChartIds = chartOrder.filter((id) =>
    ['tilgungsplanChart', 'cashflowEquityCharts', 'investmentComparison', 'threeYearCost'].includes(id)
  )
  // Ensure new charts appear if not in persisted order
  if (!analyseChartIds.includes('threeYearCost')) {
    analyseChartIds.unshift('threeYearCost')
  }

  const handleChartDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const currentOrder = [...chartOrder]
    const oldIndex = currentOrder.indexOf(active.id as string)
    const newIndex = currentOrder.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    currentOrder.splice(oldIndex, 1)
    currentOrder.splice(newIndex, 0, active.id as string)
    setChartOrder(currentOrder)
  }

  return (
    <div className="space-y-6">
      <VerkaufSimulation project={project} result={result} />
      <ZinsSimulation project={project} result={result} />
      <MietsteigerungSimulation project={project} result={result} />
      <AnschlussfinanzierungCard project={project} result={result} />

      <DndContext sensors={chartSensors} collisionDetection={closestCenter} onDragEnd={handleChartDragEnd}>
        <SortableContext items={analyseChartIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-6">
            {analyseChartIds.map((chartId) => {
              switch (chartId) {
                case 'tilgungsplanChart':
                  return (
                    <SortableChartItem key={chartId} id={chartId}>
                      <TilgungsplanChart projection={result.projection} zinsbindung={project.zinsbindung} zinsbindungPeriods={project.zinsbindungPeriods} />
                    </SortableChartItem>
                  )
                case 'threeYearCost':
                  return (
                    <SortableChartItem key={chartId} id={chartId}>
                      <ThreeYearCostChart result={result} nutzungsart={project.nutzungsart} />
                    </SortableChartItem>
                  )
                case 'cashflowEquityCharts':
                  return (
                    <SortableChartItem key={chartId} id={chartId}>
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <CashflowChart result={result} nutzungsart={project.nutzungsart} zinsbindung={project.zinsbindung} zinsbindungPeriods={project.zinsbindungPeriods} />
                        <EquityGrowthChart projection={result.projection} zinsbindung={project.zinsbindung} zinsbindungPeriods={project.zinsbindungPeriods} />
                      </div>
                    </SortableChartItem>
                  )
                case 'investmentComparison':
                  return (
                    <SortableChartItem key={chartId} id={chartId}>
                      <InvestmentComparisonChart
                        comparison={result.investmentComparison}
                        eigenkapital={project.eigenkapital}
                        etfRendite={project.etfRendite}
                      />
                    </SortableChartItem>
                  )
                default:
                  return null
              }
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
