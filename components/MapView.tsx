'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Pin } from '@/lib/types'

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
}

export default function MapView({ pins, isAdmin, onDeletePin }: MapViewProps) {
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
        <MarkerClusterGroup>
          {pins.map((pin) => (
            <Marker key={pin.id} position={[pin.lat, pin.lng]}>
              <Popup>
                <strong>{pin.username ?? 'Anonymous'}</strong>
                <br />
                {pin.city}
                {isAdmin && (
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
        </MarkerClusterGroup>
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
