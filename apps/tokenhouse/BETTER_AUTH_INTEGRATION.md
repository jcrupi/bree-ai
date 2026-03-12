# Better Auth Integration for TokenHouse

This guide shows how to integrate better-auth into TokenHouse for proper user authentication and organization management with custom JWT claims.

## Overview

Better Auth provides:
- User authentication (email/password, OAuth, etc.)
- Organization management with custom fields
- JWT tokens with custom claims
- Session management
- Built-in database schema

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Better Auth Layer                        │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Users     │  │ Organizations│  │  Memberships │     │
│  │              │  │              │  │              │     │
│  │ - email      │  │ - name       │  │ - user_id    │     │
│  │ - password   │  │ - slug       │  │ - org_id     │     │
│  │ - name       │  │ - org_secret │  │ - role       │     │
│  └──────────────┘  │ - billing    │  └──────────────┘     │
│                     │ - models     │                        │
│                     │ - limits     │                        │
│                     └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   JWT Token     │
                    │                 │
                    │ Standard Claims │
                    │ - sub (user_id) │
                    │ - email         │
                    │ - name          │
                    │                 │
                    │ Custom Claims   │
                    │ - org_id        │
                    │ - org_role      │
                    │ - org_secret    │
                    │ - billing_tier  │
                    │ - allowed_models│
                    │ - rate_limits   │
                    └─────────────────┘
```

## Custom Claims in Better Auth

Better Auth allows you to add custom claims to JWTs through hooks:

### 1. Define Custom Claims

In `gateway/src/auth/better-auth.ts`:

```typescript
// Hook to add custom claims after sign-in
advanced: {
  hooks: {
    after: [
      {
        matcher: (ctx) => ctx.endpoint === '/sign-in/email',
        handler: async (ctx) => {
          const userId = ctx.session?.user?.id

          // Fetch user's organization data
          const orgData = await getOrganizationForUser(userId)

          // Add custom claims to session
          ctx.session = {
            ...ctx.session,
            // TokenHouse custom claims
            org_id: orgData.slug,
            org_role: orgData.role,
            org_secret: orgData.secret,
            billing_tier: orgData.billing_tier,
            allowed_models: orgData.allowed_models,
            rate_limits: orgData.rate_limits
          }

          return ctx
        }
      }
    ]
  }
}
```

### 2. Custom Organization Schema

Extend the organization table with TokenHouse fields:

```typescript
plugins: [
  organization({
    schema: {
      organization: {
        fields: {
          // TokenHouse-specific fields
          org_secret: {
            type: 'string',
            required: true,
            unique: true
          },
          billing_tier: {
            type: 'string',
            required: true,
            defaultValue: 'free'
          },
          allowed_models: {
            type: 'string', // JSON array as string
            required: true
          },
          requests_per_minute: {
            type: 'number',
            required: true
          },
          tokens_per_day: {
            type: 'number',
            required: true
          }
        }
      }
    }
  })
]
```

## Migration from Current System

### Step 1: Install Dependencies

```bash
cd gateway
bun add better-auth better-sqlite3
bun add -d @types/better-sqlite3
```

### Step 2: Initialize Better Auth

Create `gateway/src/auth/better-auth.ts` (already created above).

### Step 3: Run Database Migration

```bash
cd gateway
bun run src/auth/migrate.ts
```

This will:
- Create better-auth tables (user, session, organization, etc.)
- Migrate existing orgs and users from in-memory storage
- Generate org_secret and org_token for each org

### Step 4: Update Gateway Routes

Replace simple JWT auth with better-auth:

**Before (gateway/src/routes/auth.ts):**
```typescript
// Simple org_id + org_secret authentication
post('/auth/token', async ({ body }) => {
  const { org_id, org_secret } = body
  const org = orgs.get(org_id)
  // ...
})
```

**After (gateway/src/routes/auth.ts):**
```typescript
// Better auth endpoints
import { authHandler } from '../auth/better-auth'

// Mount better-auth routes at /auth/*
.all('/auth/*', authHandler)

// Verify JWT from better-auth
.derive(async ({ headers, set }) => {
  const token = headers.authorization?.replace('Bearer ', '')
  const session = await auth.validateToken(token)

  if (!session) {
    set.status = 401
    return { error: 'Unauthorized' }
  }

  return { session }
})
```

### Step 5: Update Admin UI

The admin UI will use better-auth UI components:

**Install better-auth-ui:**
```bash
cd examples/admin-ui
bun add @daveyplate/better-auth-ui
```

**Update App.tsx:**
```tsx
import { AuthProvider } from '@daveyplate/better-auth-ui'
import { OrganizationSwitcher, CreateOrganizationDialog } from '@daveyplate/better-auth-ui'

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

function AdminDashboard() {
  return (
    <div>
      <OrganizationSwitcher />
      <CreateOrganizationDialog />
      {/* Your existing admin UI */}
    </div>
  )
}
```

## Custom Claims Use Cases

### 1. Organization-Based API Access

```typescript
// Chat endpoint checks allowed_models from JWT
app.post('/chat/completions', async ({ body, session }) => {
  const { model } = body
  const { allowed_models } = session // From JWT claims

  if (!allowed_models.includes(model)) {
    return { error: 'Model not allowed for your organization' }
  }

  // Proceed with API call
})
```

### 2. Rate Limiting

```typescript
// Rate limiter uses claims from JWT
const rateLimiter = new RateLimiter({
  getLimit: (session) => session.rate_limits.requests_per_minute,
  getKey: (session) => session.org_id
})

app.use(rateLimiter.middleware)
```

### 3. Usage Tracking

```typescript
// Log usage with org context from JWT
async function logUsage(session, usage) {
  await db.insert('usage_logs', {
    org_id: session.org_id,
    billing_tier: session.billing_tier,
    tokens: usage.total_tokens,
    cost: calculateCost(usage)
  })
}
```

## Better Auth API Endpoints

After integration, these endpoints are available:

### Authentication
- `POST /auth/sign-up/email` - Register new user
- `POST /auth/sign-in/email` - Sign in with email/password
- `POST /auth/sign-out` - Sign out
- `GET /auth/session` - Get current session
- `GET /auth/jwks` - JWKS endpoint for JWT verification

### Organizations
- `POST /auth/organization/create` - Create organization
- `GET /auth/organization/:slug` - Get organization details
- `POST /auth/organization/:slug/invite` - Invite member
- `PATCH /auth/organization/:slug` - Update organization
- `DELETE /auth/organization/:slug` - Delete organization

### Members
- `GET /auth/organization/:slug/members` - List members
- `PATCH /auth/organization/:slug/members/:userId` - Update member role
- `DELETE /auth/organization/:slug/members/:userId` - Remove member

## TypeScript Types

```typescript
// JWT Payload with custom claims
interface TokenHouseSession {
  user: {
    id: string
    email: string
    name: string
  }
  // Custom TokenHouse claims
  org_id: string
  org_name: string
  org_role: 'owner' | 'admin' | 'member'
  org_secret: string
  billing_tier: 'free' | 'starter' | 'pro' | 'enterprise'
  allowed_models: string[]
  rate_limits: {
    requests_per_minute: number
    tokens_per_day: number
  }
}
```

## Database Schema

Better Auth creates these tables:

```sql
-- Users table
CREATE TABLE user (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  email_verified INTEGER DEFAULT 0,
  name TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Sessions table
CREATE TABLE session (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id)
);

-- Organizations table (with TokenHouse fields)
CREATE TABLE organization (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  -- TokenHouse custom fields
  org_secret TEXT UNIQUE NOT NULL,
  org_token TEXT UNIQUE NOT NULL,
  billing_tier TEXT NOT NULL DEFAULT 'free',
  allowed_models TEXT NOT NULL DEFAULT '[]',
  requests_per_minute INTEGER NOT NULL DEFAULT 60,
  tokens_per_day INTEGER NOT NULL DEFAULT 500000
);

-- Organization members
CREATE TABLE organization_member (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organization(id),
  FOREIGN KEY (user_id) REFERENCES user(id)
);
```

## Testing

### 1. Create User and Organization

```bash
# Sign up
curl -X POST http://localhost:8187/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "johnny@tokenhouse.ai",
    "password": "secure123",
    "name": "Johnny"
  }'

# Create organization
curl -X POST http://localhost:8187/auth/organization/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{
    "name": "TokenHouse Super Org",
    "slug": "tokenhouse-super-org",
    "billing_tier": "enterprise",
    "allowed_models": ["gpt-4o", "claude-3-5-sonnet-20241022"]
  }'
```

### 2. Sign In and Get JWT

```bash
# Sign in
curl -X POST http://localhost:8187/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "johnny@tokenhouse.ai",
    "password": "secure123"
  }'

# Response includes JWT with custom claims:
{
  "session": {
    "user": {
      "id": "...",
      "email": "johnny@tokenhouse.ai",
      "name": "Johnny"
    },
    "org_id": "tokenhouse-super-org",
    "org_role": "owner",
    "org_secret": "ths_abc123...",
    "billing_tier": "enterprise",
    "allowed_models": ["gpt-4o", "claude-3-5-sonnet-20241022"],
    "rate_limits": {
      "requests_per_minute": 1000,
      "tokens_per_day": 100000000
    }
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 3. Use JWT for API Calls

```bash
# Chat completion with JWT
curl -X POST http://localhost:8187/chat/completions \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello"}]
  }'

# JWT contains org_id, allowed_models, rate_limits
# No database lookup needed!
```

## Benefits of Better Auth

1. **No Database Lookups**: All org data in JWT claims
2. **Standard Auth**: Industry-standard authentication
3. **Organization Management**: Built-in org/team features
4. **Session Management**: Automatic session refresh
5. **Security**: JWKS endpoint for JWT verification
6. **Extensible**: Easy to add custom claims
7. **UI Components**: Pre-built React components

## Next Steps

1. Run migration script to move existing data
2. Update gateway to use better-auth
3. Update admin UI with better-auth-ui components
4. Add OAuth providers (Google, GitHub, etc.)
5. Add email verification
6. Add password reset flow
7. Add 2FA/MFA support

## Resources

- [Better Auth Docs](https://better-auth.com)
- [Better Auth UI Components](https://better-auth-ui.com)
- [Better Auth Organization Plugin](https://better-auth.com/docs/plugins/organization)
- [JWT Custom Claims](https://better-auth.com/docs/concepts/jwt)

## Support

For questions about better-auth integration:
- Email: johnny@tokenhouse.ai
- Better Auth Discord: https://discord.gg/better-auth
