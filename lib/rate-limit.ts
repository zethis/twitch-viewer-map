interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

const LIMIT = 5
const WINDOW_MS = 60 * 1000 // 60 seconds

export function checkRateLimit(request: Request): boolean {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now > entry.resetAt) {
    // New window
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false // not exceeded
  }

  if (entry.count >= LIMIT) {
    return true // exceeded
  }

  entry.count++
  return false // not exceeded
}
