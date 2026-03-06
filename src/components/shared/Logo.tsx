interface LogoProps {
  variant?: 'full' | 'icon' | 'inverted'
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ variant = 'full', className = '', size = 'md' }: LogoProps) {
  const iconSize = size === 'sm' ? 'h-6 w-6' : size === 'lg' ? 'h-10 w-10' : 'h-8 w-8'
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl'
  const textColor = variant === 'inverted' ? 'text-white' : 'text-foreground'

  const WaveIcon = (
    <svg viewBox="0 0 32 32" fill="none" className={iconSize}>
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      {/* Building shape with wave */}
      <rect x="4" y="12" width="10" height="16" rx="1.5" fill="url(#logo-gradient)" />
      <rect x="18" y="6" width="10" height="22" rx="1.5" fill="url(#logo-gradient)" opacity="0.75" />
      {/* Wave line */}
      <path
        d="M2 22 C6 18, 10 26, 16 20 C20 16, 24 24, 30 18"
        stroke="url(#logo-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Windows */}
      <rect x="7" y="15" width="2" height="2" rx="0.3" fill="white" opacity="0.8" />
      <rect x="10" y="15" width="2" height="2" rx="0.3" fill="white" opacity="0.8" />
      <rect x="7" y="19" width="2" height="2" rx="0.3" fill="white" opacity="0.8" />
      <rect x="10" y="19" width="2" height="2" rx="0.3" fill="white" opacity="0.8" />
      <rect x="21" y="9" width="2" height="2" rx="0.3" fill="white" opacity="0.8" />
      <rect x="24" y="9" width="2" height="2" rx="0.3" fill="white" opacity="0.8" />
      <rect x="21" y="13" width="2" height="2" rx="0.3" fill="white" opacity="0.8" />
      <rect x="24" y="13" width="2" height="2" rx="0.3" fill="white" opacity="0.8" />
      <rect x="21" y="17" width="2" height="2" rx="0.3" fill="white" opacity="0.8" />
      <rect x="24" y="17" width="2" height="2" rx="0.3" fill="white" opacity="0.8" />
    </svg>
  )

  if (variant === 'icon') {
    return <span className={className}>{WaveIcon}</span>
  }

  return (
    <span className={`flex items-center gap-2 ${className}`}>
      {WaveIcon}
      <span className={`font-bold tracking-tight ${textSize} ${textColor}`}>
        <span className="brand-gradient-text">Was</span>
        <span className="brand-gradient-text">Immo</span>
        <span className="brand-gradient-text">Wert</span>
      </span>
    </span>
  )
}
