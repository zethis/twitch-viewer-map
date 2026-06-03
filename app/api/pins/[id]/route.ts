import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const envPassword = process.env.ADMIN_PASSWORD
  if (!envPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const requestPassword = request.headers.get('x-admin-password')
  if (requestPassword !== envPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsedId = parseInt(params.id, 10)
  if (!/^[1-9]\d*$/.test(params.id) || !Number.isFinite(parsedId) || parsedId <= 0) {
    return NextResponse.json({ error: 'Invalid pin id' }, { status: 400 })
  }

  try {
    const result = await pool.query(
      'DELETE FROM pins WHERE id = $1 RETURNING id',
      [parsedId]
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Pin not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Pin deleted', id: parsedId })
  } catch (err) {
    console.error('[DELETE /api/pins/:id]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
