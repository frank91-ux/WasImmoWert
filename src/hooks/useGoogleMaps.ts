import { useState, useEffect } from 'react'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''

let mapsPromise: Promise<void> | null = null

function loadGoogleMaps(): Promise<void> {
  if (mapsPromise) return mapsPromise

  mapsPromise = new Promise<void>((resolve, reject) => {
    // Already loaded (e.g. via script tag in index.html)
    if (window.google?.maps?.places) {
      resolve()
      return
    }

    // Create callback for async script load
    const callbackName = '__googleMapsCallback_' + Date.now()
    ;(window as unknown as Record<string, () => void>)[callbackName] = () => {
      delete (window as unknown as Record<string, () => void>)[callbackName]
      resolve()
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&language=de&region=DE&callback=${callbackName}`
    script.async = true
    script.defer = true
    script.onerror = () => {
      mapsPromise = null
      reject(new Error('Failed to load Google Maps script'))
    }
    document.head.appendChild(script)
  })

  return mapsPromise
}

export function useGoogleMaps() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    loadGoogleMaps()
      .then(() => setIsLoaded(true))
      .catch((err: unknown) => setError(err instanceof Error ? err : new Error(String(err))))
  }, [])

  return { isLoaded, error }
}
