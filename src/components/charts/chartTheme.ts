/* ─── Centralized Chart Theme ─── */

export const CHART_COLORS = {
  primary: '#0d9488',     // teal-600
  secondary: '#10b981',   // emerald-500
  tertiary: '#14b8a6',    // teal-500
  quaternary: '#059669',  // emerald-600
  positive: '#10b981',    // grün für Gewinne
  negative: '#ef4444',    // rot für Verluste
  warning: '#f59e0b',     // amber für Warnungen
  neutral: '#6b7280',     // grau
  muted: '#94a3b8',       // slate-400

  // Palette für Pie-Charts / Multi-Series
  palette: [
    '#0d9488', // teal-600
    '#10b981', // emerald-500
    '#14b8a6', // teal-500
    '#f59e0b', // amber-500
    '#6366f1', // Kontrast-Akzent
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
  ],

  // Teal-only Palette für zusammengehörige Daten
  tealPalette: [
    '#134e4a', // teal-900
    '#115e59', // teal-800
    '#0f766e', // teal-700
    '#0d9488', // teal-600
    '#14b8a6', // teal-500
    '#2dd4bf', // teal-400
    '#5eead4', // teal-300
    '#99f6e4', // teal-200
  ],
}

export const TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: 'var(--color-card)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-foreground)',
  borderRadius: '0.75rem',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
  padding: '14px 18px',
  fontSize: '0.8125rem',
  lineHeight: '1.5',
}

export const AXIS_TICK = {
  fontSize: 12,
  fontWeight: 500,
  fill: 'var(--color-muted-foreground)',
}

export const GRID_STYLE = {
  strokeDasharray: '3 3',
  stroke: 'var(--color-border)',
  strokeOpacity: 0.5,
}

export const BAR_RADIUS: [number, number, number, number] = [4, 4, 0, 0]

export const ANIMATION_DURATION = 800

export const LEGEND_STYLE = {
  fontSize: '0.75rem',
  color: 'var(--color-foreground)',
}

export const LABEL_STYLE = {
  fontSize: 12,
  fontWeight: 600,
  fill: 'var(--color-foreground)',
}

// F7: Custom legend entry for Zinsbindung reference lines
export const ZINSBINDUNG_LEGEND_ENTRY = {
  value: 'Zinsbindungsende',
  type: 'plainline' as const,
  color: '#f59e0b',
  id: 'zinsbindung-legend',
}

// German number formatting helper
export function formatDeValue(value: number, suffix = ' €'): string {
  return value.toLocaleString('de-DE', { maximumFractionDigits: 0 }) + suffix
}

export function formatDePercent(value: number): string {
  return value.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %'
}
