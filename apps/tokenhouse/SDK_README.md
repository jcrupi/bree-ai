# TokenHouse Starter SDK - Multi-Tenant AI Gateway

Complete SDK for building multi-tenant AI applications with org-based usage tracking.

## 🏗️ Architecture

**Platform Model**: You (platform owner) hold the master OpenAI and Claude API keys. Multiple organizations authenticate through TokenHouse and all API calls are proxied through the gateway with complete usage tracking.

```
┌─────────────────────────────────────────┐
│      Your Application (Frontend)        │
│   Uses @tokenhouse/react hooks          │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│    TokenHouse Gateway (Backend)         │
│  • Validates JWT on every request       │
│  • Proxies to OpenAI/Claude             │
│  • Tracks usage per org                 │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│   OpenAI/Claude APIs                    │
│   (Using your master keys)              │
└─────────────────────────────────────────┘
```

## 📦 Packages

### `@tokenhouse/core`
TypeScript SDK for authenticating and making API calls through TokenHouse.

```typescript
import { TokenHouseClient } from '@tokenhouse/core'

const client = new TokenHouseClient({
  orgId: 'org_demo123',
  orgSecret: 'ths_demo_secret_xyz789',
  baseUrl: 'http://localhost:8187'
})

// Authenticate (automatic with built-in token refresh)
await client.authenticate()

// Chat completion
const response = await client.chat({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'user', content: 'Hello!' }
  ]
})

console.log(response.choices[0].message.content)
console.log(`Tokens used: ${response.usage.total_tokens}`)
console.log(`Cost: $${response.cost_usd}`)

// Get usage statistics
const stats = await client.getUsage({
  start_date: '2024-01-01',
  end_date: '2024-01-31'
})

console.log(`Total tokens: ${stats.totals.total_tokens}`)
console.log(`Total cost: $${stats.totals.cost_usd}`)
```

### `@tokenhouse/react`
React hooks and components for easy integration.

```tsx
import { TokenHouseProvider, useChat } from '@tokenhouse/react'

function ChatComponent() {
  const { messages, sendMessage, isLoading, usage } = useChat()

  return (
    <div>
      {messages.map((msg, i) => (
        <div key={i}>{msg.role}: {msg.content}</div>
      ))}
      <div>Tokens: {usage.tokens} | Cost: ${usage.cost}</div>
      <button onClick={() => sendMessage('Hello', 'gpt-4o-mini')}>
        Send
      </button>
    </div>
  )
}

function App() {
  return (
    <TokenHouseProvider config={{
      orgId: 'org_demo123',
      orgSecret: 'ths_demo_secret_xyz789',
      baseUrl: 'http://localhost:8187'
    }}>
      <ChatComponent />
    </TokenHouseProvider>
  )
}
```

### `@tokenhouse/gateway`
Backend gateway server that proxies requests and tracks usage.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Environment

Create `gateway/.env`:

```bash
JWT_SECRET=your-secret-key-change-in-production
OPENAI_API_KEY=sk-proj-your-openai-master-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-master-key
```

### 3. Build Packages

```bash
bun run build:packages
```

### 4. Start Gateway

```bash
bun run dev:gateway
```

The gateway will start on `http://localhost:8187` and display demo credentials:

```
╔════════════════════════════════════════════════════════════╗
║                  DEMO ORG CREDENTIALS                       ║
╠════════════════════════════════════════════════════════════╣
║  Org ID:     org_demo123                                   ║
║  Secret:     ths_demo_secret_xyz789                        ║
╠════════════════════════════════════════════════════════════╣
║  Use these credentials to test the TokenHouse Gateway      ║
╚════════════════════════════════════════════════════════════╝
```

### 5. Start Example Chat App

```bash
bun run dev:chat
```

Open `http://localhost:6181` to see the chat interface.

## 🔑 Authentication Flow

### Step 1: Org Authenticates

```bash
curl -X POST http://localhost:8187/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "org_id": "org_demo123",
    "org_secret": "ths_demo_secret_xyz789"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Step 2: JWT Claims

The JWT contains:
```typescript
{
  iss: 'tokenhouse.ai',
  sub: 'org_demo123',
  org_id: 'org_demo123',
  org_name: 'Demo Organization',
  allowed_models: [
    'gpt-4o',
    'gpt-4o-mini',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022'
  ],
  rate_limits: {
    requests_per_minute: 100,
    tokens_per_day: 1000000
  },
  billing_tier: 'pro',
  usage_tracking_id: 'uuid-for-this-session'
}
```

**Important**: The JWT does NOT contain OpenAI/Claude API keys. Those remain secret on the gateway server.

### Step 3: Make API Calls

```bash
curl -X POST http://localhost:8187/chat/completions \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

Response:
```json
{
  "id": "chatcmpl-123",
  "model": "gpt-4o-mini",
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "Hello! How can I help you today?"
    }
  }],
  "usage": {
    "prompt_tokens": 8,
    "completion_tokens": 9,
    "total_tokens": 17
  },
  "cost_usd": 0.0000027,
  "org_id": "org_demo123"
}
```

### Step 4: Check Usage

```bash
curl -X GET "http://localhost:8187/usage/stats?start_date=2024-03-01&end_date=2024-03-09" \
  -H "Authorization: Bearer eyJhbGc..."
```

Response:
```json
{
  "org_id": "org_demo123",
  "period": {
    "start": "2024-03-01",
    "end": "2024-03-09"
  },
  "totals": {
    "requests": 42,
    "prompt_tokens": 1234,
    "completion_tokens": 5678,
    "total_tokens": 6912,
    "cost_usd": 0.012345
  },
  "by_model": {
    "gpt-4o-mini": {
      "requests": 30,
      "tokens": 5000,
      "cost_usd": 0.008
    },
    "claude-3-5-haiku-20241022": {
      "requests": 12,
      "tokens": 1912,
      "cost_usd": 0.004345
    }
  },
  "daily_breakdown": [
    {
      "date": "2024-03-08",
      "tokens": 3456,
      "cost_usd": 0.006172
    },
    {
      "date": "2024-03-09",
      "tokens": 3456,
      "cost_usd": 0.006173
    }
  ]
}
```

## 📊 Usage Tracking

Every API call is logged with:
- `org_id` - Which organization made the request
- `model` - Which AI model was used
- `prompt_tokens` - Input token count
- `completion_tokens` - Output token count
- `total_tokens` - Combined token count
- `cost_usd` - Calculated cost based on model pricing
- `latency_ms` - How long the request took

This data is stored in-memory (for demo) but can be persisted to MongoDB or PostgreSQL in production.

## 💰 Pricing

The gateway calculates costs based on current model pricing:

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| GPT-4o | $2.50 | $10.00 |
| GPT-4o Mini | $0.15 | $0.60 |
| Claude 3.5 Sonnet | $3.00 | $15.00 |
| Claude 3.5 Haiku | $0.80 | $4.00 |

Costs are returned in every API response and tracked per org for billing.

## 🎯 Use Cases

### 1. SaaS Platform with AI Features
Build a multi-tenant SaaS app where each customer gets AI capabilities without managing API keys.

### 2. White-Label AI Chat
Offer branded AI chat to your customers with transparent usage tracking and billing.

### 3. AI Developer Platform
Create a platform where developers build apps using your shared AI infrastructure.

### 4. Internal Tools
Track AI usage across different departments or teams in your organization.

## 🔒 Security Features

### JWT Validation
- Every request validates the JWT signature
- Tokens expire after 1 hour (auto-refresh in SDK)
- Invalid tokens return 401 Unauthorized

### Org Isolation
- Database queries filtered by `org_id`
- No org can see another org's data or usage
- Rate limits enforced per org

### Secret Storage
- Master API keys stored in environment variables
- Org secrets hashed with bcrypt
- Never expose keys in responses or logs

### Rate Limiting
- Configurable per-org limits
- `requests_per_minute` and `tokens_per_day`
- Returns 429 when limits exceeded

## 🏭 Production Deployment

### Database
Replace in-memory storage with MongoDB or PostgreSQL:

```typescript
// gateway/src/db/orgs.ts
import { MongoClient } from 'mongodb'

const client = new MongoClient(process.env.DATABASE_URL!)
const db = client.db('tokenhouse')

export async function getOrg(org_id: string) {
  return await db.collection('orgs').findOne({ org_id })
}
```

### Analytics
Add NATS for real-time usage analytics:

```typescript
// gateway/src/tracking/usage-logger.ts
import { connect } from 'nats'

const nats = await connect({ servers: process.env.NATS_URL })

export async function logUsage(log: UsageLog) {
  await db.usage_logs.insertOne(log)
  await nats.publish('usage.logged', JSON.stringify(log))
}
```

### Billing
Integrate with Stripe for automated invoicing:

```typescript
import Stripe from 'stripe'

async function generateMonthlyInvoice(orgId: string) {
  const stats = await getUsageStats({ org_id: orgId, ... })

  const invoice = await stripe.invoices.create({
    customer: org.stripe_customer_id,
    auto_advance: true
  })

  await stripe.invoiceItems.create({
    invoice: invoice.id,
    description: `AI Usage - ${stats.totals.total_tokens} tokens`,
    amount: Math.round(stats.totals.cost_usd * 100),
    currency: 'usd'
  })
}
```

## 📚 API Reference

### Core SDK

#### `TokenHouseClient`

**Constructor**
```typescript
new TokenHouseClient({
  orgId: string
  orgSecret: string
  baseUrl?: string
  onTokenRefresh?: (token: string) => void
})
```

**Methods**
```typescript
authenticate(): Promise<string>
chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>
chatStream(request: ChatCompletionRequest): AsyncGenerator<string>
getUsage(params?): Promise<UsageStats>
```

### React Hooks

#### `useChat()`
```typescript
const {
  messages: ChatMessage[]
  isLoading: boolean
  error: Error | null
  usage: { tokens: number, cost: number }
  sendMessage: (content: string, model?: string) => Promise<void>
  streamMessage: (content: string, model?: string) => AsyncGenerator<string>
  reset: () => void
} = useChat()
```

#### `useUsage(params?)`
```typescript
const {
  stats: UsageStats | null
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
} = useUsage({
  start_date?: string
  end_date?: string
  model?: string
  refreshInterval?: number
})
```

## 🎨 Example Apps

### Simple Chat (Included)
`examples/simple-chat` - Full-featured chat interface with model selector and usage tracking.

### Custom Integration

```typescript
import { TokenHouseClient } from '@tokenhouse/core'

const client = new TokenHouseClient({
  orgId: process.env.TOKENHOUSE_ORG_ID!,
  orgSecret: process.env.TOKENHOUSE_ORG_SECRET!
})

async function summarize(text: string) {
  const response = await client.chat({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Summarize the following text concisely.' },
      { role: 'user', content: text }
    ],
    temperature: 0.3,
    max_tokens: 150
  })

  return response.choices[0].message.content
}

const summary = await summarize('Long article text...')
console.log('Summary:', summary)
```

## 🤝 Contributing

This is a starter SDK - customize it for your specific use case:

1. Add more AI providers (Google, Cohere, etc.)
2. Implement streaming responses
3. Add embeddings endpoints
4. Build analytics dashboards
5. Add team/user management within orgs
6. Implement usage-based pricing tiers

## 📄 License

MIT - Feel free to use this as a foundation for your AI platform.

## 🆘 Support

For issues or questions:
1. Check the AgentX design document: `agentx/apps/tokenhouse-starter-sdk-org-tracking.agentx.md`
2. Review the example chat app: `examples/simple-chat`
3. Open an issue in the repository

---

**Built with**: Bun, Elysia, React, TypeScript, OpenAI, Anthropic
