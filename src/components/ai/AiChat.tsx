import { useEffect, useRef, useState, useCallback } from 'react'
import { useAiChatStore, type ChatMessage } from '@/store/useAiChatStore'
import { sendChatMessage } from '@/lib/ai-service'
import { SuggestionChips } from './SuggestionChips'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SendHorizontal, Loader2, AlertCircle, Bot, User, Key, Trash2, Calculator } from 'lucide-react'
import type { Project, CalculationResult } from '@/calc/types'

interface AiChatProps {
  project: Project
  result: CalculationResult
  onParameterChange: (changes: Record<string, number>) => void
}

export function AiChat({ project, result, onParameterChange }: AiChatProps) {
  const {
    messages, isLoading, error, apiKey,
    addMessage, setLoading, setError, clearMessages,
    loadApiKey, setApiKey, removeApiKey,
  } = useAiChatStore()

  const [input, setInput] = useState('')
  const [keyInput, setKeyInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load API key on mount
  useEffect(() => {
    loadApiKey()
  }, [loadApiKey])

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
        content: m.role === 'assistant' && (m.parameterChanges || m.inlineCalculation)
          ? JSON.stringify({
              message: m.content,
              ...(m.parameterChanges ? { parameterChanges: m.parameterChanges } : {}),
              ...(m.inlineCalculation ? { inlineCalculation: m.inlineCalculation } : {}),
            })
          : m.content,
      }))

      const response = await sendChatMessage(apiKey, project, result, history)

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.message,
        parameterChanges: response.parameterChanges as Record<string, number | string> | undefined,
        inlineCalculation: response.inlineCalculation,
        timestamp: Date.now(),
      }
      addMessage(assistantMsg)

      // Apply parameter changes if any
      if (response.parameterChanges) {
        onParameterChange(response.parameterChanges)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }, [apiKey, project, result, addMessage, setLoading, setError, onParameterChange])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(input)
    }
  }

  // No API key → show setup card
  if (!apiKey) {
    return (
      <Card>
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
    <Card>
      <CardContent className="p-0">
        {/* Chat messages */}
        <div className="h-80 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
              <Bot className="h-8 w-8 opacity-40" />
              <p>Stelle eine Frage zu deinem Investment oder klicke einen Vorschlag.</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted/60 text-foreground rounded-bl-md'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.inlineCalculation && msg.inlineCalculation.entries.length > 0 && (
                  <div className="mt-3 bg-background/80 rounded-xl p-3 border border-border/40">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Calculator className="h-3.5 w-3.5 text-primary" />
                      <span className="font-semibold text-xs text-primary">{msg.inlineCalculation.title}</span>
                    </div>
                    <div className="space-y-1">
                      {msg.inlineCalculation.entries.map((entry, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{entry.label}</span>
                          <span className="font-medium tabular-nums">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {msg.parameterChanges && Object.keys(msg.parameterChanges).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/30 text-xs">
                    <span className="font-medium text-primary">Parameter geändert:</span>
                    {Object.entries(msg.parameterChanges).map(([k, v]) => (
                      <span key={k} className="ml-1.5 inline-flex items-center gap-0.5">
                        {k}: {typeof v === 'number' ? v.toLocaleString('de-DE') : v}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-foreground/10 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-4 w-4 text-foreground/70" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted/60 rounded-2xl rounded-bl-md px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
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

        {/* Suggestion chips + Input */}
        <div className="border-t px-4 py-3 space-y-3">
          {messages.length < 4 && (
            <SuggestionChips onSelect={handleSend} disabled={isLoading} />
          )}

          <div className="flex gap-2 items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Frage stellen..."
              disabled={isLoading}
              className="flex-1 px-3 py-2 text-sm rounded-lg border bg-background
                focus:outline-none focus:ring-2 focus:ring-primary/50
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <Button
              size="icon"
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isLoading}
              className="shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
            </Button>
            {messages.length > 0 && (
              <Button
                size="icon"
                variant="ghost"
                onClick={clearMessages}
                title="Chat leeren"
                className="shrink-0 text-muted-foreground"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => { removeApiKey(); clearMessages(); setError(null) }}
              title="API-Key ändern"
              className="shrink-0 text-muted-foreground"
            >
              <Key className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
