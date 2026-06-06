'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Pin } from '@/lib/types'
import { useState } from 'react'
import { useCurrentUser } from '@/lib/auth-client'

// Fix Leaflet's broken default icon in webpack/Next.js
L.Icon.Default.mergeOptions({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
})

interface MapViewProps {
  pins: Pin[]
  isAdmin: boolean
  onDeletePin: (pinId: number) => void
  onEditPin: (pinId: number, city: string, lat: number, lng: number) => void
}

export default function MapView({ pins, isAdmin, onDeletePin, onEditPin }: MapViewProps) {
  const currentUser = useCurrentUser()
  const [editingPinId, setEditingPinId] = useState<number | null>(null)
  const [editCity, setEditCity] = useState('')

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {pins.map((pin) => (
          <Marker key={pin.id} position={[pin.lat, pin.lng]}>
            <Popup>
              <strong>
                {pin.profile_image_url && (
                  // biome-ignore lint/performance/noImgElement: External avatar URL from Twitch
                  <img src={pin.profile_image_url} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%', marginRight: '6px', verticalAlign: 'middle', display: 'inline' }} />
                )}
                {pin.display_name ?? pin.username ?? 'Anonymous'}
              </strong>
              <br />
              {pin.city}
              {currentUser && pin.twitch_id === currentUser.id && (
                <>
                  {editingPinId === pin.id ? (
                    // Inline edit form
                    <div style={{ marginTop: '8px' }}>
                      <input
                        type="text"
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        placeholder="New city name"
                        style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', marginBottom: '4px' }}
                      />
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!editCity.trim()) return
                            // Use nominatim to geocode the city
                            const res = await fetch(`/api/geocode?q=${encodeURIComponent(editCity)}`)
                            const results = await res.json()
                            if (results.length > 0) {
                              const r = results[0]
                              await onEditPin(pin.id, r.display_name, parseFloat(r.lat), parseFloat(r.lon))
                              setEditingPinId(null)
                            }
                          }}
                          style={{ flex: 1, background: '#7c3aed', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPinId(null)}
                          style={{ flex: 1, background: 'none', border: '1px solid #d1d5db', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setEditingPinId(pin.id); setEditCity(pin.city) }}
                      style={{ display: 'block', marginTop: '6px', color: '#7c3aed', background: 'none', border: '1px solid #7c3aed', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', width: '100%' }}
                    >
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Delete your pin? This cannot be undone.')) {
                        onDeletePin(pin.id)
                      }
                    }}
                    style={{ display: 'block', marginTop: '4px', color: '#ef4444', background: 'none', border: '1px solid #ef4444', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', width: '100%' }}
                  >
                    Delete
                  </button>
                </>
              )}
              {isAdmin && !(currentUser && pin.twitch_id === currentUser.id) && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Delete this pin? This cannot be undone.')) {
                      onDeletePin(pin.id)
                    }
                  }}
                  style={{ display: 'block', marginTop: '6px', color: '#ef4444', background: 'none', border: '1px solid #ef4444', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', width: '100%' }}
                >
                  Delete
                </button>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {pins.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            backgroundColor: 'rgba(255,255,255,0.9)',
            padding: '16px 24px',
            borderRadius: '8px',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <p style={{ margin: 0, fontSize: '16px', color: '#374151' }}>
            No viewers yet — be the first to add your location!
          </p>
        </div>
      )}
    </div>
  )
}
