import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limit'
import fs from 'fs'
import path from 'path'

const ALLOWED_MIME_TYPES = ['image/png', 'image/svg+xml', 'image/jpeg']
const MAX_FILE_SIZE = 5 * 1024 * 1024

const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'image/jpeg': 'jpg',
}

export async function POST(request: NextRequest, { params }: { params: { name: string } }) {
  if (checkRateLimit(request)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const requestPassword = request.headers.get('x-admin-password')

  let isAdmin = false
  if (params.name && requestPassword) {
    const streamerResult = await pool.query(
      'SELECT admin_password FROM streamers WHERE name = $1',
      [params.name],
    )
    isAdmin =
      streamerResult.rowCount !== null &&
      streamerResult.rowCount > 0 &&
      streamerResult.rows[0].admin_password === requestPassword
  }

  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: image/png, image/svg+xml, image/jpeg' },
        { status: 400 },
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum 5MB' }, { status: 400 })
    }

    const ext = MIME_TO_EXT[file.type] ?? 'png'
    const safeName = `${params.name}-${Date.now()}.${ext}`

    const oldResult = await pool.query(
      'SELECT logo_url FROM streamers WHERE name = $1',
      [params.name],
    )
    if (oldResult.rowCount === null || oldResult.rowCount === 0) {
      return NextResponse.json({ error: 'Streamer not found' }, { status: 404 })
    }
    const oldLogoUrl: string | null = oldResult.rows[0].logo_url ?? null

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const savePath = path.join(process.cwd(), 'public', 'logos', safeName)
    fs.writeFileSync(savePath, buffer)

    if (oldLogoUrl) {
      const prefix = oldLogoUrl.startsWith('/api/logos/') ? '/api/logos/' : '/logos/'
      const oldFileName = oldLogoUrl.replace(prefix, '')
      const oldPath = path.join(process.cwd(), 'public', 'logos', oldFileName)
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath)
      }
    }

    const newLogoUrl = `/api/logos/${safeName}`
    await pool.query('UPDATE streamers SET logo_url = $1 WHERE name = $2', [
      newLogoUrl,
      params.name,
    ])

    return NextResponse.json({ logo_url: newLogoUrl })
  } catch (err) {
    console.error('[POST /api/streamers/[name]/logo]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
