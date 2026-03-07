/* ─── Centralized Chart Theme ─── */

export const CHART_COLORS = {
  primary: '#1e3a5f',     // navy – trust
  secondary: '#2563eb',   // blue – akzent
  tertiary: '#0d9488',    // teal – CTA
  quaternary: '#10b981',  // emerald – sekundär
  positive: '#10b981',    // grün für Gewinne
  negative: '#ef4444',    // rot für Verluste
  warning: '#f59e0b',     // amber für Warnungen
  neutral: '#6b7280',     // grau
  muted: '#94a3b8',       // slate-400

  // Palette für Pie-Charts / Multi-Series
  palette: [
    '#1e3a5f', // navy
    '#2563eb', // blue-600
    '#0d9488', // teal-600
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
  ],

  // Navy-Blue Palette für zusammengehörige Daten
  navyPalette: [
    '#0f172a', // slate-900
    '#1e293b', // slate-800
    '#1e3a5f', // navy
    '#1d4ed8', // blue-700
    '#2563eb', // blue-600
    '#3b82f6', // blue-500
    '#60a5fa', // blue-400
    '#93c5fd', // blue-300
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

export const ANIMATION_DURATION = 1200

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
