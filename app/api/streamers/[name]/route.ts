import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limit'

export async function PUT(request: NextRequest, { params }: { params: { name: string } }) {
  if (checkRateLimit(request)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const requestPassword = request.headers.get('x-admin-password')
  const streamerName = request.headers.get('x-streamer-name')

  if (!requestPassword || !streamerName) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const streamerResult = await pool.query(
    'SELECT admin_password FROM streamers WHERE name = $1',
    [streamerName],
  )
  const isAdmin =
    streamerResult.rowCount !== null &&
    streamerResult.rowCount > 0 &&
    streamerResult.rows[0].admin_password === requestPassword

  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { twitch_url?: string; logo_url?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { twitch_url, logo_url } = body

  if (twitch_url === undefined && logo_url === undefined) {
    return NextResponse.json({ error: 'No fields provided' }, { status: 400 })
  }

  const updates: string[] = []
  const values: (string | null)[] = []

  if (twitch_url !== undefined) {
    if (
      typeof twitch_url !== 'string' ||
      (!twitch_url.startsWith('http://') && !twitch_url.startsWith('https://'))
    ) {
      return NextResponse.json({ error: 'Invalid twitch_url' }, { status: 400 })
    }
    updates.push('twitch_url = $' + (values.length + 1))
    values.push(twitch_url)
  }

  if (logo_url !== undefined) {
    updates.push('logo_url = $' + (values.length + 1))
    values.push(logo_url)
  }

  values.push(params.name)

  try {
    await pool.query(
      `UPDATE streamers SET ${updates.join(', ')} WHERE name = $${values.length}`,
      values,
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PUT /api/streamers/:name]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
