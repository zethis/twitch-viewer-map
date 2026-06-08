'use client'

import { useSession } from 'next-auth/react'

export function useCurrentUser() {
  const { data: session } = useSession()
  const user = session?.user

  if (!user?.id) {
    return null
  }

  return {
    id: user.id,
    name: user.name ?? null,
    image: user.image ?? null,
  }
}
