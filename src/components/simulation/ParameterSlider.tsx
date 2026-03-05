import { Slider } from '@/components/ui/slider'
import { ExplanationTooltip } from '@/components/shared/ExplanationTooltip'

interface ParameterSliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  tooltip?: string
  onChange: (value: number) => void
  formatValue?: (value: number) => string
  scale?: 'linear' | 'log'
  accentColor?: string
}

function logToValue(position: number, min: number, max: number): number {
  const logMin = Math.log(Math.max(min, 1))
  const logMax = Math.log(max)
  return Math.round(Math.exp(logMin + (position / 1000) * (logMax - logMin)))
}

function valueToLog(value: number, min: number, max: number): number {
  const logMin = Math.log(Math.max(min, 1))
  const logMax = Math.log(max)
  const logVal = Math.log(Math.max(value, 1))
  return Math.round(((logVal - logMin) / (logMax - logMin)) * 1000)
}

function roundToNiceStep(value: number): number {
  if (value <= 100000) return Math.round(value / 5000) * 5000
  if (value <= 500000) return Math.round(value / 10000) * 10000
  if (value <= 2000000) return Math.round(value / 25000) * 25000
  if (value <= 5000000) return Math.round(value / 50000) * 50000
  return Math.round(value / 100000) * 100000
}

export function ParameterSlider({
  label, value, min, max, step, unit, tooltip, onChange, formatValue, scale = 'linear', accentColor,
}: ParameterSliderProps) {
  const displayValue = formatValue
    ? formatValue(value)
    : `${value.toLocaleString('de-DE')} ${unit}`

  const isLog = scale === 'log'

  const handleChange = (rawValue: number) => {
    if (isLog) {
      const actual = logToValue(rawValue, min, max)
      onChange(roundToNiceStep(Math.max(min, Math.min(max, actual))))
    } else {
      onChange(rawValue)
    }
  }

  const sliderValue = isLog ? valueToLog(value, min, max) : value
  const sliderMin = isLog ? 0 : min
  const sliderMax = isLog ? 1000 : max
  const sliderStep = isLog ? 1 : step

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {tooltip ? (
            <ExplanationTooltip term={tooltip}>{label}</ExplanationTooltip>
          ) : (
            label
          )}
        </span>
        <span
          className="text-sm font-semibold tabular-nums"
          style={{ color: accentColor || 'var(--color-primary)' }}
        >
          {displayValue}
        </span>
      </div>
      <Slider
        min={sliderMin}
        max={sliderMax}
        step={sliderStep}
        value={sliderValue}
        onChange={handleChange}
        accentColor={accentColor}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min.toLocaleString('de-DE')} {unit}</span>
        <span>{max.toLocaleString('de-DE')} {unit}</span>
      </div>
    </div>
  )
}
