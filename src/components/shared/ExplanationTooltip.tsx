import { Tooltip } from '@/components/ui/tooltip'
import { TOOLTIPS } from '@/i18n/tooltips'
import { HelpCircle } from 'lucide-react'

interface ExplanationTooltipProps {
  term: string
  children?: React.ReactNode
}

export function ExplanationTooltip({ term, children }: ExplanationTooltipProps) {
  const explanation = TOOLTIPS[term]
  if (!explanation) return <>{children}</>

  return (
    <Tooltip content={explanation}>
      <span className="inline-flex items-center gap-1 cursor-help">
        {children}
        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
      </span>
    </Tooltip>
  )
}
