'use client'

import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { isAdminAuthenticated, setAdminAuthenticated, storeAdminPassword } from '@/lib/admin-auth'

interface AdminLoginProps {
  onAuthChange?: () => void
}

export default function AdminLogin({ onAuthChange }: AdminLoginProps) {
  const [isAdmin, setIsAdmin] = useState(() => isAdminAuthenticated())
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsAdmin(isAdminAuthenticated())
  }, [])

  const handleLogin = async () => {
    if (!password.trim()) {
      setError('Password required')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/pins/99999999', {
        method: 'DELETE',
        headers: { 'x-admin-password': password },
      })

      if (res.status === 401) {
        setError('Invalid password')
        setIsLoading(false)
        return
      }

      storeAdminPassword(password)
      setAdminAuthenticated(true)
      setIsAdmin(true)
      setPassword('')
      setError('')
      onAuthChange?.()
    } catch {
      setError('Connection error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    setAdminAuthenticated(false)
    setIsAdmin(false)
    setPassword('')
    setError('')
    onAuthChange?.()
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    handleLogin()
  }

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        minWidth: '220px',
      }}
    >
      {isAdmin ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#1f2937' }}>Admin</span>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              border: 'none',
              background: '#ef4444',
              color: 'white',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label htmlFor="admin-password" style={{ fontSize: '14px', fontWeight: 700, color: '#1f2937' }}>
            Admin Login
          </label>
          {error && (
            <div style={{ fontSize: '12px', color: '#ef4444', padding: '4px 0' }}>
              {error}
            </div>
          )}
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            disabled={isLoading}
            style={{
              width: '100%',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '8px 10px',
              fontSize: '14px',
              outline: 'none',
              opacity: isLoading ? 0.6 : 1,
            }}
          />
          <button
            type="submit"
            disabled={isLoading}
            style={{
              border: 'none',
              background: '#7c3aed',
              color: 'white',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? 'Checking...' : 'Login as Admin'}
          </button>
        </form>
      )}
    </div>
  )
}
