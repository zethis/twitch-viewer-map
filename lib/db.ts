import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Eagerly establish one connection so the pool is warm before the first SSR render.
pool.connect().then((client) => client.release()).catch((err) => {
  console.error('[db] initial connection failed:', err.message)
})

export default pool
