import type { RentabilitaetScore } from '@/calc/rentabilitaet'

interface RentabilitaetBadgeProps {
  score: RentabilitaetScore
  onClick?: () => void
  compact?: boolean
}

function getGradeColors(color: string) {
  if (color.includes('emerald-600')) return { bg: 'bg-emerald-100 dark:bg-emerald-950', border: 'border-emerald-400', ring: 'ring-emerald-200' }
  if (color.includes('emerald-500')) return { bg: 'bg-emerald-50 dark:bg-emerald-950', border: 'border-emerald-400', ring: 'ring-emerald-200' }
  if (color.includes('green')) return { bg: 'bg-green-50 dark:bg-green-950', border: 'border-green-400', ring: 'ring-green-200' }
  if (color.includes('yellow')) return { bg: 'bg-yellow-50 dark:bg-yellow-950', border: 'border-yellow-400', ring: 'ring-yellow-200' }
  if (color.includes('orange')) return { bg: 'bg-orange-50 dark:bg-orange-950', border: 'border-orange-400', ring: 'ring-orange-200' }
  return { bg: 'bg-red-50 dark:bg-red-950', border: 'border-red-400', ring: 'ring-red-200' }
}

export function RentabilitaetBadge({ score, onClick, compact }: RentabilitaetBadgeProps) {
  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-1 text-sm font-bold ${score.color} hover:opacity-80 transition-opacity`}
      >
        <span className="text-base">{score.grade}</span>
        <span className="text-xs font-normal text-muted-foreground">
          ({score.score.toFixed(1)})
        </span>
      </button>
    )
  }

  const colors = getGradeColors(score.color)

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl border-2 ${colors.border} ${colors.bg} hover:ring-2 ${colors.ring} transition-all`}
    >
      <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${colors.border} ${colors.bg}`}>
        <span className={`text-xl font-black ${score.color}`}>
          {score.grade}
        </span>
      </div>
      <div className="text-left">
        <span className={`text-sm font-bold ${score.color} block`}>
          {score.label}
        </span>
        <span className="text-xs text-muted-foreground">
          {score.score.toFixed(1)} / 10 Punkte
        </span>
      </div>
    </button>
  )
}
