import ClientPage from '@/components/ClientPage'
import pool from '@/lib/db'
import type { Pin } from '@/lib/types'

async function getPins(): Promise<Pin[]> {
  try {
    const result = await pool.query<Pin>(
      'SELECT id, city, username, lat, lng, created_at FROM pins ORDER BY created_at DESC'
    )
    return result.rows
  } catch {
    return []
  }
}

export default async function Home() {
  const pins = await getPins()
  return <ClientPage initialPins={pins} />
}