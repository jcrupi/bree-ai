import Elysia from 'elysia'
import { auth } from '../auth'

// Mount Better Auth handler under /api/auth/*
export const authRoutes = new Elysia({ prefix: '/api/auth' })
  .all('/*', async ({ request }) => {
    return auth.handler(request)
  })
