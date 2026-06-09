import { notFound } from 'next/navigation'
import ClientPage from '@/components/ClientPage'
import pool from '@/lib/db'
import type { Pin } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function StreamerPage({ params }: { params: { streamer: string } }) {
  const { streamer } = params

  const streamerResult = await pool.query('SELECT 1 FROM streamers WHERE name = $1', [streamer])
  if (streamerResult.rowCount === 0) {
    notFound()
  }

  const result = await pool.query<Pin>(
    'SELECT id, city, username, lat, lng, created_at, twitch_id, display_name, profile_image_url, streamer_name FROM pins WHERE streamer_name = $1 ORDER BY created_at DESC',
    [streamer]
  )

  return <ClientPage initialPins={result.rows} streamerName={streamer} />
}
