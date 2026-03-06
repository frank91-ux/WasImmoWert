interface KpiGaugeProps {
  value: number
  thresholds: { good: number; medium: number }
  direction: 'higher-better' | 'lower-better'
  min: number
  max: number
  unit?: string
}

export function KpiGauge({ value, thresholds, direction, min, max, unit = '' }: KpiGaugeProps) {
  const isHigherBetter = direction === 'higher-better'

  // Dynamic scaling: expand min/max if value is outside range
  const dynamicMin = Math.min(min, value - Math.abs(value) * 0.1)
  const dynamicMax = Math.max(max, value + Math.abs(value) * 0.1)
  const range = dynamicMax - dynamicMin
  if (range <= 0) return null

  const position = ((Math.max(dynamicMin, Math.min(dynamicMax, value)) - dynamicMin) / range) * 100

  // Calculate threshold positions on the dynamic scale
  const { good, medium } = thresholds
  const goodPos = Math.max(0, Math.min(100, ((good - dynamicMin) / range) * 100))
  const mediumPos = Math.max(0, Math.min(100, ((medium - dynamicMin) / range) * 100))

  const leftPos = isHigherBetter ? Math.min(mediumPos, goodPos) : Math.min(goodPos, mediumPos)
  const rightPos = isHigherBetter ? Math.max(mediumPos, goodPos) : Math.max(goodPos, mediumPos)

  // Determine value color based on zone
  const getValueColor = () => {
    if (isHigherBetter) {
      if (value >= good) return 'text-green-600 dark:text-green-400'
      if (value >= medium) return 'text-amber-600 dark:text-amber-400'
      return 'text-red-600 dark:text-red-400'
    } else {
      if (value <= good) return 'text-green-600 dark:text-green-400'
      if (value <= medium) return 'text-amber-600 dark:text-amber-400'
      return 'text-red-600 dark:text-red-400'
    }
  }

  // Format threshold labels
  const fmt = (v: number) => Number.isInteger(v) ? `${v}` : v.toFixed(1)

  // Determine left/right label values
  const leftLabel = isHigherBetter ? fmt(medium) : fmt(good)
  const rightLabel = isHigherBetter ? fmt(good) : fmt(medium)

  // Prevent label overlap with marker
  const leftLabelStyle = Math.abs(leftPos - position) < 12 ? { opacity: 0.4 } : {}
  const rightLabelStyle = Math.abs(rightPos - position) < 12 ? { opacity: 0.4 } : {}

  return (
    <div className="w-full mt-2">
      {/* Value labels at zone boundaries - always visible */}
      <div className="relative h-4 mb-0.5">
        {/* Left boundary label */}
        <div
          className="absolute -translate-x-1/2 top-0 text-[10px] text-red-500/80 tabular-nums whitespace-nowrap font-medium"
          style={{ left: `${leftPos}%`, ...leftLabelStyle }}
        >
          {leftLabel}
        </div>
        {/* Right boundary label */}
        <div
          className="absolute -translate-x-1/2 top-0 text-[10px] text-green-600/80 tabular-nums whitespace-nowrap font-medium"
          style={{ left: `${rightPos}%`, ...rightLabelStyle }}
        >
          {rightLabel}
        </div>
        {/* Current value label */}
        <div
          className={`absolute -translate-x-1/2 top-0 text-[10px] tabular-nums whitespace-nowrap font-bold ${getValueColor()}`}
          style={{ left: `${position}%` }}
        >
          {fmt(value)}{unit ? ` ${unit}` : ''}
        </div>
      </div>

      <div className="relative h-2 rounded-full overflow-hidden bg-muted">
        {/* Color zones */}
        {isHigherBetter ? (
          <>
            <div
              className="absolute inset-y-0 left-0 bg-red-400/60 dark:bg-red-500/40"
              style={{ width: `${leftPos}%` }}
            />
            <div
              className="absolute inset-y-0 bg-amber-400/60 dark:bg-amber-500/40"
              style={{ left: `${leftPos}%`, width: `${rightPos - leftPos}%` }}
            />
            <div
              className="absolute inset-y-0 right-0 bg-green-400/60 dark:bg-green-500/40"
              style={{ left: `${rightPos}%` }}
            />
          </>
        ) : (
          <>
            <div
              className="absolute inset-y-0 left-0 bg-green-400/60 dark:bg-green-500/40"
              style={{ width: `${leftPos}%` }}
            />
            <div
              className="absolute inset-y-0 bg-amber-400/60 dark:bg-amber-500/40"
              style={{ left: `${leftPos}%`, width: `${rightPos - leftPos}%` }}
            />
            <div
              className="absolute inset-y-0 right-0 bg-red-400/60 dark:bg-red-500/40"
              style={{ left: `${rightPos}%` }}
            />
          </>
        )}

        {/* Value marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-foreground bg-background shadow-sm z-10"
          style={{ left: `${position}%` }}
        />
      </div>
    </div>
  )
}
