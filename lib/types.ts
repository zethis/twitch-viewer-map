export interface Pin {
  id: number
  city: string
  username: string | null
  lat: number
  lng: number
  created_at: string
  twitch_id: string | null
  display_name: string | null
  profile_image_url: string | null
  streamer_name: string | null
}

export interface CreatePinBody {
  city: string
  username?: string
  lat: number
  lng: number
  twitch_id?: string | null
  display_name?: string | null
  profile_image_url?: string | null
  streamer_name?: string | null
}

export interface GeocodeResult {
  display_name: string
  lat: string
  lon: string
}
