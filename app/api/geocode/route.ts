import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import type { GeocodeResult } from '@/lib/types'

interface PhotonFeature {
  geometry: { coordinates: [number, number] }
  properties: {
    name?: string
    city?: string
    county?: string
    state?: string
    country?: string
    countrycode?: string
    type?: string
  }
}

function buildDisplayName(props: PhotonFeature['properties']): string {
  const parts: string[] = []
  if (props.name) parts.push(props.name)
  if (props.county && props.county !== props.name) parts.push(props.county)
  if (props.state && props.state !== props.county) parts.push(props.state)
  if (props.country) parts.push(props.country)
  return parts.join(', ')
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? ''

  if (q.length < 2) {
    return NextResponse.json([])
  }

  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&lang=en`
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 0 },
    })

    if (!response.ok) {
      console.error('[GET /api/geocode] Photon error:', response.status)
      return NextResponse.json({ error: 'Geocoding unavailable' }, { status: 502 })
    }

    const data = await response.json()
    const features: PhotonFeature[] = data.features ?? []

    const results: GeocodeResult[] = features
      .filter((f) => ['city', 'town', 'village', 'locality'].includes(f.properties.type ?? ''))
      .map((f) => ({
        display_name: buildDisplayName(f.properties),
        lat: String(f.geometry.coordinates[1]),
        lon: String(f.geometry.coordinates[0]),
      }))

    return NextResponse.json(results)
  } catch (err) {
    console.error('[GET /api/geocode]', err)
    return NextResponse.json({ error: 'Geocoding unavailable' }, { status: 502 })
  }
}
