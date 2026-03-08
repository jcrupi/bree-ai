import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { authRoutes } from './routes/auth.routes'
import { walletRoutes } from './routes/wallet.routes'
import { gatewayRoutes } from './routes/gateway.routes'
import { getNatsConnection } from './nats'
import { startSettlementConsumer } from './nats/settlement.consumer'
import { startLLMConsumer } from './nats/llm.consumer'

const PORT = parseInt(process.env.PORT ?? '3000')

const app = new Elysia()
  .use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }))

  .use(swagger({
    path: '/docs',
    documentation: {
      info: {
        title: 'Token House API',
        version: '0.1.0',
        description: 'AI Token Clearinghouse — unified access to LLMs with token-based billing',
      },
      tags: [
        { name: 'auth', description: 'Authentication via Better Auth' },
        { name: 'wallet', description: 'Token balance, purchases, usage' },
        { name: 'gateway', description: 'OpenAI-compatible LLM proxy' },
      ],
    },
  }))

  // Health check
  .get('/health', () => ({
    status: 'ok',
    service: 'tokenhouse-api',
    timestamp: new Date().toISOString(),
  }))

  // Routes
  .use(authRoutes)
  .use(walletRoutes)
  .use(gatewayRoutes)

  .onStart(async () => {
    console.log('\n🏦 Token House Server starting...\n')

    // Connect to NATS and start consumers
    try {
      await getNatsConnection()
      await startSettlementConsumer()
      await startLLMConsumer()
      console.log('[NATS] All consumers started\n')
    } catch (err) {
      console.warn('[NATS] Could not connect — running without NATS (limited functionality):', err)
    }
  })

  .listen(PORT)

console.log(`
╔═══════════════════════════════════════╗
║       🏦  TOKEN HOUSE SERVER          ║
╠═══════════════════════════════════════╣
║  API:   http://localhost:${PORT}         ║
║  Docs:  http://localhost:${PORT}/docs    ║
╚═══════════════════════════════════════╝
`)

export type App = typeof app
