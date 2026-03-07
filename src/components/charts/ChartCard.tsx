import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { HelpCircle } from 'lucide-react'

export type TimeRange = '3' | '10' | '15' | 'end'

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '3', label: '3J' },
  { value: '10', label: '10J' },
  { value: '15', label: '15J' },
  { value: 'end', label: 'Ende' },
]

interface ChartCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  timeRange?: TimeRange
  onTimeRangeChange?: (range: TimeRange) => void
  onInfoClick?: () => void
}

export function ChartCard({ title, subtitle, children, className, timeRange, onTimeRangeChange, onInfoClick }: ChartCardProps) {
  return (
    <Card className={`shadow-sm hover:shadow-md transition-shadow h-full flex flex-col ${className || ''}`} style={{ overflow: 'visible' }}>
      <CardHeader className="pb-1 pt-3 px-4 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              {onInfoClick ? (
                <CardTitle
                  className="text-sm leading-tight cursor-pointer hover:text-primary transition-colors"
                  onClick={onInfoClick}
                >
                  {title}
                </CardTitle>
              ) : (
                <CardTitle className="text-sm leading-tight">{title}</CardTitle>
              )}
              {onInfoClick && (
                <button
                  type="button"
                  onClick={onInfoClick}
                  className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                  title="Info anzeigen"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {subtitle && <CardDescription className="text-[10px] leading-tight">{subtitle}</CardDescription>}
          </div>
          {onTimeRangeChange && timeRange && (
            <div className="flex items-center bg-muted/60 rounded-md p-0.5 shrink-0">
              {TIME_RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onTimeRangeChange(opt.value)}
                  className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all ${
                    timeRange === opt.value
                      ? 'bg-white dark:bg-card text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-2 pt-0 flex-1 min-h-0">
        {children}
      </CardContent>
    </Card>
  )
}
