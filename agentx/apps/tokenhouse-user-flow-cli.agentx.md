# TokenHouse: User Flow & CLI Integration

**Type:** User Journey Documentation
**Focus:** Account Creation → LLM Selection → CLI Authentication → Chat Usage
**Created:** 2026-03-09

---

## High-Level Overview

### The Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                    1. SIGN UP (Web/CLI)                          │
│  User creates account → Gets TokenHouse ID + Secret              │
│  Email: jane@dev.com → th_user_abc123 + ths_secret_xyz789      │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│              2. SELECT LLMs (Web Dashboard)                      │
│  Choose providers: ☑ OpenAI  ☑ Claude  ☐ Gemini                │
│  TokenHouse provisions scoped credentials behind the scenes      │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│              3. ADD FUNDS (Web Dashboard)                        │
│  Link Venmo/Zelle → Deposit $100 → Auto-convert to tokens      │
│  Balance: $100 USD = 1,000,000 TH tokens                        │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│              4. INSTALL CLI (Terminal)                           │
│  $ npm install -g tokenhouse-cli                                │
│  $ tokenhouse --version                                          │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│              5. LOGIN VIA CLI                                    │
│  $ tokenhouse login                                              │
│  Enter TokenHouse ID: th_user_abc123                            │
│  Enter Secret: ths_secret_xyz789                                │
│  ✓ Authenticated! JWT saved to ~/.tokenhouse/config.json       │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│              6. VIEW CLAIMS (CLI)                                │
│  $ tokenhouse whoami --show-claims                              │
│  Shows: Balance, allowed models, AI credentials, rate limits    │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│              7. CHAT WITH AI (CLI)                               │
│  $ tokenhouse chat                                               │
│  > Hello, explain quantum computing                              │
│  [Claude] Quantum computing uses quantum mechanics...            │
│  Balance: $99.98 remaining                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 1: Account Creation & Setup

### Step 1.1: Sign Up (Web Interface)

**URL:** `https://tokenhouse.ai/signup`

```typescript
// User fills registration form
interface SignUpForm {
  email: string              // "jane@dev.com"
  password: string           // Minimum 12 characters
  name: string               // "Jane Developer"
  username: string           // "janedev" (for @janedev P2P payments)
  acceptTerms: boolean       // Must agree to ToS
}

// Frontend POST request
const response = await fetch('https://api.tokenhouse.ai/auth/sign-up', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'jane@dev.com',
    password: 'SecurePassword123!',
    name: 'Jane Developer',
    username: 'janedev'
  })
})

// API Response
{
  "success": true,
  "user": {
    "id": "user_internal_uuid",
    "tokenhouse_id": "th_user_abc123",              // PUBLIC ID (for API)
    "tokenhouse_secret": "ths_secret_xyz789def456", // SECRET KEY (show once!)
    "email": "jane@dev.com",
    "username": "@janedev",
    "name": "Jane Developer",
    "created_at": "2026-03-09T10:00:00Z"
  },
  "session_token": "sess_web_token_123",
  "important_message": "⚠️ SAVE YOUR SECRET KEY - It will not be shown again!"
}
```

**Web UI Shows:**
```
┌──────────────────────────────────────────────────────────────┐
│  ✓ Account Created Successfully!                             │
│                                                               │
│  Your TokenHouse Credentials:                                │
│                                                               │
│  TokenHouse ID: th_user_abc123                               │
│  Secret Key:    ths_secret_xyz789def456                      │
│                                                               │
│  ⚠️ IMPORTANT: Save these credentials now!                   │
│  You'll need them for CLI and API access.                    │
│  The secret key will NOT be shown again.                     │
│                                                               │
│  [Copy to Clipboard]  [Download as Text]  [I've Saved It]   │
└──────────────────────────────────────────────────────────────┘
```

### Step 1.2: Email Verification

```typescript
// Backend sends verification email
await sendEmail({
  to: 'jane@dev.com',
  subject: 'Verify your TokenHouse account',
  body: `
    Welcome to TokenHouse!

    Click here to verify your email:
    https://tokenhouse.ai/verify?token=verify_abc123xyz

    Your TokenHouse ID: th_user_abc123

    Need help? Reply to this email or visit docs.tokenhouse.ai
  `
})

// User clicks link → Account verified
// Status: unverified → verified
```

### Step 1.3: Initial Dashboard Welcome

User is redirected to dashboard after signup:

```
https://tokenhouse.ai/dashboard?welcome=true
```

**Dashboard Shows:**
```
┌──────────────────────────────────────────────────────────────┐
│  Welcome to TokenHouse, Jane! 👋                             │
│                                                               │
│  Let's get you started:                                       │
│                                                               │
│  ☐ Step 1: Select your AI providers                         │
│  ☐ Step 2: Add funds to your account                        │
│  ☐ Step 3: Install TokenHouse CLI                           │
│  ☐ Step 4: Start building with AI                           │
│                                                               │
│  Current Balance: $0.00                                       │
│  Available Models: None (select providers first)             │
│                                                               │
│  [Get Started →]                                             │
└──────────────────────────────────────────────────────────────┘
```

---

## Part 2: LLM Provider Selection

### Step 2.1: Provider Selection Interface

**URL:** `https://tokenhouse.ai/dashboard/providers`

```typescript
interface ProviderSelectionUI {
  providers: Array<{
    id: 'openai' | 'anthropic' | 'google'
    name: string
    logo: string
    enabled: boolean
    models: Array<{
      id: string
      name: string
      pricing: { input: number; output: number }
    }>
  }>
}

// UI State
const [selectedProviders, setSelectedProviders] = useState({
  openai: true,     // User wants OpenAI
  anthropic: true,  // User wants Claude
  google: false     // User doesn't want Gemini (yet)
})
```

**UI Display:**
```
┌──────────────────────────────────────────────────────────────┐
│  Select Your AI Providers                                     │
│                                                               │
│  Choose which AI providers you want to use:                  │
│                                                               │
│  ┌────────────────────────────────────────────────┐          │
│  │ ☑ OpenAI                                       │          │
│  │   • GPT-4o         ($3.00 / $12.00 per 1M)   │          │
│  │   • GPT-4o-mini    ($0.15 / $0.60 per 1M)    │          │
│  │   ✓ Currently enabled                         │          │
│  └────────────────────────────────────────────────┘          │
│                                                               │
│  ┌────────────────────────────────────────────────┐          │
│  │ ☑ Anthropic (Claude)                          │          │
│  │   • Claude 3.5 Sonnet  ($3.00 / $15.00)      │          │
│  │   • Claude 3.5 Haiku   ($0.80 / $4.00)       │          │
│  │   ✓ Currently enabled                         │          │
│  └────────────────────────────────────────────────┘          │
│                                                               │
│  ┌────────────────────────────────────────────────┐          │
│  │ ☐ Google (Gemini)                             │          │
│  │   • Gemini 1.5 Pro    ($1.25 / $5.00)        │          │
│  │   • Gemini 1.5 Flash  ($0.10 / $0.40)        │          │
│  │   ○ Not enabled                                │          │
│  └────────────────────────────────────────────────┘          │
│                                                               │
│  [Save Selection]  [Cancel]                                  │
└──────────────────────────────────────────────────────────────┘
```

### Step 2.2: Backend Provisioning

When user saves selection, backend provisions credentials:

```typescript
// Frontend sends selection
const response = await fetch('https://api.tokenhouse.ai/providers/configure', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${sessionToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    providers: ['openai', 'anthropic']
  })
})

// Backend processing
async function provisionProviderAccess(userId: string, providers: string[]) {
  for (const provider of providers) {
    // 1. Get TokenHouse's master account for this provider
    const masterAccount = await db.providerAccounts.findOne({
      provider,
      status: 'active'
    })

    // 2. Create scoped credentials for this user
    // (These are sub-accounts or virtual keys that map to master)
    const scopedCredentials = await createScopedCredentials({
      provider,
      masterApiKey: masterAccount.master_api_key,
      userId,
      scopes: ['chat', 'embeddings'],  // What they can access
      rateLimits: getUserRateLimits(userId)
    })

    // 3. Store encrypted credentials
    await db.aiCredentials.insert({
      user_id: userId,
      provider,
      api_key_encrypted: encrypt(scopedCredentials.apiKey),
      org_id: scopedCredentials.orgId,
      project_id: scopedCredentials.projectId,
      allowed_models: getModelsForProvider(provider),
      status: 'active',
      created_at: new Date()
    })
  }

  // 4. Update user's allowed models
  const allModels = providers.flatMap(p => getModelsForProvider(p))
  await db.users.update(userId, {
    allowed_models: allModels
  })

  return {
    success: true,
    providers_enabled: providers,
    models_available: allModels
  }
}

// Helper: Create scoped credentials
async function createScopedCredentials(params) {
  const { provider, masterApiKey, userId, scopes, rateLimits } = params

  if (provider === 'openai') {
    // Option A: OpenAI Projects feature (if available)
    const project = await openai.projects.create({
      name: `TokenHouse User ${userId}`,
      organization_id: TOKENHOUSE_OPENAI_ORG_ID
    })

    const projectKey = await openai.projects.apiKeys.create(project.id, {
      name: `user_${userId}`,
      scopes: scopes,
      rate_limits: rateLimits
    })

    return {
      apiKey: projectKey.key,
      orgId: TOKENHOUSE_OPENAI_ORG_ID,
      projectId: project.id
    }

    // Option B: Virtual key mapping (if provider doesn't support scoping)
    // Create virtual key that maps to master key internally
    const virtualKey = `sk-th-${provider}-${userId}-${nanoid()}`

    await db.virtualKeys.insert({
      virtual_key: virtualKey,
      user_id: userId,
      provider,
      real_api_key: masterApiKey,  // Maps to master
      scopes,
      rate_limits: rateLimits
    })

    return {
      apiKey: virtualKey,  // User gets this
      orgId: null,
      projectId: null
    }
  }

  if (provider === 'anthropic') {
    // Similar logic for Anthropic
    // Check if they have workspace/sub-account features
    // Otherwise use virtual key mapping
  }
}

// API Response
{
  "success": true,
  "providers_enabled": ["openai", "anthropic"],
  "models_available": [
    "gpt-4o",
    "gpt-4o-mini",
    "claude-3-5-sonnet-20241022",
    "claude-3-5-haiku-20241022"
  ],
  "message": "Providers configured successfully. Your credentials are ready!"
}
```

**UI Success Message:**
```
┌──────────────────────────────────────────────────────────────┐
│  ✓ Providers Configured Successfully!                        │
│                                                               │
│  You now have access to:                                      │
│  • OpenAI (GPT-4o, GPT-4o-mini)                              │
│  • Anthropic (Claude 3.5 Sonnet, Claude 3.5 Haiku)          │
│                                                               │
│  Your AI credentials have been provisioned securely.         │
│  They'll be included in your JWT when you authenticate.      │
│                                                               │
│  Next: Add funds to start using AI →                         │
└──────────────────────────────────────────────────────────────┘
```

---

## Part 3: Add Funds

### Step 3.1: Link Payment Method

**URL:** `https://tokenhouse.ai/dashboard/wallet`

```typescript
// User links Venmo
const response = await fetch('https://api.tokenhouse.ai/payments/link-venmo', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${sessionToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    venmo_user_id: 'venmo_jane',
    access_token: 'venmo_oauth_token_xxx'  // From Venmo OAuth flow
  })
})
```

### Step 3.2: Deposit Funds

```typescript
// User deposits $100 from Venmo
const deposit = await fetch('https://api.tokenhouse.ai/payments/deposit', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${sessionToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount_usd: 100.00,
    source: 'venmo',
    source_id: 'venmo_jane'
  })
})

// Response
{
  "transaction_id": "txn_deposit_abc123",
  "amount_usd": 100.00,
  "fee_usd": 2.40,              // 2.4% for Pro plan
  "net_amount": 97.60,
  "tokens_credited": 976000,    // Auto-converted ($97.60 × 10,000)
  "status": "completed",
  "balance_usd": 97.60,
  "balance_tokens": 976000
}
```

**Dashboard Updates:**
```
┌──────────────────────────────────────────────────────────────┐
│  Wallet                                                       │
│                                                               │
│  Balance: $97.60 USD  (976,000 tokens)                       │
│                                                               │
│  Recent Transactions:                                         │
│  • Deposit from Venmo    +$100.00  (fee: -$2.40)            │
│                                                               │
│  [Add Funds]  [Withdraw]  [Transaction History]             │
└──────────────────────────────────────────────────────────────┘
```

---

## Part 4: CLI Installation & Setup

### Step 4.1: Install CLI

```bash
# Via npm (Node.js)
npm install -g tokenhouse-cli

# Via Homebrew (macOS)
brew install tokenhouse-cli

# Via script (Linux/macOS)
curl -fsSL https://get.tokenhouse.ai | sh

# Verify installation
tokenhouse --version
# → TokenHouse CLI v1.0.0
```

### Step 4.2: CLI Login Flow

```bash
$ tokenhouse login
```

**CLI Prompt Flow:**
```
┌──────────────────────────────────────────────────────────────┐
│  TokenHouse CLI Login                                         │
│                                                               │
│  Enter your TokenHouse credentials:                          │
│                                                               │
│  TokenHouse ID: th_user_abc123                               │
│  Secret:        ******************** (hidden)                │
│                                                               │
│  Authenticating...                                           │
└──────────────────────────────────────────────────────────────┘
```

**Behind the Scenes:**

```typescript
// CLI code (tokenhouse-cli/src/auth/login.ts)
import { input, password } from '@inquirer/prompts'
import { writeFile } from 'fs/promises'
import { homedir } from 'os'
import { join } from 'path'

async function login() {
  // 1. Prompt for credentials
  const tokenhouseId = await input({
    message: 'TokenHouse ID:',
    validate: (value) => value.startsWith('th_user_') || 'Invalid TokenHouse ID'
  })

  const tokenhouseSecret = await password({
    message: 'Secret:',
    mask: '*'
  })

  // 2. Authenticate with TokenHouse API
  console.log('\nAuthenticating...')

  const response = await fetch('https://api.tokenhouse.ai/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tokenhouse_id: tokenhouseId,
      tokenhouse_secret: tokenhouseSecret
    })
  })

  if (!response.ok) {
    console.error('✗ Authentication failed. Check your credentials.')
    process.exit(1)
  }

  const data = await response.json()

  // 3. Save JWT and config to ~/.tokenhouse/config.json
  const configDir = join(homedir(), '.tokenhouse')
  const configPath = join(configDir, 'config.json')

  await mkdir(configDir, { recursive: true })
  await writeFile(configPath, JSON.stringify({
    tokenhouse_id: tokenhouseId,
    access_token: data.access_token,
    token_type: data.token_type,
    expires_at: Date.now() + (data.expires_in * 1000),
    balance_usd: data.balance_usd,
    balance_tokens: data.balance_tokens
  }, null, 2), { mode: 0o600 })  // Read/write for user only

  console.log('✓ Authenticated successfully!')
  console.log(`\nBalance: $${data.balance_usd} (${data.balance_tokens.toLocaleString()} tokens)`)
  console.log(`Config saved to: ${configPath}`)
}
```

**Config File Created:**
```json
// ~/.tokenhouse/config.json
{
  "tokenhouse_id": "th_user_abc123",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_at": 1741532400000,
  "balance_usd": 97.60,
  "balance_tokens": 976000
}
```

**CLI Output:**
```
✓ Authenticated successfully!

Balance: $97.60 (976,000 tokens)
Config saved to: /Users/jane/.tokenhouse/config.json

You're ready to use TokenHouse CLI!
Try: tokenhouse chat
```

---

## Part 5: View Authentication Claims

### Command: `tokenhouse whoami`

```bash
$ tokenhouse whoami
```

**Output:**
```
┌──────────────────────────────────────────────────────────────┐
│  TokenHouse Account Info                                      │
│                                                               │
│  TokenHouse ID:  th_user_abc123                              │
│  Username:       @janedev                                     │
│  Email:          jane@dev.com                                 │
│  Name:           Jane Developer                               │
│  Plan:           Pro                                          │
│                                                               │
│  Balance:        $97.60 (976,000 tokens)                     │
│  Reserved:       $0.00                                        │
│                                                               │
│  Enabled Providers:                                           │
│  • OpenAI       (2 models available)                         │
│  • Anthropic    (2 models available)                         │
│                                                               │
│  Payment Methods:                                             │
│  • Venmo        (@janedev)                                   │
└──────────────────────────────────────────────────────────────┘
```

### Command: `tokenhouse whoami --show-claims`

```bash
$ tokenhouse whoami --show-claims
```

**Output (Full JWT Claims):**
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "iss": "https://tokenhouse.ai",
    "sub": "th_user_abc123",
    "aud": "tokenhouse-api",
    "exp": 1741532400,
    "iat": 1741528800,
    "jti": "jwt_xyz789",

    "tokenhouse_id": "th_user_abc123",
    "email": "jane@dev.com",
    "name": "Jane Developer",
    "username": "@janedev",

    "balance_usd": 97.60,
    "balance_tokens": 976000,
    "balance_reserved": 0,

    "ai_credentials": {
      "openai": {
        "api_key": "sk-proj-tokenhouse-scoped-abc123xyz",
        "org_id": "org-tokenhouse-jane",
        "project_id": "proj_abc123"
      },
      "anthropic": {
        "api_key": "sk-ant-tokenhouse-scoped-def456uvw",
        "workspace_id": "ws-tokenhouse-jane"
      }
    },

    "plan_tier": "pro",
    "allowed_models": [
      "gpt-4o",
      "gpt-4o-mini",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022"
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
      "streaming",
      "batch",
      "direct_credentials"
    ],

    "can_receive_payments": true,
    "can_send_payments": true,
    "daily_send_limit": 10000.00,
    "daily_receive_limit": 25000.00
  }
}
```

### Command: `tokenhouse whoami --json`

```bash
$ tokenhouse whoami --json
```

**Output (JSON format for scripting):**
```json
{
  "tokenhouse_id": "th_user_abc123",
  "username": "@janedev",
  "email": "jane@dev.com",
  "balance_usd": 97.60,
  "balance_tokens": 976000,
  "plan_tier": "pro",
  "providers": ["openai", "anthropic"],
  "allowed_models": ["gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022"]
}
```

---

## Part 6: CLI Chat

### Command: `tokenhouse chat`

```bash
$ tokenhouse chat
```

**Interactive Chat Session:**
```
┌──────────────────────────────────────────────────────────────┐
│  TokenHouse Chat                                              │
│                                                               │
│  Model: claude-3-5-haiku-20241022                            │
│  Balance: $97.60 (976,000 tokens)                            │
│                                                               │
│  Type your message (or /help for commands)                   │
└──────────────────────────────────────────────────────────────┘

You: Hello! Explain quantum computing in simple terms.

[Thinking...]

Claude: Quantum computing is a revolutionary approach to computation that
leverages the principles of quantum mechanics. Unlike classical computers
that use bits (0s and 1s), quantum computers use quantum bits or "qubits"
that can exist in multiple states simultaneously through superposition.

Key concepts:
1. Superposition: Qubits can be both 0 and 1 at the same time
2. Entanglement: Qubits can be correlated in ways impossible classically
3. Interference: Quantum algorithms use interference to amplify correct answers

This allows quantum computers to solve certain problems exponentially faster
than classical computers, particularly in cryptography, optimization, and
simulation of quantum systems.

────────────────────────────────────────────────────────────────
Tokens: 142 (12 input + 130 output) | Cost: $0.53 | Balance: $97.07

You:
```

### Behind the Scenes (CLI Implementation)

```typescript
// tokenhouse-cli/src/commands/chat.ts
import { createInterface } from 'readline'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

async function chat(options: { model?: string }) {
  // 1. Load config and JWT
  const config = await loadConfig()
  const jwt = decodeJWT(config.access_token)

  // 2. Select model (default or user-specified)
  const model = options.model || 'claude-3-5-haiku-20241022'

  // 3. Get AI credentials from JWT claims
  const provider = getProviderForModel(model)
  const credentials = jwt.ai_credentials[provider]

  // 4. Initialize AI client with scoped credentials
  let aiClient
  if (provider === 'anthropic') {
    aiClient = new Anthropic({
      apiKey: credentials.api_key,
      // Optional: Add TokenHouse tracking header
      defaultHeaders: {
        'X-TokenHouse-Session': config.access_token
      }
    })
  } else if (provider === 'openai') {
    aiClient = new OpenAI({
      apiKey: credentials.api_key,
      organization: credentials.org_id,
      project: credentials.project_id,
      defaultHeaders: {
        'X-TokenHouse-Session': config.access_token
      }
    })
  }

  // 5. Display chat header
  console.log('┌' + '─'.repeat(62) + '┐')
  console.log('│  TokenHouse Chat' + ' '.repeat(46) + '│')
  console.log('│' + ' '.repeat(62) + '│')
  console.log(`│  Model: ${model}` + ' '.repeat(62 - 10 - model.length) + '│')
  console.log(`│  Balance: $${jwt.balance_usd} (${jwt.balance_tokens.toLocaleString()} tokens)` + ' '.repeat(20) + '│')
  console.log('└' + '─'.repeat(62) + '┘')

  // 6. Start interactive loop
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '\nYou: '
  })

  const conversationHistory = []

  rl.prompt()

  rl.on('line', async (input) => {
    const userMessage = input.trim()

    if (!userMessage) {
      rl.prompt()
      return
    }

    // Handle special commands
    if (userMessage.startsWith('/')) {
      await handleCommand(userMessage, rl, config)
      return
    }

    // Add user message to history
    conversationHistory.push({
      role: 'user',
      content: userMessage
    })

    // Show thinking indicator
    process.stdout.write('\n[Thinking...]\n\n')

    try {
      // Call AI API directly with scoped credentials
      let response
      if (provider === 'anthropic') {
        response = await aiClient.messages.create({
          model,
          max_tokens: 1024,
          messages: conversationHistory
        })

        const assistantMessage = response.content[0].text
        conversationHistory.push({
          role: 'assistant',
          content: assistantMessage
        })

        // Display response
        console.log(`Claude: ${assistantMessage}\n`)

        // Show usage info
        const usage = response.usage
        const cost = calculateCost(model, usage)

        console.log('─'.repeat(60))
        console.log(
          `Tokens: ${usage.input_tokens + usage.output_tokens} ` +
          `(${usage.input_tokens} input + ${usage.output_tokens} output) | ` +
          `Cost: $${cost.toFixed(2)} | ` +
          `Balance: $${(jwt.balance_usd - cost).toFixed(2)}`
        )

        // Update local balance (will refresh on next JWT request)
        jwt.balance_usd -= cost

      } else if (provider === 'openai') {
        // Similar for OpenAI...
      }

    } catch (error) {
      console.error(`\n✗ Error: ${error.message}`)
    }

    rl.prompt()
  })

  rl.on('close', () => {
    console.log('\nGoodbye! 👋')
    process.exit(0)
  })
}

// Helper: Calculate cost based on model pricing
function calculateCost(model: string, usage: any): number {
  const pricing = {
    'claude-3-5-haiku-20241022': { input: 0.80, output: 4.00 },
    'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 }
  }

  const rates = pricing[model]
  const inputCost = (usage.input_tokens / 1_000_000) * rates.input
  const outputCost = (usage.output_tokens / 1_000_000) * rates.output

  return inputCost + outputCost
}

// Helper: Handle special commands
async function handleCommand(cmd: string, rl: any, config: any) {
  const [command, ...args] = cmd.slice(1).split(' ')

  switch (command) {
    case 'help':
      console.log(`
Available commands:
  /help         - Show this help message
  /models       - List available models
  /model <name> - Switch to different model
  /balance      - Check current balance
  /history      - Show conversation history
  /clear        - Clear conversation history
  /exit         - Exit chat
      `)
      break

    case 'models':
      const jwt = decodeJWT(config.access_token)
      console.log('\nAvailable models:')
      jwt.allowed_models.forEach((model: string) => {
        console.log(`  • ${model}`)
      })
      break

    case 'balance':
      const balanceJWT = decodeJWT(config.access_token)
      console.log(`\nBalance: $${balanceJWT.balance_usd} (${balanceJWT.balance_tokens.toLocaleString()} tokens)`)
      break

    case 'exit':
      rl.close()
      return

    default:
      console.log(`Unknown command: ${command}. Type /help for available commands.`)
  }

  rl.prompt()
}
```

### Chat with Specific Model

```bash
$ tokenhouse chat --model gpt-4o
```

**Output:**
```
┌──────────────────────────────────────────────────────────────┐
│  TokenHouse Chat                                              │
│                                                               │
│  Model: gpt-4o                                                │
│  Balance: $97.07 (970,700 tokens)                            │
│                                                               │
│  Type your message (or /help for commands)                   │
└──────────────────────────────────────────────────────────────┘

You: What's the capital of France?

GPT-4o: The capital of France is Paris. It's the country's largest city
and has been the capital since the 12th century. Paris is known for
landmarks like the Eiffel Tower, Louvre Museum, and Notre-Dame Cathedral.

────────────────────────────────────────────────────────────────
Tokens: 58 (8 input + 50 output) | Cost: $0.52 | Balance: $96.55

You:
```

---

## Part 7: Advanced CLI Features

### List Available Models

```bash
$ tokenhouse models
```

**Output:**
```
Available Models:

OpenAI:
  • gpt-4o              $2.50 / $10.00 per 1M tokens
  • gpt-4o-mini         $0.15 / $0.60 per 1M tokens

Anthropic:
  • claude-3-5-sonnet   $3.00 / $15.00 per 1M tokens
  • claude-3-5-haiku    $0.80 / $4.00 per 1M tokens

Total: 4 models available
```

### Check Balance

```bash
$ tokenhouse balance
```

**Output:**
```
TokenHouse Balance:

USD Balance:      $96.55
Token Balance:    965,500 tokens
Reserved:         $0.00

This month:
  Spent:          $1.05
  Transactions:   3 AI requests

[View Details →]
```

### Usage History

```bash
$ tokenhouse usage --limit 10
```

**Output:**
```
Recent Usage:

┌────────────────────┬────────────┬────────┬────────┬────────┐
│ Timestamp          │ Model      │ Tokens │ Cost   │ Type   │
├────────────────────┼────────────┼────────┼────────┼────────┤
│ 2026-03-09 10:45   │ gpt-4o     │ 58     │ $0.52  │ Chat   │
│ 2026-03-09 10:40   │ claude-h   │ 142    │ $0.53  │ Chat   │
│ 2026-03-09 09:30   │ claude-s   │ 2,450  │ $8.50  │ API    │
└────────────────────┴────────────┴────────┴────────┴────────┘

Total spent today: $9.55
```

### One-Shot Completion

```bash
$ tokenhouse complete "Explain REST APIs in one sentence"
```

**Output:**
```
[claude-3-5-haiku]
REST APIs are web services that use HTTP methods (GET, POST, PUT, DELETE)
to enable communication between client and server applications through
standardized, stateless requests and responses.

Tokens: 48 | Cost: $0.04 | Balance: $96.51
```

### Pipe Input

```bash
$ echo "Summarize this text" | tokenhouse complete --stdin
```

### Shell Integration

```bash
# Add to ~/.bashrc or ~/.zshrc
alias ai='tokenhouse complete'
alias chat='tokenhouse chat'

# Usage
$ ai "What's the time complexity of quicksort?"
$ chat --model gpt-4o
```

---

## Part 8: Complete Request Flow Diagram

### Authentication & API Call Flow

```
┌──────────────┐
│   Developer  │
│   Terminal   │
└──────┬───────┘
       │
       │ 1. $ tokenhouse login
       │    Enter ID: th_user_abc123
       │    Enter Secret: ths_secret_***
       ↓
┌──────────────────────────────────────────────────────────────┐
│            TokenHouse Auth API                                │
│                                                               │
│  POST /auth/token                                             │
│  {                                                            │
│    tokenhouse_id: "th_user_abc123",                          │
│    tokenhouse_secret: "ths_secret_xyz789"                    │
│  }                                                            │
│                                                               │
│  1. Verify credentials (hash match)                          │
│  2. Load user data from database                             │
│  3. Load AI credentials (encrypted)                          │
│  4. Generate JWT with embedded credentials                   │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 │ Returns JWT
                 ↓
┌──────────────────────────────────────────────────────────────┐
│  JWT Token (saved to ~/.tokenhouse/config.json)             │
│                                                               │
│  {                                                            │
│    "tokenhouse_id": "th_user_abc123",                        │
│    "balance_usd": 97.60,                                     │
│    "balance_tokens": 976000,                                 │
│    "ai_credentials": {                                        │
│      "openai": {                                              │
│        "api_key": "sk-proj-tokenhouse-scoped-abc123",       │
│        "org_id": "org-tokenhouse-jane",                      │
│        "project_id": "proj_abc123"                           │
│      },                                                       │
│      "anthropic": {                                           │
│        "api_key": "sk-ant-tokenhouse-scoped-def456",        │
│        "workspace_id": "ws-tokenhouse-jane"                  │
│      }                                                        │
│    },                                                         │
│    "allowed_models": [...],                                   │
│    "rate_limits": {...}                                       │
│  }                                                            │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 │ 2. $ tokenhouse chat
                 ↓
┌──────────────────────────────────────────────────────────────┐
│  CLI Chat Command                                             │
│                                                               │
│  1. Load JWT from ~/.tokenhouse/config.json                  │
│  2. Decode JWT → Extract ai_credentials.anthropic            │
│  3. Initialize Anthropic client with scoped key              │
│  4. User types: "Hello, explain quantum computing"           │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 │ 3. Direct API call (no proxy!)
                 ↓
┌──────────────────────────────────────────────────────────────┐
│         Anthropic API (api.anthropic.com)                     │
│                                                               │
│  POST /v1/messages                                            │
│  Authorization: Bearer sk-ant-tokenhouse-scoped-def456       │
│  X-TokenHouse-Session: eyJhbGc... (optional tracking)        │
│                                                               │
│  {                                                            │
│    "model": "claude-3-5-haiku-20241022",                     │
│    "messages": [                                              │
│      {"role": "user", "content": "Hello, explain..."}        │
│    ]                                                          │
│  }                                                            │
│                                                               │
│  1. Anthropic validates scoped key                           │
│  2. Checks rate limits for this key                          │
│  3. Processes request                                         │
│  4. Returns response + usage data                            │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 │ Returns response
                 ↓
┌──────────────────────────────────────────────────────────────┐
│  CLI Display & Usage Tracking                                │
│                                                               │
│  1. Display Claude's response to user                        │
│  2. Calculate cost based on usage                            │
│  3. Show: Tokens: 142 | Cost: $0.53 | Balance: $97.07      │
│  4. Report usage to TokenHouse (async webhook/polling)       │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 │ 4. Usage webhook (async)
                 ↓
┌──────────────────────────────────────────────────────────────┐
│     TokenHouse Usage Tracking API                            │
│                                                               │
│  POST /webhooks/usage                                         │
│  {                                                            │
│    "user_id": "th_user_abc123",                              │
│    "provider": "anthropic",                                   │
│    "model": "claude-3-5-haiku-20241022",                     │
│    "usage": {                                                 │
│      "input_tokens": 12,                                      │
│      "output_tokens": 130,                                    │
│      "total_tokens": 142                                      │
│    }                                                          │
│  }                                                            │
│                                                               │
│  1. Deduct $0.53 from user balance                           │
│  2. Log transaction                                           │
│  3. Check auto-recharge threshold                            │
└──────────────────────────────────────────────────────────────┘
```

### Key Insight: No Proxy for API Calls!

**Unlike OpenRouter:**
- Developer calls Anthropic/OpenAI **directly**
- TokenHouse credentials are in the JWT
- No latency from proxy
- Usage tracking happens async (webhooks or periodic reconciliation)

---

## Part 9: Security & Best Practices

### Credential Security

```typescript
// CLI stores credentials securely
const configPath = join(homedir(), '.tokenhouse', 'config.json')

// File permissions: 0o600 (read/write for owner only)
await writeFile(configPath, JSON.stringify(config), {
  mode: 0o600
})

// JWT expiration: 1 hour
// User must re-authenticate after expiry
```

### Secret Rotation

```bash
$ tokenhouse rotate-secret
```

**Output:**
```
Rotating your TokenHouse secret...

⚠️  This will invalidate your current secret!
   All devices using the old secret will need to re-authenticate.

Continue? (y/N): y

✓ Secret rotated successfully!

New secret: ths_secret_new987uvw654

Save this secret securely. The old secret will be valid for 7 days
to allow you to update your devices.

[Copy to Clipboard]
```

### Rate Limiting

```typescript
// Rate limits enforced at provider level
// Based on user's plan tier

const rateLimits = {
  free: {
    requests_per_second: 2,
    requests_per_day: 100
  },
  pro: {
    requests_per_second: 20,
    requests_per_day: 50000
  },
  business: {
    requests_per_second: 50,
    requests_per_day: 200000
  }
}

// If user exceeds limits, provider returns 429
// CLI shows helpful message
```

---

## Summary

### The Complete Flow

1. **Sign Up** → Get TokenHouse ID + Secret
2. **Select LLMs** → TokenHouse provisions scoped credentials
3. **Add Funds** → Deposit via Venmo/Zelle
4. **Install CLI** → `npm install -g tokenhouse-cli`
5. **Login** → `tokenhouse login` (saves JWT with credentials)
6. **View Claims** → `tokenhouse whoami --show-claims`
7. **Chat** → `tokenhouse chat` (calls providers directly!)

### Key Advantages

✅ **One Account** → Access OpenAI, Claude, Gemini
✅ **Direct API Calls** → No proxy latency (unlike OpenRouter)
✅ **Credentials in JWT** → No separate API key management
✅ **CLI + Web** → Flexible usage
✅ **P2P Payments** → Built-in invoicing and team splitting
✅ **Financial Platform** → Receive payments, use for AI, pay team

**TokenHouse = Cash App + OpenAI + Claude in one platform** 🚀

---

**Created:** 2026-03-09
**Author:** Johnny Crupi
**Status:** Complete Flow Documentation
