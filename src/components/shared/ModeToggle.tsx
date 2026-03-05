import { useUiStore } from '@/store/useUiStore'
import { cn } from '@/lib/utils'

export function ModeToggle() {
  const { mode, setMode } = useUiStore()

  return (
    <div className="inline-flex items-center rounded-lg bg-muted p-1 text-sm">
      <button
        className={cn(
          'rounded-md px-3 py-1.5 font-medium transition-colors',
          mode === 'beginner' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => setMode('beginner')}
      >
        Anfänger
      </button>
      <button
        className={cn(
          'rounded-md px-3 py-1.5 font-medium transition-colors',
          mode === 'pro' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => setMode('pro')}
      >
        Profi
      </button>
    </div>
  )
}
