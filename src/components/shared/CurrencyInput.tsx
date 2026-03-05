import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ExplanationTooltip } from './ExplanationTooltip'

interface CurrencyInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  tooltip?: string
  suffix?: string
  min?: number
  max?: number
  step?: number
  className?: string
}

export function CurrencyInput({
  label, value, onChange, tooltip, suffix = '€', min, max, step = 1, className,
}: CurrencyInputProps) {
  const labelContent = tooltip
    ? <ExplanationTooltip term={tooltip}>{label}</ExplanationTooltip>
    : label

  return (
    <div className={className}>
      <Label className="mb-1.5 block">{labelContent}</Label>
      <div className="relative">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="pr-8"
        />
        <span className="absolute right-3 top-2.5 text-sm text-muted-foreground pointer-events-none">
          {suffix}
        </span>
      </div>
    </div>
  )
}

interface PercentInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  tooltip?: string
  min?: number
  max?: number
  step?: number
  className?: string
}

export function PercentInput({
  label, value, onChange, tooltip, min = 0, max = 100, step = 0.1, className,
}: PercentInputProps) {
  const labelContent = tooltip
    ? <ExplanationTooltip term={tooltip}>{label}</ExplanationTooltip>
    : label

  return (
    <div className={className}>
      <Label className="mb-1.5 block">{labelContent}</Label>
      <div className="relative">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="pr-8"
        />
        <span className="absolute right-3 top-2.5 text-sm text-muted-foreground pointer-events-none">
          %
        </span>
      </div>
    </div>
  )
}
