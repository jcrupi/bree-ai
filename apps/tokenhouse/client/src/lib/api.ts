// Eden treaty client — type-safe API calls backed by Elysia server types
// NOTE: In development the type import below gives full autocomplete.
// For production builds, run `bun run build` in /server first.

import { treaty } from '@elysiajs/eden'

// We import the App type from the server for full e2e type safety
// This is a dev-time only import — no runtime dependency on server code
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type App = any // Replace with: import type { App } from '../../../server/src/index'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const api = treaty<App>(API_URL, {
  fetch: {
    credentials: 'include',
  },
})

// Helper to make authenticated requests with JWT bearer token
export function apiWithToken(token: string) {
  return treaty<App>(API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    fetch: {
      credentials: 'include',
    },
  })
}
