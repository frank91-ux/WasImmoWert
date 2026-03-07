import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEtvStore, type EtvProtokoll, type EtvBeschluss } from '@/store/useEtvStore'
import { useAiChatStore } from '@/store/useAiChatStore'
import { analyseEtvProtokoll } from '@/lib/etv-service'
import {
  Upload,
  FileText,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Building2,
  Wallet,
  Wrench,
  MoreHorizontal,
  ClipboardList,
  Loader2,
  Eye,
  Info,
} from 'lucide-react'
import type { Project } from '@/calc/types'

/* ─── Helpers ─── */

function formatEur(v: number): string {
  return v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function kategorieIcon(kat: EtvBeschluss['kategorie']) {
  switch (kat) {
    case 'verwaltung': return <Building2 className="h-4 w-4 text-blue-500" />
    case 'finanzen': return <Wallet className="h-4 w-4 text-emerald-500" />
    case 'instandhaltung': return <Wrench className="h-4 w-4 text-orange-500" />
    default: return <MoreHorizontal className="h-4 w-4 text-gray-400" />
  }
}

function kategorieLabel(kat: EtvBeschluss['kategorie']) {
  switch (kat) {
    case 'verwaltung': return 'Verwaltung'
    case 'finanzen': return 'Finanzen'
    case 'instandhaltung': return 'Instandhaltung'
    default: return 'Sonstiges'
  }
}

function ergebnisIcon(ergebnis: string) {
  const lower = ergebnis.toLowerCase()
  if (lower.includes('angenommen') || lower.includes('genehmigt') || lower.includes('beschlossen')) {
    return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
  }
  if (lower.includes('abgelehnt') || lower.includes('zurückgewiesen')) {
    return <XCircle className="h-4 w-4 text-red-500" />
  }
  if (lower.includes('vertagt') || lower.includes('zurückgestellt')) {
    return <MinusCircle className="h-4 w-4 text-amber-500" />
  }
  return <Info className="h-4 w-4 text-muted-foreground" />
}

/* ─── Beschluss Card ─── */

function BeschlussCard({ b }: { b: EtvBeschluss }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        {kategorieIcon(b.kategorie)}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">{b.topNummer}</span>
            <span className="font-medium text-sm truncate">{b.titel}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {b.kostenRelevant && b.betrag != null && (
            <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
              {formatEur(b.betrag)}
            </span>
          )}
          {ergebnisIcon(b.ergebnis)}
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-3 pt-1 border-t bg-muted/30 space-y-2 text-sm">
          <p className="text-muted-foreground">{b.antrag}</p>
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="bg-muted px-2 py-0.5 rounded">{kategorieLabel(b.kategorie)}</span>
            {b.jaStimmen != null && (
              <span className="text-emerald-700">JA: {b.jaStimmen}</span>
            )}
            {b.neinStimmen != null && (
              <span className="text-red-600">NEIN: {b.neinStimmen}</span>
            )}
            {b.enthaltungen != null && b.enthaltungen > 0 && (
              <span className="text-amber-600">Enthaltungen: {b.enthaltungen}</span>
            )}
            <span className="font-medium">{b.ergebnis}</span>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Wirtschaftsplan Section ─── */

function WirtschaftsplanSection({ wp }: { wp: NonNullable<EtvProtokoll['wirtschaftsplan']> }) {
  const [open, setOpen] = useState(true)

  return (
    <Card>
      <CardHeader className="pb-2">
        <button
          className="flex items-center justify-between w-full"
          onClick={() => setOpen(!open)}
        >
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4 text-emerald-500" />
            Wirtschaftsplan {wp.jahr}
          </CardTitle>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </CardHeader>
      {open && (
        <CardContent className="space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Ausgaben Gesamt</p>
              <p className="font-semibold text-sm">{formatEur(wp.ausgabenGesamt)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Rücklage Gesamt</p>
              <p className="font-semibold text-sm">{formatEur(wp.ruecklageGesamt)}</p>
            </div>
            {wp.hausgeldMonatlich != null && (
              <div className="bg-emerald-50 rounded-lg p-3 text-center">
                <p className="text-xs text-emerald-700">Hausgeld / Monat</p>
                <p className="font-bold text-sm text-emerald-700">{formatEur(wp.hausgeldMonatlich)}</p>
              </div>
            )}
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Positionen</p>
              <p className="font-semibold text-sm">{wp.kostenPositionen.length}</p>
            </div>
          </div>

          {/* Kosten table */}
          {wp.kostenPositionen.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs">
                    <th className="text-left py-2 pr-4">Position</th>
                    <th className="text-right py-2 px-2">Gesamt</th>
                    <th className="text-right py-2 px-2">Dein Anteil</th>
                    <th className="text-left py-2 pl-2">Verteilung</th>
                  </tr>
                </thead>
                <tbody>
                  {wp.kostenPositionen.map((k, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-1.5 pr-4">{k.bezeichnung}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-xs">{formatEur(k.gesamtkosten)}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-xs font-medium">
                        {k.anteilEigentümer != null ? formatEur(k.anteilEigentümer) : '—'}
                      </td>
                      <td className="py-1.5 pl-2 text-xs text-muted-foreground">{k.verteilschluessel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

/* ─── Single Protokoll View ─── */

function ProtokollView({ p, onRemove }: { p: EtvProtokoll; onRemove: () => void }) {
  const [expanded, setExpanded] = useState(true)

  const kostenBeschluesse = p.beschluesse.filter((b) => b.kostenRelevant && b.betrag != null)
  const gesamtKosten = kostenBeschluesse.reduce((s, b) => s + (b.betrag ?? 0), 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <button className="flex-1 text-left" onClick={() => setExpanded(!expanded)}>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              {p.dateiName}
            </CardTitle>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
              {p.datum && <span>Datum: {p.datum}</span>}
              {p.objekt && <span>Objekt: {p.objekt}</span>}
              {p.verwaltung && <span>Verwaltung: {p.verwaltung}</span>}
            </div>
          </button>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-md hover:bg-muted"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <button
              onClick={onRemove}
              className="p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600"
              title="Protokoll entfernen"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* Zusammenfassung */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> Zusammenfassung (Investoren-Sicht)
            </p>
            <p className="text-sm text-blue-900">{p.zusammenfassung}</p>
          </div>

          {/* Warnungen */}
          {p.warnungen.length > 0 && (
            <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Hinweise für Investoren
              </p>
              <ul className="space-y-1">
                {p.warnungen.map((w, i) => (
                  <li key={i} className="text-sm text-amber-900 flex gap-2">
                    <span className="text-amber-500 shrink-0 mt-0.5">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Kosten-Übersicht (wenn vorhanden) */}
          {kostenBeschluesse.length > 0 && (
            <div className="bg-orange-50/60 border border-orange-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-orange-700 mb-2 flex items-center gap-1">
                <Wallet className="h-3.5 w-3.5" /> Kostenrelevante Beschlüsse — Gesamt: {formatEur(gesamtKosten)}
              </p>
              <div className="space-y-1">
                {kostenBeschluesse.map((b, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-orange-900">{b.titel}</span>
                    <span className="font-mono font-medium text-orange-800">{formatEur(b.betrag!)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Beschlüsse */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <ClipboardList className="h-3.5 w-3.5" />
              Alle Beschlüsse ({p.beschluesse.length})
            </p>
            <div className="space-y-1.5">
              {p.beschluesse.map((b, i) => (
                <BeschlussCard key={i} b={b} />
              ))}
            </div>
          </div>

          {/* Wirtschaftsplan */}
          {p.wirtschaftsplan && <WirtschaftsplanSection wp={p.wirtschaftsplan} />}
        </CardContent>
      )}
    </Card>
  )
}

/* ─── Main Tab ─── */

interface Props {
  project: Project
}

export function EtvProtokolleTab({ project }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const protokolle = useEtvStore((s) => s.protokolle)
  const isAnalysing = useEtvStore((s) => s.isAnalysing)
  const error = useEtvStore((s) => s.error)
  const addProtokoll = useEtvStore((s) => s.addProtokoll)
  const removeProtokoll = useEtvStore((s) => s.removeProtokoll)
  const setAnalysing = useEtvStore((s) => s.setAnalysing)
  const setError = useEtvStore((s) => s.setError)
  const apiKey = useAiChatStore((s) => s.apiKey)
  const setApiKey = useAiChatStore((s) => s.setApiKey)
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const [tempApiKey, setTempApiKey] = useState('')

  const projectProtokolle = protokolle[project.id] ?? []

  // Load API key on mount (run once only)
  useEffect(() => { useAiChatStore.getState().loadApiKey() }, [])

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const currentKey = useAiChatStore.getState().apiKey
      if (!currentKey) {
        setShowApiKeyInput(true)
        setError('Bitte gib zuerst deinen Anthropic API-Key ein.')
        return
      }

      const fileArr = Array.from(files).filter(
        (f) =>
          f.type === 'application/pdf' ||
          f.type.startsWith('image/'),
      )

      if (fileArr.length === 0) {
        setError('Bitte lade eine PDF-Datei oder ein Bild hoch.')
        return
      }

      setAnalysing(true)
      try {
        const result = await analyseEtvProtokoll(currentKey, fileArr)
        addProtokoll(project.id, {
          id: crypto.randomUUID(),
          dateiName: fileArr.map((f) => f.name).join(', '),
          ...result,
          uploadedAt: Date.now(),
        })
        setAnalysing(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Analyse fehlgeschlagen')
      }
    },
    [project.id, addProtokoll, setAnalysing, setError],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  const handleSaveApiKey = () => {
    if (tempApiKey.trim()) {
      setApiKey(tempApiKey.trim())
      setShowApiKeyInput(false)
      setTempApiKey('')
      setError(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* API Key prompt */}
      {showApiKeyInput && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground mb-2">
              Für die KI-Analyse wird ein Anthropic API-Key benötigt.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="sk-ant-..."
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveApiKey()}
                className="flex-1 px-3 py-1.5 rounded-md border text-sm"
              />
              <Button size="sm" onClick={handleSaveApiKey}>Speichern</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isAnalysing && fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${dragOver
            ? 'border-blue-500 bg-blue-50/50'
            : 'border-muted-foreground/20 hover:border-blue-400 hover:bg-blue-50/30'}
          ${isAnalysing ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files)
            e.target.value = ''
          }}
        />

        {isAnalysing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            <div>
              <p className="font-medium text-sm">Protokoll wird analysiert…</p>
              <p className="text-xs text-muted-foreground mt-1">
                Die KI liest und strukturiert alle Tagesordnungspunkte, Abstimmungen und Kosten.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="h-10 w-10 text-muted-foreground/50" />
            <div>
              <p className="font-medium text-sm">ETV-Protokoll hochladen</p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF oder Bild hierher ziehen oder klicken — Eigentümerversammlungsprotokoll, Wirtschaftsplan, Tagesordnung
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Analysed Protokolle */}
      {projectProtokolle.length > 0 && (
        <div className="space-y-4">
          {projectProtokolle
            .slice()
            .sort((a, b) => b.uploadedAt - a.uploadedAt)
            .map((p) => (
              <ProtokollView
                key={p.id}
                p={p}
                onRemove={() => removeProtokoll(project.id, p.id)}
              />
            ))}
        </div>
      )}

      {/* Empty state */}
      {projectProtokolle.length === 0 && !isAnalysing && (
        <Card>
          <CardContent className="py-10 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Noch keine Protokolle hochgeladen. Lade ein ETV-Protokoll hoch um die Beschlüsse, Kosten und Wirtschaftspläne automatisch zu analysieren.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
