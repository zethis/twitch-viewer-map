'use client'

import dynamic from 'next/dynamic'
import AdminLogin from '@/components/AdminLogin'
import Footer from '@/components/Footer'
import SubmitForm from '@/components/SubmitForm'
import { useEffect, useState } from 'react'
import type { Pin } from '@/lib/types'
import { isAdminAuthenticated, getAdminPassword, setAdminAuthenticated } from '@/lib/admin-auth'

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
    console.log('[DEBUG] Delete attempt:', { pinId, hasPassword: !!password, passwordLength: password?.length })
    if (!password) {
      window.alert('Session expired. Please log in again.')
      setIsAdmin(false)
      setAdminAuthenticated(false)
      return
    }
    try {
      const res = await fetch(`/api/pins/${pinId}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password },
      })
      console.log('[DEBUG] Delete response:', { status: res.status, ok: res.ok })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        window.alert(data.error ?? 'Failed to delete pin')
        return
      }
      const pinsRes = await fetch('/api/pins')
      const data: Pin[] = await pinsRes.json()
      setPins(data)
    } catch (err) {
      console.error('[DEBUG] Delete error:', err)
    }
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <MapView pins={pins} isAdmin={isAdmin} onDeletePin={handlePinDeleted} />
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '55px',
          zIndex: 1000,
        }}
      >
        <SubmitForm onPinAdded={handlePinAdded} />
      </div>
      <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 1000 }}>
        {showAdminLogin && <AdminLogin onAuthChange={handleAuthChange} />}
      </div>
      <Footer />
    </div>
  )
}
