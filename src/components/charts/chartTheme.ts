export const TOOLTIP_STYLE = {
  backgroundColor: 'var(--color-card)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-foreground)',
  borderRadius: '0.75rem',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  padding: '12px 16px',
  fontSize: '0.8125rem',
}

export const AXIS_TICK = {
  fontSize: 11,
  fill: 'var(--color-muted-foreground)',
}

export const GRID_STYLE = {
  strokeDasharray: '3 3',
  stroke: 'var(--color-border)',
  strokeOpacity: 0.7,
}

export const BAR_RADIUS: [number, number, number, number] = [4, 4, 0, 0]

export const ANIMATION_DURATION = 800

export const LEGEND_STYLE = {
  fontSize: '0.75rem',
  color: 'var(--color-foreground)',
}

// F7: Custom legend entry for Zinsbindung reference lines
export const ZINSBINDUNG_LEGEND_ENTRY = {
  value: 'Zinsbindungsende',
  type: 'plainline' as const,
  color: '#f59e0b',
  id: 'zinsbindung-legend',
}
