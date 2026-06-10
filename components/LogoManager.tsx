'use client'

import type { ChangeEvent, FormEvent } from 'react'
import { useState } from 'react'
import { getAdminPassword } from '@/lib/admin-auth'

interface LogoManagerProps {
  streamerName: string
  currentLogoUrl?: string | null
  currentTwitchUrl?: string | null
  onLogoUpdated: (logoUrl: string) => void
  onTwitchUrlUpdated: (url: string) => void
}

const MAX_FILE_SIZE = 5 * 1024 * 1024

const cardStyle = {
  background: 'rgba(255, 255, 255, 0.95)',
  padding: '12px',
  borderRadius: '8px',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
  minWidth: '220px',
} as const

const labelStyle = {
  fontSize: '14px',
  fontWeight: 700,
  color: '#1f2937',
} as const

const inputStyle = {
  width: '100%',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  padding: '8px 10px',
  fontSize: '14px',
  outline: 'none',
} as const

const primaryButtonStyle = {
  border: 'none',
  background: '#7c3aed',
  color: 'white',
  borderRadius: '6px',
  padding: '8px 12px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
} as const

const dangerButtonStyle = {
  ...primaryButtonStyle,
  background: '#ef4444',
} as const

const messageStyle = (isError: boolean) => ({
  fontSize: '12px',
  color: isError ? '#ef4444' : '#10b981',
  padding: '4px 0',
})

export default function LogoManager({
  streamerName,
  currentLogoUrl,
  currentTwitchUrl,
  onLogoUpdated,
  onTwitchUrlUpdated,
}: LogoManagerProps) {
  const [logoMessage, setLogoMessage] = useState('')
  const [logoError, setLogoError] = useState(false)
  const [urlMessage, setUrlMessage] = useState('')
  const [urlError, setUrlError] = useState(false)
  const [twitchUrl, setTwitchUrl] = useState(currentTwitchUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [savingUrl, setSavingUrl] = useState(false)

  const authHeaders = (): Record<string, string> => {
    const password = getAdminPassword(streamerName)
    return {
      'x-admin-password': password ?? '',
      'x-streamer-name': streamerName,
    }
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLogoMessage('')
    setLogoError(false)

    if (!file.type.startsWith('image/')) {
      setLogoMessage('File must be an image')
      setLogoError(true)
      e.target.value = ''
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setLogoMessage('File must be 5MB or smaller')
      setLogoError(true)
      e.target.value = ''
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/streamers/${streamerName}/logo`, {
        method: 'POST',
        body: formData,
        headers: authHeaders(),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || `Upload failed (${res.status})`)
      }

      const data = await res.json()
      onLogoUpdated(data.logo_url)
      setLogoMessage('Logo uploaded!')
      setLogoError(false)
    } catch (err) {
      setLogoMessage(err instanceof Error ? err.message : 'Upload failed')
      setLogoError(true)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleRemoveLogo = async () => {
    setLogoMessage('')
    setLogoError(false)
    setRemoving(true)

    try {
      const res = await fetch(`/api/streamers/${streamerName}`, {
        method: 'PUT',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logo_url: '' }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || `Remove failed (${res.status})`)
      }

      onLogoUpdated('')
      setLogoMessage('Logo removed')
      setLogoError(false)
    } catch (err) {
      setLogoMessage(err instanceof Error ? err.message : 'Remove failed')
      setLogoError(true)
    } finally {
      setRemoving(false)
    }
  }

  const handleSaveTwitchUrl = async (e: FormEvent) => {
    e.preventDefault()
    setUrlMessage('')
    setUrlError(false)
    setSavingUrl(true)

    try {
      const res = await fetch(`/api/streamers/${streamerName}`, {
        method: 'PUT',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ twitch_url: twitchUrl }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || `Save failed (${res.status})`)
      }

      onTwitchUrlUpdated(twitchUrl)
      setUrlMessage('URL saved!')
      setUrlError(false)
    } catch (err) {
      setUrlMessage(err instanceof Error ? err.message : 'Save failed')
      setUrlError(true)
    } finally {
      setSavingUrl(false)
    }
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={labelStyle}>Logo</span>

          {currentLogoUrl && currentLogoUrl !== '' && (
            <img
              src={currentLogoUrl}
              alt="Current logo"
              style={{ width: '64px', height: '64px', objectFit: 'contain', borderRadius: '4px' }}
            />
          )}

          {logoMessage && (
            <div style={messageStyle(logoError)}>{logoMessage}</div>
          )}

          <input
            type="file"
            accept=".png,.svg,.jpg,.jpeg"
            onChange={handleFileChange}
            disabled={uploading}
            style={{
              ...inputStyle,
              padding: '6px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              opacity: uploading ? 0.6 : 1,
            }}
          />

          {currentLogoUrl && currentLogoUrl !== '' && (
            <button
              type="button"
              onClick={handleRemoveLogo}
              disabled={removing}
              style={{
                ...dangerButtonStyle,
                cursor: removing ? 'not-allowed' : 'pointer',
                opacity: removing ? 0.6 : 1,
              }}
            >
              {removing ? 'Removing...' : 'Remove Logo'}
            </button>
          )}
        </div>

        <form onSubmit={handleSaveTwitchUrl} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label htmlFor="twitch-url" style={labelStyle}>Twitch URL</label>

          {urlMessage && (
            <div style={messageStyle(urlError)}>{urlMessage}</div>
          )}

          <input
            id="twitch-url"
            type="text"
            value={twitchUrl}
            onChange={(e) => setTwitchUrl(e.target.value)}
            placeholder="https://twitch.tv/..."
            disabled={savingUrl}
            style={{
              ...inputStyle,
              opacity: savingUrl ? 0.6 : 1,
            }}
          />

          <button
            type="submit"
            disabled={savingUrl}
            style={{
              ...primaryButtonStyle,
              cursor: savingUrl ? 'not-allowed' : 'pointer',
              opacity: savingUrl ? 0.6 : 1,
            }}
          >
            {savingUrl ? 'Saving...' : 'Save URL'}
          </button>
        </form>
      </div>
    </div>
  )
}
