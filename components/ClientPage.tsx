'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

import AdminLogin from '@/components/AdminLogin'
import Logo from '@/components/Logo'
import RecentRegistrations from '@/components/RecentRegistrations'
import SessionProvider from '@/components/SessionProvider'
import SubmitForm from '@/components/SubmitForm'
import TwitchLoginButton from '@/components/TwitchLoginButton'
import { getAdminPassword, isAdminAuthenticated } from '@/lib/admin-auth'
import type { Pin } from '@/lib/types'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

interface ClientPageProps {
  initialPins: Pin[]
}

export default function ClientPage({ initialPins }: ClientPageProps) {
  const [pins, setPins] = useState<Pin[]>(initialPins)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)

  useEffect(() => {
    setIsAdmin(isAdminAuthenticated())
    // Check if ?admin=true is in URL query string
    const params = new URLSearchParams(window.location.search)
    setShowAdminLogin(params.get('admin') === 'true')
  }, [])

  const handleAuthChange = () => {
    setIsAdmin(isAdminAuthenticated())
  }

  const handlePinAdded = async () => {
    try {
      const res = await fetch('/api/pins')
      const data: Pin[] = await res.json()
      setPins(data)
    } catch {
      // silent - map will be updated on next manual refresh
    }
  }

  const handlePinDeleted = async (pinId: number) => {
    const password = getAdminPassword()
    try {
      const headers: Record<string, string> = {}
      if (password) {
        headers['x-admin-password'] = password
      }

      const res = await fetch(`/api/pins/${pinId}`, {
        method: 'DELETE',
        headers,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        window.alert(data.error ?? 'Failed to delete pin')
        return
      }
      const pinsRes = await fetch('/api/pins')
      const data: Pin[] = await pinsRes.json()
      setPins(data)
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const handlePinEdited = async (pinId: number, city: string, lat: number, lng: number) => {
    const res = await fetch(`/api/pins/${pinId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, lat, lng }),
    })
    if (res.ok) {
      const pinsRes = await fetch('/api/pins')
      const data: Pin[] = await pinsRes.json()
      setPins(data)
    }
  }

  return (
    <SessionProvider>
      <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <MapView pins={pins} isAdmin={isAdmin} onDeletePin={handlePinDeleted} onEditPin={handlePinEdited} />
        {/* Logo - centered at top */}
        <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', zIndex: 500, width: '280px' }}>
          <Logo />
        </div>
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '55px',
            zIndex: 1000,
          }}
        >
          <SubmitForm onPinAdded={handlePinAdded} />
          <div className="mt-3">
            <RecentRegistrations pins={pins} />
          </div>
        </div>
        <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 1000 }} className="flex flex-col gap-2 items-end">
          <TwitchLoginButton />
          {showAdminLogin && <AdminLogin onAuthChange={handleAuthChange} />}
        </div>
      </div>
    </SessionProvider>
  )
}
