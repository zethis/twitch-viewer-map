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

  useEffect(() => {
    setIsAdmin(isAdminAuthenticated())
  }, [])

  const handleLogin = () => {
    storeAdminPassword(password)
    setAdminAuthenticated(true)
    setIsAdmin(true)
    setPassword('')
    onAuthChange?.()
  }

  const handleLogout = () => {
    setAdminAuthenticated(false)
    setIsAdmin(false)
    setPassword('')
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
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            style={{
              width: '100%',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '8px 10px',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              border: 'none',
              background: '#7c3aed',
              color: 'white',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Login as Admin
          </button>
        </form>
      )}
    </div>
  )
}
