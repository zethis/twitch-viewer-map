import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { NextResponse } from 'next/server'

const MIME_MAP: Record<string, string> = {
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
}

export async function GET(
  _request: Request,
  { params }: { params: { filename: string } },
) {
  const { filename } = params

  if (!filename || filename.includes('..') || filename.includes('/')) {
    return new NextResponse('Invalid filename', { status: 400 })
  }

  const filePath = join(process.cwd(), 'public', 'logos', filename)
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const contentType = MIME_MAP[ext] || 'application/octet-stream'

  try {
    const file = await readFile(filePath)
    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
      },
    })
  } catch {
    return new NextResponse('Logo not found', { status: 404 })
  }
}
