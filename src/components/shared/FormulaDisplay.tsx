import type { ReactNode } from 'react'

export type FormulaNode =
  | { type: 'fraction'; top: string | ReactNode; bottom: string | ReactNode; topValue?: string; bottomValue?: string }
  | { type: 'multiply'; parts: (string | ReactNode)[] }
  | { type: 'sum'; parts: (string | ReactNode)[]; partValues?: (string | undefined)[] }
  | { type: 'text'; content: string }
  | { type: 'step'; number: number; label: string; content: string | ReactNode }
  | { type: 'highlight'; content: string | ReactNode; color?: 'green' | 'red' | 'blue' | 'amber' }

interface FormulaDisplayProps {
  formula: FormulaNode
  result?: string
  resultValue?: string
  className?: string
}

const HIGHLIGHT_COLORS = {
  green: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
  red: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
  blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
}

function renderNode(node: FormulaNode): ReactNode {
  switch (node.type) {
    case 'fraction':
      return (
        <span className="inline-flex flex-col items-center mx-1">
          <span className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-t-md text-center border border-b-0 border-green-200 dark:border-green-800 group/top relative">
            {node.top}
            {node.topValue && (
              <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 translate-y-full z-10 hidden group-hover/top:block bg-popover text-foreground border rounded-md shadow-lg px-2 py-1 text-xs whitespace-nowrap">
                = {node.topValue}
              </span>
            )}
          </span>
          <span className="border-t-2 border-foreground/30 w-full" />
          <span className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-1 rounded-b-md text-center border border-t-0 border-red-200 dark:border-red-800 group/bottom relative">
            {node.bottom}
            {node.bottomValue && (
              <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 -translate-y-full z-10 hidden group-hover/bottom:block bg-popover text-foreground border rounded-md shadow-lg px-2 py-1 text-xs whitespace-nowrap">
                = {node.bottomValue}
              </span>
            )}
          </span>
        </span>
      )
    case 'multiply':
      return (
        <span className="inline-flex items-center gap-1.5">
          {node.parts.map((part, i) => (
            <span key={i} className="inline-flex items-center">
              {i > 0 && <span className="text-muted-foreground mx-1 font-bold">×</span>}
              {typeof part === 'string' ? (
                <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                  {part}
                </span>
              ) : part}
            </span>
          ))}
        </span>
      )
    case 'sum':
      return (
        <span className="inline-flex flex-wrap items-center gap-1.5">
          {node.parts.map((part, i) => {
            const partStr = typeof part === 'string' ? part : ''
            const isNegative = partStr.startsWith('−') || partStr.startsWith('-')
            const colorClass = isNegative
              ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
              : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
            const partValue = node.partValues?.[i]
            return (
              <span key={i} className="inline-flex items-center group/part relative">
                {i > 0 && <span className="text-muted-foreground mx-1 font-bold">+</span>}
                {typeof part === 'string' ? (
                  <span className={`px-2 py-0.5 rounded border ${colorClass}`}>
                    {part}
                  </span>
                ) : part}
                {partValue && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 translate-y-full z-10 hidden group-hover/part:block bg-popover text-foreground border rounded-md shadow-lg px-2 py-1 text-xs whitespace-nowrap">
                    = {partValue}
                  </span>
                )}
              </span>
            )
          })}
        </span>
      )
    case 'text':
      return <span className="text-muted-foreground">{node.content}</span>
    case 'step':
      return (
        <div className="flex items-start gap-2">
          <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">
            {node.number}
          </span>
          <div>
            <span className="text-xs font-medium text-muted-foreground">{node.label}</span>
            <div className="text-sm">{node.content}</div>
          </div>
        </div>
      )
    case 'highlight':
      return (
        <span className={`px-2 py-0.5 rounded border text-sm font-medium ${HIGHLIGHT_COLORS[node.color ?? 'blue']}`}>
          {node.content}
        </span>
      )
  }
}

export function FormulaDisplay({ formula, result, resultValue, className = '' }: FormulaDisplayProps) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-xl bg-muted/30 border px-5 py-4 text-sm ${className}`}>
      {renderNode(formula)}
      {result && (
        <>
          <span className="text-muted-foreground mx-1">=</span>
          <span className="text-primary font-bold text-base">{result}</span>
        </>
      )}
      {resultValue && !result && (
        <>
          <span className="text-muted-foreground mx-1">=</span>
          <span className="text-primary font-bold text-base">{resultValue}</span>
        </>
      )}
    </div>
  )
}
