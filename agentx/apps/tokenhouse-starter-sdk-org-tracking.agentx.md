# TokenHouse Starter SDK - Org-Based Multi-Tenant AI Gateway

**Status**: Design Document
**Type**: Multi-Tenant SaaS SDK
**Stack**: Bun, Elysia, React, TypeScript
**Architecture**: Proxy Gateway with Org-Level Usage Tracking

---

## Business Model

**TokenHouse as Shared Key Platform**:
- Platform owner (you) holds master OpenAI and Claude API keys
- Multiple organizations (customers) use your keys through TokenHouse
- Each org gets their own auth credentials and usage tracking
- Bill orgs based on actual token consumption
- SDK abstracts API complexity and handles authentication

**Key Difference from Previous Design**:
- **Previous**: Users got AI credentials in JWT and called APIs directly (authentication gateway)
- **This Design**: TokenHouse proxies all requests and tracks org usage (API gateway)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       TokenHouse Platform                        │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           Platform Owner (You)                           │   │
│  │  • Holds OpenAI Master Key: sk-proj-master-xxx          │   │
│  │  • Holds Claude Master Key: sk-ant-master-xxx           │   │
│  │  • Encrypted in Platform Config                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Org A      │  │   Org B      │  │   Org C      │          │
│  │ ID: org_abc  │  │ ID: org_def  │  │ ID: org_ghi  │          │
│  │ API: th_org_ │  │ API: th_org_ │  │ API: th_org_ │          │
│  │ Secret: ths_ │  │ Secret: ths_ │  │ Secret: ths_ │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                 │
│                            │                                     │
│                    ┌───────▼────────┐                           │
│                    │  Auth Service  │                           │
│                    │  Returns JWT   │                           │
│                    │  with Claims   │                           │
│                    └───────┬────────┘                           │
│                            │                                     │
│                    ┌───────▼────────┐                           │
│                    │  Proxy Gateway │                           │
│                    │  Routes to     │                           │
│                    │  OpenAI/Claude │                           │
│                    │  + Tracks      │                           │
│                    └───────┬────────┘                           │
│                            │                                     │
│                    ┌───────▼────────┐                           │
│                    │ Usage Tracker  │                           │
│                    │ Per-Org Counts │                           │
│                    └────────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## JWT Claims Structure

When an org authenticates, they receive a JWT with these claims:

```typescript
interface TokenHouseJWT {
  // Standard JWT claims
  iss: 'tokenhouse.ai'
  sub: string                           // org_abc123
  aud: 'tokenhouse-api'
  exp: number
  iat: number

  // Org identification
  org_id: string                        // org_abc123
  org_name: string                      // "Acme Corp"

  // Org credentials (hashed/obfuscated)
  org_token_hash: string                // SHA256 hash for request signing

  // Allowed models
  allowed_models: string[]              // ['gpt-4o', 'claude-3-5-sonnet-20241022']

  // Rate limits
  rate_limits: {
    requests_per_minute: number         // 100
    tokens_per_day: number              // 1000000
  }

  // Billing tier
  billing_tier: 'free' | 'starter' | 'pro' | 'enterprise'

  // Usage tracking identifier (for analytics)
  usage_tracking_id: string             // Unique ID for this session
}
```

**Important**: The JWT does NOT contain actual OpenAI/Claude keys. Those remain secret on the server.

---

## SDK Architecture

### Package Structure

```
@tokenhouse/sdk-starter/
├── packages/
│   ├── core/                          # Core TypeScript SDK
│   │   ├── src/
│   │   │   ├── client.ts             # Main TokenHouse client
│   │   │   ├── auth.ts               # Authentication handling
│   │   │   ├── chat.ts               # Chat completions
│   │   │   ├── embeddings.ts         # Embeddings
│   │   │   └── usage.ts              # Usage tracking utilities
│   │   └── package.json
│   │
│   ├── react/                         # React hooks and components
│   │   ├── src/
│   │   │   ├── provider.tsx          # TokenHouseProvider
│   │   │   ├── useChat.ts            # Chat hook
│   │   │   ├── useUsage.ts           # Usage stats hook
│   │   │   └── components/
│   │   │       ├── ChatWindow.tsx
│   │   │       └── UsageChart.tsx
│   │   └── package.json
│   │
│   └── elysia-plugin/                 # Backend middleware
│       ├── src/
│       │   ├── index.ts              # Plugin entry
│       │   ├── auth.ts               # JWT validation
│       │   └── usage-tracker.ts      # Usage logging
│       └── package.json
│
├── examples/
│   ├── simple-chat/                   # Minimal chat example
│   └── dashboard/                     # Full dashboard with analytics
│
└── server/                            # TokenHouse Gateway Server
    ├── src/
    │   ├── index.ts                  # Elysia server entry
    │   ├── routes/
    │   │   ├── auth.ts               # POST /auth/token
    │   │   ├── chat.ts               # POST /chat/completions
    │   │   ├── embeddings.ts         # POST /embeddings
    │   │   └── usage.ts              # GET /usage/stats
    │   ├── proxy/
    │   │   ├── openai.ts             # OpenAI proxy with tracking
    │   │   └── anthropic.ts          # Claude proxy with tracking
    │   ├── tracking/
    │   │   ├── usage-logger.ts       # Log token usage to DB
    │   │   └── analytics.ts          # Real-time analytics
    │   └── db/
    │       └── schema.ts             # Database schema
    └── package.json
```

---

## Core SDK Implementation

### 1. TokenHouse Client (`@tokenhouse/core`)

```typescript
// packages/core/src/client.ts

export interface TokenHouseConfig {
  baseUrl?: string
  orgId: string
  orgSecret: string
  onTokenRefresh?: (token: string) => void
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionRequest {
  model: string
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

export interface ChatCompletionResponse {
  id: string
  model: string
  choices: Array<{
    index: number
    message: ChatMessage
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  cost_usd: number              // Calculated cost
  org_id: string                // Echo back for tracking
}

export class TokenHouseClient {
  private baseUrl: string
  private orgId: string
  private orgSecret: string
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  constructor(config: TokenHouseConfig) {
    this.baseUrl = config.baseUrl || 'https://api.tokenhouse.ai'
    this.orgId = config.orgId
    this.orgSecret = config.orgSecret
  }

  /**
   * Authenticate and get JWT access token
   */
  async authenticate(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        org_id: this.orgId,
        org_secret: this.orgSecret
      })
    })

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.statusText}`)
    }

    const data = await response.json()
    this.accessToken = data.access_token
    this.tokenExpiry = Date.now() + (data.expires_in * 1000)

    return this.accessToken
  }

  /**
   * Get current access token (auto-refresh if expired)
   */
  private async getToken(): Promise<string> {
    if (!this.accessToken || Date.now() >= this.tokenExpiry - 60000) {
      await this.authenticate()
    }
    return this.accessToken!
  }

  /**
   * Chat completion (proxied through TokenHouse)
   */
  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const token = await this.getToken()

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Chat request failed: ${error.message}`)
    }

    return response.json()
  }

  /**
   * Stream chat completion
   */
  async *chatStream(request: ChatCompletionRequest): AsyncGenerator<string> {
    const token = await this.getToken()

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ...request, stream: true })
    })

    if (!response.ok) {
      throw new Error(`Stream failed: ${response.statusText}`)
    }

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(line => line.trim())

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices[0]?.delta?.content
            if (content) yield content
          } catch (e) {
            console.error('Failed to parse SSE data:', e)
          }
        }
      }
    }
  }

  /**
   * Get usage statistics for this org
   */
  async getUsage(params?: {
    start_date?: string
    end_date?: string
    model?: string
  }): Promise<UsageStats> {
    const token = await this.getToken()

    const searchParams = new URLSearchParams()
    if (params?.start_date) searchParams.set('start_date', params.start_date)
    if (params?.end_date) searchParams.set('end_date', params.end_date)
    if (params?.model) searchParams.set('model', params.model)

    const response = await fetch(
      `${this.baseUrl}/usage/stats?${searchParams}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    )

    return response.json()
  }
}

export interface UsageStats {
  org_id: string
  period: {
    start: string
    end: string
  }
  totals: {
    requests: number
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
    cost_usd: number
  }
  by_model: Record<string, {
    requests: number
    tokens: number
    cost_usd: number
  }>
  daily_breakdown: Array<{
    date: string
    tokens: number
    cost_usd: number
  }>
}
```

### 2. React SDK (`@tokenhouse/react`)

```typescript
// packages/react/src/provider.tsx

import React, { createContext, useContext, useState, useEffect } from 'react'
import { TokenHouseClient, type TokenHouseConfig } from '@tokenhouse/core'

interface TokenHouseContextValue {
  client: TokenHouseClient
  isAuthenticated: boolean
  error: Error | null
}

const TokenHouseContext = createContext<TokenHouseContextValue | null>(null)

export function TokenHouseProvider({
  children,
  config
}: {
  children: React.ReactNode
  config: TokenHouseConfig
}) {
  const [client] = useState(() => new TokenHouseClient(config))
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    client.authenticate()
      .then(() => setIsAuthenticated(true))
      .catch(setError)
  }, [client])

  return (
    <TokenHouseContext.Provider value={{ client, isAuthenticated, error }}>
      {children}
    </TokenHouseContext.Provider>
  )
}

export function useTokenHouse() {
  const context = useContext(TokenHouseContext)
  if (!context) {
    throw new Error('useTokenHouse must be used within TokenHouseProvider')
  }
  return context
}
```

```typescript
// packages/react/src/useChat.ts

import { useState } from 'react'
import { useTokenHouse } from './provider'
import type { ChatMessage } from '@tokenhouse/core'

export function useChat() {
  const { client } = useTokenHouse()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [usage, setUsage] = useState({ tokens: 0, cost: 0 })

  async function sendMessage(content: string, model: string = 'gpt-4o') {
    const userMessage: ChatMessage = { role: 'user', content }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    try {
      const response = await client.chat({
        model,
        messages: [...messages, userMessage]
      })

      const assistantMessage = response.choices[0].message
      setMessages(prev => [...prev, assistantMessage])

      setUsage(prev => ({
        tokens: prev.tokens + response.usage.total_tokens,
        cost: prev.cost + response.cost_usd
      }))
    } catch (e) {
      setError(e as Error)
    } finally {
      setIsLoading(false)
    }
  }

  async function *streamMessage(content: string, model: string = 'gpt-4o') {
    const userMessage: ChatMessage = { role: 'user', content }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    let assistantContent = ''

    try {
      for await (const chunk of client.chatStream({
        model,
        messages: [...messages, userMessage]
      })) {
        assistantContent += chunk
        yield chunk
      }

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: assistantContent }
      ])
    } catch (e) {
      setError(e as Error)
    } finally {
      setIsLoading(false)
    }
  }

  function reset() {
    setMessages([])
    setUsage({ tokens: 0, cost: 0 })
    setError(null)
  }

  return {
    messages,
    isLoading,
    error,
    usage,
    sendMessage,
    streamMessage,
    reset
  }
}
```

---

## Server Implementation

### Gateway Server with Proxy and Tracking

```typescript
// server/src/index.ts

import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { cors } from '@elysiajs/cors'
import { authRoutes } from './routes/auth'
import { chatRoutes } from './routes/chat'
import { usageRoutes } from './routes/usage'

const app = new Elysia()
  .use(cors())
  .use(jwt({
    name: 'jwt',
    secret: process.env.JWT_SECRET!
  }))
  .use(authRoutes)
  .use(chatRoutes)
  .use(usageRoutes)
  .listen(3000)

console.log(`🚀 TokenHouse Gateway running at ${app.server?.hostname}:${app.server?.port}`)
```

```typescript
// server/src/routes/auth.ts

import { Elysia, t } from 'elysia'
import { db } from '../db'
import { hash, compare } from 'bcrypt'

export const authRoutes = new Elysia()
  .post('/auth/token', async ({ body, jwt }) => {
    const { org_id, org_secret } = body

    // Look up org in database
    const org = await db.orgs.findOne({ org_id })

    if (!org) {
      throw new Error('Invalid credentials')
    }

    // Verify secret
    const isValid = await compare(org_secret, org.org_secret_hash)
    if (!isValid) {
      throw new Error('Invalid credentials')
    }

    // Generate JWT with claims
    const token = await jwt.sign({
      iss: 'tokenhouse.ai',
      sub: org_id,
      aud: 'tokenhouse-api',
      exp: Math.floor(Date.now() / 1000) + (60 * 60),  // 1 hour
      iat: Math.floor(Date.now() / 1000),

      org_id: org.org_id,
      org_name: org.org_name,
      org_token_hash: org.org_token_hash,

      allowed_models: org.allowed_models,
      rate_limits: org.rate_limits,
      billing_tier: org.billing_tier,
      usage_tracking_id: crypto.randomUUID()
    })

    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: 3600
    }
  }, {
    body: t.Object({
      org_id: t.String(),
      org_secret: t.String()
    })
  })
```

```typescript
// server/src/routes/chat.ts

import { Elysia, t } from 'elysia'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { logUsage } from '../tracking/usage-logger'

// Initialize with platform owner's keys
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!  // Your master key
})

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!  // Your master key
})

export const chatRoutes = new Elysia()
  .derive(async ({ headers, jwt }) => {
    const token = headers.authorization?.replace('Bearer ', '')
    if (!token) throw new Error('Missing token')

    const claims = await jwt.verify(token)
    if (!claims) throw new Error('Invalid token')

    return { org: claims }
  })
  .post('/chat/completions', async ({ body, org }) => {
    const { model, messages, temperature, max_tokens, stream } = body

    // Validate model access
    if (!org.allowed_models.includes(model)) {
      throw new Error(`Model ${model} not allowed for this org`)
    }

    const startTime = Date.now()

    // Route to appropriate provider
    if (model.startsWith('gpt-') || model.startsWith('o1-')) {
      // OpenAI
      const response = await openai.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens,
        stream
      })

      if (stream) {
        // Return stream (handle separately)
        return response
      }

      // Log usage
      await logUsage({
        org_id: org.org_id,
        usage_tracking_id: org.usage_tracking_id,
        provider: 'openai',
        model,
        prompt_tokens: response.usage!.prompt_tokens,
        completion_tokens: response.usage!.completion_tokens,
        total_tokens: response.usage!.total_tokens,
        latency_ms: Date.now() - startTime,
        cost_usd: calculateCost('openai', model, response.usage!)
      })

      return {
        id: response.id,
        model: response.model,
        choices: response.choices,
        usage: response.usage,
        cost_usd: calculateCost('openai', model, response.usage!),
        org_id: org.org_id
      }
    }
    else if (model.startsWith('claude-')) {
      // Anthropic
      const response = await anthropic.messages.create({
        model,
        messages,
        temperature,
        max_tokens: max_tokens || 1024
      })

      // Log usage
      await logUsage({
        org_id: org.org_id,
        usage_tracking_id: org.usage_tracking_id,
        provider: 'anthropic',
        model,
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens,
        latency_ms: Date.now() - startTime,
        cost_usd: calculateCost('anthropic', model, {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens
        })
      })

      return {
        id: response.id,
        model: response.model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: response.content[0].text
          },
          finish_reason: response.stop_reason
        }],
        usage: {
          prompt_tokens: response.usage.input_tokens,
          completion_tokens: response.usage.output_tokens,
          total_tokens: response.usage.input_tokens + response.usage.output_tokens
        },
        cost_usd: calculateCost('anthropic', model, {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens
        }),
        org_id: org.org_id
      }
    }

    throw new Error(`Unsupported model: ${model}`)
  }, {
    body: t.Object({
      model: t.String(),
      messages: t.Array(t.Object({
        role: t.String(),
        content: t.String()
      })),
      temperature: t.Optional(t.Number()),
      max_tokens: t.Optional(t.Number()),
      stream: t.Optional(t.Boolean())
    })
  })

// Cost calculation based on current pricing
function calculateCost(
  provider: 'openai' | 'anthropic',
  model: string,
  usage: any
): number {
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 2.5 / 1_000_000, output: 10 / 1_000_000 },
    'gpt-4o-mini': { input: 0.15 / 1_000_000, output: 0.60 / 1_000_000 },
    'claude-3-5-sonnet-20241022': { input: 3 / 1_000_000, output: 15 / 1_000_000 },
    'claude-3-5-haiku-20241022': { input: 0.80 / 1_000_000, output: 4 / 1_000_000 }
  }

  const rates = pricing[model]
  if (!rates) return 0

  if (provider === 'openai') {
    return (usage.prompt_tokens * rates.input) + (usage.completion_tokens * rates.output)
  } else {
    return (usage.input_tokens * rates.input) + (usage.output_tokens * rates.output)
  }
}
```

```typescript
// server/src/tracking/usage-logger.ts

import { db } from '../db'
import { nats } from '../nats'

interface UsageLog {
  org_id: string
  usage_tracking_id: string
  provider: 'openai' | 'anthropic'
  model: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  latency_ms: number
  cost_usd: number
}

export async function logUsage(log: UsageLog) {
  // Insert into database
  await db.usage_logs.insertOne({
    ...log,
    timestamp: new Date(),
    created_at: new Date()
  })

  // Publish to NATS for real-time analytics
  await nats.publish('usage.logged', JSON.stringify(log))

  // Update org aggregate counts
  await db.orgs.updateOne(
    { org_id: log.org_id },
    {
      $inc: {
        'usage_totals.total_requests': 1,
        'usage_totals.total_tokens': log.total_tokens,
        'usage_totals.total_cost_usd': log.cost_usd,
        [`usage_totals.by_model.${log.model}.requests`]: 1,
        [`usage_totals.by_model.${log.model}.tokens`]: log.total_tokens,
        [`usage_totals.by_model.${log.model}.cost_usd`]: log.cost_usd
      }
    }
  )
}
```

---

## Database Schema

```typescript
// server/src/db/schema.ts

export interface Org {
  _id: ObjectId
  org_id: string                        // org_abc123
  org_name: string                      // "Acme Corp"
  org_secret_hash: string               // bcrypt hash of org_secret
  org_token_hash: string                // SHA256 for request signing

  // API access
  allowed_models: string[]              // ['gpt-4o', 'claude-3-5-sonnet']
  rate_limits: {
    requests_per_minute: number
    tokens_per_day: number
  }

  // Billing
  billing_tier: 'free' | 'starter' | 'pro' | 'enterprise'
  billing_email: string
  stripe_customer_id: string | null

  // Usage aggregates (for quick lookups)
  usage_totals: {
    total_requests: number
    total_tokens: number
    total_cost_usd: number
    by_model: Record<string, {
      requests: number
      tokens: number
      cost_usd: number
    }>
  }

  // Metadata
  created_at: Date
  updated_at: Date
  is_active: boolean
}

export interface UsageLog {
  _id: ObjectId
  org_id: string
  usage_tracking_id: string             // Session identifier

  // Request details
  provider: 'openai' | 'anthropic'
  model: string

  // Token counts
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number

  // Performance
  latency_ms: number

  // Cost
  cost_usd: number

  // Metadata
  timestamp: Date
  created_at: Date
}

// Indexes
db.usage_logs.createIndex({ org_id: 1, timestamp: -1 })
db.usage_logs.createIndex({ usage_tracking_id: 1 })
db.usage_logs.createIndex({ provider: 1, model: 1 })
```

---

## Example: Simple Chat App

```typescript
// examples/simple-chat/src/App.tsx

import { TokenHouseProvider, useChat } from '@tokenhouse/react'
import { useState } from 'react'

function ChatInterface() {
  const { messages, isLoading, usage, sendMessage } = useChat()
  const [input, setInput] = useState('')
  const [model, setModel] = useState('gpt-4o')

  const handleSend = async () => {
    if (!input.trim()) return
    await sendMessage(input, model)
    setInput('')
  }

  return (
    <div className="chat-container">
      <div className="header">
        <h1>TokenHouse Chat</h1>
        <div className="stats">
          <span>Tokens: {usage.tokens.toLocaleString()}</span>
          <span>Cost: ${usage.cost.toFixed(4)}</span>
        </div>
        <select value={model} onChange={(e) => setModel(e.target.value)}>
          <option value="gpt-4o">GPT-4o</option>
          <option value="gpt-4o-mini">GPT-4o Mini</option>
          <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
          <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
        </select>
      </div>

      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
        {isLoading && <div className="loading">AI is thinking...</div>}
      </div>

      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          disabled={isLoading}
        />
        <button onClick={handleSend} disabled={isLoading}>
          Send
        </button>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <TokenHouseProvider
      config={{
        orgId: import.meta.env.VITE_TOKENHOUSE_ORG_ID,
        orgSecret: import.meta.env.VITE_TOKENHOUSE_ORG_SECRET,
        baseUrl: 'http://localhost:3000'
      }}
    >
      <ChatInterface />
    </TokenHouseProvider>
  )
}
```

---

## Usage Tracking Flow

```
1. Org authenticates
   POST /auth/token
   └─> Returns JWT with org_id and usage_tracking_id

2. Org makes chat request
   POST /chat/completions
   ├─> JWT validated (org_id extracted)
   ├─> Request proxied to OpenAI/Claude using PLATFORM KEYS
   ├─> Response received with token counts
   ├─> Usage logged:
   │   ├─> Write to usage_logs collection (org_id, tokens, cost)
   │   ├─> Publish to NATS for real-time analytics
   │   └─> Update org aggregate totals
   └─> Response returned to client with cost_usd

3. Org queries usage stats
   GET /usage/stats?start_date=2024-01-01&end_date=2024-01-31
   └─> Query usage_logs filtered by org_id
   └─> Return aggregated stats and daily breakdown
```

---

## Key Features

### 1. **Multi-Tenant Isolation**
- Each org has unique `org_id` and `org_secret`
- JWT contains org identity and is validated on every request
- Database queries filtered by `org_id`
- No org can see another org's data

### 2. **Transparent Usage Tracking**
- Every API call logged with token counts and cost
- Real-time aggregation for quick stats
- Historical queries for analytics and billing
- Per-model breakdown

### 3. **Cost Calculation**
- Calculate cost based on current pricing
- Include in response so orgs know exact cost
- Store in database for billing reconciliation

### 4. **SDK Abstraction**
- Orgs don't need to know about OpenAI/Claude APIs
- Simple `client.chat()` method handles everything
- Automatic token refresh
- React hooks for easy UI integration

### 5. **Platform Control**
- You (platform owner) control the master API keys
- Add/remove models per org
- Set rate limits and quotas
- Bill orgs based on actual usage

---

## Deployment

### Environment Variables

```bash
# Server (.env)
OPENAI_API_KEY=sk-proj-your-master-key
ANTHROPIC_API_KEY=sk-ant-your-master-key
JWT_SECRET=your-jwt-secret
DATABASE_URL=mongodb://localhost:27017/tokenhouse
NATS_URL=nats://localhost:4222
```

### Docker Compose

```yaml
version: '3.8'

services:
  tokenhouse-gateway:
    build: ./server
    ports:
      - "3000:3000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
      - DATABASE_URL=mongodb://mongo:27017/tokenhouse
      - NATS_URL=nats://nats:4222
    depends_on:
      - mongo
      - nats

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

  nats:
    image: nats:latest
    ports:
      - "4222:4222"
      - "8222:8222"
    command: ["-js", "-m", "8222"]

volumes:
  mongo-data:
```

---

## Billing Integration

### Monthly Invoice Generation

```typescript
// Generate invoice at end of month
async function generateMonthlyInvoice(orgId: string, month: string) {
  const startDate = new Date(`${month}-01`)
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)

  // Aggregate usage for the month
  const usage = await db.usage_logs.aggregate([
    {
      $match: {
        org_id: orgId,
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$model',
        total_requests: { $sum: 1 },
        total_tokens: { $sum: '$total_tokens' },
        total_cost_usd: { $sum: '$cost_usd' }
      }
    }
  ])

  // Create Stripe invoice
  const invoice = await stripe.invoices.create({
    customer: org.stripe_customer_id,
    auto_advance: true,
    collection_method: 'charge_automatically'
  })

  // Add line items
  for (const item of usage) {
    await stripe.invoiceItems.create({
      invoice: invoice.id,
      customer: org.stripe_customer_id,
      description: `${item._id} - ${item.total_requests} requests, ${item.total_tokens} tokens`,
      amount: Math.round(item.total_cost_usd * 100),  // Convert to cents
      currency: 'usd'
    })
  }

  // Finalize and send
  await stripe.invoices.finalizeInvoice(invoice.id)
}
```

---

## Security Considerations

1. **Master Key Protection**
   - Store OpenAI/Claude keys in encrypted secrets manager
   - Never expose in logs or responses
   - Rotate regularly

2. **JWT Security**
   - Short expiry (1 hour)
   - Signed with strong secret
   - Validate on every request

3. **Rate Limiting**
   - Enforce per-org rate limits
   - Prevent abuse of shared keys
   - Alert on anomalies

4. **Audit Logging**
   - Log all API calls with org_id
   - Track failed authentication attempts
   - Monitor for suspicious patterns

---

## Summary

This starter SDK provides:

✅ **Multi-tenant SaaS architecture** - Multiple orgs share your API keys
✅ **Complete usage tracking** - Every token counted and billed
✅ **Simple SDK** - TypeScript + React hooks for easy integration
✅ **Transparent costs** - Orgs see exact costs in real-time
✅ **Platform control** - You manage keys, models, and access
✅ **Billing ready** - Direct integration with Stripe invoicing

**Key Difference from Previous Design**:
- Previous: JWT contains AI credentials, clients call directly (auth gateway)
- This: JWT contains org identity, server proxies calls with platform keys (API gateway)

This model is ideal for SaaS platforms where you want to:
- Control API key usage and costs
- Provide a unified billing experience
- Track usage per customer/org
- Scale without distributing keys
