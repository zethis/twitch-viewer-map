export interface Pin {
  id: number
  city: string
  username: string | null
  lat: number
  lng: number
  created_at: string
}

export interface CreatePinBody {
  city: string
  username?: string
  lat: number
  lng: number
}

export interface GeocodeResult {
  display_name: string
  lat: string
  lon: string
}
