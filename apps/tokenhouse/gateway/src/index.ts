import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { cors } from '@elysiajs/cors'
import { auth } from './auth/better-auth'
import { authRoutes } from './routes/auth'
import { chatRoutes } from './routes/chat'
import { usageRoutes } from './routes/usage'
import { adminRoutes } from './routes/admin'

const app = new Elysia()
  .use(cors())
  .use(jwt({
    name: 'jwt',
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production'
  }))
  .get('/', () => ({
    service: 'TokenHouse Gateway',
    version: '0.2.0',
    status: 'running',
    auth: 'better-auth + jwt'
  }))
  // Mount better-auth for user authentication
  .all('/auth/*', async ({ request }) => {
    return await auth.handler(request)
  })
  // Keep legacy API token authentication
  .use(authRoutes)
  .use(chatRoutes)
  .use(usageRoutes)
  .use(adminRoutes)
  .listen(8187)

console.log(`🚀 TokenHouse Gateway running at ${app.server?.hostname}:${app.server?.port}`)
console.log(`📝 Better-auth endpoints available at /auth/*`)
console.log(`🔑 API token endpoint available at /auth/token`)
console.log(`🔐 JWKS endpoint available at /auth/jwks`)
