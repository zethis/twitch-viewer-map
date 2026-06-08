'use client'

import { signIn, signOut } from 'next-auth/react'
import { useCurrentUser } from '@/lib/auth-client'

export default function TwitchLoginButton() {
  const user = useCurrentUser()

  if (user === null) {
    return (
      <button
        type="button"
        onClick={() => signIn('twitch')}
        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-all duration-150 flex items-center gap-2"
      >
        <svg
          className="w-5 h-5 fill-current"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
        </svg>
        Login with Twitch
      </button>
    )
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg ring-1 ring-black/5 px-3 py-2 flex items-center gap-2">
      {/* biome-ignore lint/performance/noImgElement: External avatar URL */}
      <img
        src={user.image ?? ''}
        alt={user.name ?? ''}
        className="w-8 h-8 rounded-full object-cover"
      />
      <span className="text-sm font-semibold text-gray-800">{user.name}</span>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: '/' })}
        className="text-xs text-red-500 hover:text-red-700 font-medium"
      >
        Logout
      </button>
    </div>
  )
}
