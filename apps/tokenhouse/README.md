# 🏦 Token House

**AI Token Clearinghouse** — A unified gateway to Claude, GPT-4, and other LLMs through a single API with token-based billing, multi-org support, and a NATS-powered agent clearinghouse backbone.

## Stack (BREE)

| Layer | Technology |
|-------|-----------|
| **B**un | Runtime, package manager, test runner |
| **R**eact | Frontend UI with Vite |
| **E**lysia | Bun-native HTTP framework, OpenAI-compatible gateway |
| **E**den | End-to-end type-safe API client |

**Plus:**
- **Better Auth** — Auth with multi-org support and custom JWT claims
- **NATS JetStream** — Realtime messaging backbone for agent dispatch and settlement
- **Drizzle ORM** — Type-safe Postgres queries
- **Stripe** — Credit purchases

---

## Architecture

```
React (Bun + Vite)
  └─ Eden (type-safe API client)
       └─ Elysia Gateway (Bun)
            ├─ Better Auth (JWT validation, org context, custom claims)
            ├─ Wallet Service (balance checks, deductions)
            ├─ NATS Publisher (dispatches tasks)
            │
            └─ NATS JetStream
                 ├─ LLM Consumer → Anthropic API / OpenAI API
                 └─ Settlement Consumer → Postgres (deduct tokens, log usage)
```

### JWT Claims

Every authenticated request carries a Token House JWT with:

```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "org_id": "org_id_or_null",
  "org_role": "owner|admin|member|null",
  "token_balance": 48250,
  "token_budget": 100000,
  "allowed_models": ["claude-3-5-haiku-20241022", "gpt-4o-mini"],
  "plan_tier": "free|pro|enterprise"
}
```

No database hit required for auth/model permission checks — all authority lives in the token.

---

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- [Docker](https://docker.com) (for Postgres + NATS)
- Anthropic and/or OpenAI API keys

### 1. Clone and install

```bash
git clone <repo>
cd tokenhouse
bun install
```

### 2. Start infrastructure

```bash
docker compose up -d
```

This starts:
- PostgreSQL on `localhost:5432`
- NATS with JetStream on `localhost:4222`
- NATS monitoring at `http://localhost:8222`

### 3. Configure environment

```bash
# Server
cp server/.env.example server/.env
# Edit server/.env with your values:
# - ANTHROPIC_API_KEY
# - OPENAI_API_KEY
# - STRIPE_SECRET_KEY (optional for local dev)
# - BETTER_AUTH_SECRET (any 32+ char string)

# Client
cp client/.env.example client/.env
```

### 4. Run database migrations

```bash
cd server
bun run db:migrate
```

### 5. Start development

```bash
# From root — starts both server and client
bun run dev

# Or individually:
cd server && bun run dev   # http://localhost:3000
cd client && bun run dev   # http://localhost:5173
```

---

## API Reference

### Auth (Better Auth)

Better Auth handles all auth endpoints automatically:

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/sign-up/email` | Register with email/password |
| `POST /api/auth/sign-in/email` | Sign in, receive session |
| `GET  /api/auth/get-session` | Get current session |
| `POST /api/auth/sign-out` | Sign out |
| `GET  /api/auth/jwks` | JWKS for JWT verification |
| `GET  /api/auth/token` | Get JWT for API use |

### Wallet

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET  /api/wallet/balance` | Bearer JWT | Get token balance |
| `GET  /api/wallet/packages` | — | List credit packages |
| `POST /api/wallet/purchase` | Bearer JWT | Create Stripe checkout |
| `GET  /api/wallet/usage` | Bearer JWT | Usage history |

### Gateway (OpenAI-compatible)

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET  /api/gateway/models` | Bearer JWT | List allowed models |
| `POST /api/gateway/v1/chat/completions` | Bearer JWT | Send a chat completion |
| `GET  /api/gateway/agents` | Bearer JWT | List registered agents |

#### Example — calling the gateway

```bash
# 1. Get a JWT
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/token \
  -H "Cookie: <your-session-cookie>" | jq -r '.token')

# 2. Call the gateway (OpenAI-compatible format)
curl -X POST http://localhost:3000/api/gateway/v1/chat/completions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3-5-haiku-20241022",
    "messages": [{"role": "user", "content": "Hello from Token House!"}]
  }'
```

#### Response includes Token House metadata

```json
{
  "id": "chatcmpl-...",
  "choices": [{ "message": { "role": "assistant", "content": "..." } }],
  "usage": { "prompt_tokens": 12, "completion_tokens": 48 },
  "tokenhouse": {
    "taskId": "uuid",
    "tokensCharged": 142,
    "latencyMs": 843,
    "remainingBalance": 48108
  }
}
```

---

## Token Pricing

Token House units map to provider costs as follows (per 1M tokens):

| Model | Input | Output | Provider |
|-------|-------|--------|----------|
| claude-3-5-haiku-20241022 | 800 TH | 4,000 TH | Anthropic |
| claude-3-5-sonnet-20241022 | 3,000 TH | 15,000 TH | Anthropic |
| gpt-4o-mini | 150 TH | 600 TH | OpenAI |
| gpt-4o | 2,500 TH | 10,000 TH | OpenAI |

**$1 USD = 10,000 Token House units**

---

## Project Structure

```
tokenhouse/
├── docker-compose.yml      # Postgres + NATS
├── package.json            # Monorepo root
│
├── server/                 # Elysia + Bun API
│   ├── src/
│   │   ├── index.ts        # App entry, Elysia setup
│   │   ├── auth/           # Better Auth config + JWT claims
│   │   ├── db/             # Drizzle schema + migrations
│   │   ├── nats/           # NATS connection, consumers, subjects
│   │   ├── plugins/        # Elysia auth plugin
│   │   ├── routes/         # auth, wallet, gateway routes
│   │   └── services/       # wallet service, LLM service
│   └── drizzle/            # Generated migrations
│
└── client/                 # React + Vite frontend
    └── src/
        ├── lib/            # Better Auth client, Eden API client
        ├── hooks/          # useJwtToken, useWallet
        ├── components/     # Shared UI components
        └── pages/          # AuthPage, Dashboard
```

---

## Extending with Agents

To register a custom agent that processes tasks via NATS:

```typescript
import { connect, JSONCodec } from 'nats'

const nc = await connect({ servers: 'nats://localhost:4222' })
const jc = JSONCodec()

// Subscribe to tasks matching your capability
const sub = nc.subscribe('tokenhouse.tasks.new')

for await (const msg of sub) {
  const task = jc.decode(msg.data)

  // Process the task (call your specialized model, tool, etc.)
  const result = await myAgent.process(task)

  // Reply to the requester
  if (task.replySubject) {
    nc.publish(task.replySubject, jc.encode({ content: result }))
  }
}
```

---

## Environment Variables

### Server (`server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | ✅ | Min 32 char secret for JWT signing |
| `BETTER_AUTH_URL` | ✅ | Server base URL |
| `NATS_URL` | ✅ | NATS connection URL |
| `ANTHROPIC_API_KEY` | ⚠️ | Required for Claude models |
| `OPENAI_API_KEY` | ⚠️ | Required for GPT models |
| `STRIPE_SECRET_KEY` | Optional | For credit purchases |
| `STRIPE_WEBHOOK_SECRET` | Optional | For Stripe webhooks |

### Client (`client/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ | Server URL |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Optional | Stripe publishable key |

---

## Next Steps

- [ ] Add streaming responses via NATS + SSE
- [ ] Organization management UI (invite members, set budgets)
- [ ] Agent registry UI with capability browser
- [ ] Token futures/hedging market layer
- [ ] HIPAA compliance mode (PHI audit logging, BAA flow)
- [ ] Rate limiting per org/user
- [ ] Model fallback routing (if Claude is down, route to GPT)
