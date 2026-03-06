import type { LucideIcon } from 'lucide-react'

interface FeatureIconProps {
  icon: LucideIcon
  label?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function FeatureIcon({ icon: Icon, label, size = 'md', className = '' }: FeatureIconProps) {
  const sizes = {
    sm: { container: 'h-10 w-10', icon: 'h-5 w-5', text: 'text-xs' },
    md: { container: 'h-14 w-14', icon: 'h-7 w-7', text: 'text-sm' },
    lg: { container: 'h-18 w-18', icon: 'h-9 w-9', text: 'text-base' },
  }
  const s = sizes[size]

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div
        className={`${s.container} rounded-2xl bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border border-teal-200/50 flex items-center justify-center`}
      >
        <Icon className={`${s.icon} text-teal-600`} />
      </div>
      {label && (
        <span className={`${s.text} font-medium text-foreground text-center`}>{label}</span>
      )}
    </div>
  )
}
