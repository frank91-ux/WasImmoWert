import { useState, useRef, useEffect, useCallback } from 'react'
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

/** Parse a German-formatted number string: "1.234,5" → 1234.5 */
function parseGermanNumber(input: string): number {
  // Remove everything except digits, comma, dot, minus
  const cleaned = input.replace(/[^0-9,.\-]/g, '')
  // If comma is used as decimal separator (German format)
  if (cleaned.includes(',')) {
    // Remove dots (thousand separators), replace comma with dot
    return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'))
  }
  // Otherwise parse as-is (English format)
  return parseFloat(cleaned.replace(/,/g, ''))
}

export function ParameterSlider({
  label, value, min, max, step, unit, tooltip, onChange, formatValue, scale = 'linear', accentColor,
}: ParameterSliderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

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

  // Start editing on click
  const handleStartEdit = useCallback(() => {
    setEditText(String(value).replace('.', ','))
    setIsEditing(true)
  }, [value])

  // Commit the edit
  const handleCommit = useCallback(() => {
    const parsed = parseGermanNumber(editText)
    if (!isNaN(parsed) && isFinite(parsed)) {
      // Snap to step for linear sliders
      let snapped = parsed
      if (!isLog && step > 0) {
        snapped = Math.round(parsed / step) * step
      } else if (isLog) {
        snapped = roundToNiceStep(parsed)
      }
      // Clamp to valid range — but allow slightly above max for usability
      const clamped = Math.max(min, Math.min(max, snapped))
      onChange(clamped)
    }
    setIsEditing(false)
  }, [editText, min, max, step, isLog, onChange])

  // Handle keyboard
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCommit()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }, [handleCommit])

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

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
        {isEditing ? (
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleCommit}
              onKeyDown={handleKeyDown}
              className="w-24 text-right text-sm font-semibold tabular-nums px-1.5 py-0.5 rounded border border-primary/40 bg-background outline-none focus:ring-1 focus:ring-primary/30"
              style={{ color: accentColor || 'var(--color-primary)' }}
            />
            <span className="text-xs text-muted-foreground">{unit}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleStartEdit}
            className="text-sm font-semibold tabular-nums cursor-text hover:bg-muted/50 rounded px-1.5 py-0.5 -mr-1.5 transition-colors"
            style={{ color: accentColor || 'var(--color-primary)' }}
            title="Klicken zum Bearbeiten"
          >
            {displayValue}
          </button>
        )}
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
