# 🏦 TokenHouse Starter SDK

**Multi-tenant AI API Gateway** - Unified access to Claude, GPT-4, and other LLMs with organization-based usage tracking, transparent pricing, and auto-refresh authentication.

## Features

- 🔐 **Org-based Authentication** - JWT tokens with automatic refresh
- 💰 **Transparent Pricing** - Cost calculated and returned in every API response
- 📊 **Usage Tracking** - Per-org token counts and cost calculation
- 🏢 **Multi-tenancy** - Isolated organizations with individual rate limits
- 🎯 **Simple SDK** - TypeScript SDK with React hooks for easy integration
- 🚀 **Production Ready** - Elysia gateway with CORS, rate limiting, and error handling

## Stack (BREE)

| Layer | Technology |
|-------|-----------|
| **B**un | Runtime and package manager |
| **R**eact | Frontend UI with Vite |
| **E**lysia | Bun-native HTTP framework |
| **E**den | End-to-end type-safe API client |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TokenHouse Platform                      │
│                 (tokenhouse-super-org)                      │
│                  Owner: johnny@tokenhouse.ai                 │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   [Groups]          [Companies]         [Admin UI]
        │                   │                   │
┌───────┴────────┐  ┌──────┴──────┐      Port: 6182
│                │  │             │
│ Community      │  │ HappyAI     │
│ (free tier)    │  │ (enterprise)│
│                │  │             │
│ Professional   │  │ Groovy      │
│ (pro tier)     │  │ Relativity  │
│                │  │ (pro tier)  │
│                │  │             │
│                │  │ FreeHabits  │
│                │  │ (starter)   │
└────────────────┘  └─────────────┘


React App (Examples)          TypeScript SDK (packages/core)
     │                                  │
     ├─ useTokenHouse() ───────────────┤
     ├─ useChat()                       │
     └─ useUsage()                      │
                                        │
                                        ▼
                          Gateway (Elysia on port 8187)
                                        │
                    ┌───────────────────┼────────────────────┐
                    │                   │                    │
              JWT Auth            Proxy Layer          Usage Tracking
                    │                   │                    │
            Org Validation         OpenAI API         Per-org logs
            Rate Limiting          Anthropic API      Cost calculation
            Token refresh          Master keys        NATS publish
```

## Quick Start

### 1. Start the Chat Demo

```bash
# Start gateway + chat UI
./start-demo.sh
```

- Gateway: http://localhost:8187
- Chat UI: http://localhost:6181

**Demo Credentials:**
- Org ID: `org_demo123`
- Org Secret: `ths_demo_secret_xyz789`

### 2. Start the Admin UI

```bash
# Start gateway + admin UI
./start-admin.sh
```

- Gateway: http://localhost:8187
- Admin UI: http://localhost:6182

**Admin Credentials:**
- Admin Secret: `admin-secret-change-me`
- User: johnny@tokenhouse.ai

## Organizations

### Platform Owner
**TokenHouse (tokenhouse-super-org)**
- Tier: Enterprise
- Limits: 1000 req/min, 100M tokens/day
- Owner: johnny@tokenhouse.ai

### Groups
**TokenHouse Community (tokenhouse-community)**
- Tier: Free
- Limits: 60 req/min, 500K tokens/day

**TokenHouse Professional (tokenhouse-professional)**
- Tier: Pro
- Limits: 200 req/min, 5M tokens/day

### Companies
**HappyAI (happyai)**
- Tier: Enterprise
- Limits: 300 req/min, 10M tokens/day

**Groovy Relativity (groovy-relativity)**
- Tier: Pro
- Limits: 250 req/min, 8M tokens/day

**FreeHabits (freehabits)**
- Tier: Starter
- Limits: 150 req/min, 3M tokens/day

## SDK Usage

### TypeScript Client

```typescript
import { TokenHouseClient } from '@tokenhouse/core'

const client = new TokenHouseClient({
  orgId: 'happyai',
  orgSecret: 'ths_happyai_secret_xyz',
  baseUrl: 'http://localhost:8187'
})

// SDK handles authentication automatically
const response = await client.chat({
  model: 'gpt-4o',
  messages: [
    { role: 'user', content: 'Hello from TokenHouse!' }
  ]
})

console.log(response.content)
console.log(`Cost: $${response.cost_usd}`)
console.log(`Tokens: ${response.usage.total_tokens}`)
```

### React Hooks

```tsx
import { TokenHouseProvider, useChat } from '@tokenhouse/react'

function App() {
  return (
    <TokenHouseProvider config={{
      orgId: 'happyai',
      orgSecret: 'ths_happyai_secret_xyz',
      baseUrl: 'http://localhost:8187'
    }}>
      <ChatInterface />
    </TokenHouseProvider>
  )
}

function ChatInterface() {
  const { messages, sendMessage, usage } = useChat()

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      <div>Total cost: ${usage.cost}</div>
      <button onClick={() => sendMessage('Hello!')}>
        Send
      </button>
    </div>
  )
}
```

## Admin API

All admin endpoints require the `X-Admin-Secret` header.

### Create Organization

```bash
curl -X POST http://localhost:8187/admin/orgs \
  -H "X-Admin-Secret: admin-secret-change-me" \
  -H "Content-Type: application/json" \
  -d '{
    "org_name": "Acme Corporation",
    "initial_user_email": "admin@acme.com",
    "billing_tier": "pro",
    "allowed_models": ["gpt-4o", "claude-3-5-sonnet-20241022"]
  }'
```

**Response:**
```json
{
  "org_id": "acme-corporation",
  "org_name": "Acme Corporation",
  "org_secret": "ths_abc123...",
  "org_token": "tht_xyz789...",
  "billing_tier": "pro"
}
```

⚠️ Save the `org_secret` - it's only shown once!

### Create User

```bash
curl -X POST http://localhost:8187/admin/users \
  -H "X-Admin-Secret: admin-secret-change-me" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "org_ids": ["happyai", "groovy-relativity"]
  }'
```

### List Organizations

```bash
curl http://localhost:8187/admin/orgs \
  -H "X-Admin-Secret: admin-secret-change-me"
```

### List Users

```bash
curl http://localhost:8187/admin/users \
  -H "X-Admin-Secret: admin-secret-change-me"
```

## Project Structure

```
tokenhouse/
├── packages/
│   ├── core/              # TypeScript SDK
│   │   ├── src/
│   │   │   ├── client.ts  # TokenHouseClient
│   │   │   └── types.ts   # Type definitions
│   │   └── package.json
│   │
│   └── react/             # React hooks
│       ├── src/
│       │   ├── provider.tsx  # TokenHouseProvider
│       │   ├── useChat.ts    # Chat hook
│       │   └── useUsage.ts   # Usage tracking hook
│       └── package.json
│
├── gateway/               # Elysia server (port 8187)
│   ├── src/
│   │   ├── index.ts       # Main server
│   │   ├── routes/
│   │   │   ├── auth.ts    # JWT authentication
│   │   │   ├── chat.ts    # Proxy to OpenAI/Claude
│   │   │   ├── usage.ts   # Usage stats
│   │   │   └── admin.ts   # Admin endpoints
│   │   └── db/
│   │       ├── orgs.ts    # Organization storage
│   │       └── usage.ts   # Usage logging
│   └── package.json
│
├── examples/
│   ├── simple-chat/       # Chat demo (port 6181)
│   │   ├── src/
│   │   │   └── App.tsx
│   │   └── package.json
│   │
│   └── admin-ui/          # Admin interface (port 6182)
│       ├── src/
│       │   ├── App.tsx
│       │   └── components/
│       │       ├── OrganizationsPanel.tsx
│       │       ├── UsersPanel.tsx
│       │       ├── CreateOrgPanel.tsx
│       │       └── CreateUserPanel.tsx
│       └── package.json
│
├── agentx/
│   └── apps/
│       └── tokenhouse-domain-model.agentx.md  # Architecture doc
│
├── start-demo.sh          # Start chat demo
├── start-admin.sh         # Start admin UI
└── package.json           # Monorepo root
```

## Pricing & Billing Tiers

### Cost Calculation

Token costs are calculated in real-time using OpenAI/Anthropic pricing:

```typescript
// OpenAI pricing (per 1M tokens)
gpt-4o:      $2.50 input, $10.00 output
gpt-4o-mini: $0.15 input, $0.60 output

// Anthropic pricing (per 1M tokens)
claude-3-5-sonnet: $3.00 input, $15.00 output
claude-3-5-haiku:  $0.80 input, $4.00 output
```

Every API response includes:
- `cost_usd`: Total cost in dollars
- `usage.total_tokens`: Token count
- `org_id`: Organization charged

### Billing Tiers

| Tier | Monthly | Requests/Min | Tokens/Day | Best For |
|------|---------|--------------|------------|----------|
| **Free** | $0 | 60 | 500K | Testing & demos |
| **Starter** | $29 | 150 | 3M | Growing startups |
| **Pro** | $99 | 200 | 5M | Production apps |
| **Enterprise** | Custom | 300+ | 10M+ | Large scale |

## Available Models

All organizations can access:

**OpenAI:**
- gpt-4o
- gpt-4o-mini
- o1
- o1-mini

**Anthropic:**
- claude-3-5-sonnet-20241022
- claude-3-5-haiku-20241022

Model access can be configured per organization.

## Development

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- Anthropic and/or OpenAI API keys

### Environment Setup

```bash
# Gateway
cd gateway
cp .env.example .env
# Add your API keys to gateway/.env

# Install dependencies
cd ..
bun install
```

### Start Development

```bash
# Start everything (gateway + chat UI)
bun run dev

# Or individually:
bun run dev:gateway  # Port 8187
bun run dev:chat     # Port 6181
bun run dev:admin    # Port 6182

# Build for production
bun run build
```

## Documentation

- [Admin UI Guide](examples/admin-ui/README.md) - Complete admin interface documentation
- [Admin API Guide](ADMIN_GUIDE.md) - Admin API endpoints and examples
- [SDK Documentation](packages/core/README.md) - TypeScript SDK reference
- [Domain Model](agentx/apps/tokenhouse-domain-model.agentx.md) - Architecture and design
- [Quick Start Guide](QUICKSTART.md) - 3-step quick start
- [Testing Guide](TEST_UI.md) - Testing the chat UI

## Security

⚠️ **Production Considerations:**

1. Change `admin-secret-change-me` to a secure secret
2. Use HTTPS for all production traffic
3. Store org secrets securely (never in code)
4. Implement proper rate limiting per org
5. Add request logging and monitoring
6. Use environment variables for all secrets
7. Enable CORS only for trusted domains

## Support

- Email: johnny@tokenhouse.ai
- Organization: TokenHouse (tokenhouse-super-org)

## License

Proprietary - TokenHouse Platform
