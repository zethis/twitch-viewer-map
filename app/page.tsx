import pool from '@/lib/db'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface Streamer {
  name: string
  display_name: string | null
}

export default async function Home() {
  const result = await pool.query<Streamer>('SELECT name, display_name FROM streamers ORDER BY name')
  const streamers = result.rows

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '32px' }}>Twitch Viewer Maps</h1>
      {streamers.length === 0 ? (
        <p style={{ fontSize: '18px', color: '#94a3b8' }}>No streamers configured yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '400px' }}>
          {streamers.map((streamer) => (
            <Link
              key={streamer.name}
              href={`/${streamer.name}`}
              style={{
                display: 'block',
                padding: '16px 24px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '12px',
                textDecoration: 'none',
                color: 'white',
                fontSize: '18px',
                fontWeight: 600,
                textAlign: 'center',
                transition: 'background 0.2s',
              }}
            >
              {streamer.display_name ?? streamer.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
