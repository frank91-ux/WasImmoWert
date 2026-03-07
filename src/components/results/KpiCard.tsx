import { Card, CardContent } from '@/components/ui/card'
import { ExplanationTooltip } from '@/components/shared/ExplanationTooltip'
import { KpiGauge } from './KpiGauge'
import type { KpiThreshold } from '@/i18n/kpiInfo'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: string
  tooltip?: string
  trend?: 'positive' | 'negative' | 'neutral'
  subtitle?: string
  example?: string
  className?: string
  onClick?: () => void
  gaugeValue?: number
  gaugeThreshold?: KpiThreshold
}

export function KpiCard({ label, value, tooltip, trend, subtitle, example, className, onClick, gaugeValue, gaugeThreshold }: KpiCardProps) {
  const trendColor = trend === 'positive' ? 'text-success'
    : trend === 'negative' ? 'text-destructive'
    : 'text-foreground'

  return (
    <Card
      className={cn('hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200', onClick && 'cursor-pointer', className)}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="text-sm text-muted-foreground mb-1">
          {tooltip ? (
            <ExplanationTooltip term={tooltip}>{label}</ExplanationTooltip>
          ) : (
            label
          )}
        </div>
        <div className={cn('text-2xl font-bold tabular-nums', trendColor)}>
          {value}
        </div>
        {subtitle && (
          <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
        )}
        {gaugeValue !== undefined && gaugeThreshold && (
          <KpiGauge
            value={gaugeValue}
            thresholds={{ good: gaugeThreshold.good, medium: gaugeThreshold.medium }}
            direction={gaugeThreshold.direction}
            min={gaugeThreshold.min}
            max={gaugeThreshold.max}
          />
        )}
        {example && (
          <div className="text-[0.65rem] text-muted-foreground mt-1.5 pt-1.5 border-t border-dashed leading-relaxed">
            {example}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
