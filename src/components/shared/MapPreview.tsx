import { useRef, useEffect } from 'react'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin } from 'lucide-react'

interface MapPreviewProps {
  lat: number
  lng: number
  className?: string
}

export function MapPreview({ lat, lng, className }: MapPreviewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const { isLoaded } = useGoogleMaps()

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center: { lat, lng },
        zoom: 15,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'cooperative',
      })

      markerRef.current = new google.maps.Marker({
        map: mapInstanceRef.current,
        position: { lat, lng },
      })
    } else {
      const position = { lat, lng }
      mapInstanceRef.current.panTo(position)
      if (markerRef.current) {
        markerRef.current.setPosition(position)
      }
    }
  }, [isLoaded, lat, lng])

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          Lage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={mapRef}
          className="w-full h-[250px] rounded-lg overflow-hidden bg-muted"
        />
      </CardContent>
    </Card>
  )
}
