import { useEffect, useRef, useState, useCallback } from 'react'
import { useAiChatStore, type ChatMessage } from '@/store/useAiChatStore'
import { sendChatMessage } from '@/lib/ai-service'
import { usePlan } from '@/hooks/usePlan'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SendHorizontal, Loader2, AlertCircle, Bot, User, Key, Trash2, Calculator } from 'lucide-react'
import type { Project, CalculationResult, ScenarioAdjustment } from '@/calc/types'
import type { EtvProtokoll } from '@/store/useEtvStore'

interface AiChatProps {
  project: Project
  result: CalculationResult
  onParameterChange: (changes: Record<string, number>) => void
  onScenarioAdjustments?: (adjustments: ScenarioAdjustment[]) => void
  etvProtokolle?: EtvProtokoll[]
}

/* ─── Typing Indicator ─── */
function TypingIndicator() {
  return (
    <div className="flex gap-1.5 items-center">
      <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

/* ─── Simple Markdown Renderer ─── */
function RenderMarkdown({ text }: { text: string }) {
  // Normalise any escaped sequences that slipped through (e.g. literal "\n")
  const normalised = text.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '')
  // Split into paragraphs, then render inline formatting
  const paragraphs = normalised.split(/\n{2,}/)

  return (
    <div className="space-y-2">
      {paragraphs.map((para, i) => {
        // Check if it's a list
        const lines = para.split('\n')
        const isList = lines.every((l) => /^[-•*]\s/.test(l.trim()) || l.trim() === '')

        if (isList) {
          return (
            <ul key={i} className="space-y-1 ml-1">
              {lines
                .filter((l) => l.trim())
                .map((line, j) => (
                  <li key={j} className="flex gap-2 items-start">
                    <span className="text-blue-500 mt-0.5 shrink-0">•</span>
                    <span>{renderInline(line.replace(/^[-•*]\s*/, ''))}</span>
                  </li>
                ))}
            </ul>
          )
        }

        // Check if it's a numbered list
        const isNumberedList = lines.every((l) => /^\d+[.)]\s/.test(l.trim()) || l.trim() === '')
        if (isNumberedList) {
          return (
            <ol key={i} className="space-y-1 ml-1">
              {lines
                .filter((l) => l.trim())
                .map((line, j) => (
                  <li key={j} className="flex gap-2 items-start">
                    <span className="text-blue-600 font-semibold shrink-0">{j + 1}.</span>
                    <span>{renderInline(line.replace(/^\d+[.)]\s*/, ''))}</span>
                  </li>
                ))}
            </ol>
          )
        }

        // Regular paragraph — handle single line breaks
        return (
          <p key={i}>
            {lines.map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {renderInline(line)}
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
}

function renderInline(text: string): React.ReactNode {
  // Bold: **text** or __text__
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__)/g)
  return parts.map((part, i) => {
    if (/^\*\*(.+)\*\*$/.test(part)) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    }
    if (/^__(.+)__$/.test(part)) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

export function AiChat({ project, result, onParameterChange, onScenarioAdjustments, etvProtokolle }: AiChatProps) {
  const messages = useAiChatStore((s) => s.messages)
  const isLoading = useAiChatStore((s) => s.isLoading)
  const error = useAiChatStore((s) => s.error)
  const apiKey = useAiChatStore((s) => s.apiKey)
  const addMessage = useAiChatStore((s) => s.addMessage)
  const setLoading = useAiChatStore((s) => s.setLoading)
  const setError = useAiChatStore((s) => s.setError)
  const clearMessages = useAiChatStore((s) => s.clearMessages)
  const setApiKey = useAiChatStore((s) => s.setApiKey)
  const removeApiKey = useAiChatStore((s) => s.removeApiKey)

  const { hasAiChat } = usePlan()
  const hasEnvKey = Boolean(import.meta.env.VITE_ANTHROPIC_API_KEY)

  const [input, setInput] = useState('')
  const [keyInput, setKeyInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load API key on mount (run once only — use getState to avoid dependency on store function reference)
  useEffect(() => {
    useAiChatStore.getState().loadApiKey()
  }, [])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || !apiKey) return

    // Read fresh loading state from store to avoid stale closure issues
    if (useAiChatStore.getState().isLoading) return

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    }
    addMessage(userMsg)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      // Read fresh messages from store (avoids stale closure)
      const currentMessages = useAiChatStore.getState().messages
      const history = currentMessages.map((m) => ({
        role: m.role,
        content: m.role === 'assistant' && (m.parameterChanges || m.inlineCalculation || m.scenarioAdjustments)
          ? JSON.stringify({
              message: m.content,
              ...(m.parameterChanges ? { parameterChanges: m.parameterChanges } : {}),
              ...(m.inlineCalculation ? { inlineCalculation: m.inlineCalculation } : {}),
              ...(m.scenarioAdjustments ? { scenarioAdjustments: m.scenarioAdjustments } : {}),
            })
          : m.content,
      }))

      const response = await sendChatMessage(apiKey, project, result, history, etvProtokolle)

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.message,
        parameterChanges: response.parameterChanges as Record<string, number | string> | undefined,
        inlineCalculation: response.inlineCalculation,
        scenarioAdjustments: response.scenarioAdjustments,
        timestamp: Date.now(),
      }
      addMessage(assistantMsg)

      // Apply parameter changes if any
      if (response.parameterChanges) {
        onParameterChange(response.parameterChanges)
      }
      // Apply scenario adjustments if any
      if (response.scenarioAdjustments && onScenarioAdjustments) {
        onScenarioAdjustments(response.scenarioAdjustments)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }, [apiKey, project, result, addMessage, setLoading, setError, onParameterChange, onScenarioAdjustments])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(input)
    }
  }

  // No API key → show setup card
  if (!apiKey) {
    return (
      <Card className="h-full">
        <CardContent className="py-8">
          <div className="max-w-md mx-auto text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Key className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">API-Key erforderlich</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Um den KI-Berater zu nutzen, benötigst du einen Anthropic API-Key.
                Erstelle einen auf{' '}
                <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  console.anthropic.com
                </a>
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="sk-ant-api03-..."
                className="flex-1 px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && keyInput.trim()) {
                    setApiKey(keyInput.trim())
                    setKeyInput('')
                  }
                }}
              />
              <Button
                onClick={() => { setApiKey(keyInput.trim()); setKeyInput('') }}
                disabled={!keyInput.trim()}
              >
                Speichern
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Dein Key wird nur lokal in deinem Browser gespeichert.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-0 flex flex-col h-full min-h-0">
        {/* Header */}
        <div className="border-b bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full brand-gradient flex items-center justify-center shrink-0">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">KI-Berater</h3>
              <p className="text-[10px] text-muted-foreground">Immobilien-Analyse & Simulation</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button
                size="icon"
                variant="ghost"
                onClick={clearMessages}
                title="Chat leeren"
                className="h-7 w-7 text-muted-foreground hover:text-blue-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
            {!hasEnvKey && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => { removeApiKey(); clearMessages(); setError(null) }}
                title="API-Key ändern"
                className="h-7 w-7 text-muted-foreground hover:text-blue-600"
              >
                <Key className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Pro Only Banner */}
        {!hasAiChat && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border-b border-amber-200 dark:border-amber-800 px-4 py-3 shrink-0">
            <div className="flex items-center justify-between">
              <p className="text-sm text-amber-900 dark:text-amber-100">
                <span className="font-semibold">Pro Only:</span> Upgrade auf Pro für den KI-Berater
              </p>
              <Button size="sm" variant="default" className="bg-amber-600 hover:bg-amber-700 text-white">
                Upgraden
              </Button>
            </div>
          </div>
        )}

        {/* Chat messages — scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-3 py-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                <Bot className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground/70">Dein KI-Berater für Immobilien</p>
                <p className="text-xs mt-1 max-w-[250px]">Stelle eine Frage oder wähle einen Vorschlag unterhalb des Chat-Fensters.</p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full brand-gradient flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-muted/60 text-foreground rounded-bl-md border'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <RenderMarkdown text={msg.content} />
                ) : (
                  <p>{msg.content}</p>
                )}
                {msg.inlineCalculation && msg.inlineCalculation.entries.length > 0 && (
                  <div className="mt-3 bg-white dark:bg-card rounded-xl p-3 border">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Calculator className="h-3.5 w-3.5 text-blue-600" />
                      <span className="font-semibold text-xs text-blue-700 dark:text-blue-300">{msg.inlineCalculation.title}</span>
                    </div>
                    <div className="space-y-1.5">
                      {msg.inlineCalculation.entries.map((entry, idx) => (
                        <div key={idx} className="flex justify-between text-xs gap-3">
                          <span className="text-muted-foreground">{entry.label}</span>
                          <span className="font-semibold tabular-nums text-foreground">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {msg.parameterChanges && Object.keys(msg.parameterChanges).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                    <span className="font-medium">Parameter geändert:</span>
                    {Object.entries(msg.parameterChanges).map(([k, v]) => (
                      <span key={k} className="ml-1.5 inline-flex items-center gap-0.5">
                        {k}: {typeof v === 'number' ? v.toLocaleString('de-DE') : v}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full brand-gradient flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-muted/60 border rounded-2xl rounded-bl-md px-4 py-3">
                <TypingIndicator />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t bg-card px-4 py-3 shrink-0">
          <div className="flex gap-2 items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Frage stellen..."
              disabled={isLoading || !hasAiChat}
              className="flex-1 px-3 py-2.5 text-sm rounded-xl border bg-background
                focus:outline-none focus:ring-2 focus:ring-blue-500/50
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <Button
              size="icon"
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isLoading || !hasAiChat}
              className="shrink-0 h-10 w-10 rounded-xl btn-brand"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
