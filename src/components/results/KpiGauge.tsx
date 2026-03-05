interface KpiGaugeProps {
  value: number
  thresholds: { good: number; medium: number }
  direction: 'higher-better' | 'lower-better'
  min: number
  max: number
  unit?: string
}

export function KpiGauge({ value, thresholds, direction, min, max, unit = '' }: KpiGaugeProps) {
  const range = max - min
  if (range <= 0) return null

  // Clamp value to range
  const clamped = Math.max(min, Math.min(max, value))
  const position = ((clamped - min) / range) * 100

  // Calculate threshold positions
  const { good, medium } = thresholds
  const goodPos = ((good - min) / range) * 100
  const mediumPos = ((medium - min) / range) * 100

  // Build gradient based on direction
  // higher-better: left=bad(red), middle=medium(amber), right=good(green)
  // lower-better: left=good(green), middle=medium(amber), right=bad(red)
  const isHigherBetter = direction === 'higher-better'

  // For higher-better: red → amber → green (left to right)
  // Thresholds: medium < good (e.g. medium=3, good=5)
  // For lower-better: green → amber → red (left to right)
  // Thresholds: good < medium (e.g. good=20, medium=25)
  const leftPos = isHigherBetter ? Math.min(mediumPos, goodPos) : Math.min(goodPos, mediumPos)
  const rightPos = isHigherBetter ? Math.max(mediumPos, goodPos) : Math.max(goodPos, mediumPos)

  // Format threshold labels
  const fmt = (v: number) => Number.isInteger(v) ? `${v}` : v.toFixed(1)

  return (
    <div className="w-full mt-2 group">
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

      {/* Hover labels at zone boundaries */}
      <div className="relative h-0 opacity-0 group-hover:opacity-100 group-hover:h-5 transition-all duration-200 overflow-hidden">
        <div
          className="absolute -translate-x-1/2 top-0.5 text-[10px] text-muted-foreground tabular-nums whitespace-nowrap"
          style={{ left: `${leftPos}%` }}
        >
          {isHigherBetter ? fmt(medium) : fmt(good)}
        </div>
        <div
          className="absolute -translate-x-1/2 top-0.5 text-[10px] text-muted-foreground tabular-nums whitespace-nowrap"
          style={{ left: `${rightPos}%` }}
        >
          {isHigherBetter ? fmt(good) : fmt(medium)}
        </div>
      </div>
    </div>
  )
}
