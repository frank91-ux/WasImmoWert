import { useRef, useEffect, useState, useMemo } from 'react'
import type { Project, CalculationResult } from '@/calc/types'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'
import { MARKTDATEN, getPreisfarbe, LEGENDE_KAUF, LEGENDE_MIETE } from '@/data/marktdaten'
import type { StadtteilDaten } from '@/data/marktdaten'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatEur } from '@/lib/format'
import { MapPin, Home, TrendingUp, TrendingDown, Minus, ChevronDown, DollarSign, Building2, HelpCircle } from 'lucide-react'
import { KpiInfoDialog } from '@/components/results/KpiInfoDialog'

interface MarktvergleichTabProps {
  project: Project
  result: CalculationResult
}

// Haversine distance in km
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// SVG circle marker as data URL
function createMarkerSvg(farbe: string, label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="22" fill="${farbe}" stroke="white" stroke-width="2" opacity="0.9"/>
    <text x="24" y="26" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="9" font-weight="bold" font-family="system-ui,sans-serif">${label}</text>
  </svg>`
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg)
}

function createProjectMarkerSvg(label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52">
    <polygon points="26,2 50,20 42,50 10,50 2,20" fill="#3b82f6" stroke="white" stroke-width="2" opacity="0.95"/>
    <text x="26" y="32" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="9" font-weight="bold" font-family="system-ui,sans-serif">${label}</text>
  </svg>`
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg)
}

function formatPreisKurz(preis: number): string {
  if (preis >= 1000) return `${(preis / 1000).toFixed(1)}k`
  return preis.toFixed(0)
}

const NEARBY_RADIUS_KM = 8

export function MarktvergleichTab({ project, result }: MarktvergleichTabProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  const { isLoaded } = useGoogleMaps()

  const [modus, setModus] = useState<'kauf' | 'miete'>('kauf')
  const [showAllStadtteile, setShowAllStadtteile] = useState(false)
  const [listExpanded, setListExpanded] = useState(false)
  const [marktKpiInfo, setMarktKpiInfo] = useState<string | null>(null)

  const eigenPreisProQm = project.wohnflaeche > 0 ? project.kaufpreis / project.wohnflaeche : 0
  const eigenMieteProQm = project.wohnflaeche > 0 ? project.monatsmieteKalt / project.wohnflaeche : 0

  const legende = modus === 'kauf' ? LEGENDE_KAUF : LEGENDE_MIETE

  // Nearby + sorted districts (compute first, then use for averages)
  const { nearbyStadtteile, allSorted } = useMemo(() => {
    const sorted = [...MARKTDATEN].sort((a, b) => {
      const av = modus === 'kauf' ? a.kaufpreisProQm : a.mietpreisProQm
      const bv = modus === 'kauf' ? b.kaufpreisProQm : b.mietpreisProQm
      return bv - av
    })

    if (project.lat != null && project.lng != null) {
      const nearby = sorted.filter((s) =>
        haversineDistance(project.lat!, project.lng!, s.lat, s.lng) <= NEARBY_RADIUS_KM
      )
      return { nearbyStadtteile: nearby, allSorted: sorted }
    }
    return { nearbyStadtteile: sorted, allSorted: sorted }
  }, [modus, project.lat, project.lng])

  const displayStadtteile = showAllStadtteile ? allSorted : nearbyStadtteile

  // Average from nearby Stadtteile only (fallback to all if none nearby)
  const kaufDurchschnitt = useMemo(() => {
    const data = nearbyStadtteile.length > 0 ? nearbyStadtteile : MARKTDATEN
    return data.reduce((s, d) => s + d.kaufpreisProQm, 0) / data.length
  }, [nearbyStadtteile])
  const mietDurchschnitt = useMemo(() => {
    const data = nearbyStadtteile.length > 0 ? nearbyStadtteile : MARKTDATEN
    return data.reduce((s, d) => s + d.mietpreisProQm, 0) / data.length
  }, [nearbyStadtteile])
  const kaufDiff = eigenPreisProQm > 0 ? ((eigenPreisProQm / kaufDurchschnitt) - 1) * 100 : 0
  const mietDiff = eigenMieteProQm > 0 ? ((eigenMieteProQm / mietDurchschnitt) - 1) * 100 : 0

  // Clear all markers
  function clearMarkers() {
    for (const m of markersRef.current) m.setMap(null)
    markersRef.current = []
  }

  // Create markers for all districts
  function createMarkers(map: google.maps.Map) {
    clearMarkers()
    if (infoWindowRef.current) infoWindowRef.current.close()
    infoWindowRef.current = new google.maps.InfoWindow()

    for (const stadtteil of MARKTDATEN) {
      const preis = modus === 'kauf' ? stadtteil.kaufpreisProQm : stadtteil.mietpreisProQm
      const farbe = getPreisfarbe(preis, modus)
      const label = modus === 'kauf' ? formatPreisKurz(preis) : `${preis.toFixed(0)}€`

      const marker = new google.maps.Marker({
        map,
        position: { lat: stadtteil.lat, lng: stadtteil.lng },
        icon: {
          url: createMarkerSvg(farbe, label),
          scaledSize: new google.maps.Size(48, 48),
          anchor: new google.maps.Point(24, 24),
        },
        title: stadtteil.name,
        zIndex: 10,
      })

      marker.addListener('click', () => {
        const trend = modus === 'kauf' ? stadtteil.trendKauf : stadtteil.trendMiete
        const trendStr = trend != null ? (trend > 0 ? `+${trend.toFixed(1)}%` : `${trend.toFixed(1)}%`) : '—'
        const trendColor = trend != null ? (trend > 0 ? '#22c55e' : trend < 0 ? '#ef4444' : '#888') : '#888'

        infoWindowRef.current!.setContent(`
          <div style="font-family:system-ui,sans-serif;min-width:180px;padding:4px 0">
            <div style="font-weight:700;font-size:14px;margin-bottom:4px">${stadtteil.name}</div>
            <div style="font-size:12px;color:#666;margin-bottom:8px">${stadtteil.stadt}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:12px">
              <div style="color:#666">Kaufpreis/m²</div>
              <div style="font-weight:${modus === 'kauf' ? '700' : '400'};text-align:right">${stadtteil.kaufpreisProQm.toLocaleString('de-DE')} €</div>
              <div style="color:#666">Miete/m²</div>
              <div style="font-weight:${modus === 'miete' ? '700' : '400'};text-align:right">${stadtteil.mietpreisProQm.toFixed(2)} €</div>
              <div style="color:#666">Trend (YoY)</div>
              <div style="text-align:right;color:${trendColor};font-weight:600">${trendStr}</div>
            </div>
          </div>
        `)
        infoWindowRef.current!.open(map, marker)
      })

      markersRef.current.push(marker)
    }

    // Project marker
    if (project.lat != null && project.lng != null) {
      const eigenPreis = modus === 'kauf' ? eigenPreisProQm : eigenMieteProQm
      const eigenLabel = modus === 'kauf' ? formatPreisKurz(eigenPreis) : `${eigenPreis.toFixed(0)}€`

      const projectMarker = new google.maps.Marker({
        map,
        position: { lat: project.lat, lng: project.lng },
        icon: {
          url: createProjectMarkerSvg(eigenLabel),
          scaledSize: new google.maps.Size(52, 52),
          anchor: new google.maps.Point(26, 26),
        },
        title: 'Mein Objekt',
        zIndex: 20,
      })

      projectMarker.addListener('click', () => {
        const diff = eigenPreisProQm - kaufDurchschnitt
        const diffStr = diff > 0 ? `+${formatEur(diff)}` : formatEur(diff)

        infoWindowRef.current!.setContent(`
          <div style="font-family:system-ui,sans-serif;min-width:200px;padding:4px 0">
            <div style="font-weight:700;font-size:14px;margin-bottom:4px">⭐ ${project.name || 'Mein Objekt'}</div>
            <div style="font-size:12px;color:#666;margin-bottom:8px">${project.address || ''}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:12px">
              <div style="color:#666">Kaufpreis/m²</div>
              <div style="font-weight:700;text-align:right">${eigenPreisProQm.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €</div>
              <div style="color:#666">Miete/m²</div>
              <div style="font-weight:700;text-align:right">${eigenMieteProQm.toFixed(2)} €</div>
              <div style="color:#666">vs. Ø Region</div>
              <div style="text-align:right;color:${diff <= 0 ? '#22c55e' : '#ef4444'};font-weight:600">${diffStr}/m²</div>
            </div>
          </div>
        `)
        infoWindowRef.current!.open(map, projectMarker)
      })

      markersRef.current.push(projectMarker)
    }
  }

  // Init map
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return

    if (!mapInstanceRef.current) {
      const hasProjectCoords = project.lat != null && project.lng != null
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center: hasProjectCoords
          ? { lat: project.lat!, lng: project.lng! }
          : { lat: 49.585, lng: 10.950 },
        zoom: hasProjectCoords ? 14 : 12,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'cooperative',
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        ],
      })
    }

    createMarkers(mapInstanceRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, modus, project.lat, project.lng, project.kaufpreis, project.monatsmieteKalt, project.wohnflaeche])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Marktvergleich
            </CardTitle>
            <div className="flex rounded-lg border overflow-hidden text-sm">
              <button
                className={`px-3 py-1.5 transition-colors ${modus === 'kauf' ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-muted'}`}
                onClick={() => setModus('kauf')}
              >
                Kaufpreis/m²
              </button>
              <button
                className={`px-3 py-1.5 transition-colors ${modus === 'miete' ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-muted'}`}
                onClick={() => setModus('miete')}
              >
                Mietpreis/m²
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* KPIs + Map in grid */}
          <div className="grid grid-cols-12 gap-4">
            {/* KPIs left */}
            <div className="col-span-12 lg:col-span-3 space-y-3">
              {/* Kaufpreis KPI */}
              <Card className="shadow-sm cursor-pointer hover:shadow-md transition-shadow group" onClick={() => setMarktKpiInfo('marktvergleich')}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                    <DollarSign className="h-3.5 w-3.5" />
                    Kaufpreis/m²
                    <HelpCircle className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-60 transition-opacity" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground">Dein Preis</span>
                      <span className="text-lg font-bold tabular-nums">
                        {eigenPreisProQm > 0 ? `${eigenPreisProQm.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €` : '—'}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground">Ø Markt</span>
                      <span className="text-lg font-semibold tabular-nums text-muted-foreground">
                        {kaufDurchschnitt.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €
                      </span>
                    </div>
                  </div>
                  {eigenPreisProQm > 0 && (
                    <div className={`text-center text-sm font-semibold rounded-md py-1 ${kaufDiff <= 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'}`}>
                      {kaufDiff > 0 ? '+' : ''}{kaufDiff.toFixed(1)}% {kaufDiff <= 0 ? 'günstiger' : 'teurer'} als Markt
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Mietpreis KPI */}
              <Card className="shadow-sm cursor-pointer hover:shadow-md transition-shadow group" onClick={() => setMarktKpiInfo('marktvergleich')}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                    <Building2 className="h-3.5 w-3.5" />
                    Mietpreis/m²
                    <HelpCircle className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-60 transition-opacity" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground">Deine Miete</span>
                      <span className="text-lg font-bold tabular-nums">
                        {eigenMieteProQm > 0 ? `${eigenMieteProQm.toFixed(2)} €` : '—'}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground">Ø Markt</span>
                      <span className="text-lg font-semibold tabular-nums text-muted-foreground">
                        {mietDurchschnitt.toFixed(2)} €
                      </span>
                    </div>
                  </div>
                  {eigenMieteProQm > 0 && (
                    <div className={`text-center text-sm font-semibold rounded-md py-1 ${mietDiff >= 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'}`}>
                      {mietDiff > 0 ? '+' : ''}{mietDiff.toFixed(1)}% {mietDiff >= 0 ? 'über' : 'unter'} Markt
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Map right */}
            <div className="col-span-12 lg:col-span-9">
              <div
                ref={mapRef}
                className="w-full h-[450px] rounded-lg overflow-hidden bg-muted"
              />
            </div>
          </div>

          {/* Legende */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="font-medium">Preisniveau:</span>
            {legende.map((l) => (
              <div key={l.label} className="flex items-center gap-1">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ backgroundColor: l.farbe }}
                />
                <span>{l.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Collapsible Stadtteil-Tabelle */}
      <Card>
        <CardHeader className="pb-0">
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => setListExpanded(!listExpanded)}
          >
            <CardTitle className="text-base">
              Stadtteile im Vergleich
              <span className="text-xs font-normal text-muted-foreground ml-2">
                ({displayStadtteile.length} {showAllStadtteile ? 'alle' : 'in der Nähe'})
              </span>
            </CardTitle>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${listExpanded ? '' : '-rotate-90'}`} />
          </button>
        </CardHeader>
        {listExpanded && (
          <CardContent className="pt-3">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 font-medium">Stadtteil</th>
                    <th className="text-left py-2 font-medium pl-2">Stadt</th>
                    <th className={`text-right py-2 font-medium ${modus === 'kauf' ? 'text-foreground' : ''}`}>Kauf/m²</th>
                    <th className={`text-right py-2 font-medium ${modus === 'miete' ? 'text-foreground' : ''}`}>Miete/m²</th>
                    <th className="text-right py-2 font-medium">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {displayStadtteile.map((s) => {
                    const trend = modus === 'kauf' ? s.trendKauf : s.trendMiete
                    const farbe = getPreisfarbe(modus === 'kauf' ? s.kaufpreisProQm : s.mietpreisProQm, modus)
                    return (
                      <tr key={`${s.stadt}-${s.name}`} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-2 flex items-center gap-2">
                          <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: farbe }} />
                          {s.name}
                        </td>
                        <td className="py-2 pl-2 text-muted-foreground">{s.stadt}</td>
                        <td className={`py-2 text-right tabular-nums ${modus === 'kauf' ? 'font-semibold' : 'text-muted-foreground'}`}>
                          {s.kaufpreisProQm.toLocaleString('de-DE')} €
                        </td>
                        <td className={`py-2 text-right tabular-nums ${modus === 'miete' ? 'font-semibold' : 'text-muted-foreground'}`}>
                          {s.mietpreisProQm.toFixed(2)} €
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {trend != null ? (
                            <span className={`inline-flex items-center gap-0.5 ${trend > 0 ? 'text-success' : trend < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                              {trend > 0 ? <TrendingUp className="h-3 w-3" /> : trend < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                  {/* Eigenes Objekt */}
                  {project.wohnflaeche > 0 && (
                    <tr className="border-t-2 border-primary/20 bg-primary/5 font-medium">
                      <td className="py-2 flex items-center gap-2">
                        <Home className="h-3.5 w-3.5 text-primary shrink-0" />
                        {project.name || 'Mein Objekt'}
                      </td>
                      <td className="py-2 pl-2 text-muted-foreground">{project.address ? project.address.split(',')[0] : '—'}</td>
                      <td className={`py-2 text-right tabular-nums ${modus === 'kauf' ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                        {eigenPreisProQm.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €
                      </td>
                      <td className={`py-2 text-right tabular-nums ${modus === 'miete' ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                        {eigenMieteProQm.toFixed(2)} €
                      </td>
                      <td className="py-2 text-right text-muted-foreground">—</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Toggle all / nearby */}
            {nearbyStadtteile.length < allSorted.length && (
              <button
                className="mt-3 text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors"
                onClick={() => setShowAllStadtteile(!showAllStadtteile)}
              >
                {showAllStadtteile
                  ? `Nur Stadtteile in der Nähe anzeigen (${nearbyStadtteile.length})`
                  : `Alle Stadtteile anzeigen (${allSorted.length})`
                }
              </button>
            )}
          </CardContent>
        )}
      </Card>
      <KpiInfoDialog
        open={marktKpiInfo !== null}
        onOpenChange={(open) => { if (!open) setMarktKpiInfo(null) }}
        kpiKey={marktKpiInfo ?? ''}
        currentValue={modus === 'kauf' ? `${eigenPreisProQm.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €/m²` : `${eigenMieteProQm.toFixed(2)} €/m²`}
        result={result}
        project={project}
      />
    </div>
  )
}
