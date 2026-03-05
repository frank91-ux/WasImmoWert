import { useRef, useEffect, useState, useMemo } from 'react'
import type { Project, CalculationResult } from '@/calc/types'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'
import { MARKTDATEN, getPreisfarbe, LEGENDE_KAUF, LEGENDE_MIETE } from '@/data/marktdaten'
import type { StadtteilDaten } from '@/data/marktdaten'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatEur } from '@/lib/format'
import { MapPin, Home, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MarktvergleichTabProps {
  project: Project
  result: CalculationResult
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

export function MarktvergleichTab({ project, result }: MarktvergleichTabProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  const { isLoaded } = useGoogleMaps()

  const [modus, setModus] = useState<'kauf' | 'miete'>('kauf')

  const eigenPreisProQm = project.wohnflaeche > 0 ? project.kaufpreis / project.wohnflaeche : 0
  const eigenMieteProQm = project.wohnflaeche > 0 ? project.monatsmieteKalt / project.wohnflaeche : 0

  const legende = modus === 'kauf' ? LEGENDE_KAUF : LEGENDE_MIETE

  // Sort districts by price (descending)
  const sortierteStadtteile = useMemo(() => {
    return [...MARKTDATEN].sort((a, b) => {
      const av = modus === 'kauf' ? a.kaufpreisProQm : a.mietpreisProQm
      const bv = modus === 'kauf' ? b.kaufpreisProQm : b.mietpreisProQm
      return bv - av
    })
  }, [modus])

  // Average for comparison
  const durchschnitt = useMemo(() => {
    const sum = MARKTDATEN.reduce((s, d) => s + (modus === 'kauf' ? d.kaufpreisProQm : d.mietpreisProQm), 0)
    return sum / MARKTDATEN.length
  }, [modus])

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
        const diff = eigenPreisProQm - durchschnitt
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
              Marktvergleich – Herzogenaurach & Erlangen
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
          {/* Map */}
          <div
            ref={mapRef}
            className="w-full h-[500px] rounded-lg overflow-hidden bg-muted"
          />

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

      {/* Stadtteil-Tabelle */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Stadtteile im Vergleich
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                {sortierteStadtteile.map((s) => {
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

          {/* Durchschnittsvergleich */}
          {project.wohnflaeche > 0 && (
            <div className="mt-4 pt-3 border-t text-sm text-muted-foreground">
              {modus === 'kauf' ? (
                <p>
                  Ø Kaufpreis Region: <span className="font-semibold text-foreground">{durchschnitt.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €/m²</span>
                  {' · '}Ihr Objekt: <span className={`font-semibold ${eigenPreisProQm <= durchschnitt ? 'text-success' : 'text-destructive'}`}>
                    {eigenPreisProQm <= durchschnitt ? '' : '+'}{(eigenPreisProQm - durchschnitt).toLocaleString('de-DE', { maximumFractionDigits: 0 })} €/m² {eigenPreisProQm <= durchschnitt ? 'unter' : 'über'} Durchschnitt
                  </span>
                </p>
              ) : (
                <p>
                  Ø Mietpreis Region: <span className="font-semibold text-foreground">{durchschnitt.toFixed(2)} €/m²</span>
                  {' · '}Ihre Miete: <span className={`font-semibold ${eigenMieteProQm >= durchschnitt ? 'text-success' : 'text-destructive'}`}>
                    {eigenMieteProQm >= durchschnitt ? '+' : ''}{(eigenMieteProQm - durchschnitt).toFixed(2)} €/m² {eigenMieteProQm >= durchschnitt ? 'über' : 'unter'} Durchschnitt
                  </span>
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
