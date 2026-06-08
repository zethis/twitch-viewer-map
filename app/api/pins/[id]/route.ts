import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getServerSession } from '@/lib/auth'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const parsedId = parseInt(params.id, 10)
  if (!/^[1-9]\d*$/.test(params.id) || !Number.isFinite(parsedId) || parsedId <= 0) {
    return NextResponse.json({ error: 'Invalid pin id' }, { status: 400 })
  }

  const envPassword = process.env.ADMIN_PASSWORD
  const requestPassword = request.headers.get('x-admin-password')
  const isAdmin = envPassword && requestPassword === envPassword

  const session = await getServerSession()
  const sessionUserId = session?.user?.id ?? null

  if (!isAdmin && !sessionUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    if (isAdmin) {
      const result = await pool.query('DELETE FROM pins WHERE id = $1 RETURNING id', [parsedId])
      if (result.rowCount === 0) return NextResponse.json({ error: 'Pin not found' }, { status: 404 })
      return NextResponse.json({ message: 'Pin deleted', id: parsedId })
    }

    const pin = await pool.query('SELECT twitch_id FROM pins WHERE id = $1', [parsedId])
    if (pin.rowCount === 0) return NextResponse.json({ error: 'Pin not found' }, { status: 404 })
    if (pin.rows[0].twitch_id !== sessionUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    await pool.query('DELETE FROM pins WHERE id = $1', [parsedId])
    return NextResponse.json({ message: 'Pin deleted', id: parsedId })
  } catch (err) {
    console.error('[DELETE /api/pins/:id]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsedId = parseInt(params.id, 10)
  if (!/^[1-9]\d*$/.test(params.id) || !Number.isFinite(parsedId) || parsedId <= 0) {
    return NextResponse.json({ error: 'Invalid pin id' }, { status: 400 })
  }

  let body: { city?: string; lat?: number; lng?: number }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const { city, lat, lng } = body

  if (!city || typeof city !== 'string' || city.trim().length === 0) {
    return NextResponse.json({ error: 'city is required' }, { status: 400 })
  }
  if (typeof lat !== 'number' || lat < -90 || lat > 90) {
    return NextResponse.json({ error: 'lat must be between -90 and 90' }, { status: 400 })
  }
  if (typeof lng !== 'number' || lng < -180 || lng > 180) {
    return NextResponse.json({ error: 'lng must be between -180 and 180' }, { status: 400 })
  }

  const pin = await pool.query('SELECT twitch_id FROM pins WHERE id = $1', [parsedId])
  if (pin.rowCount === 0) {
    return NextResponse.json({ error: 'Pin not found' }, { status: 404 })
  }
  if (pin.rows[0].twitch_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const result = await pool.query(
    'UPDATE pins SET city = $1, lat = $2, lng = $3 WHERE id = $4 RETURNING *',
    [city.trim(), lat, lng, parsedId]
  )
  return NextResponse.json(result.rows[0])
}
