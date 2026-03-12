# TokenHouse SDK Monorepo & Example Applications

**Type:** Developer SDK & Reference Implementation
**Stack:** Bun + React + Elysia + Eden + TypeScript
**Created:** 2026-03-09

---

## Overview

This document describes the TokenHouse SDK monorepo structure that developers can clone and use to build applications with TokenHouse authentication and AI capabilities.

### Repository Structure

```
tokenhouse-sdk/
├── packages/
│   ├── core/                  # Core TypeScript SDK
│   ├── react/                 # React hooks and components
│   ├── elysia-plugin/        # Elysia middleware for backend
│   └── cli/                   # CLI tool
│
├── examples/
│   ├── chat-app/             # Full-stack chat application
│   ├── ai-playground/        # AI model playground
│   ├── team-workspace/       # Collaborative AI workspace
│   └── payment-demo/         # P2P payment integration
│
├── docs/                      # Documentation site
├── package.json              # Monorepo root
├── turbo.json               # Turborepo config
└── README.md
```

---

## Part 1: Monorepo Setup

### Root Package Configuration

```json
// package.json
{
  "name": "tokenhouse-sdk",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "packages/*",
    "examples/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.3.0"
  }
}
```

### Turbo Configuration

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {}
  }
}
```

---

## Part 2: Core SDK Package

### Package: @tokenhouse/core

```
packages/core/
├── src/
│   ├── client.ts            # Main TokenHouseClient
│   ├── auth.ts              # Authentication logic
│   ├── oauth.ts             # OAuth flows (TokenHouse + OpenAI)
│   ├── ai.ts                # AI credential management
│   ├── payments.ts          # Payment methods
│   ├── types.ts             # TypeScript types
│   └── index.ts
├── package.json
└── tsconfig.json
```

### Implementation: TokenHouseClient

```typescript
// packages/core/src/client.ts
export class TokenHouseClient {
  private baseUrl: string
  private clientId?: string
  private clientSecret?: string
  private accessToken?: string

  constructor(config: TokenHouseConfig) {
    this.baseUrl = config.baseUrl || 'https://api.tokenhouse.ai'
    this.clientId = config.clientId
    this.clientSecret = config.clientSecret
    this.accessToken = config.accessToken
  }

  // Authentication
  async authenticate(credentials: {
    tokenhouse_id: string
    tokenhouse_secret: string
  }): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    })

    if (!response.ok) {
      throw new Error('Authentication failed')
    }

    const data = await response.json()
    this.accessToken = data.access_token

    return data
  }

  // OAuth flows
  oauth = {
    // TokenHouse OAuth (for third-party apps)
    getAuthorizationUrl: (params: OAuthParams): string => {
      const searchParams = new URLSearchParams({
        client_id: this.clientId!,
        redirect_uri: params.redirectUri,
        response_type: 'code',
        scope: params.scopes.join(' '),
        ...(params.state && { state: params.state })
      })

      return `https://auth.tokenhouse.ai/oauth/authorize?${searchParams}`
    },

    exchangeCode: async (code: string, redirectUri: string): Promise<TokenResponse> => {
      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri
        })
      })

      return response.json()
    },

    // OpenAI OAuth (link user's OpenAI account)
    linkOpenAI: async (): Promise<string> => {
      // Returns OpenAI OAuth URL for user to approve
      const searchParams = new URLSearchParams({
        client_id: TOKENHOUSE_OPENAI_CLIENT_ID,
        redirect_uri: `${this.baseUrl}/oauth/openai/callback`,
        response_type: 'code',
        scope: 'api:write',
        state: this.accessToken!
      })

      return `https://platform.openai.com/oauth/authorize?${searchParams}`
    },

    // After OpenAI approval, exchange for tokens
    completeOpenAILink: async (code: string): Promise<void> => {
      await fetch(`${this.baseUrl}/oauth/openai/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      })
    }
  }

  // User info
  async getUserInfo(): Promise<UserInfo> {
    const response = await fetch(`${this.baseUrl}/oauth/userinfo`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    })

    return response.json()
  }

  // AI credentials
  async getAICredentials(): Promise<AICredentials> {
    const response = await fetch(`${this.baseUrl}/oauth/ai-credentials`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    })

    return response.json()
  }

  // Balance
  async getBalance(): Promise<BalanceInfo> {
    const response = await fetch(`${this.baseUrl}/wallet/balance`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    })

    return response.json()
  }

  // Payments
  payments = {
    send: async (params: SendPaymentParams): Promise<PaymentResult> => {
      const response = await fetch(`${this.baseUrl}/payments/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })

      return response.json()
    },

    request: async (params: RequestPaymentParams): Promise<PaymentRequest> => {
      const response = await fetch(`${this.baseUrl}/payments/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })

      return response.json()
    }
  }
}

// Types
export interface TokenHouseConfig {
  baseUrl?: string
  clientId?: string
  clientSecret?: string
  accessToken?: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  expires_in: number
  balance_usd: number
  balance_tokens: number
}

export interface UserInfo {
  sub: string
  email: string
  username: string
  name: string
  balance_usd: number
  balance_tokens: number
  ai_enabled: boolean
}

export interface AICredentials {
  openai?: {
    api_key: string
    org_id: string
    project_id: string
    is_user_owned: boolean  // NEW: True if user linked their own OpenAI account
  }
  anthropic?: {
    api_key: string
    workspace_id: string
  }
  allowed_models: string[]
  rate_limits: Record<string, any>
}
```

### Package.json

```json
// packages/core/package.json
{
  "name": "@tokenhouse/core",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

---

## Part 3: React Hooks Package

### Package: @tokenhouse/react

```
packages/react/
├── src/
│   ├── TokenHouseProvider.tsx
│   ├── useTokenHouse.ts
│   ├── useAICredentials.ts
│   ├── useBalance.ts
│   ├── components/
│   │   ├── SignInButton.tsx
│   │   ├── UserProfile.tsx
│   │   └── BalanceDisplay.tsx
│   └── index.ts
├── package.json
└── tsconfig.json
```

### Implementation

```typescript
// packages/react/src/TokenHouseProvider.tsx
import React, { createContext, useContext, useState, useEffect } from 'react'
import { TokenHouseClient } from '@tokenhouse/core'
import type { UserInfo, AICredentials } from '@tokenhouse/core'

interface TokenHouseContextValue {
  client: TokenHouseClient
  user: UserInfo | null
  aiCredentials: AICredentials | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: () => void
  signOut: () => void
}

const TokenHouseContext = createContext<TokenHouseContextValue | null>(null)

export function TokenHouseProvider({
  clientId,
  clientSecret,
  redirectUri,
  scopes = ['openid', 'profile', 'ai_credits'],
  children
}: {
  clientId: string
  clientSecret?: string
  redirectUri: string
  scopes?: string[]
  children: React.ReactNode
}) {
  const [client] = useState(() => new TokenHouseClient({ clientId, clientSecret }))
  const [user, setUser] = useState<UserInfo | null>(null)
  const [aiCredentials, setAICredentials] = useState<AICredentials | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const accessToken = localStorage.getItem('tokenhouse_access_token')
    if (accessToken) {
      client.setAccessToken(accessToken)
      loadUser()
    } else {
      setIsLoading(false)
    }
  }, [])

  async function loadUser() {
    try {
      const [userInfo, creds] = await Promise.all([
        client.getUserInfo(),
        client.getAICredentials()
      ])

      setUser(userInfo)
      setAICredentials(creds)
    } catch (error) {
      console.error('Failed to load user:', error)
      signOut()
    } finally {
      setIsLoading(false)
    }
  }

  function signIn() {
    const state = Math.random().toString(36).substring(7)
    sessionStorage.setItem('oauth_state', state)

    const authUrl = client.oauth.getAuthorizationUrl({
      redirectUri,
      scopes,
      state
    })

    window.location.href = authUrl
  }

  function signOut() {
    localStorage.removeItem('tokenhouse_access_token')
    setUser(null)
    setAICredentials(null)
  }

  const value: TokenHouseContextValue = {
    client,
    user,
    aiCredentials,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signOut
  }

  return (
    <TokenHouseContext.Provider value={value}>
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
// packages/react/src/useAICredentials.ts
import { useTokenHouse } from './TokenHouseProvider'

export function useAICredentials() {
  const { aiCredentials } = useTokenHouse()

  return {
    openai: aiCredentials?.openai || null,
    anthropic: aiCredentials?.anthropic || null,
    allowedModels: aiCredentials?.allowed_models || [],
    isReady: !!aiCredentials
  }
}
```

---

## Part 4: Elysia Plugin Package

### Package: @tokenhouse/elysia-plugin

```
packages/elysia-plugin/
├── src/
│   ├── index.ts
│   ├── middleware.ts
│   └── types.ts
├── package.json
└── tsconfig.json
```

### Implementation

```typescript
// packages/elysia-plugin/src/index.ts
import { Elysia } from 'elysia'
import { TokenHouseClient } from '@tokenhouse/core'

export const tokenhouse = (config: {
  clientId: string
  clientSecret: string
}) => {
  const client = new TokenHouseClient(config)

  return new Elysia({ name: 'tokenhouse' })
    .decorate('tokenhouse', client)
    .derive(async ({ headers }) => {
      const authorization = headers.authorization

      if (!authorization?.startsWith('Bearer ')) {
        return { user: null }
      }

      const token = authorization.slice(7)
      client.setAccessToken(token)

      try {
        const user = await client.getUserInfo()
        return { user }
      } catch {
        return { user: null }
      }
    })
    .macro(({ onBeforeHandle }) => ({
      requireAuth(enabled: boolean) {
        if (!enabled) return

        onBeforeHandle(({ user, error }) => {
          if (!user) {
            return error(401, { error: 'Unauthorized' })
          }
        })
      }
    }))
}

// Usage example:
// app.use(tokenhouse({ clientId: '...', clientSecret: '...' }))
// app.get('/protected', ({ user }) => ({ user }), { requireAuth: true })
```

---

## Part 5: Example Chat Application

### Structure

```
examples/chat-app/
├── client/                  # React frontend
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── ModelSelector.tsx
│   │   │   └── MessageList.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── server/                  # Elysia backend
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   └── chat.ts
│   │   └── services/
│   │       └── ai.service.ts
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

### Frontend Implementation

```tsx
// examples/chat-app/client/src/App.tsx
import { TokenHouseProvider, useTokenHouse } from '@tokenhouse/react'
import { ChatInterface } from './components/ChatInterface'

function App() {
  return (
    <TokenHouseProvider
      clientId="chat_app_client_id"
      redirectUri="http://localhost:5173/callback"
      scopes={['openid', 'profile', 'ai_credits']}
    >
      <MainApp />
    </TokenHouseProvider>
  )
}

function MainApp() {
  const { isAuthenticated, user, signIn, signOut } = useTokenHouse()

  if (!isAuthenticated) {
    return (
      <div className="login-screen">
        <h1>TokenHouse Chat</h1>
        <button onClick={signIn}>Sign in with TokenHouse</button>
      </div>
    )
  }

  return (
    <div className="app">
      <header>
        <h1>TokenHouse Chat</h1>
        <div>
          <span>{user?.name}</span>
          <span>${user?.balance_usd}</span>
          <button onClick={signOut}>Sign Out</button>
        </div>
      </header>

      <ChatInterface />
    </div>
  )
}

export default App
```

```tsx
// examples/chat-app/client/src/components/ChatInterface.tsx
import { useState } from 'react'
import { useTokenHouse, useAICredentials } from '@tokenhouse/react'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

export function ChatInterface() {
  const { user } = useTokenHouse()
  const { openai, anthropic, allowedModels } = useAICredentials()

  const [selectedModel, setSelectedModel] = useState('claude-3-5-haiku-20241022')
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function sendMessage() {
    if (!input.trim()) return

    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      let response: string

      // Use appropriate SDK based on selected model
      if (selectedModel.startsWith('claude')) {
        const client = new Anthropic({
          apiKey: anthropic!.api_key,
          defaultHeaders: {
            'X-TokenHouse-User': user!.sub
          }
        })

        const result = await client.messages.create({
          model: selectedModel,
          max_tokens: 1024,
          messages: [...messages, userMessage]
        })

        response = result.content[0].text
      } else if (selectedModel.startsWith('gpt')) {
        const client = new OpenAI({
          apiKey: openai!.api_key,
          organization: openai!.org_id,
          defaultHeaders: {
            'X-TokenHouse-User': user!.sub
          }
        })

        const result = await client.chat.completions.create({
          model: selectedModel,
          messages: [...messages, userMessage]
        })

        response = result.choices[0].message.content!
      } else {
        throw new Error('Unsupported model')
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch (error) {
      console.error('Chat error:', error)
      alert('Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="chat-interface">
      <div className="model-selector">
        <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
          {allowedModels.map(model => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
      </div>

      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong>
            <p>{msg.content}</p>
          </div>
        ))}

        {isLoading && <div className="loading">AI is thinking...</div>}
      </div>

      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          disabled={isLoading}
        />
        <button onClick={sendMessage} disabled={isLoading}>
          Send
        </button>
      </div>
    </div>
  )
}
```

### Backend Implementation

```typescript
// examples/chat-app/server/src/index.ts
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { tokenhouse } from '@tokenhouse/elysia-plugin'

const app = new Elysia()
  .use(cors())
  .use(tokenhouse({
    clientId: process.env.TOKENHOUSE_CLIENT_ID!,
    clientSecret: process.env.TOKENHOUSE_CLIENT_SECRET!
  }))

  // OAuth callback
  .get('/api/auth/callback', async ({ query, tokenhouse }) => {
    const { code } = query

    const tokens = await tokenhouse.oauth.exchangeCode(
      code as string,
      'http://localhost:5173/callback'
    )

    return tokens
  })

  // Get user info
  .get('/api/user', ({ user }) => {
    return { user }
  }, { requireAuth: true })

  // Chat endpoint (server-side streaming)
  .post('/api/chat/stream', async ({ body, user, set }) => {
    if (!user) {
      set.status = 401
      return { error: 'Unauthorized' }
    }

    // Get AI credentials for this user
    const aiCreds = await tokenhouse.getAICredentials()

    // Stream response
    // Implementation depends on chosen AI SDK
  }, { requireAuth: true })

  .listen(3000)

console.log('Server running on http://localhost:3000')
```

---

## Part 6: OpenAI OAuth2 Integration

### User Flow: Link Personal OpenAI Account

```
User Settings → "Link your OpenAI account" → OAuth flow → TokenHouse uses user's key
```

### Implementation

```typescript
// Backend: Initiate OpenAI OAuth
app.get('/api/oauth/openai/link', ({ user, tokenhouse }) => {
  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Generate OpenAI OAuth URL
  const authUrl = tokenhouse.oauth.linkOpenAI()

  return { auth_url: authUrl }
}, { requireAuth: true })

// Backend: OpenAI OAuth callback
app.get('/api/oauth/openai/callback', async ({ query, tokenhouse }) => {
  const { code, state } = query

  // state contains the user's TokenHouse access token
  tokenhouse.setAccessToken(state as string)

  // Exchange code for OpenAI tokens
  const openaiTokens = await exchangeOpenAICode(code as string)

  // Store user's OpenAI tokens (encrypted)
  await db.aiCredentials.update({
    user_id: getUserIdFromToken(state as string),
    provider: 'openai'
  }, {
    api_key_encrypted: encrypt(openaiTokens.access_token),
    is_user_owned: true,  // Mark as user's own key
    openai_refresh_token: encrypt(openaiTokens.refresh_token)
  })

  return { success: true }
})

async function exchangeOpenAICode(code: string) {
  const response = await fetch('https://platform.openai.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      client_id: TOKENHOUSE_OPENAI_CLIENT_ID,
      client_secret: TOKENHOUSE_OPENAI_CLIENT_SECRET,
      redirect_uri: 'https://api.tokenhouse.ai/oauth/openai/callback'
    })
  })

  return response.json()
}
```

### Benefits

**For Users:**
- Use their own OpenAI credits
- Keep their existing OpenAI organization setup
- Bypass TokenHouse rate limits (use OpenAI's limits instead)

**For TokenHouse:**
- Reduce costs for power users
- Enable users who already have OpenAI subscriptions
- More flexible pricing options

### UI Component

```tsx
// Settings page
function AISettings() {
  const { aiCredentials, client } = useTokenHouse()
  const [isLinking, setIsLinking] = useState(false)

  async function linkOpenAI() {
    setIsLinking(true)

    const { auth_url } = await fetch('/api/oauth/openai/link', {
      headers: {
        'Authorization': `Bearer ${client.getAccessToken()}`
      }
    }).then(r => r.json())

    window.location.href = auth_url
  }

  return (
    <div>
      <h2>AI Provider Settings</h2>

      <div className="provider">
        <h3>OpenAI</h3>
        {aiCredentials?.openai?.is_user_owned ? (
          <div>
            <span>✓ Using your personal OpenAI account</span>
            <button>Unlink</button>
          </div>
        ) : (
          <div>
            <span>Using TokenHouse credits</span>
            <button onClick={linkOpenAI} disabled={isLinking}>
              Link your OpenAI account
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## Part 7: Getting Started Guide

### Quick Start

```bash
# Clone the monorepo
git clone https://github.com/tokenhouse/sdk.git
cd sdk

# Install dependencies
bun install

# Build all packages
bun run build

# Run chat app example
cd examples/chat-app
cp server/.env.example server/.env  # Add your credentials
bun run dev
```

### Create New App

```bash
# Use the starter template
bunx create-tokenhouse-app my-app

# Or manually
mkdir my-app && cd my-app
bun init
bun add @tokenhouse/core @tokenhouse/react
```

### Minimal Example

```tsx
// App.tsx
import { TokenHouseProvider, useTokenHouse } from '@tokenhouse/react'

function App() {
  return (
    <TokenHouseProvider
      clientId="your_client_id"
      redirectUri="http://localhost:3000/callback"
    >
      <Dashboard />
    </TokenHouseProvider>
  )
}

function Dashboard() {
  const { user, isAuthenticated, signIn } = useTokenHouse()

  if (!isAuthenticated) {
    return <button onClick={signIn}>Sign in with TokenHouse</button>
  }

  return <div>Welcome, {user?.name}!</div>
}
```

---

## Summary

### What Developers Get

✅ **Complete SDK Monorepo** - Clone and start building
✅ **TypeScript SDK** - Type-safe API client
✅ **React Hooks** - Easy frontend integration
✅ **Elysia Plugin** - Backend middleware
✅ **Working Examples** - Chat app, AI playground, etc.
✅ **OpenAI OAuth2** - Users can link their own accounts
✅ **Full Documentation** - API docs, guides, tutorials

### Example Applications Included

1. **Chat App** - Multi-model AI chat interface
2. **AI Playground** - Test different models and parameters
3. **Team Workspace** - Collaborative AI workspace with P2P payments
4. **Payment Demo** - Invoice generation and cost splitting

### Developer Experience

```bash
# Clone and run in 3 commands
git clone https://github.com/tokenhouse/sdk.git
cd sdk/examples/chat-app
bun run dev
```

**TokenHouse SDK = Everything developers need to build AI-powered apps** 🚀

---

**Created:** 2026-03-09
**Author:** Johnny Crupi
**Status:** SDK Monorepo Architecture Complete
