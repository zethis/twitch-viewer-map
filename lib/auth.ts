import type { DefaultSession, NextAuthOptions } from 'next-auth'
import { getServerSession as _getServerSession } from 'next-auth'
import TwitchProvider from 'next-auth/providers/twitch'

export { useCurrentUser } from '@/lib/auth-client'

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID ?? '',
      clientSecret: process.env.TWITCH_CLIENT_SECRET ?? '',
    }),
  ],
  callbacks: {
    jwt({ token, account }) {
      if (account) {
        token.id = account.providerAccountId
      }

      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }

      return session
    },
  },
}

export const getServerSession = () => _getServerSession(authOptions)
