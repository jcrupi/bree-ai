# TokenHouse: OAuth Provider SDK & Auto-Refill System

**Type:** Integration Architecture
**Focus:** Third-Party App Integration + Venmo Auto-Refill
**Created:** 2026-03-09

---

## Overview

This document covers two key integrations:

1. **Auto-Refill from Venmo** (Like Starbucks App)
   - Link Venmo account to TokenHouse
   - Automatic refills when balance is low
   - One-tap payments from Venmo

2. **TokenHouse OAuth SDK** (Like Okta)
   - Third-party apps use TokenHouse for authentication
   - "Sign in with TokenHouse" button
   - Apps get AI credits included with user authentication
   - SSO for enterprises

---

## Part 1: Venmo Auto-Refill (Like Starbucks)

### How Starbucks + Venmo Works

```
Starbucks App → User links Venmo → Low balance triggers auto-refill
```

**TokenHouse Implementation:**

```
TokenHouse Account → Link Venmo → Auto-refill when balance < $10
```

### Step 1: Link Venmo to TokenHouse

**Dashboard UI:**
```
┌──────────────────────────────────────────────────────────────┐
│  Payment Methods                                              │
│                                                               │
│  Auto-Refill Settings                                         │
│                                                               │
│  ☑ Enable auto-refill when balance is low                   │
│                                                               │
│  Refill when balance drops below: [$10.00]                   │
│  Refill amount:                   [$100.00]                  │
│                                                               │
│  Payment Source:                                              │
│  ┌────────────────────────────────────────────────┐          │
│  │ ○ Credit Card (ending in 4242)                │          │
│  │ ● Venmo (@janedev) ✓ Linked                  │          │
│  │ ○ Zelle (jane@dev.com)                        │          │
│  └────────────────────────────────────────────────┘          │
│                                                               │
│  [Save Settings]                                             │
└──────────────────────────────────────────────────────────────┘
```

### Step 2: Venmo OAuth Integration

```typescript
// User clicks "Link Venmo"
// Redirects to Venmo OAuth
const venmoAuthUrl = `https://api.venmo.com/v1/oauth/authorize?` +
  `client_id=${TOKENHOUSE_VENMO_CLIENT_ID}&` +
  `scope=make_payments,access_profile&` +
  `response_type=code&` +
  `redirect_uri=https://tokenhouse.ai/auth/venmo/callback`

// User approves on Venmo
// Venmo redirects back with authorization code

// TokenHouse exchanges code for access token
const tokenResponse = await fetch('https://api.venmo.com/v1/oauth/access_token', {
  method: 'POST',
  body: JSON.stringify({
    client_id: TOKENHOUSE_VENMO_CLIENT_ID,
    client_secret: TOKENHOUSE_VENMO_CLIENT_SECRET,
    code: authorizationCode,
    redirect_uri: 'https://tokenhouse.ai/auth/venmo/callback'
  })
})

const { access_token, refresh_token, user } = await tokenResponse.json()

// Store encrypted tokens
await db.paymentAccounts.insert({
  user_id: currentUser.id,
  provider: 'venmo',
  provider_account_id: user.id,
  display_name: user.username,
  access_token_encrypted: encrypt(access_token),
  refresh_token_encrypted: encrypt(refresh_token),
  status: 'active',
  verification_status: 'verified'
})

// Update user auto-refill settings
await db.users.update(currentUser.id, {
  auto_recharge_enabled: true,
  auto_recharge_threshold: 10.00,  // $10
  auto_recharge_amount: 100.00,    // $100
  auto_recharge_source: 'venmo',
  auto_recharge_source_id: venmoAccount.id
})
```

### Step 3: Auto-Refill Trigger

```typescript
// This runs after every AI API call when balance is deducted
async function checkAutoRefill(userId: string) {
  const user = await db.users.findOne({ id: userId })

  if (!user.auto_recharge_enabled) return
  if (user.balance_usd >= user.auto_recharge_threshold) return

  // Balance is below threshold, trigger auto-refill
  console.log(`🔄 Auto-refill triggered for ${userId}: Balance $${user.balance_usd} < $${user.auto_recharge_threshold}`)

  // Get payment account
  const paymentAccount = await db.paymentAccounts.findOne({
    id: user.auto_recharge_source_id,
    status: 'active'
  })

  if (!paymentAccount) {
    await sendEmail(user.email, 'auto_refill_failed', {
      reason: 'Payment method not available'
    })
    return
  }

  // Initiate Venmo payment
  try {
    const venmoAccessToken = decrypt(paymentAccount.access_token_encrypted)

    // Charge Venmo account
    const payment = await fetch('https://api.venmo.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${venmoAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: TOKENHOUSE_VENMO_MERCHANT_ID,  // TokenHouse's merchant account
        amount: user.auto_recharge_amount,
        note: `TokenHouse auto-refill: $${user.auto_recharge_amount}`,
        audience: 'private'
      })
    })

    const paymentData = await payment.json()

    if (paymentData.error) {
      throw new Error(paymentData.error.message)
    }

    // Record transaction
    await db.paymentTransactions.insert({
      user_id: userId,
      payment_account_id: paymentAccount.id,
      type: 'deposit',
      status: 'completed',
      amount_usd: user.auto_recharge_amount,
      fee_usd: user.auto_recharge_amount * 0.024,  // 2.4% for Pro
      net_amount_usd: user.auto_recharge_amount * 0.976,
      external_transaction_id: paymentData.payment.id,
      completed_at: new Date()
    })

    // Credit user balance
    const netAmount = user.auto_recharge_amount * 0.976
    const tokensToAdd = Math.floor(netAmount * 10000)

    await db.users.update(userId, {
      $inc: {
        balance_usd: netAmount,
        balance_tokens: tokensToAdd
      }
    })

    // Send confirmation
    await sendEmail(user.email, 'auto_refill_success', {
      amount: user.auto_recharge_amount,
      new_balance: user.balance_usd + netAmount,
      source: 'Venmo'
    })

    console.log(`✓ Auto-refill completed: +$${netAmount} from Venmo`)

  } catch (error) {
    console.error('Auto-refill failed:', error)

    // Disable auto-refill temporarily
    await db.users.update(userId, {
      auto_recharge_enabled: false
    })

    await sendEmail(user.email, 'auto_refill_failed', {
      reason: error.message,
      action: 'Auto-refill has been disabled. Please update your payment method.'
    })
  }
}
```

### Step 4: Notification Flow

**SMS/Email Notification:**
```
TokenHouse Auto-Refill 🔄

Your balance dropped below $10.00.

We've automatically added $100.00 from your Venmo account (@janedev).

New balance: $107.32

View transaction: https://tokenhouse.ai/transactions/txn_abc123
```

**Push Notification (Mobile App):**
```
💰 Auto-Refill Complete
$100 added from Venmo
Balance: $107.32
```

### Step 5: Manual One-Tap Refill

**Dashboard Button:**
```
┌──────────────────────────────────────────────────────────────┐
│  Balance: $7.32                                               │
│                                                               │
│  [Refill from Venmo - $100]  ← One-tap button               │
│                                                               │
│  Or choose amount:                                            │
│  [ $25 ]  [ $50 ]  [ $100 ]  [ $200 ]  [Custom]             │
└──────────────────────────────────────────────────────────────┘
```

```typescript
// One-tap refill
async function oneClickRefill(userId: string) {
  const user = await db.users.findOne({ id: userId })
  const defaultAmount = user.auto_recharge_amount || 100.00

  // Same logic as auto-refill
  await processVenmoPayment(userId, defaultAmount)
}
```

---

## Part 2: TokenHouse OAuth Provider (Like Okta)

### Concept: "Sign in with TokenHouse"

Third-party apps can use TokenHouse as their authentication provider. Benefits:

1. **SSO** - Users sign in once, access all apps
2. **AI Credits Included** - Apps get AI API access automatically
3. **Payment Platform** - Apps can accept payments through TokenHouse
4. **Enterprise Ready** - SAML, SCIM provisioning

### OAuth Flow Diagram

```
┌─────────────────┐
│  Third-Party    │
│  App (SaaS)     │
└────────┬────────┘
         │
         │ 1. User clicks "Sign in with TokenHouse"
         ↓
┌─────────────────────────────────────────────────────────────┐
│  App redirects to TokenHouse:                                │
│  https://auth.tokenhouse.ai/oauth/authorize?                │
│    client_id=app_xyz123&                                     │
│    redirect_uri=https://myapp.com/callback&                 │
│    response_type=code&                                       │
│    scope=openid profile ai_credits payments                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│  TokenHouse Login Page                                       │
│                                                               │
│  [MyApp] wants to access your TokenHouse account            │
│                                                               │
│  This app will be able to:                                   │
│  ✓ View your profile (@janedev)                             │
│  ✓ Use your AI credits for API calls                        │
│  ✓ Process payments on your behalf                          │
│                                                               │
│  [Sign in with TokenHouse ID]                               │
│  [Cancel]                                                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ 2. User signs in and approves
                 ↓
┌─────────────────────────────────────────────────────────────┐
│  TokenHouse redirects back to app:                          │
│  https://myapp.com/callback?code=auth_code_abc123           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ 3. App exchanges code for token
                 ↓
┌─────────────────────────────────────────────────────────────┐
│  POST https://auth.tokenhouse.ai/oauth/token                │
│  {                                                            │
│    code: "auth_code_abc123",                                 │
│    client_id: "app_xyz123",                                  │
│    client_secret: "secret_789",                              │
│    grant_type: "authorization_code"                          │
│  }                                                            │
│                                                               │
│  Returns:                                                     │
│  {                                                            │
│    access_token: "eyJhbGc...",                               │
│    refresh_token: "refresh_xyz...",                          │
│    id_token: "eyJhbGc...",  // OpenID Connect                │
│    token_type: "Bearer",                                     │
│    expires_in: 3600                                          │
│  }                                                            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ 4. App uses access token
                 ↓
┌─────────────────────────────────────────────────────────────┐
│  GET https://api.tokenhouse.ai/oauth/userinfo               │
│  Authorization: Bearer eyJhbGc...                            │
│                                                               │
│  Returns:                                                     │
│  {                                                            │
│    sub: "th_user_abc123",                                    │
│    email: "jane@dev.com",                                    │
│    username: "@janedev",                                     │
│    name: "Jane Developer",                                   │
│    ai_enabled: true,                                         │
│    balance_usd: 107.32                                       │
│  }                                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 3: TokenHouse TypeScript SDK (Like Okta SDK)

### Installation

```bash
npm install @tokenhouse/sdk
```

### SDK Architecture

```typescript
// @tokenhouse/sdk/src/index.ts

export class TokenHouseSDK {
  private clientId: string
  private clientSecret: string
  private redirectUri: string
  private scopes: string[]

  constructor(config: TokenHouseConfig) {
    this.clientId = config.clientId
    this.clientSecret = config.clientSecret
    this.redirectUri = config.redirectUri
    this.scopes = config.scopes || ['openid', 'profile']
  }

  // Generate authorization URL
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scopes.join(' '),
      ...(state && { state })
    })

    return `https://auth.tokenhouse.ai/oauth/authorize?${params}`
  }

  // Exchange code for tokens
  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    const response = await fetch('https://auth.tokenhouse.ai/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri
      })
    })

    if (!response.ok) {
      throw new Error('Token exchange failed')
    }

    return response.json()
  }

  // Get user info
  async getUserInfo(accessToken: string): Promise<UserInfo> {
    const response = await fetch('https://api.tokenhouse.ai/oauth/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    return response.json()
  }

  // Get AI credentials (if ai_credits scope granted)
  async getAICredentials(accessToken: string): Promise<AICredentials> {
    const response = await fetch('https://api.tokenhouse.ai/oauth/ai-credentials', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    return response.json()
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const response = await fetch('https://auth.tokenhouse.ai/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    })

    return response.json()
  }

  // Revoke token
  async revokeToken(token: string): Promise<void> {
    await fetch('https://auth.tokenhouse.ai/oauth/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
      },
      body: JSON.stringify({ token })
    })
  }
}

// Types
export interface TokenHouseConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes?: string[]
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  id_token?: string
  token_type: string
  expires_in: number
}

export interface UserInfo {
  sub: string
  email: string
  username: string
  name: string
  picture?: string
  ai_enabled: boolean
  balance_usd: number
  balance_tokens: number
}

export interface AICredentials {
  openai?: {
    api_key: string
    org_id: string
    project_id: string
  }
  anthropic?: {
    api_key: string
    workspace_id: string
  }
  google?: {
    api_key: string
    project_id: string
  }
  allowed_models: string[]
  rate_limits: Record<string, any>
}
```

---

## Part 4: Example Integration (Next.js App)

### Setup

```bash
npm install @tokenhouse/sdk
```

### Environment Variables

```bash
# .env.local
TOKENHOUSE_CLIENT_ID=app_xyz123
TOKENHOUSE_CLIENT_SECRET=secret_789
TOKENHOUSE_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

### API Route: Login

```typescript
// pages/api/auth/login.ts
import { TokenHouseSDK } from '@tokenhouse/sdk'
import { NextApiRequest, NextApiResponse } from 'next'

const sdk = new TokenHouseSDK({
  clientId: process.env.TOKENHOUSE_CLIENT_ID!,
  clientSecret: process.env.TOKENHOUSE_CLIENT_SECRET!,
  redirectUri: process.env.TOKENHOUSE_REDIRECT_URI!,
  scopes: ['openid', 'profile', 'ai_credits', 'payments']
})

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const state = Math.random().toString(36).substring(7)

  // Store state in session for validation
  req.session.oauthState = state

  const authUrl = sdk.getAuthorizationUrl(state)
  res.redirect(authUrl)
}
```

### API Route: Callback

```typescript
// pages/api/auth/callback.ts
import { TokenHouseSDK } from '@tokenhouse/sdk'
import { NextApiRequest, NextApiResponse } from 'next'

const sdk = new TokenHouseSDK({
  clientId: process.env.TOKENHOUSE_CLIENT_ID!,
  clientSecret: process.env.TOKENHOUSE_CLIENT_SECRET!,
  redirectUri: process.env.TOKENHOUSE_REDIRECT_URI!
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, state } = req.query

  // Validate state
  if (state !== req.session.oauthState) {
    return res.status(400).json({ error: 'Invalid state' })
  }

  try {
    // Exchange code for token
    const tokens = await sdk.exchangeCodeForToken(code as string)

    // Get user info
    const userInfo = await sdk.getUserInfo(tokens.access_token)

    // Get AI credentials (if scope granted)
    const aiCredentials = await sdk.getAICredentials(tokens.access_token)

    // Store in session
    req.session.user = userInfo
    req.session.tokens = tokens
    req.session.aiCredentials = aiCredentials

    res.redirect('/dashboard')
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' })
  }
}
```

### Protected Page

```typescript
// pages/dashboard.tsx
import { GetServerSideProps } from 'next'
import { TokenHouseSDK } from '@tokenhouse/sdk'

export default function Dashboard({ user, aiCredentials }) {
  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <p>Username: {user.username}</p>
      <p>Balance: ${user.balance_usd}</p>

      <h2>Available AI Models:</h2>
      <ul>
        {aiCredentials.allowed_models.map(model => (
          <li key={model}>{model}</li>
        ))}
      </ul>

      <button onClick={callClaude}>Ask Claude a Question</button>
    </div>
  )

  async function callClaude() {
    // Use AI credentials from TokenHouse
    const anthropic = new Anthropic({
      apiKey: aiCredentials.anthropic.api_key
    })

    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      messages: [{ role: 'user', content: 'Hello!' }]
    })

    alert(response.content[0].text)
  }
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const user = req.session.user
  const aiCredentials = req.session.aiCredentials

  if (!user) {
    return { redirect: { destination: '/api/auth/login', permanent: false } }
  }

  return {
    props: {
      user,
      aiCredentials
    }
  }
}
```

---

## Part 5: React Component Library

### Installation

```bash
npm install @tokenhouse/react
```

### Components

```typescript
// @tokenhouse/react

export { TokenHouseProvider } from './TokenHouseProvider'
export { useTokenHouse } from './useTokenHouse'
export { SignInButton } from './SignInButton'
export { UserProfile } from './UserProfile'
export { BalanceDisplay } from './BalanceDisplay'
export { AICredentialsProvider } from './AICredentialsProvider'
```

### Usage Example

```tsx
// app.tsx
import { TokenHouseProvider, SignInButton, useTokenHouse } from '@tokenhouse/react'

function App() {
  return (
    <TokenHouseProvider
      clientId="app_xyz123"
      redirectUri="http://localhost:3000/callback"
      scopes={['openid', 'profile', 'ai_credits']}
    >
      <HomePage />
    </TokenHouseProvider>
  )
}

function HomePage() {
  const { user, isAuthenticated, signIn, signOut } = useTokenHouse()

  if (!isAuthenticated) {
    return <SignInButton />
  }

  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <p>Balance: ${user.balance_usd}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### Sign In Button Component

```tsx
// @tokenhouse/react/src/SignInButton.tsx
import React from 'react'
import { useTokenHouse } from './useTokenHouse'

export function SignInButton() {
  const { signIn } = useTokenHouse()

  return (
    <button
      onClick={signIn}
      style={{
        background: '#6366f1',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        border: 'none',
        fontSize: '16px',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
        {/* TokenHouse logo */}
      </svg>
      Sign in with TokenHouse
    </button>
  )
}
```

---

## Part 6: Enterprise Features

### SAML SSO

```typescript
// Enterprise customers can use SAML for SSO
// TokenHouse acts as Identity Provider (IdP)

interface SAMLConfig {
  entityId: string
  ssoUrl: string
  certificate: string
  nameIdFormat: string
}

// Configure SAML for enterprise org
const samlConfig = {
  entityId: 'https://tokenhouse.ai/saml/metadata',
  ssoUrl: 'https://tokenhouse.ai/saml/sso',
  certificate: '-----BEGIN CERTIFICATE-----...',
  nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'
}
```

### SCIM Provisioning

```typescript
// Automatic user provisioning for enterprises
// Supports Azure AD, Okta, OneLogin

interface SCIMUser {
  id: string
  userName: string
  name: {
    givenName: string
    familyName: string
  }
  emails: Array<{ value: string; primary: boolean }>
  active: boolean
}

// SCIM endpoints
POST /scim/v2/Users       // Create user
GET /scim/v2/Users/:id    // Get user
PATCH /scim/v2/Users/:id  // Update user
DELETE /scim/v2/Users/:id // Deactivate user
```

---

## Summary

### Auto-Refill System (Like Starbucks)

✅ Link Venmo account to TokenHouse
✅ Automatic refills when balance < threshold
✅ One-tap manual refills
✅ SMS/Email notifications
✅ Fallback to other payment methods

### OAuth Provider (Like Okta)

✅ Third-party apps use "Sign in with TokenHouse"
✅ TypeScript SDK (@tokenhouse/sdk)
✅ React component library (@tokenhouse/react)
✅ AI credentials included in auth flow
✅ Payment processing built-in
✅ Enterprise SSO (SAML, SCIM)

### Key Advantages

**For Users:**
- One account for all apps
- AI credits work everywhere
- Seamless payment experience

**For Developers:**
- Easy integration (like Okta)
- AI access included
- Payment processing built-in

**For Enterprises:**
- SSO with existing identity providers
- Centralized billing
- Usage tracking across apps

**TokenHouse = Okta + Stripe + OpenAI in one platform** 🚀

---

**Created:** 2026-03-09
**Author:** Johnny Crupi
**Status:** Integration Architecture Complete
