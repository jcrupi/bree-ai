# TokenHouse SDK - Quick Start Guide

Complete multi-tenant AI gateway with org-based usage tracking.

## 🎯 What Was Built

A complete SDK monorepo with:

✅ **@tokenhouse/core** - TypeScript SDK for authentication and API calls
✅ **@tokenhouse/react** - React hooks (useChat, useUsage)
✅ **@tokenhouse/gateway** - Backend proxy server with usage tracking
✅ **examples/simple-chat** - Full-featured chat UI demo
✅ Complete documentation and deployment guides

## 🚀 Quick Start (3 Steps)

### 1. Start the Gateway

```bash
cd gateway
bun run dev
```

You'll see demo credentials printed:
```
╔════════════════════════════════════════════════════════════╗
║                  DEMO ORG CREDENTIALS                       ║
╠════════════════════════════════════════════════════════════╣
║  Org ID:     org_demo123                                   ║
║  Secret:     ths_demo_secret_xyz789                        ║
╠════════════════════════════════════════════════════════════╣
║  Use these credentials to test the TokenHouse Gateway      ║
╚════════════════════════════════════════════════════════════╝
🚀 TokenHouse Gateway running at 0.0.0.0:3000
```

### 2. Start the Example Chat App

In a new terminal:

```bash
cd examples/simple-chat
bun install
bun run dev
```

Open http://localhost:6181

### 3. Test the API

```bash
# Authenticate
curl -X POST http://localhost:8187/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "org_id": "org_demo123",
    "org_secret": "ths_demo_secret_xyz789"
  }'

# Save the access_token from the response, then:

# Chat with AI
curl -X POST http://localhost:8187/chat/completions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'

# Check usage stats
curl -X GET "http://localhost:8187/usage/stats" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📦 Package Structure

```
tokenhouse/
├── packages/
│   ├── core/              # @tokenhouse/core - TypeScript SDK
│   │   ├── src/
│   │   │   ├── client.ts  # Main TokenHouseClient class
│   │   │   └── index.ts   # Exports
│   │   └── dist/          # Built output
│   │
│   └── react/             # @tokenhouse/react - React hooks
│       ├── src/
│       │   ├── provider.tsx   # TokenHouseProvider
│       │   ├── useChat.ts     # Chat hook
│       │   ├── useUsage.ts    # Usage stats hook
│       │   └── index.ts
│       └── dist/
│
├── gateway/               # Backend proxy server
│   └── src/
│       ├── index.ts       # Elysia server
│       ├── routes/
│       │   ├── auth.ts    # JWT authentication
│       │   ├── chat.ts    # Proxy to OpenAI/Claude
│       │   └── usage.ts   # Usage stats
│       ├── tracking/
│       │   └── usage-logger.ts  # Log all API calls
│       └── db/
│           └── orgs.ts    # Org database (in-memory demo)
│
└── examples/
    └── simple-chat/       # Full chat UI demo
        ├── src/
        │   ├── App.tsx    # Main chat interface
        │   └── index.css  # Styling
        └── index.html
```

## 🔑 How It Works

### Authentication Flow

1. **Org Authenticates**
   POST `/auth/token` with `org_id` and `org_secret`

2. **Receive JWT**
   Contains org identity, allowed models, rate limits
   **Does NOT contain AI API keys** (those stay secret on server)

3. **Make API Calls**
   POST `/chat/completions` with JWT in Authorization header

4. **Gateway Proxies**
   - Validates JWT
   - Extracts org_id
   - Calls OpenAI/Claude with platform's master keys
   - Logs usage (org_id, tokens, cost)
   - Returns response with cost

5. **Track Usage**
   GET `/usage/stats` to see total tokens and cost

### Key Architecture Points

- **No API Key Distribution**: Your OpenAI/Claude keys stay on the gateway server
- **Multi-Tenant**: Each org has isolated usage tracking
- **Transparent Pricing**: Every response includes exact cost
- **Usage Tracking**: Every token counted and attributed to org
- **Automatic Billing Ready**: Usage data ready for Stripe invoicing

## 💡 Usage Examples

### TypeScript SDK

```typescript
import { TokenHouseClient } from '@tokenhouse/core'

const client = new TokenHouseClient({
  orgId: 'org_demo123',
  orgSecret: 'ths_demo_secret_xyz789',
  baseUrl: 'http://localhost:8187'
})

// Chat
const response = await client.chat({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'Hello!' }]
})

console.log(response.choices[0].message.content)
console.log(`Cost: $${response.cost_usd}`)

// Usage stats
const stats = await client.getUsage()
console.log(`Total cost this month: $${stats.totals.cost_usd}`)
```

### React Hooks

```tsx
import { TokenHouseProvider, useChat } from '@tokenhouse/react'

function ChatComponent() {
  const { messages, sendMessage, usage } = useChat()

  return (
    <div>
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

## 🔧 Configuration

### Environment Variables (gateway/.env)

```bash
# Required
JWT_SECRET=your-secret-key-change-in-production

# Platform Master Keys (your keys)
OPENAI_API_KEY=sk-proj-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Optional (for production)
DATABASE_URL=mongodb://localhost:27017/tokenhouse
NATS_URL=nats://localhost:4222
```

### Supported Models

- **OpenAI**: gpt-4o, gpt-4o-mini
- **Anthropic**: claude-3-5-sonnet-20241022, claude-3-5-haiku-20241022

Add more models by updating:
- `gateway/src/routes/chat.ts` - Add to routing logic
- `gateway/src/db/orgs.ts` - Add to allowed_models for demo org

## 📊 Usage Tracking

Every API call logs:
- `org_id` - Which organization
- `model` - Which AI model
- `prompt_tokens` - Input tokens
- `completion_tokens` - Output tokens
- `cost_usd` - Calculated cost
- `latency_ms` - Request duration

View in gateway logs:
```
[USAGE] Org: org_demo123 | Model: gpt-4o-mini | Tokens: 17 | Cost: $0.000003
```

## 💰 Pricing

Current pricing (automatically calculated):

| Model | Input | Output |
|-------|-------|--------|
| GPT-4o | $2.50/1M | $10.00/1M |
| GPT-4o Mini | $0.15/1M | $0.60/1M |
| Claude 3.5 Sonnet | $3.00/1M | $15.00/1M |
| Claude 3.5 Haiku | $0.80/1M | $4.00/1M |

Update in `gateway/src/routes/chat.ts` → `calculateCost()` function

## 🏭 Production Deployment

### 1. Database
Replace in-memory storage with MongoDB:

```typescript
// gateway/src/db/orgs.ts
import { MongoClient } from 'mongodb'
const db = new MongoClient(process.env.DATABASE_URL!).db('tokenhouse')
```

### 2. Analytics
Add NATS for real-time usage events:

```typescript
// gateway/src/tracking/usage-logger.ts
import { connect } from 'nats'
const nats = await connect({ servers: process.env.NATS_URL })
await nats.publish('usage.logged', JSON.stringify(log))
```

### 3. Billing
Integrate Stripe for automated invoicing:

```typescript
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

async function generateInvoice(orgId: string) {
  const stats = await getUsageStats({ org_id: orgId })
  await stripe.invoiceItems.create({
    customer: org.stripe_customer_id,
    amount: Math.round(stats.totals.cost_usd * 100),
    currency: 'usd'
  })
}
```

## 🚢 Docker Deployment

```dockerfile
# gateway/Dockerfile
FROM oven/bun:1
WORKDIR /app
COPY package.json bun.lock ./
COPY src ./src
RUN bun install --production
CMD ["bun", "src/index.ts"]
```

```bash
docker build -t tokenhouse-gateway ./gateway
docker run -p 3000:3000 \
  -e JWT_SECRET=your-secret \
  -e OPENAI_API_KEY=sk-proj-xxx \
  -e ANTHROPIC_API_KEY=sk-ant-xxx \
  tokenhouse-gateway
```

## 📚 Documentation

- **SDK Reference**: See `SDK_README.md` for complete API docs
- **AgentX Design**: See `agentx/apps/tokenhouse-starter-sdk-org-tracking.agentx.md` for full architecture
- **Example Code**: Check `examples/simple-chat/src/App.tsx` for working implementation

## 🎨 Customization

### Add New Models
1. Update `gateway/src/routes/chat.ts` routing logic
2. Add pricing to `calculateCost()` function
3. Add to org's `allowed_models` list

### Add New Providers
1. Create proxy in `gateway/src/proxy/`
2. Add routing in `gateway/src/routes/chat.ts`
3. Add usage logging with provider name

### Build Custom UI
Use the React hooks in your own components:

```tsx
import { useChat, useUsage } from '@tokenhouse/react'

function MyCustomChat() {
  const { messages, sendMessage, isLoading } = useChat()
  const { stats } = useUsage({ refreshInterval: 30000 })

  // Your UI here
}
```

## ✅ What's Working

- ✅ JWT authentication with org isolation
- ✅ Proxy to OpenAI (GPT-4o, GPT-4o Mini)
- ✅ Proxy to Anthropic (Claude 3.5 Sonnet, Haiku)
- ✅ Usage tracking per org with token counts and costs
- ✅ TypeScript SDK with auto-refresh
- ✅ React hooks with state management
- ✅ Full example chat application
- ✅ In-memory storage (demo ready)

## 🔜 Production TODO

- [ ] Replace in-memory storage with MongoDB/PostgreSQL
- [ ] Add NATS for real-time analytics
- [ ] Implement rate limiting per org
- [ ] Add Stripe billing integration
- [ ] Add streaming response support
- [ ] Add embeddings endpoints
- [ ] Build admin dashboard
- [ ] Add webhook notifications
- [ ] Implement audit logging
- [ ] Add team management within orgs

## 🆘 Troubleshooting

**Gateway won't start**
- Check that ports 3000 is available
- Verify environment variables are set

**Authentication fails**
- Verify org credentials match demo: `org_demo123` / `ths_demo_secret_xyz789`
- Check JWT_SECRET is consistent

**API calls fail**
- Ensure gateway is running on port 3000
- Check Authorization header format: `Bearer <token>`
- Verify model is in org's allowed_models list

**Chat app won't connect**
- Start gateway first (port 3000)
- Check console for CORS errors
- Verify baseUrl in App.tsx matches gateway URL

## 📞 Support

For questions or issues:
1. Check the full documentation in `SDK_README.md`
2. Review the AgentX design document
3. Examine the example chat app code
4. Open an issue in the repository

---

**Built with**: Bun, Elysia, React, TypeScript, OpenAI, Anthropic

**Ready to deploy**: This is production-ready architecture, just add your database and billing integration.
