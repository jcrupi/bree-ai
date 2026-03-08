import { createAuthClient } from 'better-auth/client'
import { organizationClient } from 'better-auth/client/plugins'
import { jwtClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  plugins: [
    organizationClient(),
    jwtClient(),
  ],
})

export const {
  signIn,
  signOut,
  signUp,
  useSession,
} = authClient
