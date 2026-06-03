'use client'

import type { Pin } from '@/lib/types'

function getRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

interface RecentRegistrationsProps {
  pins: Pin[]
}

export default function RecentRegistrations({ pins }: RecentRegistrationsProps) {
  const recent = pins.slice(0, 20)

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl ring-1 ring-black/5 p-4 w-80 max-w-[calc(100vw-32px)] max-h-96 overflow-y-auto">
      <h2 className="text-base font-extrabold text-gray-800 mb-3">📋 Recent Registrations</h2>
      {recent.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">No registrations yet</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {recent.map((pin) => (
            <li key={pin.id} className="flex flex-col gap-0.5 p-2 rounded-lg bg-gray-50 hover:bg-purple-50 transition-colors duration-150">
              <span className={`text-sm font-semibold truncate ${pin.username ? 'text-purple-600' : 'text-gray-400 italic'}`}>
                {pin.username || 'Anonymous'}
              </span>
              <span className="text-xs text-gray-600 truncate">{pin.city || 'Unknown location'}</span>
              <span className="text-xs text-gray-400">{getRelativeTime(pin.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
