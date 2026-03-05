import { useUiStore } from '@/store/useUiStore'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { theme, setTheme } = useUiStore()

  const options = [
    { value: 'light' as const, icon: Sun, label: 'Hell' },
    { value: 'dark' as const, icon: Moon, label: 'Dunkel' },
    { value: 'system' as const, icon: Monitor, label: 'System' },
  ]

  return (
    <div className="inline-flex items-center rounded-lg bg-muted p-1">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          title={label}
          className={cn(
            'rounded-md p-1.5 transition-colors',
            theme === value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setTheme(value)}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  )
}
