# How Better Auth Handles JWT

Complete guide to JWT handling in better-auth for TokenHouse.

## Overview

Better Auth uses a sophisticated JWT system with:
- **Asymmetric encryption** (RS256) for production security
- **JWKS endpoint** for public key distribution
- **Custom claims** via hooks
- **Automatic refresh** tokens
- **Session management** with database persistence

## JWT Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Better Auth JWT Flow                  │
└─────────────────────────────────────────────────────────┘

1. User Sign In
   POST /auth/sign-in/email
   {
     "email": "johnny@tokenhouse.ai",
     "password": "ChangeMe123!"
   }
   │
   ▼
2. Better Auth validates credentials
   - Check email/password in database
   - Verify account is active
   │
   ▼
3. After-Hook runs (custom claims)
   - Query user's organization
   - Add TokenHouse claims to session
   │
   ▼
4. Generate JWT
   - Sign with private key (RS256)
   - Include standard + custom claims
   - Set expiration (default: 7 days)
   │
   ▼
5. Return JWT to client
   {
     "session": {
       "user": { ... },
       "org_id": "tokenhouse-super-org",
       "org_role": "owner",
       ...
     },
     "token": "eyJhbGciOiJSUzI1NiIs..."
   }
   │
   ▼
6. Client stores JWT
   - LocalStorage or Cookie
   - Send in Authorization header
   │
   ▼
7. API Request with JWT
   GET /chat/completions
   Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
   │
   ▼
8. Verify JWT
   - Fetch public key from JWKS endpoint
   - Verify signature
   - Check expiration
   - Extract claims
   │
   ▼
9. Use Claims (no DB lookup!)
   - Check org_id, allowed_models
   - Apply rate_limits
   - Process request
```

## JWT Structure

### Header
```json
{
  "alg": "RS256",           // Algorithm (RSA + SHA256)
  "typ": "JWT",             // Token type
  "kid": "better-auth-key"  // Key ID for JWKS lookup
}
```

### Payload (Claims)
```json
{
  // Standard Claims (registered)
  "iss": "http://localhost:8187",           // Issuer
  "sub": "user-uuid-here",                  // Subject (user ID)
  "aud": ["http://localhost:8187"],         // Audience
  "exp": 1735689600,                        // Expiration (Unix timestamp)
  "nbf": 1735603200,                        // Not Before
  "iat": 1735603200,                        // Issued At
  "jti": "session-uuid-here",               // JWT ID (session ID)

  // Better Auth Standard Claims
  "email": "johnny@tokenhouse.ai",
  "name": "Johnny",
  "email_verified": true,

  // TokenHouse Custom Claims (added via hooks)
  "org_id": "tokenhouse-super-org",
  "org_name": "TokenHouse",
  "org_role": "owner",
  "org_secret": "ths_super_secret_abc123",
  "billing_tier": "enterprise",
  "allowed_models": [
    "gpt-4o",
    "claude-3-5-sonnet-20241022"
  ],
  "rate_limits": {
    "requests_per_minute": 1000,
    "tokens_per_day": 100000000
  }
}
```

### Signature
```
RSASHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  privateKey
)
```

## Key Management

### Private Key (Signing)
```typescript
// Better Auth generates RSA key pair on first start
// Stored in database or environment variable

const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...
-----END RSA PRIVATE KEY-----`

// Used to sign JWTs
jwt.sign(payload, privateKey, { algorithm: 'RS256' })
```

### Public Key (Verification)
```typescript
// Exposed via JWKS endpoint
GET /auth/jwks
{
  "keys": [
    {
      "kty": "RSA",
      "kid": "better-auth-key",
      "use": "sig",
      "alg": "RS256",
      "n": "base64-encoded-modulus...",
      "e": "AQAB"
    }
  ]
}

// API servers fetch public key to verify JWTs
const jwks = jose.createRemoteJWKSet(new URL('http://localhost:8187/auth/jwks'))
const { payload } = await jose.jwtVerify(token, jwks)
```

## Custom Claims via Hooks

Better Auth uses hooks to add custom claims:

```typescript
export const auth = betterAuth({
  advanced: {
    hooks: {
      after: [
        {
          // Trigger: after successful sign-in
          matcher: (ctx) => ctx.endpoint === '/sign-in/email',

          // Handler: add custom claims
          handler: async (ctx) => {
            const userId = ctx.session?.user?.id

            // Query organization data from database
            const org = db.query(`
              SELECT
                o.slug as org_id,
                o.name as org_name,
                o.org_secret,
                o.billing_tier,
                o.allowed_models,
                o.requests_per_minute,
                o.tokens_per_day,
                m.role as org_role
              FROM organization_member m
              JOIN organization o ON m.organization_id = o.id
              WHERE m.user_id = ?
              LIMIT 1
            `).get(userId)

            // Add to session (becomes JWT claims)
            ctx.session = {
              ...ctx.session,
              org_id: org.org_id,
              org_name: org.org_name,
              org_role: org.org_role,
              org_secret: org.org_secret,
              billing_tier: org.billing_tier,
              allowed_models: JSON.parse(org.allowed_models),
              rate_limits: {
                requests_per_minute: org.requests_per_minute,
                tokens_per_day: org.tokens_per_day
              }
            }

            return ctx
          }
        }
      ]
    }
  }
})
```

## JWT Verification

### Client-Side (for display/routing only)
```typescript
import { jwtDecode } from 'jwt-decode'

// Decode JWT (NO verification - client can't verify signature)
const decoded = jwtDecode(token)

// Use for UI purposes only
if (decoded.org_role === 'owner') {
  showAdminPanel()
}

// ⚠️ NEVER trust client-side JWT for authorization!
```

### Server-Side (secure verification)
```typescript
import * as jose from 'jose'

// Fetch JWKS (public keys)
const jwks = jose.createRemoteJWKSet(
  new URL('http://localhost:8187/auth/jwks')
)

// Verify JWT signature and expiration
const { payload } = await jose.jwtVerify(token, jwks, {
  issuer: 'http://localhost:8187',
  audience: 'http://localhost:8187'
})

// Payload is now verified and trustworthy
const orgId = payload.org_id
const allowedModels = payload.allowed_models
```

## Session Management

Better Auth stores sessions in database:

```sql
CREATE TABLE session (
  id TEXT PRIMARY KEY,           -- Session UUID
  user_id TEXT NOT NULL,         -- User UUID
  token TEXT UNIQUE NOT NULL,    -- JWT token
  expires_at TEXT NOT NULL,      -- Expiration timestamp
  ip_address TEXT,               -- Client IP
  user_agent TEXT,               -- Client browser
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)
```

### Session Lifecycle

1. **Create**: JWT generated, session saved to DB
2. **Verify**: JWT signature + expiration checked
3. **Refresh**: New JWT issued before expiration
4. **Revoke**: Session deleted from DB (JWT becomes invalid)

### Refresh Tokens

Better Auth uses sliding sessions:

```typescript
session: {
  expiresIn: 60 * 60 * 24 * 7,  // 7 days
  updateAge: 60 * 60 * 24,      // Refresh after 24 hours
}

// If user makes request with token >24h old,
// Better Auth issues new JWT automatically
```

## Security Features

### 1. RS256 (Asymmetric Encryption)
- **Private key**: Only auth server can sign JWTs
- **Public key**: Any service can verify JWTs
- **Benefit**: Distributed verification without shared secrets

### 2. JWKS Endpoint
- **Dynamic keys**: Keys can be rotated without downtime
- **Multi-key**: Support multiple keys simultaneously
- **Standard**: Industry-standard JWT verification

### 3. Claims Validation
```typescript
// Better Auth validates all claims automatically:
- Expiration (exp)
- Not Before (nbf)
- Issued At (iat)
- Issuer (iss)
- Audience (aud)
```

### 4. Session Revocation
```typescript
// Revoke session (logout)
POST /auth/sign-out
- Deletes session from database
- JWT becomes invalid (even if not expired)
```

### 5. IP/User-Agent Tracking
```typescript
// Sessions track client metadata
- Detect suspicious activity
- Force logout on device change
- Security audit trail
```

## TokenHouse Integration

### Gateway Verification

```typescript
// gateway/src/middleware/auth.ts
import * as jose from 'jose'

const jwks = jose.createRemoteJWKSet(
  new URL('http://localhost:8187/auth/jwks')
)

export async function verifyToken(token: string) {
  const { payload } = await jose.jwtVerify(token, jwks)

  return {
    userId: payload.sub,
    email: payload.email,
    // TokenHouse custom claims
    orgId: payload.org_id,
    orgRole: payload.org_role,
    allowedModels: payload.allowed_models,
    rateLimits: payload.rate_limits
  }
}

// Use in routes
app.derive(async ({ headers, set }) => {
  const token = headers.authorization?.replace('Bearer ', '')

  if (!token) {
    set.status = 401
    return { error: 'Unauthorized' }
  }

  const session = await verifyToken(token)
  return { session }
})

// Access claims without DB lookup!
app.post('/chat/completions', async ({ session, body }) => {
  // Check allowed models from JWT claim
  if (!session.allowedModels.includes(body.model)) {
    return { error: 'Model not allowed' }
  }

  // Apply rate limits from JWT claim
  await checkRateLimit(session.orgId, session.rateLimits)

  // Process request...
})
```

### Admin UI Authentication

```typescript
// examples/admin-ui/src/App.tsx
import { AuthProvider } from '@daveyplate/better-auth-ui'

function App() {
  return (
    <AuthProvider
      auth={{
        baseURL: 'http://localhost:8187',
        basePath: '/auth'
      }}
    >
      <AdminDashboard />
    </AuthProvider>
  )
}

// Sign in component
import { AuthCard } from '@daveyplate/better-auth-ui'

function SignIn() {
  return (
    <AuthCard
      onSuccess={(session) => {
        console.log('JWT token:', session.token)
        console.log('Org ID:', session.org_id)
        console.log('Allowed models:', session.allowed_models)
      }}
    />
  )
}
```

## Benefits Over Simple JWT

### Before (Simple JWT)
```typescript
// Every request requires DB lookup
app.post('/chat', async ({ headers }) => {
  const { org_id, org_secret } = parseAuth(headers)

  // Database query on every request
  const org = await db.query('SELECT * FROM org WHERE id = ?', org_id)

  if (!org || org.secret !== org_secret) {
    return { error: 'Unauthorized' }
  }

  // Check allowed models (another query)
  const models = await db.query('SELECT models FROM org WHERE id = ?', org_id)

  // Process request...
})
```

### After (Better Auth JWT)
```typescript
// No database lookups!
app.post('/chat', async ({ session }) => {
  // All data in JWT claims
  if (!session.allowed_models.includes(body.model)) {
    return { error: 'Model not allowed' }
  }

  // Apply rate limits from JWT
  await checkRateLimit(session.org_id, session.rate_limits)

  // Process request...
})
```

## Performance Comparison

| Metric | Simple Auth | Better Auth JWT |
|--------|-------------|-----------------|
| Auth per request | 2-3 DB queries | 0 DB queries |
| Response time | 50-100ms | 1-5ms |
| DB load | High | Minimal |
| Scalability | Limited | Excellent |
| Horizontal scaling | Requires shared DB | Stateless |

## Common Patterns

### Pattern 1: Check Organization Access
```typescript
function requireOrg(session, requiredOrgId) {
  if (session.org_id !== requiredOrgId) {
    throw new Error('Not authorized for this organization')
  }
}
```

### Pattern 2: Check Role
```typescript
function requireRole(session, requiredRole) {
  const roleHierarchy = ['member', 'admin', 'owner']
  const userLevel = roleHierarchy.indexOf(session.org_role)
  const requiredLevel = roleHierarchy.indexOf(requiredRole)

  if (userLevel < requiredLevel) {
    throw new Error(`Requires ${requiredRole} role`)
  }
}
```

### Pattern 3: Model Access Control
```typescript
function checkModelAccess(session, model) {
  if (!session.allowed_models.includes(model)) {
    throw new Error(`Model ${model} not available on ${session.billing_tier} tier`)
  }
}
```

### Pattern 4: Rate Limiting
```typescript
async function checkRateLimit(session) {
  const key = `rate:${session.org_id}`
  const current = await redis.incr(key)

  if (current === 1) {
    await redis.expire(key, 60) // 1 minute window
  }

  if (current > session.rate_limits.requests_per_minute) {
    throw new Error('Rate limit exceeded')
  }
}
```

## Testing JWT

### Decode JWT
```bash
# Using jwt.io
echo "eyJhbGciOiJSUzI1NiIs..." | base64 -d

# Using jwt-cli
jwt decode eyJhbGciOiJSUzI1NiIs...

# Using Node.js
node -e "console.log(JSON.stringify(JSON.parse(Buffer.from('eyJhbGciOiJSUzI1NiIs...'.split('.')[1], 'base64').toString()), null, 2))"
```

### Verify JWT
```bash
# Get JWKS
curl http://localhost:8187/auth/jwks

# Verify with public key (using jwt.io or online tool)
```

### Test Custom Claims
```bash
# Sign in and get JWT
TOKEN=$(curl -s -X POST http://localhost:8187/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"johnny@tokenhouse.ai","password":"ChangeMe123!"}' \
  | jq -r '.token')

# Decode to see claims
echo $TOKEN | jwt decode - | jq

# Use JWT in API call
curl -X POST http://localhost:8187/chat/completions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"Hi"}]}'
```

## Resources

- [Better Auth Docs](https://better-auth.com/docs)
- [JWT RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519)
- [JWKS RFC 7517](https://datatracker.ietf.org/doc/html/rfc7517)
- [RS256 Algorithm](https://auth0.com/blog/rs256-vs-hs256-whats-the-difference/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
