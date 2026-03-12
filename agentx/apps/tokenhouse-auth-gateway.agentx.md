# TokenHouse: AI Financial Platform & Authentication Gateway

**Status:** Design Phase
**Type:** Fintech + AI SaaS Platform
**Stack:** BREE (Bun + React + Elysia + Eden)
**Created:** 2026-03-08
**Updated:** 2026-03-09 (Payment Platform Integration)

## 🎯 Core Concept

**TokenHouse is a financial platform for AI developers** — part Venmo/Zelle, part API gateway. Users can receive payments, deposit money, pay each other, and use their balance to call OpenAI, Claude, Gemini, etc.

### The Three-Way Value Proposition

```
💰 Financial Account          🔑 AI Authentication          👥 P2P Payments
├─ Receive money (Venmo)     ├─ One TokenHouse ID         ├─ Pay collaborators
├─ Deposit funds (Zelle)     ├─ JWT with AI credentials   ├─ Bill clients
├─ Cash balance              └─ Call OpenAI/Claude        └─ Split costs
└─ Auto-convert to tokens       directly (no proxy)           with teams
```

## 🎯 Key Differentiators

### vs OpenRouter (API Gateway Only)
**OpenRouter:** Pay for AI → All calls proxied through their servers
**TokenHouse:** Receive payments + Pay for AI → Call providers directly with credentials

### vs Venmo/Zelle (Payments Only)
**Venmo/Zelle:** Send/receive money for anything
**TokenHouse:** Send/receive money + built-in AI API access

### Architecture Advantage

| Mode | Request Path | Use Case | Latency |
|------|-------------|----------|---------|
| **Direct** | Developer → Provider (with TH credentials) | Production, high-volume, low-latency | 0ms overhead |
| **Proxy** | Developer → TokenHouse → Provider | Optional fallback for special cases | +10-50ms |

**TokenHouse is the only platform that combines financial accounts with AI API authentication.**

---

## Executive Summary

**TokenHouse is a financial platform specifically designed for AI developers** — combining Venmo/Zelle-style payments with AI API authentication and billing.

### How It Works

**1. Financial Account (Like Venmo/Cash App)**
- Link Venmo or Zelle to your TokenHouse account
- Receive payments from clients, collaborators, or anyone
- Deposit money directly from linked bank accounts
- Hold USD balance in your TokenHouse account

**2. AI Authentication (Unlike OpenRouter)**
- Authenticate with `tokenhouse_id` + `tokenhouse_secret`
- Receive JWT with embedded OpenAI, Claude, Gemini credentials
- Call providers **directly** (no proxy latency)
- AI usage automatically deducted from your balance

**3. P2P Payments (Like Venmo, but for AI)**
- Pay other TokenHouse users for services
- Split AI costs with team members
- Bill clients directly in TokenHouse
- Transfer funds peer-to-peer instantly

### Architecture: Authentication Gateway (NOT Proxy)

```
┌─────────────────────────────────────────────────────┐
│              User's TokenHouse Account              │
│                                                     │
│  💰 USD Balance: $250.00                           │
│  🪙 Token Balance: 2,500,000 TH tokens            │
│                                                     │
│  Linked: Venmo, Zelle, Bank Account               │
└─────────────────────┬───────────────────────────────┘
                      │
                      │ 1. Authenticate
                      ↓
┌─────────────────────────────────────────────────────┐
│         TokenHouse Authentication Service           │
│                                                     │
│  POST /auth/token                                   │
│  Body: {                                            │
│    tokenhouse_id: "th_user_abc123",               │
│    tokenhouse_secret: "ths_secret_xyz789"         │
│  }                                                  │
└─────────────────────┬───────────────────────────────┘
                      │
                      │ 2. Returns JWT with embedded credentials
                      ↓
┌─────────────────────────────────────────────────────┐
│                    JWT Payload                      │
│                                                     │
│  {                                                  │
│    "sub": "th_user_abc123",                        │
│    "balance_usd": 250.00,                          │
│    "balance_tokens": 2500000,                      │
│                                                     │
│    "ai_credentials": {                              │
│      "openai": {                                    │
│        "api_key": "sk-proj-scoped-xxx",           │
│        "org_id": "org-tokenhouse-xxx"             │
│      },                                            │
│      "anthropic": {                                 │
│        "api_key": "sk-ant-scoped-xxx",            │
│        "workspace_id": "ws-tokenhouse-xxx"        │
│      },                                            │
│      "google": {                                    │
│        "api_key": "AIza-scoped-xxx"               │
│      }                                             │
│    },                                              │
│                                                     │
│    "allowed_models": [...],                        │
│    "rate_limits": {...}                            │
│  }                                                  │
└─────────────────────┬───────────────────────────────┘
                      │
                      │ 3. Developer extracts credentials
                      ↓
┌─────────────────────────────────────────────────────┐
│              Developer's Application                │
│                                                     │
│  const jwt = decodeJWT(access_token)               │
│  const openaiKey = jwt.ai_credentials.openai.api_key │
│                                                     │
│  // Call OpenAI DIRECTLY (no proxy)                │
│  const openai = new OpenAI({ apiKey: openaiKey }) │
│  const response = await openai.chat.completions... │
└─────────────────────┬───────────────────────────────┘
                      │
                      │ 4. Direct API call
                      ↓
┌─────────────────────────────────────────────────────┐
│         OpenAI / Anthropic / Google APIs            │
│                                                     │
│  Provider processes request with scoped key        │
│  Returns response directly to developer            │
│  Reports usage back to TokenHouse (webhooks)       │
└─────────────────────────────────────────────────────┘
```

**Key Point:** Developers call AI providers **directly** with credentials from JWT. TokenHouse is NOT in the request path (unlike OpenRouter).

### Value Proposition

**For Developers & Freelancers:**
- 💰 **Financial Account:** Receive payments via Venmo/Zelle, hold USD balance
- 🔑 **AI Authentication:** One TokenHouse ID for OpenAI, Claude, Gemini access
- ⚡ **Direct API Calls:** Native performance (no proxy latency)
- 👥 **P2P Payments:** Pay collaborators, bill clients, split costs
- 📊 **Unified Billing:** One balance for payments in + AI usage out
- 🔄 **Auto-Convert:** USD automatically converts to tokens for AI usage
- 🏦 **Business Account:** Professional payment receiving + AI access

**Real-World Use Cases:**
1. **Freelance Developer:** Client pays $500 via TokenHouse → Use for Claude API → Bill client for AI usage
2. **AI Agency:** Receive project payment → Pay team members → Use remaining for AI costs
3. **Startup Team:** Investors deposit funds → Team splits access → Track usage per member
4. **Contractor:** Get paid for work → Keep cash or spend on AI → All in one account

**For TokenHouse:**
- 💳 **Payment Processing Fees:** 2.9% on Venmo/Zelle deposits (like Cash App Business)
- 📈 **Token Margin:** 20-40% markup on AI API resale
- 💰 **Float Income:** Interest on held USD balances (like PayPal)
- 🔄 **Transaction Fees:** 1-2% on P2P transfers above free tier
- 🎯 **Premium Features:** Monthly SaaS fees for teams/orgs
- 📊 **Foreign Exchange:** Fees on international payments

**For AI Providers:**
- 🏢 **One Large Customer:** TokenHouse vs thousands of small accounts
- 💵 **Predictable Revenue:** Volume commitments and prepaid accounts
- 📉 **Lower Support Burden:** TokenHouse handles tier-1 support
- 🤝 **Partnership Opportunities:** Co-marketing, featured models

---

## Architecture Approach: Authentication Gateway vs Pass-Through Proxy

### How TokenHouse Differs from OpenRouter

**OpenRouter Model (Pass-Through Proxy):**
```
Developer → OpenRouter Server → Provider API
            ↑ All traffic flows through OpenRouter
            ↑ OpenRouter validates, routes, logs every request
            ↑ Adds latency (extra network hop)
```

**TokenHouse Model (Authentication Gateway):**
```
Developer → TokenHouse Auth → Get JWT Token
                              ↓
Developer → Provider API Directly (with TokenHouse JWT)
            ↑ No proxy - direct connection
            ↑ Lower latency
            ↑ TokenHouse bills based on usage reports
```

### Key Architectural Differences

| Aspect | OpenRouter | TokenHouse |
|--------|------------|------------|
| **Request Path** | All requests proxy through OpenRouter servers | Developers call providers directly after auth |
| **Latency** | Extra hop adds 10-50ms | Native provider latency only |
| **Infrastructure Load** | Must handle all traffic throughput | Only handles auth + billing events |
| **Provider Keys** | OpenRouter uses their own keys | Developer gets scoped/virtual keys |
| **Billing Trigger** | Per-request proxy intercepts usage | Usage reported via webhooks or headers |
| **Downtime Impact** | OpenRouter down = no access | TokenHouse down = auth unavailable, but existing tokens work |

### TokenHouse Architecture Options

We have two implementation paths:

#### Option A: True Authentication Gateway (Recommended)

Developers authenticate with TokenHouse, receive JWT with embedded provider credentials, then call providers directly.

```typescript
// Step 1: Get TokenHouse JWT
const { access_token } = await fetch('https://tokenhouse.ai/auth/token')

// Step 2: Extract provider keys from JWT
const jwt = decodeJWT(access_token)
const openaiKey = jwt.providers.openai.api_key  // Scoped key

// Step 3: Call OpenAI directly (no proxy)
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${openaiKey}`,
    'X-TokenHouse-Session': access_token  // For usage tracking
  },
  body: JSON.stringify({ model: 'gpt-4o', messages: [...] })
})

// Step 4: Usage automatically reported to TokenHouse
// (via OpenAI webhooks or periodic sync)
```

**Pros:**
- ✅ No latency overhead (direct to provider)
- ✅ Lower infrastructure costs (no proxy traffic)
- ✅ Better reliability (TokenHouse outage doesn't break existing sessions)
- ✅ Native streaming support (no proxy buffering)
- ✅ Works with any provider SDK out-of-the-box

**Cons:**
- ❌ More complex usage tracking (rely on provider webhooks)
- ❌ Harder to enforce real-time rate limits
- ❌ Provider keys exposed in JWT (even if encrypted)
- ❌ Delayed billing (wait for usage reports)

#### Option B: Hybrid Gateway + Proxy

Offer both modes - developers choose based on needs.

```typescript
// Mode 1: Direct (for low-latency, high-volume)
const directKey = await tokenhouse.getProviderKey('openai')
const response = await openai.chat.completions.create({
  apiKey: directKey,
  model: 'gpt-4o',
  messages: [...]
})

// Mode 2: Proxy (for simplicity, real-time billing)
const response = await fetch('https://api.tokenhouse.ai/gateway/v1/chat/completions', {
  headers: { 'Authorization': `Bearer ${tokenhouse_jwt}` },
  body: JSON.stringify({ model: 'gpt-4o', messages: [...] })
})
```

**Pros:**
- ✅ Flexibility for different use cases
- ✅ Enterprise customers can use direct mode
- ✅ Small projects can use simple proxy mode
- ✅ Gradual migration path

**Cons:**
- ❌ Maintain two code paths
- ❌ More complex billing logic
- ❌ Harder to explain to users

#### Option C: Proxy Only (Like OpenRouter)

All requests go through TokenHouse gateway (current AgentX implementation).

**Pros:**
- ✅ Simple billing (intercept every request)
- ✅ Real-time rate limiting
- ✅ Immediate balance updates
- ✅ Full request/response logging

**Cons:**
- ❌ Latency overhead on every request
- ❌ High infrastructure costs (proxy all traffic)
- ❌ TokenHouse downtime = service outage
- ❌ Streaming complexity (proxy buffering)

### Recommended: Hybrid Approach

**Default: Proxy Mode** (simple onboarding)
```typescript
// Most developers start here - works like OpenRouter
const client = new TokenHouse({ jwt: 'xxx' })
const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [...]
})
```

**Advanced: Direct Mode** (opt-in for performance)
```typescript
// Enterprise customers upgrade to direct mode
const credentials = await tokenhouse.getDirectCredentials({
  providers: ['openai', 'anthropic'],
  scopes: ['chat', 'embeddings'],
  ttl: '24h'
})

// Use native OpenAI SDK with TokenHouse billing
const openai = new OpenAI({
  apiKey: credentials.openai.key,
  defaultHeaders: {
    'X-TokenHouse-Tracking': credentials.tracking_id
  }
})
```

### Implementation Strategy

**Phase 1: Proxy Only** (MVP)
- All requests through TokenHouse gateway
- Validate architecture and billing logic
- Build customer base

**Phase 2: Add Direct Mode** (Performance tier)
- Offer direct credentials for enterprise
- Usage tracking via provider webhooks
- Premium feature for latency-sensitive apps

**Phase 3: Optimize Hybrid** (Scale)
- Intelligent routing (proxy vs direct)
- Auto-failover between modes
- Cost optimization recommendations

### Why This Matters

**Developer Experience:**
- Proxy: "It just works" - like OpenRouter
- Direct: "Maximum performance" - like managing own keys
- Hybrid: "Best of both worlds" - flexibility

**Business Model:**
- Proxy: Higher infrastructure costs, but easier billing
- Direct: Lower costs, attract enterprise customers
- Hybrid: Serve both SMB (proxy) and Enterprise (direct)

**Competitive Positioning:**
- **vs OpenRouter:** "Same simplicity, but 50% lower latency with direct mode"
- **vs Managing Own Keys:** "Same performance, but unified billing and team management"
- **vs Portkey/Helicone:** "Not just observability - we handle auth, billing, and infrastructure"

---

## Business Model

### Revenue Streams

```typescript
interface RevenueModel {
  // 1. Payment processing fees (NEW - primary fintech revenue)
  deposit_fees: {
    venmo: "2.9% per transaction",
    zelle: "1.5% per transaction",
    bank_ach: "0.8% per transaction",
    wire: "$15 flat fee"
  },
  withdrawal_fees: {
    venmo: "$1 flat (instant) or free (1-3 days)",
    zelle: "$1 flat",
    bank_ach: "free",
    wire: "$25 flat fee"
  },
  p2p_fees: {
    first_1000_per_month: "free",
    above_1000: "1% of transaction",
    business_accounts: "2.5% (like PayPal Business)"
  },

  // 2. Float income (holding user balances)
  float_revenue: "Interest on aggregated USD balances held (~1-3% APY)",
  average_balance_per_user: 150,  // $150 average
  interest_rate: 0.04,            // 4% APY on high-yield accounts
  // With 10,000 users: $1.5M float × 4% = $60K annual interest income

  // 3. Token margin (AI API resale)
  provider_cost: number        // e.g., $0.80 for Claude Haiku 1M tokens (with 15% discount)
  retail_price: number         // e.g., $1.00 for Claude Haiku 1M tokens
  gross_margin: number         // 25% margin on AI usage

  // 4. Subscription fees
  subscription_tiers: {
    free: {
      monthly_fee: 0,
      p2p_limit: "1000/month free",
      deposit_fee: "2.9%",
      included_tokens: 10000
    },
    pro: {
      monthly_fee: 49,
      p2p_limit: "5000/month free",
      deposit_fee: "2.4%",  // Lower fees
      included_tokens: 500000
    },
    business: {
      monthly_fee: 149,
      p2p_limit: "unlimited",
      deposit_fee: "1.9%",  // Even lower
      included_tokens: 2000000,
      features: ["Invoicing", "Team accounts", "API access"]
    },
    enterprise: {
      monthly_fee: 499,
      p2p_limit: "unlimited",
      deposit_fee: "1.5%",
      included_tokens: 10000000,
      features: ["SSO", "Dedicated support", "SLA", "Custom rates"]
    }
  }

  // 5. Add-on services
  premium_support: 199,          // per month
  dedicated_infrastructure: 999, // per month
  white_label: 2999              // per month
}
```

### Pricing Example: Freelance Developer

```
Jane (Freelance Developer) - Pro Plan ($49/month)

Month Activity:
1. Client pays $2,000 via Venmo → Jane's TokenHouse account
2. Jane uses AI: 50M Claude tokens + 10M GPT-4o tokens
3. Jane pays contractor $300 via P2P
4. Jane withdraws $1,200 to Venmo

TokenHouse Revenue:
  Subscription (Pro): $49.00

  Deposit fee (Venmo):
    - $2,000 × 2.4% (Pro rate) = $48.00

  AI Token usage:
    - Claude 3.5 Haiku: 50M × $1.00/1M = $50.00
    - GPT-4o: 10M × $3.00/1M = $30.00

  P2P fee:
    - $300 (under $5,000 Pro limit) = $0.00 (free)

  Withdrawal fee:
    - $1 flat fee = $1.00

  Total Revenue: $178.00

TokenHouse Costs:
  AI Provider costs:
    - Anthropic: 50M × $0.85/1M = $42.50 (15% discount)
    - OpenAI: 10M × $2.55/1M = $25.50 (15% discount)
  Payment processing:
    - Venmo API fees: $2,000 × 1.9% = $38.00
    - Withdrawal processing: $0.50
  Total Costs: $106.50

TokenHouse Gross Profit:
  Revenue: $178.00
  Costs: $106.50
  Gross Margin: $71.50 (40%)

Additional Float Income (if Jane keeps $500 average balance):
  $500 × 4% APY / 12 months = $1.67/month passive income
```

### Unit Economics at Scale

```
With 10,000 active users (similar profile to Jane):

Monthly Revenue:
  Subscriptions: 10,000 × $49 = $490,000
  Deposit fees: 10,000 × $48 = $480,000
  AI usage: 10,000 × $80 = $800,000
  Withdrawal fees: 10,000 × $1 = $10,000
  Total: $1,780,000/month

Annual Revenue: $21.36M

Monthly Costs:
  Provider costs: 10,000 × $68 = $680,000
  Payment processing: 10,000 × $38.50 = $385,000
  Infrastructure: ~$50,000
  Total: $1,115,000/month

Gross Profit: $665,000/month ($7.98M annually)
Gross Margin: 37%

Float Income (additional):
  10,000 users × $500 avg balance = $5M float
  $5M × 4% APY = $200K annual interest income
```

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Developer Client                     │
│                                                          │
│  Eden SDK (type-safe) or cURL                           │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ 1. Authenticate with TokenHouse
                         ↓
┌─────────────────────────────────────────────────────────┐
│              TokenHouse Authentication API               │
│                    (Better Auth + JWT)                   │
│                                                          │
│  POST /auth/login                                        │
│  → Returns JWT with claims:                             │
│     - user_id, org_id                                   │
│     - stripe_customer_id                                │
│     - token_balance                                     │
│     - allowed_models                                    │
│     - rate_limits                                       │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ 2. JWT Token issued
                         ↓
┌─────────────────────────────────────────────────────────┐
│                      Developer Client                    │
│                                                          │
│  Stores JWT, makes API calls with:                      │
│  Authorization: Bearer eyJ... (TokenHouse JWT)          │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ 3. API Request
                         ↓
┌─────────────────────────────────────────────────────────┐
│              TokenHouse Gateway Proxy                    │
│                   (Elysia + NATS)                        │
│                                                          │
│  Middleware Pipeline:                                    │
│  1. Validate JWT signature                              │
│  2. Check token_balance from claims                     │
│  3. Verify allowed_models includes requested model      │
│  4. Check rate limits                                   │
│  5. Estimate token cost                                 │
│  6. Swap virtual key for real provider key              │
│  7. Publish to NATS (async processing)                  │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ 4. Forward to Provider
                         ↓
┌─────────────────────────────────────────────────────────┐
│                  NATS JetStream Layer                    │
│                                                          │
│  LLM Consumer:                                           │
│  - Receives task from gateway                           │
│  - Calls actual provider API with master key            │
│  - Returns response to gateway                          │
│                                                          │
│  Settlement Consumer:                                    │
│  - Receives usage data                                  │
│  - Calculates token cost                                │
│  - Updates database (wallet balance)                    │
│  - Reports to Stripe (metered billing)                  │
│  - Checks auto-recharge threshold                       │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┴────────────────┐
         ↓                                ↓
┌──────────────────┐            ┌──────────────────┐
│  AI Providers    │            │  TokenHouse DB   │
│                  │            │  (Postgres)      │
│  - OpenAI API    │            │                  │
│  - Anthropic API │            │  - Users         │
│  - Google API    │            │  - Wallets       │
│                  │            │  - Usage logs    │
│  Master keys     │            │  - Transactions  │
│  stored securely │            │                  │
└──────────────────┘            └────────┬─────────┘
                                         │
                                         │ 5. Billing Events
                                         ↓
                                ┌──────────────────┐
                                │  Stripe Platform │
                                │                  │
                                │  - Customers     │
                                │  - Payments      │
                                │  - Invoices      │
                                │  - Usage records │
                                │  - Webhooks      │
                                └──────────────────┘
```

---

## JWT Token Structure

### TokenHouse JWT Claims

```typescript
interface TokenHouseJWT {
  // Standard claims
  iss: "https://tokenhouse.ai"              // Issuer
  sub: string                                 // TokenHouse ID (th_user_abc123)
  aud: "tokenhouse-api"                       // Audience
  exp: number                                 // Expiration (1 hour)
  iat: number                                 // Issued at
  jti: string                                 // JWT ID (for revocation)

  // User identity
  tokenhouse_id: string                       // th_user_abc123
  email: string
  name: string
  username: string                            // @johndoe (for P2P payments)

  // Financial account balances
  balance_usd: number                         // USD cash balance ($250.00)
  balance_tokens: number                      // TH token balance (2,500,000)
  balance_reserved: number                    // Reserved for pending transactions

  // Organization context (for teams)
  org_id: string | null                       // Organization ID
  org_name: string | null
  org_role: "owner" | "admin" | "member" | null

  // Payment integrations
  linked_accounts: {
    venmo: { id: string; status: "active" | "pending" } | null
    zelle: { id: string; status: "active" | "pending" } | null
    bank: { id: string; last4: string; status: "verified" } | null
  }

  // AI Provider Credentials (embedded for direct calls)
  ai_credentials: {
    openai: {
      api_key: string                         // sk-proj-scoped-tokenhouse-xxx
      org_id: string                          // org-tokenhouse-xxx
      project_id: string                      // proj_xxx
    }
    anthropic: {
      api_key: string                         // sk-ant-scoped-tokenhouse-xxx
      workspace_id: string                    // ws-tokenhouse-xxx
    }
    google: {
      api_key: string                         // AIza-scoped-tokenhouse-xxx
      project_id: string                      // tokenhouse-xxx
    }
  }

  // Access control
  plan_tier: "free" | "pro" | "business" | "enterprise"
  allowed_models: string[]                    // ["claude-3-5-haiku", "gpt-4o-mini"]

  // Rate limits (requests per time period)
  rate_limits: {
    openai: {
      requests_per_second: number
      requests_per_day: number
      max_tokens_per_request: number
    }
    anthropic: {
      requests_per_second: number
      requests_per_day: number
      max_tokens_per_request: number
    }
  }

  // Feature flags
  features: string[]                          // ["p2p_payments", "venmo", "streaming", "batch"]

  // Session metadata
  session_id: string                          // For tracking/analytics
  ip_address: string                          // For security
  user_agent: string                          // For analytics

  // Payment capabilities
  can_receive_payments: boolean               // KYC verified
  can_send_payments: boolean                  // Account in good standing
  daily_send_limit: number                    // $X per day
  daily_receive_limit: number                 // $X per day
}
```

### Example JWT Payload

```json
{
  "iss": "https://tokenhouse.ai",
  "sub": "th_user_abc123",
  "aud": "tokenhouse-api",
  "exp": 1741532400,
  "iat": 1741528800,
  "jti": "jwt_xyz789",

  "tokenhouse_id": "th_user_abc123",
  "email": "jane@startup.com",
  "name": "Jane Developer",
  "username": "@janedev",

  "balance_usd": 250.00,
  "balance_tokens": 2500000,
  "balance_reserved": 50.00,

  "org_id": "org_company456",
  "org_name": "Startup Inc",
  "org_role": "admin",

  "linked_accounts": {
    "venmo": {
      "id": "venmo_user_jane",
      "status": "active"
    },
    "zelle": {
      "id": "jane@startup.com",
      "status": "active"
    },
    "bank": {
      "id": "ba_1234567890",
      "last4": "4242",
      "status": "verified"
    }
  },

  "ai_credentials": {
    "openai": {
      "api_key": "sk-proj-tokenhouse-scoped-abc123xyz",
      "org_id": "org-tokenhouse-jane",
      "project_id": "proj_abc123"
    },
    "anthropic": {
      "api_key": "sk-ant-tokenhouse-scoped-def456uvw",
      "workspace_id": "ws-tokenhouse-jane"
    },
    "google": {
      "api_key": "AIza-tokenhouse-scoped-ghi789rst",
      "project_id": "tokenhouse-jane-project"
    }
  },

  "plan_tier": "business",
  "allowed_models": [
    "claude-3-5-haiku-20241022",
    "claude-3-5-sonnet-20241022",
    "gpt-4o-mini",
    "gpt-4o"
  ],

  "rate_limits": {
    "openai": {
      "requests_per_second": 20,
      "requests_per_day": 50000,
      "max_tokens_per_request": 200000
    },
    "anthropic": {
      "requests_per_second": 10,
      "requests_per_day": 25000,
      "max_tokens_per_request": 200000
    }
  },

  "features": [
    "p2p_payments",
    "venmo_integration",
    "zelle_integration",
    "streaming",
    "batch",
    "vision",
    "direct_credentials"
  ],

  "can_receive_payments": true,
  "can_send_payments": true,
  "daily_send_limit": 10000.00,
  "daily_receive_limit": 25000.00,

  "session_id": "sess_current123",
  "ip_address": "192.168.1.100",
  "user_agent": "node-fetch/2.6.1"
}
```

---

## Database Schema

### Core Tables

```typescript
// users table
interface User {
  id: string                        // Primary key
  email: string                     // Unique
  username: string                  // Unique, for P2P payments (@janedev)
  name: string
  password_hash: string             // Hashed with bcrypt

  // TokenHouse credentials (for API authentication)
  tokenhouse_id: string             // Unique (th_user_abc123)
  tokenhouse_secret_hash: string    // Hashed secret for API auth

  // Financial account balances
  balance_usd: number               // USD cash balance
  balance_tokens: number            // TH token balance (10000 = $1)
  balance_reserved: number          // Reserved for pending transactions
  token_spent_lifetime: number      // Total tokens ever spent
  token_spent_this_month: number    // Current billing period

  // Payment capabilities (KYC status)
  can_receive_payments: boolean     // KYC verified
  can_send_payments: boolean        // Account in good standing
  daily_send_limit: number          // Max USD per day
  daily_receive_limit: number       // Max USD per day
  kyc_status: "none" | "pending" | "verified" | "rejected"
  kyc_verified_at: timestamp | null

  // Linked payment accounts
  venmo_user_id: string | null
  venmo_status: "active" | "pending" | "disabled" | null
  zelle_email: string | null
  zelle_phone: string | null
  zelle_status: "active" | "pending" | "disabled" | null

  // Auto-recharge settings
  auto_recharge_enabled: boolean
  auto_recharge_threshold: number   // Trigger when balance < this
  auto_recharge_amount: number      // Add this many tokens

  // Subscription
  plan_tier: "free" | "pro" | "business" | "enterprise"
  subscription_status: "active" | "cancelled" | "past_due"

  // Metadata
  created_at: timestamp
  updated_at: timestamp
  last_login_at: timestamp
}

// organizations table
interface Organization {
  id: string
  name: string
  owner_user_id: string             // FK to users

  // Shared wallet (optional - orgs can share balance)
  shared_wallet_enabled: boolean
  shared_token_balance: number

  // Billing
  stripe_customer_id: string        // Org can have own Stripe account
  plan_tier: "free" | "pro" | "enterprise"

  created_at: timestamp
  updated_at: timestamp
}

// organization_members table
interface OrganizationMember {
  id: string
  org_id: string                    // FK to organizations
  user_id: string                   // FK to users
  role: "owner" | "admin" | "member"

  // Member-specific limits (overrides org defaults)
  token_budget: number | null       // Max tokens per month
  allowed_models: string[] | null   // Restrict models

  joined_at: timestamp
}

// usage_logs table (partitioned by month for performance)
interface UsageLog {
  id: string
  user_id: string                   // FK to users
  org_id: string | null             // FK to organizations

  // Request details
  provider: "openai" | "anthropic" | "google"
  model: string
  endpoint: string                  // "/v1/chat/completions"

  // Token usage
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number

  // Billing
  tokens_charged: number            // TH tokens deducted
  cost_usd: number                  // Actual provider cost
  margin_usd: number                // TokenHouse margin

  // Performance
  latency_ms: number

  // Stripe integration
  stripe_usage_record_id: string | null

  // Metadata
  request_id: string                // For debugging
  ip_address: string
  user_agent: string

  created_at: timestamp
  partition_month: string           // "2026-03" for partitioning
}

// transactions table (for wallet movements)
interface Transaction {
  id: string
  user_id: string                   // FK to users
  org_id: string | null

  type: "credit_purchase" | "usage_deduction" | "refund" | "auto_recharge" | "deposit" | "withdrawal" | "p2p_sent" | "p2p_received"
  amount_usd: number                // USD amount (for payments)
  amount_tokens: number             // TH tokens (for AI usage)
  balance_usd_before: number
  balance_usd_after: number
  balance_tokens_before: number
  balance_tokens_after: number

  // Stripe reference
  stripe_payment_intent_id: string | null
  stripe_invoice_id: string | null

  description: string
  metadata: jsonb                   // Flexible metadata

  created_at: timestamp
}

// payment_accounts table (linked Venmo/Zelle/Bank accounts)
interface PaymentAccount {
  id: string
  user_id: string                   // FK to users

  provider: "venmo" | "zelle" | "plaid_bank"
  provider_account_id: string       // External ID

  // Account details
  display_name: string              // "@janedev" or "jane@email.com"
  account_type: string              // "checking", "savings", etc.
  last4: string | null              // Last 4 digits (for bank)

  status: "active" | "pending" | "disabled" | "failed"
  verification_status: "unverified" | "pending" | "verified"

  // Limits
  daily_deposit_limit: number
  daily_withdrawal_limit: number

  // OAuth tokens (encrypted)
  access_token_encrypted: string | null
  refresh_token_encrypted: string | null
  token_expires_at: timestamp | null

  created_at: timestamp
  updated_at: timestamp
  last_used_at: timestamp
}

// payment_transactions table (Venmo/Zelle deposits/withdrawals)
interface PaymentTransaction {
  id: string
  user_id: string                   // FK to users
  payment_account_id: string        // FK to payment_accounts

  type: "deposit" | "withdrawal"
  status: "pending" | "processing" | "completed" | "failed" | "cancelled"

  amount_usd: number
  fee_usd: number
  net_amount_usd: number

  // External transaction ID (from Venmo/Zelle/Bank)
  external_transaction_id: string | null

  // Timing
  initiated_at: timestamp
  completed_at: timestamp | null
  estimated_arrival: timestamp | null

  // Error handling
  error_code: string | null
  error_message: string | null

  metadata: jsonb
  created_at: timestamp
}

// p2p_payments table (peer-to-peer transactions)
interface P2PPayment {
  id: string

  from_user_id: string              // FK to users (sender)
  to_user_id: string                // FK to users (receiver)

  amount_usd: number
  fee_usd: number                   // TokenHouse fee (1% after free tier)
  net_amount_usd: number

  memo: string | null
  status: "pending" | "completed" | "cancelled" | "refunded"

  // Balances at time of transaction
  sender_balance_before: number
  sender_balance_after: number
  receiver_balance_before: number
  receiver_balance_after: number

  created_at: timestamp
  completed_at: timestamp | null
}

// payment_requests table (invoicing / money requests)
interface PaymentRequest {
  id: string

  from_user_id: string              // FK to users (requester)
  to_user_id: string | null         // FK to users (payer, null if not yet claimed)

  amount_usd: number
  memo: string
  status: "pending" | "paid" | "cancelled" | "expired"

  // Optional fields
  due_date: timestamp | null
  invoice_number: string | null

  // Fulfillment
  paid_at: timestamp | null
  payment_transaction_id: string | null  // FK to p2p_payments

  // Link sharing
  payment_link_token: string        // Public token for payment link
  payment_link_expires: timestamp

  created_at: timestamp
  expires_at: timestamp
}

// split_payments table (cost splitting)
interface SplitPayment {
  id: string
  creator_user_id: string           // FK to users (person initiating split)

  total_amount_usd: number
  split_type: "equal" | "custom"
  memo: string
  status: "pending" | "partially_paid" | "completed" | "cancelled"

  created_at: timestamp
  completed_at: timestamp | null
}

// split_payment_participants table
interface SplitPaymentParticipant {
  id: string
  split_payment_id: string          // FK to split_payments
  user_id: string                   // FK to users

  amount_due_usd: number
  status: "pending" | "paid" | "cancelled"

  payment_request_id: string | null // FK to payment_requests
  paid_at: timestamp | null
}

// ai_credentials table (scoped provider API keys)
interface AICredential {
  id: string
  user_id: string                   // FK to users

  provider: "openai" | "anthropic" | "google"

  // Scoped credentials (encrypted)
  api_key_encrypted: string
  org_id: string | null
  project_id: string | null
  workspace_id: string | null

  // Access control
  allowed_models: string[]
  rate_limit_tier: string

  status: "active" | "revoked" | "expired"
  expires_at: timestamp | null

  // Usage tracking
  last_used_at: timestamp | null
  total_requests: number
  total_tokens: number

  created_at: timestamp
  revoked_at: timestamp | null
}

// provider_accounts table (TokenHouse's master accounts)
interface ProviderAccount {
  id: string
  provider: "openai" | "anthropic" | "google"

  // Master credentials (encrypted at rest)
  master_api_key: string            // Encrypted
  account_email: string

  // Billing with provider
  account_balance: number           // Prepaid credits with provider
  monthly_spend: number             // This month's spend
  volume_discount: number           // Negotiated discount (0.15 = 15%)

  // Status
  status: "active" | "suspended" | "degraded"
  last_health_check: timestamp

  created_at: timestamp
  updated_at: timestamp
}

// rate_limit_state table (for distributed rate limiting)
interface RateLimitState {
  id: string
  user_id: string
  provider: string

  // Sliding window counters
  requests_last_second: number
  requests_last_minute: number
  requests_last_hour: number
  requests_last_day: number

  // Timestamps for window calculation
  window_start: timestamp

  updated_at: timestamp
}
```

### Indexes for Performance

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);

-- Usage logs (partitioned table)
CREATE INDEX idx_usage_user_date ON usage_logs(user_id, created_at DESC);
CREATE INDEX idx_usage_org_date ON usage_logs(org_id, created_at DESC) WHERE org_id IS NOT NULL;
CREATE INDEX idx_usage_partition ON usage_logs(partition_month);

-- Transactions
CREATE INDEX idx_transactions_user ON transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_stripe ON transactions(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

-- Rate limiting
CREATE UNIQUE INDEX idx_rate_limit_user_provider ON rate_limit_state(user_id, provider);
```

---

## API Endpoints

### Authentication Endpoints

```typescript
// Sign up - Creates TokenHouse account
POST /api/auth/sign-up
{
  "email": "jane@startup.com",
  "password": "secure_password",
  "name": "Jane Developer",
  "username": "janedev"  // For P2P payments (@janedev)
}
Response: {
  "user": {
    "tokenhouse_id": "th_user_abc123",
    "tokenhouse_secret": "ths_secret_xyz789def456",  // SAVE THIS - only shown once
    "email": "jane@startup.com",
    "username": "@janedev"
  },
  "session_token": "sess_token_xxx"
}

// Authenticate with TokenHouse ID + Secret (for API usage)
POST /api/auth/token
{
  "tokenhouse_id": "th_user_abc123",
  "tokenhouse_secret": "ths_secret_xyz789def456"
}
Response: {
  "access_token": "eyJhbGc...",  // JWT with AI credentials embedded
  "token_type": "Bearer",
  "expires_in": 3600,
  "balance_usd": 250.00,
  "balance_tokens": 2500000
}

// Sign in with email/password (for web dashboard)
POST /api/auth/sign-in
{
  "email": "jane@startup.com",
  "password": "secure_password"
}
Response: {
  "session_token": "sess_token_xxx",
  "user": {
    "tokenhouse_id": "th_user_abc123",
    "email": "jane@startup.com",
    "username": "@janedev"
  }
}

// Get session info
GET /api/auth/session
Headers: Cookie: tokenhouse.session=xxx
Response: {
  "tokenhouse_id": "th_user_abc123",
  "email": "jane@startup.com",
  "username": "@janedev",
  "balance_usd": 250.00,
  "balance_tokens": 2500000
}

// Regenerate TokenHouse Secret (rotate credentials)
POST /api/auth/regenerate-secret
Headers: Authorization: Bearer <jwt>
Response: {
  "tokenhouse_secret": "ths_secret_new123abc456",  // New secret
  "old_secret_valid_until": "2026-03-16T10:00:00Z"  // 7 day grace period
}

// Sign out
POST /api/auth/sign-out
Headers: Cookie: tokenhouse.session=xxx
Response: { success: true }
```

### Wallet Endpoints

```typescript
// Get wallet balance and info
GET /api/wallet/balance
Headers: Authorization: Bearer <jwt>
Response: {
  "token_balance": 500000,
  "balance_usd": 50.00,
  "plan_tier": "pro",
  "monthly_usage": {
    "tokens": 250000,
    "cost_usd": 25.00
  },
  "auto_recharge": {
    "enabled": true,
    "threshold": 50000,
    "amount": 100000
  }
}

// List available credit packages
GET /api/wallet/packages
Response: {
  "packages": [
    {
      "id": "price_starter",
      "name": "Starter",
      "tokens": 100000,
      "price_usd": 10.00,
      "bonus_tokens": 0
    },
    {
      "id": "price_pro",
      "name": "Pro",
      "tokens": 500000,
      "price_usd": 45.00,
      "bonus_tokens": 50000,
      "discount_percent": 10
    }
  ]
}

// Purchase credits
POST /api/wallet/purchase
Headers: Authorization: Bearer <jwt>
{
  "package_id": "price_pro"
}
Response: {
  "checkout_url": "https://checkout.stripe.com/c/pay/xxx"
}

// Get usage history
GET /api/wallet/usage?limit=100&offset=0
Headers: Authorization: Bearer <jwt>
Response: {
  "usage": [
    {
      "timestamp": "2026-03-08T10:30:00Z",
      "provider": "anthropic",
      "model": "claude-3-5-haiku",
      "tokens_used": 1250,
      "tokens_charged": 1000,
      "cost_usd": 0.10,
      "latency_ms": 843
    }
  ],
  "total": 1547,
  "has_more": true
}

// Update auto-recharge settings
PUT /api/wallet/auto-recharge
Headers: Authorization: Bearer <jwt>
{
  "enabled": true,
  "threshold": 50000,
  "amount": 100000
}
Response: { success: true }
```

### Payment Integration Endpoints

```typescript
// Link Venmo account
POST /api/payments/link-venmo
Headers: Authorization: Bearer <jwt>
{
  "venmo_user_id": "venmo_user_jane",
  "access_token": "venmo_access_token_xxx"  // From Venmo OAuth
}
Response: {
  "success": true,
  "linked_account": {
    "provider": "venmo",
    "user_id": "venmo_user_jane",
    "status": "active",
    "display_name": "@janedev"
  }
}

// Link Zelle account
POST /api/payments/link-zelle
Headers: Authorization: Bearer <jwt>
{
  "email": "jane@startup.com",  // Zelle-registered email
  "phone": "+1234567890"         // Or Zelle-registered phone
}
Response: {
  "success": true,
  "linked_account": {
    "provider": "zelle",
    "identifier": "jane@startup.com",
    "status": "pending_verification"
  },
  "verification_required": true,
  "verification_code_sent": true
}

// Verify Zelle link (micro-deposit verification)
POST /api/payments/verify-zelle
Headers: Authorization: Bearer <jwt>
{
  "verification_code": "123456"
}
Response: {
  "success": true,
  "status": "verified"
}

// Link bank account (for deposits)
POST /api/payments/link-bank
Headers: Authorization: Bearer <jwt>
{
  "routing_number": "110000000",
  "account_number": "000123456789",
  "account_type": "checking" | "savings"
}
Response: {
  "success": true,
  "plaid_link_token": "link-xxx",  // For Plaid instant verification
  "verification_method": "plaid" | "micro_deposit"
}

// Deposit money from linked account
POST /api/payments/deposit
Headers: Authorization: Bearer <jwt>
{
  "amount_usd": 100.00,
  "source": "venmo" | "zelle" | "bank",
  "source_id": "venmo_user_jane"
}
Response: {
  "transaction_id": "txn_deposit_abc123",
  "amount_usd": 100.00,
  "fee_usd": 2.90,          // 2.9% payment processing fee
  "net_amount": 97.10,
  "status": "pending",      // pending → completed
  "estimated_arrival": "2026-03-09T14:00:00Z"  // ~1 hour
}

// Withdraw money to linked account
POST /api/payments/withdraw
Headers: Authorization: Bearer <jwt>
{
  "amount_usd": 50.00,
  "destination": "venmo" | "zelle" | "bank",
  "destination_id": "venmo_user_jane"
}
Response: {
  "transaction_id": "txn_withdraw_def456",
  "amount_usd": 50.00,
  "fee_usd": 1.00,          // Flat $1 withdrawal fee
  "net_amount": 49.00,
  "status": "processing",   // processing → completed
  "estimated_arrival": "2026-03-10T10:00:00Z"  // 1-3 business days
}

// Get payment transaction history
GET /api/payments/transactions?limit=50&offset=0
Headers: Authorization: Bearer <jwt>
Response: {
  "transactions": [
    {
      "id": "txn_deposit_abc123",
      "type": "deposit",
      "amount_usd": 100.00,
      "fee_usd": 2.90,
      "source": "venmo",
      "status": "completed",
      "created_at": "2026-03-08T10:00:00Z",
      "completed_at": "2026-03-08T11:00:00Z"
    },
    {
      "id": "txn_p2p_xyz789",
      "type": "p2p_received",
      "amount_usd": 500.00,
      "from_user": "@clientbob",
      "memo": "Website project payment",
      "status": "completed",
      "created_at": "2026-03-07T15:30:00Z"
    }
  ],
  "total": 47,
  "has_more": false
}
```

### P2P Payment Endpoints

```typescript
// Send money to another TokenHouse user
POST /api/payments/send
Headers: Authorization: Bearer <jwt>
{
  "to_user": "@clientbob" | "th_user_xyz789",  // Username or TokenHouse ID
  "amount_usd": 250.00,
  "memo": "Consultant payment for March",
  "source": "balance"  // Use TokenHouse balance
}
Response: {
  "transaction_id": "txn_p2p_send_abc123",
  "to_user": "@clientbob",
  "amount_usd": 250.00,
  "fee_usd": 0.00,                    // First $1000/month free, then 1%
  "net_amount": 250.00,
  "status": "completed",
  "remaining_balance": 1750.00,
  "recipient_notified": true
}

// Request money from another TokenHouse user
POST /api/payments/request
Headers: Authorization: Bearer <jwt>
{
  "from_user": "@clientbob",
  "amount_usd": 500.00,
  "memo": "Invoice #1234 - Web development",
  "due_date": "2026-03-15"
}
Response: {
  "request_id": "req_abc123",
  "from_user": "@clientbob",
  "amount_usd": 500.00,
  "memo": "Invoice #1234 - Web development",
  "status": "pending",
  "expires_at": "2026-03-15T23:59:59Z",
  "payment_link": "https://tokenhouse.ai/pay/req_abc123"
}

// Accept payment request (sender's view)
POST /api/payments/request/{request_id}/pay
Headers: Authorization: Bearer <jwt>
Response: {
  "transaction_id": "txn_p2p_abc123",
  "amount_usd": 500.00,
  "to_user": "@janedev",
  "status": "completed",
  "remaining_balance": 1500.00
}

// Get payment requests (incoming)
GET /api/payments/requests?status=pending
Headers: Authorization: Bearer <jwt>
Response: {
  "requests": [
    {
      "request_id": "req_abc123",
      "from_user": "@janedev",
      "amount_usd": 500.00,
      "memo": "Invoice #1234",
      "status": "pending",
      "created_at": "2026-03-08T10:00:00Z",
      "expires_at": "2026-03-15T23:59:59Z",
      "payment_link": "https://tokenhouse.ai/pay/req_abc123"
    }
  ],
  "total": 3
}

// Search users (for P2P payments)
GET /api/users/search?q=jane
Headers: Authorization: Bearer <jwt>
Response: {
  "users": [
    {
      "tokenhouse_id": "th_user_abc123",
      "username": "@janedev",
      "display_name": "Jane Developer",
      "avatar_url": "https://...",
      "verified": true
    }
  ]
}

// Split AI costs with team
POST /api/payments/split
Headers: Authorization: Bearer <jwt>
{
  "amount_usd": 120.00,
  "split_with": ["@bob", "@alice", "@charlie"],
  "split_type": "equal" | "custom",
  "amounts": {  // If split_type = custom
    "@bob": 50.00,
    "@alice": 40.00,
    "@charlie": 30.00
  },
  "memo": "March AI API costs"
}
Response: {
  "split_id": "split_abc123",
  "total_amount": 120.00,
  "splits": [
    {
      "user": "@bob",
      "amount_usd": 40.00,
      "status": "pending",
      "request_id": "req_split_1"
    },
    {
      "user": "@alice",
      "amount_usd": 40.00,
      "status": "pending",
      "request_id": "req_split_2"
    },
    {
      "user": "@charlie",
      "amount_usd": 40.00,
      "status": "pending",
      "request_id": "req_split_3"
    }
  ]
}
```

### Gateway Endpoints (OpenAI-compatible)

```typescript
// List available models
GET /api/gateway/models
Headers: Authorization: Bearer <jwt>
Response: {
  "data": [
    {
      "id": "claude-3-5-haiku-20241022",
      "object": "model",
      "created": 1698959748,
      "owned_by": "anthropic",
      "pricing": {
        "input": 0.80,   // per 1M tokens
        "output": 4.00
      }
    },
    {
      "id": "gpt-4o-mini",
      "object": "model",
      "owned_by": "openai",
      "pricing": {
        "input": 0.15,
        "output": 0.60
      }
    }
  ]
}

// Chat completion (OpenAI-compatible)
POST /api/gateway/v1/chat/completions
Headers: Authorization: Bearer <jwt>
{
  "model": "claude-3-5-haiku-20241022",
  "messages": [
    {"role": "user", "content": "Hello from TokenHouse!"}
  ],
  "max_tokens": 1000,
  "temperature": 0.7
}

Response: {
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1741528800,
  "model": "claude-3-5-haiku-20241022",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 48,
    "total_tokens": 60
  },
  "tokenhouse": {
    "task_id": "task_xyz789",
    "tokens_charged": 80,           // TH tokens deducted
    "cost_usd": 0.008,
    "latency_ms": 843,
    "remaining_balance": 499920,
    "remaining_balance_usd": 49.99
  }
}

// Streaming chat completion
POST /api/gateway/v1/chat/completions
Headers:
  Authorization: Bearer <jwt>
  Accept: text/event-stream
{
  "model": "gpt-4o-mini",
  "messages": [...],
  "stream": true
}

Response: (Server-Sent Events)
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","choices":[{"delta":{"content":"Hello"}}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","choices":[{"delta":{"content":" there"}}]}

data: [DONE]
```

---

## Request Flow: End-to-End

### 1. Developer Authentication

```typescript
// Developer logs in
const response = await fetch('https://api.tokenhouse.ai/auth/sign-in/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'dev@startup.com',
    password: 'password123'
  })
})

const { session } = await response.json()
// Session stored in cookie automatically
```

### 2. Get API Token (JWT)

```typescript
// Get JWT for API usage
const tokenResponse = await fetch('https://api.tokenhouse.ai/auth/token', {
  headers: {
    'Cookie': `better-auth.session_token=${session.token}`
  }
})

const { access_token } = await tokenResponse.json()
// JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyX2FiYzEyMyI...

// Store JWT for subsequent API calls
localStorage.setItem('tokenhouse_jwt', access_token)
```

### 3. Make AI API Call

```typescript
// Call Claude through TokenHouse
const jwt = localStorage.getItem('tokenhouse_jwt')

const aiResponse = await fetch('https://api.tokenhouse.ai/gateway/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwt}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'claude-3-5-haiku-20241022',
    messages: [
      { role: 'user', content: 'Explain quantum computing in simple terms' }
    ],
    max_tokens: 500
  })
})

const result = await aiResponse.json()
console.log(result.choices[0].message.content)
console.log('Remaining balance:', result.tokenhouse.remaining_balance_usd)
```

### 4. TokenHouse Gateway Processing

```typescript
// Gateway middleware (Elysia)
app.post('/gateway/v1/chat/completions', async (context) => {
  // 1. Extract and validate JWT
  const jwt = context.headers.authorization?.replace('Bearer ', '')
  const claims = await validateJWT(jwt)  // Returns decoded TokenHouseJWT

  // 2. Check token balance
  if (claims.token_balance < 100) {
    return context.error(402, {
      error: 'Insufficient token balance',
      balance: claims.token_balance,
      balance_usd: claims.token_balance_usd
    })
  }

  // 3. Validate model access
  const { model } = context.body
  if (!claims.allowed_models.includes(model)) {
    return context.error(403, {
      error: 'Model not allowed for your plan',
      allowed_models: claims.allowed_models
    })
  }

  // 4. Check rate limits
  const provider = getProviderForModel(model) // "anthropic"
  await rateLimiter.check(claims.sub, provider, claims.rate_limits[provider])

  // 5. Estimate token cost (conservative)
  const estimatedTokens = estimateTokenUsage(context.body)
  const estimatedCost = calculateTokenCost(model, estimatedTokens)

  if (claims.token_balance < estimatedCost * 1.2) { // 20% buffer
    return context.error(402, { error: 'Insufficient balance for this request' })
  }

  // 6. Generate task ID
  const taskId = `task_${nanoid()}`

  // 7. Publish to NATS for async processing
  await nats.publish('tokenhouse.llm.request', {
    task_id: taskId,
    user_id: claims.sub,
    org_id: claims.org_id,
    stripe_customer_id: claims.stripe_customer_id,
    provider,
    model,
    request_body: context.body,
    rate_limits: claims.rate_limits[provider],
    ip_address: context.request.headers.get('x-forwarded-for'),
    user_agent: context.request.headers.get('user-agent')
  })

  // 8. Wait for NATS response (with timeout)
  const response = await nats.request(`tokenhouse.llm.response.${taskId}`, {}, {
    timeout: 30000 // 30 second timeout
  })

  return response
})
```

### 5. NATS LLM Consumer

```typescript
// LLM consumer processes request
const llmConsumer = await nats.subscribe('tokenhouse.llm.request')

for await (const msg of llmConsumer) {
  const task = JSONCodec.decode(msg.data)

  try {
    // 1. Get provider master API key
    const providerAccount = await db.providerAccounts.findOne({
      provider: task.provider,
      status: 'active'
    })

    // 2. Call actual provider API
    const startTime = Date.now()

    const providerResponse = await callProvider({
      provider: task.provider,
      apiKey: providerAccount.master_api_key,
      endpoint: '/v1/chat/completions',
      body: task.request_body
    })

    const latencyMs = Date.now() - startTime

    // 3. Calculate actual usage
    const { prompt_tokens, completion_tokens, total_tokens } = providerResponse.usage
    const tokensCharged = calculateChargedTokens(task.model, providerResponse.usage)
    const costUsd = calculateProviderCost(task.model, providerResponse.usage)

    // 4. Publish to settlement consumer
    await nats.publish('tokenhouse.settlement.process', {
      task_id: task.task_id,
      user_id: task.user_id,
      org_id: task.org_id,
      stripe_customer_id: task.stripe_customer_id,
      provider: task.provider,
      model: task.model,
      prompt_tokens,
      completion_tokens,
      total_tokens,
      tokens_charged: tokensCharged,
      cost_usd: costUsd,
      latency_ms: latencyMs,
      ip_address: task.ip_address,
      user_agent: task.user_agent
    })

    // 5. Return response to gateway
    nats.publish(`tokenhouse.llm.response.${task.task_id}`, {
      ...providerResponse,
      tokenhouse: {
        task_id: task.task_id,
        tokens_charged: tokensCharged,
        cost_usd: costUsd,
        latency_ms: latencyMs
      }
    })

  } catch (error) {
    // Handle provider errors
    nats.publish(`tokenhouse.llm.response.${task.task_id}`, {
      error: error.message,
      tokenhouse: {
        task_id: task.task_id,
        error: true
      }
    })
  }
}
```

### 6. NATS Settlement Consumer

```typescript
// Settlement consumer handles billing
const settlementConsumer = await nats.subscribe('tokenhouse.settlement.process')

for await (const msg of settlementConsumer) {
  const settlement = JSONCodec.decode(msg.data)

  try {
    // 1. Atomic wallet deduction
    const result = await db.query(`
      UPDATE users
      SET
        token_balance = token_balance - $1,
        token_spent_this_month = token_spent_this_month + $1,
        token_spent_lifetime = token_spent_lifetime + $1,
        updated_at = NOW()
      WHERE id = $2 AND token_balance >= $1
      RETURNING token_balance, auto_recharge_enabled, auto_recharge_threshold
    `, [settlement.tokens_charged, settlement.user_id])

    if (result.rows.length === 0) {
      throw new Error('Insufficient balance or user not found')
    }

    const updatedUser = result.rows[0]

    // 2. Log usage
    await db.usageLogs.insert({
      user_id: settlement.user_id,
      org_id: settlement.org_id,
      provider: settlement.provider,
      model: settlement.model,
      endpoint: '/v1/chat/completions',
      prompt_tokens: settlement.prompt_tokens,
      completion_tokens: settlement.completion_tokens,
      total_tokens: settlement.total_tokens,
      tokens_charged: settlement.tokens_charged,
      cost_usd: settlement.cost_usd,
      margin_usd: calculateMargin(settlement.cost_usd, settlement.tokens_charged),
      latency_ms: settlement.latency_ms,
      request_id: settlement.task_id,
      ip_address: settlement.ip_address,
      user_agent: settlement.user_agent,
      partition_month: new Date().toISOString().slice(0, 7)
    })

    // 3. Log transaction
    await db.transactions.insert({
      user_id: settlement.user_id,
      org_id: settlement.org_id,
      type: 'usage_deduction',
      amount: -settlement.tokens_charged,
      balance_before: updatedUser.token_balance + settlement.tokens_charged,
      balance_after: updatedUser.token_balance,
      description: `${settlement.model} - ${settlement.total_tokens} tokens`
    })

    // 4. Report to Stripe (for metered billing customers)
    const user = await db.users.findOne({ id: settlement.user_id })
    if (user.billing_model === 'postpaid' && user.stripe_subscription_item_id) {
      await stripe.subscriptionItems.createUsageRecord(
        user.stripe_subscription_item_id,
        {
          quantity: settlement.tokens_charged,
          timestamp: Math.floor(Date.now() / 1000),
          action: 'increment'
        }
      )
    }

    // 5. Check auto-recharge threshold
    if (updatedUser.auto_recharge_enabled &&
        updatedUser.token_balance < updatedUser.auto_recharge_threshold) {
      await nats.publish('tokenhouse.wallet.auto-recharge', {
        user_id: settlement.user_id
      })
    }

  } catch (error) {
    console.error('Settlement error:', error)
    // Log to error tracking (Sentry, etc.)
  }
}
```

### 7. Auto-Recharge Handler

```typescript
// Auto-recharge consumer
const rechargeConsumer = await nats.subscribe('tokenhouse.wallet.auto-recharge')

for await (const msg of rechargeConsumer) {
  const { user_id } = JSONCodec.decode(msg.data)

  const user = await db.users.findOne({ id: user_id })
  if (!user.auto_recharge_enabled) return

  try {
    // Get default payment method from Stripe
    const customer = await stripe.customers.retrieve(user.stripe_customer_id)
    const paymentMethod = customer.invoice_settings.default_payment_method

    if (!paymentMethod) {
      await sendEmail(user.email, 'auto_recharge_failed_no_payment_method')
      return
    }

    // Create payment intent
    const amountUSD = user.auto_recharge_amount / 10000

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amountUSD * 100),
      currency: 'usd',
      customer: user.stripe_customer_id,
      payment_method: paymentMethod,
      off_session: true,
      confirm: true,
      metadata: {
        user_id: user.id,
        type: 'auto_recharge',
        tokens: user.auto_recharge_amount
      }
    })

    // Tokens will be added via Stripe webhook when payment succeeds
    await sendEmail(user.email, 'auto_recharge_initiated', {
      amount_usd: amountUSD,
      tokens: user.auto_recharge_amount
    })

  } catch (error) {
    await sendEmail(user.email, 'auto_recharge_failed', { error: error.message })
  }
}
```

---

## Stripe Integration

### Stripe Webhooks

```typescript
// Webhook handler
app.post('/webhooks/stripe', async (context) => {
  const sig = context.headers['stripe-signature']
  const rawBody = await context.request.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return context.error(400, { error: 'Invalid signature' })
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object)
      break

    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object)
      break

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object)
      break

    case 'customer.subscription.deleted':
      await handleSubscriptionCancelled(event.data.object)
      break

    case 'invoice.payment_succeeded':
      await handleInvoicePayment(event.data.object)
      break
  }

  return { received: true }
})

// Payment success handler
async function handlePaymentSuccess(paymentIntent) {
  const { user_id, type, tokens } = paymentIntent.metadata

  if (type === 'token_purchase' || type === 'auto_recharge') {
    // Add tokens to user wallet
    const result = await db.query(`
      UPDATE users
      SET token_balance = token_balance + $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING token_balance
    `, [parseInt(tokens), user_id])

    // Log transaction
    await db.transactions.insert({
      user_id,
      type: type === 'auto_recharge' ? 'auto_recharge' : 'credit_purchase',
      amount: parseInt(tokens),
      balance_after: result.rows[0].token_balance,
      stripe_payment_intent_id: paymentIntent.id,
      description: `Added ${tokens} tokens via ${type}`
    })

    // Send confirmation email
    const user = await db.users.findOne({ id: user_id })
    await sendEmail(user.email, 'credits_added', {
      tokens: parseInt(tokens),
      balance: result.rows[0].token_balance,
      amount_usd: paymentIntent.amount / 100
    })
  }
}
```

### Stripe Product Catalog

```typescript
// Initial setup - create products and prices
async function setupStripeProducts() {
  // 1. Credit packages
  const packages = [
    { name: 'Starter', tokens: 100000, price: 10 },
    { name: 'Growth', tokens: 500000, price: 45, discount: 10 },
    { name: 'Business', tokens: 2000000, price: 160, discount: 20 }
  ]

  for (const pkg of packages) {
    const product = await stripe.products.create({
      name: `TokenHouse ${pkg.name}`,
      description: `${pkg.tokens.toLocaleString()} AI tokens${pkg.discount ? ` (${pkg.discount}% bonus)` : ''}`,
      metadata: {
        tokens: pkg.tokens,
        type: 'credit_package'
      }
    })

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: pkg.price * 100,
      currency: 'usd',
      metadata: {
        tokens: pkg.tokens
      }
    })

    console.log(`Created: ${pkg.name} - ${price.id}`)
  }

  // 2. Metered billing for postpaid
  const meteredProduct = await stripe.products.create({
    name: 'TokenHouse Metered Usage',
    description: 'Pay-as-you-go token usage'
  })

  const meteredPrice = await stripe.prices.create({
    product: meteredProduct.id,
    currency: 'usd',
    recurring: {
      interval: 'month',
      usage_type: 'metered'
    },
    billing_scheme: 'tiered',
    tiers_mode: 'graduated',
    tiers: [
      { up_to: 1000000, unit_amount_decimal: '0.0001' },    // $0.10 per 1M tokens
      { up_to: 'inf', unit_amount_decimal: '0.00008' }      // $0.08 per 1M tokens
    ]
  })

  // 3. Subscription plans
  const plans = [
    { name: 'Pro', price: 49, tokens: 500000 },
    { name: 'Enterprise', price: 499, tokens: 5000000 }
  ]

  for (const plan of plans) {
    const product = await stripe.products.create({
      name: `TokenHouse ${plan.name}`,
      description: `${plan.tokens.toLocaleString()} tokens/month included`
    })

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.price * 100,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: {
        included_tokens: plan.tokens,
        plan_tier: plan.name.toLowerCase()
      }
    })
  }
}
```

---

## Security Considerations

### JWT Security

```typescript
// JWT signing and validation
import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.BETTER_AUTH_SECRET // 32+ character secret
)

async function signJWT(claims: TokenHouseJWT): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .setJti(nanoid()) // Unique JWT ID for revocation
    .sign(JWT_SECRET)
}

async function validateJWT(token: string): Promise<TokenHouseJWT> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)

    // Check if JWT has been revoked
    const isRevoked = await redis.get(`revoked_jwt:${payload.jti}`)
    if (isRevoked) {
      throw new Error('Token has been revoked')
    }

    return payload as TokenHouseJWT
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

// Revoke JWT (for logout, security incidents)
async function revokeJWT(jti: string, exp: number) {
  const ttl = exp - Math.floor(Date.now() / 1000)
  await redis.setex(`revoked_jwt:${jti}`, ttl, '1')
}
```

### Rate Limiting

```typescript
// Redis-based rate limiter
class RateLimiter {
  async check(
    userId: string,
    provider: string,
    limits: { requests_per_second: number }
  ) {
    const key = `ratelimit:${userId}:${provider}:${Math.floor(Date.now() / 1000)}`

    const count = await redis.incr(key)
    await redis.expire(key, 1) // 1 second TTL

    if (count > limits.requests_per_second) {
      throw new Error('Rate limit exceeded')
    }
  }
}
```

### API Key Encryption

```typescript
// Encrypt provider master keys at rest
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex') // 32 bytes
const ALGORITHM = 'aes-256-gcm'

function encryptApiKey(apiKey: string): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv)

  let encrypted = cipher.update(apiKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

function decryptApiKey(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':')

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv)

  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
```

---

## Deployment Architecture

### Production Stack

```yaml
# docker-compose.prod.yml
services:
  # Application
  tokenhouse-api:
    image: tokenhouse/api:latest
    replicas: 3
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://...
      - NATS_URL=nats://nats-cluster:4222
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

  # Database
  postgres:
    image: postgres:16
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=tokenhouse
      - POSTGRES_USER=tokenhouse
      - POSTGRES_PASSWORD=${DB_PASSWORD}

  # Redis (session, cache, rate limiting)
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  # NATS JetStream
  nats:
    image: nats:latest
    command:
      - "--jetstream"
      - "--cluster_name=tokenhouse"
    volumes:
      - nats_data:/data

  # Load balancer
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
```

### Infrastructure Components

- **CDN:** Cloudflare (DDoS protection, SSL, caching)
- **Compute:** AWS ECS / Fly.io / Railway
- **Database:** AWS RDS PostgreSQL with read replicas
- **Cache:** Redis cluster (ElastiCache)
- **Message Queue:** NATS JetStream cluster
- **Object Storage:** S3 (logs, exports)
- **Monitoring:** Datadog / New Relic
- **Error Tracking:** Sentry
- **Logging:** CloudWatch / Better Stack

---

## Success Metrics & KPIs

### Business Metrics

```typescript
interface BusinessKPIs {
  // Revenue
  mrr: number                          // Monthly Recurring Revenue
  arr: number                          // Annual Recurring Revenue
  revenue_per_customer: number         // Average revenue per customer

  // Growth
  customer_count: number
  customer_growth_rate: number         // Month-over-month
  churn_rate: number                   // Monthly churn

  // Usage
  total_tokens_processed: number       // All-time
  tokens_per_month: number
  active_users_daily: number
  active_users_monthly: number

  // Margins
  gross_margin: number                 // (Revenue - Provider Costs) / Revenue
  provider_discount: number            // Average discount from providers

  // Efficiency
  cost_per_token: number               // Actual provider cost
  price_per_token: number              // What we charge
  margin_per_token: number             // Difference
}
```

### Technical Metrics

```typescript
interface TechnicalKPIs {
  // Performance
  p50_latency_ms: number               // Median response time
  p95_latency_ms: number               // 95th percentile
  p99_latency_ms: number               // 99th percentile

  // Reliability
  uptime_percentage: number            // 99.9% target
  error_rate: number                   // < 0.1% target
  provider_failure_rate: number        // Provider API failures

  // Throughput
  requests_per_second: number
  tokens_per_second: number

  // Infrastructure
  avg_cpu_usage: number
  avg_memory_usage: number
  database_query_time: number
  cache_hit_rate: number               // Redis cache efficiency
}
```

---

## Roadmap

### Phase 1: MVP - Proxy Mode (Month 1-2)
**Architecture:** All requests through TokenHouse proxy (like OpenRouter)

- [x] Basic authentication (Better Auth)
- [x] JWT token issuance with claims
- [x] OpenAI proxy (chat completions)
- [x] Anthropic proxy (Claude)
- [x] Stripe integration (prepaid credits)
- [x] Token wallet (balance tracking)
- [ ] Usage logging
- [ ] Dashboard (balance, usage)
- [ ] Real-time balance updates via proxy

**Goal:** Validate billing model and user experience with simple proxy architecture

### Phase 2: Core Features - Proxy Mode (Month 3-4)
**Architecture:** Mature proxy-only implementation

- [ ] Auto-recharge system
- [ ] Organization/team support
- [ ] Role-based access control
- [ ] Rate limiting per user/org
- [ ] Metered billing (postpaid option)
- [ ] Email notifications
- [ ] Usage analytics dashboard
- [ ] Performance monitoring (latency tracking)

**Goal:** Launch public beta with proxy mode, gather performance data

### Phase 3: Direct Mode - Beta (Month 5-6)
**Architecture:** Introduce direct mode for enterprise customers

- [ ] Direct credentials API (issue scoped provider keys)
- [ ] Usage tracking via provider webhooks
- [ ] Delayed billing reconciliation
- [ ] Performance comparison dashboard (proxy vs direct)
- [ ] Streaming responses (SSE) for both modes
- [ ] Google Gemini integration
- [ ] Batch API support
- [ ] Embeddings endpoint
- [ ] Mode selection API (choose proxy or direct per request)

**Goal:** Beta test direct mode with 5-10 high-volume customers

### Phase 4: Hybrid Architecture - GA (Month 7-9)
**Architecture:** Production-ready hybrid (proxy + direct)

- [ ] Intelligent mode routing (auto-select based on latency/volume)
- [ ] Direct mode SDK libraries (Python, JS, Go)
- [ ] SSO (SAML, OAuth)
- [ ] Audit logs (both modes)
- [ ] Dedicated infrastructure option
- [ ] SLA guarantees (99.9% for direct mode)
- [ ] White-label option
- [ ] Custom model routing
- [ ] Fallback providers (if OpenAI down → Claude)
- [ ] Cost optimization suggestions (proxy vs direct)

**Goal:** Full hybrid deployment, market differentiation from OpenRouter

### Phase 5: Enterprise & Ecosystem (Month 10+)
**Architecture:** Multi-region, multi-mode, enterprise-grade

- [ ] Multi-region deployment (proxy + direct)
- [ ] Advanced usage forecasting / budgeting
- [ ] Agent marketplace
- [ ] Model fine-tuning integration
- [ ] HIPAA compliance mode
- [ ] Custom contract terms (volume discounts)
- [ ] Dedicated account managers
- [ ] 24/7 enterprise support
- [ ] White-glove onboarding

**Goal:** Serve both SMB (proxy) and Enterprise (direct) segments profitably

### Architecture Evolution Summary

```
Phase 1-2: Proxy Only
Developer → TokenHouse Proxy → Provider
         (Validate business model)

Phase 3: Hybrid Beta
Developer → TokenHouse Proxy → Provider (simple)
Developer → Provider Direct (fast, beta)
         (Test direct mode)

Phase 4-5: Production Hybrid
Developer → Choose Mode:
  - Proxy (simple, real-time billing)
  - Direct (fast, enterprise)
  - Auto (intelligent routing)
         (Market leadership)
```

---

## Competitive Landscape

### Direct Competitors

| Provider | Architecture | Model | Pricing | Differentiator |
|----------|-------------|-------|---------|----------------|
| **OpenRouter** | **All traffic proxied** | Pass-through proxy | Provider cost + 5.5% fee | Pure transparency, simple |
| **Portkey** | **All traffic proxied** | Proxy + Analytics | $99/mo + usage | Observability focus |
| **Helicone** | **All traffic proxied** | Logging + Proxy | Free + $20/mo tiers | Developer tools |
| **LiteLLM** | **All traffic proxied** | Open source proxy | Free / self-hosted | Open source |

**Critical Difference:** All competitors above require **ALL API traffic to flow through their servers** (proxy architecture). This adds latency, creates single points of failure, and increases infrastructure costs.

### TokenHouse Differentiation

#### 🚀 **Architectural Advantage: Hybrid Model**

**Unlike OpenRouter and competitors, TokenHouse offers BOTH:**

1. **Proxy Mode** (like OpenRouter)
   - Simple integration, all requests through TokenHouse
   - Real-time billing and rate limiting
   - Ideal for startups and MVPs

2. **Direct Mode** (unique to TokenHouse)
   - Developers call providers directly with TokenHouse credentials
   - **Zero latency overhead** - native provider performance
   - Ideal for production, high-volume, latency-sensitive apps

| Feature | OpenRouter | Portkey | TokenHouse |
|---------|-----------|---------|------------|
| **Request Path** | All through proxy | All through proxy | **Proxy OR Direct** |
| **Added Latency** | +10-50ms per request | +20-100ms per request | **0ms (direct mode)** |
| **Infrastructure Cost** | High (proxy all traffic) | High (proxy all traffic) | **Low (auth only)** |
| **Reliability** | Single point of failure | Single point of failure | **Resilient (direct mode)** |
| **Native Streaming** | Buffered through proxy | Buffered through proxy | **Native (direct mode)** |
| **Performance Tier** | None | None | **Enterprise direct mode** |

#### 💰 **Business Model Advantages**

✅ **Token abstraction** - Single currency across providers (not just USD pass-through)
✅ **Prepaid wallet** - No surprise bills, predictable costs
✅ **Auto-recharge** - Never run out mid-request
✅ **Team management** - Built-in org support with budgets
✅ **JWT-based auth** - No DB hits for permission checks
✅ **Stripe native** - Professional billing infrastructure
✅ **Flexible deployment** - Proxy for simplicity, direct for performance

#### 🎯 **Positioning Strategy**

**vs OpenRouter:**
> "Same simplicity, but with direct mode you get 50% lower latency for production workloads. Start with proxy, graduate to direct when you scale."

**vs Managing Own Keys:**
> "Same performance with direct mode, but unified billing, team management, and compliance built-in. No more juggling multiple provider accounts."

**vs Portkey/Helicone:**
> "Not just observability - we handle authentication, billing, and give you the choice between proxy (simple) and direct (fast)."

#### 📈 **Market Positioning**

```
Simplicity ←――――――――――――――――――→ Performance

[OpenRouter]     [TokenHouse Proxy]     [TokenHouse Direct]     [Raw API Keys]
   Easy               ↓                        ↓                    Complex
   Slow          Medium Fast              Native Fast                Fast

         TokenHouse spans the entire spectrum
```

**TokenHouse is the only AI gateway that serves both:**
- **SMB/Startups:** Proxy mode for ease of use
- **Enterprise:** Direct mode for production performance

---

## Open Questions

### Technical
- [ ] How to handle streaming responses with JWT balance updates?
- [ ] Should we cache JWT claims in Redis for faster validation?
- [ ] Database partitioning strategy for usage_logs table?
- [ ] How to handle provider API downtime gracefully?
- [ ] Multi-region deployment strategy?

### Direct Mode Architecture
- [ ] **How to issue scoped provider credentials?**
  - Option A: TokenHouse creates sub-accounts with each provider
  - Option B: TokenHouse issues virtual keys that map to master keys
  - Option C: Use provider's built-in API key scoping (if available)

- [ ] **How to track usage in direct mode?**
  - Option A: Provider webhooks report usage to TokenHouse
  - Option B: Required header (`X-TokenHouse-Tracking`) in all requests
  - Option C: Periodic reconciliation via provider usage APIs
  - Option D: Hybrid (webhooks + daily reconciliation for accuracy)

- [ ] **How to enforce rate limits in direct mode?**
  - Problem: Can't intercept requests if calling provider directly
  - Option A: Trust provider rate limits, monitor via webhooks
  - Option B: Rate limit credential issuance (limit JWT refresh rate)
  - Option C: Quota-based credentials (credentials expire after X tokens)

- [ ] **How to prevent credential abuse in direct mode?**
  - Option A: Short-lived credentials (rotate every 1-24 hours)
  - Option B: IP allowlisting in JWT claims
  - Option C: Request signatures (HMAC) on every provider call
  - Option D: Provider-side usage alerts trigger credential revocation

- [ ] **What if provider doesn't support webhooks?**
  - Fallback: Daily reconciliation + estimated billing
  - Risk: Delayed billing, potential overdraft
  - Mitigation: Conservative balance holds, daily limits

### Business
- [ ] Optimal token pricing markup? (currently 20-40%)
- [ ] Free tier limits? (10K tokens/month?)
- [ ] Volume discount tiers for enterprises?
- [ ] Should we offer token futures/hedging?
- [ ] Partner/affiliate program structure?

### Product
- [ ] Should we support custom models (fine-tuned)?
- [ ] White-label option for agencies?
- [ ] API versioning strategy?
- [ ] Developer SDK priorities (Python, JS, Go)?
- [ ] Agent marketplace viability?

---

## Next Steps

### Immediate (This Week)
1. Complete usage logging implementation
2. Build React dashboard for wallet/usage
3. Test end-to-end flow with real Stripe sandbox
4. Set up error tracking (Sentry)
5. Write API documentation (Swagger/OpenAPI)

### Short-term (This Month)
1. Launch private beta with 10 developers
2. Implement auto-recharge system
3. Add Google Gemini support
4. Build organization/team features
5. Set up monitoring/alerting

### Medium-term (Next 3 Months)
1. Public beta launch
2. SDK libraries (Python, TypeScript)
3. Streaming support
4. Enterprise tier features (SSO, audit logs)
5. Marketing website and documentation

---

## Technical Debt & Risks

### Known Issues
- [ ] JWT refresh mechanism not implemented (currently 1hr expiry)
- [ ] No token balance staleness handling (cached in JWT)
- [ ] Rate limiting is per-second only (need minute/hour/day)
- [ ] No distributed tracing (hard to debug NATS flow)
- [ ] Database connection pooling not optimized

### Risks
⚠️ **Provider rate limits** - What if we hit OpenAI's rate limits?
⚠️ **Token balance race conditions** - Concurrent requests could overdraw
⚠️ **Stripe webhook reliability** - Missed webhooks = missing credits
⚠️ **NATS message durability** - What if NATS goes down during request?
⚠️ **JWT revocation** - Currently Redis-based, could be slow at scale

### Mitigation Strategies
- Provider rate limits: Implement request queuing and backpressure
- Race conditions: Use database row-level locking with `SELECT FOR UPDATE`
- Stripe webhooks: Implement idempotency keys and webhook replay
- NATS durability: Use JetStream persistence and message acknowledgments
- JWT revocation: Move to distributed cache or JWT blacklist service

---

## Appendix

### Environment Variables

```bash
# Server
DATABASE_URL=postgresql://user:pass@localhost:5432/tokenhouse
REDIS_URL=redis://localhost:6379
NATS_URL=nats://localhost:4222

BETTER_AUTH_SECRET=your-32-character-secret-key-here
BETTER_AUTH_URL=https://api.tokenhouse.ai

ANTHROPIC_API_KEY=sk-ant-api03-xxx
OPENAI_API_KEY=sk-proj-xxx
GOOGLE_API_KEY=xxx

STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

ENCRYPTION_KEY=64-character-hex-key-for-encrypting-api-keys

# Client
VITE_API_URL=https://api.tokenhouse.ai
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

### Useful Commands

```bash
# Development
bun install
bun run dev

# Database
bun run --cwd server db:migrate
bun run --cwd server db:seed

# Testing
bun test
bun run test:integration

# Production
bun run build
bun run start

# Docker
docker compose up -d
docker compose logs -f tokenhouse-api
```

---

---

## Summary: What Makes TokenHouse Unique

### 🏦 Financial Platform + AI Gateway = TokenHouse

**The Only Platform That Combines:**

1. **💰 Payment Receiving** (Venmo/Zelle Integration)
   - Freelancers get paid by clients
   - Agencies receive project payments
   - Teams split costs

2. **🔑 AI Authentication** (Direct Credentials, Not Proxy)
   - One TokenHouse ID + Secret
   - JWT with embedded OpenAI/Claude/Gemini keys
   - Call providers directly (no latency)

3. **👥 P2P Payments** (Venmo-like for Developers)
   - Pay collaborators
   - Request money (invoicing)
   - Split AI costs with teams

### Real-World Use Case

```
Jane (Freelance Developer):
1. Client pays $2,000 via TokenHouse → Jane's USD balance
2. Jane uses $500 for Claude API → Auto-deducted from balance
3. Jane pays contractor $300 → P2P payment within TokenHouse
4. Jane withdraws $1,200 to Venmo → Cash out remaining funds

All in one platform, one balance, one account.
```

### Competitive Moat

**vs OpenRouter:** We're a financial platform, not just a proxy
**vs Venmo/Zelle:** We include AI API access built-in
**vs Stripe Connect:** We specialize in AI developers/agencies
**vs PayPal:** We have direct AI provider credentials

**TokenHouse is the "Cash App for AI Developers"** — combining financial services with AI API authentication in a way no competitor can easily replicate.

---

**Last Updated:** 2026-03-09
**Author:** Johnny Crupi
**Status:** Design Complete - Financial Platform + AI Gateway Integration
**Next Phase:** Payment Integration (Venmo/Zelle SDKs + Plaid)
