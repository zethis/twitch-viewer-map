'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import SubmitForm from '@/components/SubmitForm'
import type { Pin } from '@/lib/types'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

interface ClientPageProps {
  initialPins: Pin[]
}

export default function ClientPage({ initialPins }: ClientPageProps) {
  const [pins, setPins] = useState<Pin[]>(initialPins)

  const handlePinAdded = async () => {
    try {
      const res = await fetch('/api/pins')
      const data: Pin[] = await res.json()
      setPins(data)
    } catch {
      // silent - map will be updated on next manual refresh
    }
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <MapView pins={pins} />
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 1000,
        }}
      >
        <SubmitForm onPinAdded={handlePinAdded} />
      </div>
    </div>
  )
}