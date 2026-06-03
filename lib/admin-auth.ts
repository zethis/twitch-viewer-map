const ADMIN_AUTH_KEY = 'admin-authenticated'
const ADMIN_PASSWORD_KEY = 'admin-password'

export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(ADMIN_AUTH_KEY) === 'true'
}

export function setAdminAuthenticated(value: boolean): void {
  if (typeof window === 'undefined') return
  if (value) {
    localStorage.setItem(ADMIN_AUTH_KEY, 'true')
  } else {
    localStorage.removeItem(ADMIN_AUTH_KEY)
    sessionStorage.removeItem(ADMIN_PASSWORD_KEY)
  }
}

export function storeAdminPassword(password: string): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(ADMIN_PASSWORD_KEY, password)
}

export function getAdminPassword(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(ADMIN_PASSWORD_KEY)
}
