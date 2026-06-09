const ADMIN_AUTH_KEY = 'admin-authenticated'
const ADMIN_PASSWORD_KEY = 'admin-password'

export function isAdminAuthenticated(streamerName?: string): boolean {
  if (typeof window === 'undefined') return false
  if (!streamerName) {
    // Legacy global key for backward compat
    return localStorage.getItem(ADMIN_AUTH_KEY) === 'true'
  }
  try {
    const state = JSON.parse(localStorage.getItem(ADMIN_AUTH_KEY) || '{}')
    return state[streamerName] === true
  } catch {
    return false
  }
}

export function setAdminAuthenticated(streamerName: string, value: boolean): void {
  if (typeof window === 'undefined') return
  if (!streamerName) {
    // Legacy: simple boolean
    if (value) {
      localStorage.setItem(ADMIN_AUTH_KEY, 'true')
    } else {
      localStorage.removeItem(ADMIN_AUTH_KEY)
      sessionStorage.removeItem(ADMIN_PASSWORD_KEY)
    }
    return
  }
  try {
    const state = JSON.parse(localStorage.getItem(ADMIN_AUTH_KEY) || '{}')
    if (value) {
      state[streamerName] = true
    } else {
      delete state[streamerName]
    }
    localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(state))
  } catch {
    // Fallback
    if (value) localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify({ [streamerName]: true }))
  }
}

export function storeAdminPassword(streamerName: string, password: string): void {
  if (typeof window === 'undefined') return
  if (!streamerName) {
    // Legacy: simple string
    sessionStorage.setItem(ADMIN_PASSWORD_KEY, password)
    return
  }
  try {
    const passwords = JSON.parse(sessionStorage.getItem(ADMIN_PASSWORD_KEY) || '{}')
    passwords[streamerName] = password
    sessionStorage.setItem(ADMIN_PASSWORD_KEY, JSON.stringify(passwords))
  } catch {
    sessionStorage.setItem(ADMIN_PASSWORD_KEY, JSON.stringify({ [streamerName]: password }))
  }
}

export function getAdminPassword(streamerName?: string): string | null {
  if (typeof window === 'undefined') return null
  if (!streamerName) {
    return sessionStorage.getItem(ADMIN_PASSWORD_KEY)
  }
  try {
    const passwords = JSON.parse(sessionStorage.getItem(ADMIN_PASSWORD_KEY) || '{}')
    return passwords[streamerName] || null
  } catch {
    return null
  }
}
