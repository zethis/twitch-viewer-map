'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { GeocodeResult } from '@/lib/types'
import { useCurrentUser } from '@/lib/auth-client'

interface SubmitFormProps {
  onPinAdded: () => void
}

export default function SubmitForm({ onPinAdded }: SubmitFormProps) {
  const user = useCurrentUser()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([])
  const [selected, setSelected] = useState<GeocodeResult | null>(null)
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (user?.name) setUsername(user.name)
  }, [user?.name])

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`)
      const data: GeocodeResult[] = await res.json()
      setSuggestions(data)
      setShowDropdown(data.length > 0)
    } catch {
      setSuggestions([])
      setShowDropdown(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!selected) {
      debounceRef.current = setTimeout(() => fetchSuggestions(query), 300)
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, selected, fetchSuggestions])

  const handleSelect = (result: GeocodeResult) => {
    setSelected(result)
    setQuery(result.display_name)
    setSuggestions([])
    setShowDropdown(false)
  }

  const handleQueryChange = (value: string) => {
    setQuery(value)
    setSelected(null) // deselect when user types again
    setError(null)
  }

  const handleSubmit = async () => {
    if (!selected) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: selected.display_name,
          username: username.trim() || undefined,
          lat: parseFloat(selected.lat),
          lng: parseFloat(selected.lon),
          ...(user ? {
            twitch_id: user.id,
            display_name: user.name,
            profile_image_url: user.image,
          } : {}),
        }),
      })
      if (res.status === 201) {
        setSuccess(true)
        setQuery('')
        setSelected(null)
        setUsername('')
        setSuggestions([])
        onPinAdded()
        setTimeout(() => setSuccess(false), 5000)
      } else if (res.status === 429) {
        setError('Too many submissions — please wait a minute')
      } else {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong')
      }
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl ring-1 ring-black/5 p-5 w-80 max-w-[calc(100vw-32px)] flex flex-col gap-2.5">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-base font-extrabold text-gray-800">📍 Add your location</h1>
        {user?.image && (
          <img src={user.image} alt={user.name ?? ''} className="w-8 h-8 rounded-full object-cover" />
        )}
      </div>
      {user?.name && (
        <div className="mb-2">
          <span className="text-xs text-purple-600 font-medium">Logged in as {user.name}</span>
        </div>
      )}

      {/* City search */}
      <div className="relative">
        <label htmlFor="city-input" className="block text-sm font-medium text-gray-700 mb-1">
          City <span className="text-red-500">*</span>
        </label>
        <input
          id="city-input"
          type="text"
          placeholder="Search city..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
          autoComplete="off"
        />
        {showDropdown && suggestions.length > 0 && (
          <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
            {suggestions.map((s) => (
              <li
                key={`${s.lat}-${s.lon}`}
                onMouseDown={() => handleSelect(s)}
                className="px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 cursor-pointer transition-colors duration-100"
              >
                {s.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Username */}
      <div>
        <label htmlFor="username-input" className="block text-sm font-medium text-gray-700 mb-1">
          Username <span className="text-gray-400 text-xs">(optional)</span>
        </label>
        <input
          id="username-input"
          type="text"
          placeholder="Your Twitch name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={25}
          readOnly={!!user}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-default read-only:bg-gray-100 read-only:cursor-default"
        />
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selected || loading}
        className="w-full bg-purple-600 hover:bg-purple-700 hover:shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none text-white font-semibold py-2 rounded-lg text-sm transition-all duration-150 active:scale-95"
      >
        {loading ? 'Adding...' : 'Add me to the map'}
      </button>

      {/* Feedback */}
      {success && (
        <p className="text-green-600 text-sm font-medium text-center animate-fade-in transition-opacity">
          ✅ You&apos;ve been added to the map!
        </p>
      )}
      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}
    </div>
  )
}