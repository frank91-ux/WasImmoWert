import * as React from 'react'
import { cn } from '@/lib/utils'

interface SliderProps {
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
  className?: string
  disabled?: boolean
  accentColor?: string
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ min, max, step, value, onChange, className, disabled, accentColor }, ref) => {
    const percent = ((value - min) / (max - min)) * 100
    const color = accentColor || 'var(--color-primary)'

    return (
      <input
        ref={ref}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          'w-full h-2 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        style={{
          background: `linear-gradient(to right, ${color} 0%, ${color} ${percent}%, var(--color-border) ${percent}%, var(--color-border) 100%)`,
        }}
      />
    )
  }
)
Slider.displayName = 'Slider'

export { Slider }
