import { useRef, useEffect, useCallback } from 'react'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'
import { cn } from '@/lib/utils'

export interface PlaceResult {
  address: string
  lat: number | null
  lng: number | null
  state: string | null // administrative_area_level_1 (e.g. "Bayern", "Hessen")
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onPlaceSelect?: (place: PlaceResult) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

export function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'Straße, Stadt',
  className,
  autoFocus,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const onPlaceSelectRef = useRef(onPlaceSelect)
  const onChangeRef = useRef(onChange)

  // Keep refs in sync to avoid re-initializing autocomplete on every render
  onPlaceSelectRef.current = onPlaceSelect
  onChangeRef.current = onChange

  const { isLoaded } = useGoogleMaps()

  // Initialize autocomplete once Maps API is loaded
  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: ['de', 'at', 'ch'] },
      fields: ['formatted_address', 'geometry.location', 'address_components'],
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      if (!place.formatted_address) return

      const lat = place.geometry?.location?.lat() ?? null
      const lng = place.geometry?.location?.lng() ?? null
      const stateComponent = place.address_components?.find(
        (c) => c.types.includes('administrative_area_level_1')
      )

      onChangeRef.current(place.formatted_address)
      onPlaceSelectRef.current?.({
        address: place.formatted_address,
        lat,
        lng,
        state: stateComponent?.long_name ?? null,
      })
    })

    autocompleteRef.current = autocomplete
  }, [isLoaded])

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value)
    },
    [onChange]
  )

  // Prevent form submission when pressing Enter while autocomplete dropdown is open
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const pacContainer = document.querySelector('.pac-container')
      if (pacContainer && getComputedStyle(pacContainer).display !== 'none') {
        e.preventDefault()
      }
    }
  }, [])

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={handleInput}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    />
  )
}
