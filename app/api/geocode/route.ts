import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import type { GeocodeResult } from '@/lib/types'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? ''

  if (q.length < 2) {
    return NextResponse.json([])
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=0&featuretype=settlement`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'twitch-viewer-map/1.0',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Geocoding unavailable' }, { status: 502 })
    }

    const data = await response.json()
    const results: GeocodeResult[] = data.map((item: { display_name: string; lat: string; lon: string }) => ({
      display_name: item.display_name,
      lat: item.lat,
      lon: item.lon,
    }))

    return NextResponse.json(results)
  } catch (err) {
    console.error('[GET /api/geocode]', err)
    return NextResponse.json({ error: 'Geocoding unavailable' }, { status: 502 })
  }
}
