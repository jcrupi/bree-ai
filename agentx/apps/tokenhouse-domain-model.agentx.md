# TokenHouse Domain Model - Multi-Tenant Platform Architecture

**Status**: Design Document
**Type**: Domain Model & Database Schema
**Purpose**: Define the complete organizational structure with TokenHouse as platform owner

---

## Business Model Overview

**TokenHouse** is the platform owner (super org) that provides AI API gateway services to multiple types of organizations.

```
┌─────────────────────────────────────────────────────────────┐
│                     TOKENHOUSE                               │
│                  (Platform Owner)                            │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Community Groups          Professional Groups         │  │
│  │  • Free tier              • Paid tiers                 │  │
│  │  • Shared resources       • Dedicated resources        │  │
│  │  • Open membership        • Curated membership         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Individual Organizations (Companies)                   │  │
│  │  • Private orgs for companies                          │  │
│  │  • Custom billing                                       │  │
│  │  • Team management                                      │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Domain Entities

### 1. Organization Types

#### Platform Owner
- **TokenHouse** - The platform itself
- Has admin privileges over all other orgs
- Manages master API keys (OpenAI, Anthropic)
- Sets pricing and policies

#### Community Groups
- **Purpose**: Open communities for learning, collaboration
- **Membership**: Open or invitation-based
- **Billing**: Free tier (sponsored by TokenHouse)
- **Use Cases**:
  - Open source projects
  - Educational communities
  - Developer forums
  - Hobbyist groups

#### Professional Groups
- **Purpose**: Professional organizations, industry groups
- **Membership**: Curated, approval-based
- **Billing**: Paid tiers (starter, pro)
- **Use Cases**:
  - Professional associations
  - Industry consortiums
  - Research collaborations
  - Consulting networks

#### Individual Organizations
- **Purpose**: Private companies/businesses
- **Membership**: Company employees only
- **Billing**: Custom enterprise pricing
- **Use Cases**:
  - Startups
  - SMBs
  - Enterprise companies
  - Agencies

---

## Database Schema

### Organizations Table

```typescript
interface Organization {
  // Identity
  id: string                    // UUID: 'org_550e8400-e29b-41d4-a716-446655440000'
  slug: string                  // URL-friendly: 'acme-corp', 'ai-researchers-community'
  name: string                  // Display name: 'Acme Corporation'

  // Type & Classification
  type: 'platform' | 'community' | 'professional' | 'company'
  parent_org_id: string | null  // Points to TokenHouse for all child orgs

  // Authentication
  org_secret_hash: string       // bcrypt hash of org secret
  org_token_hash: string        // For request signing

  // Billing & Limits
  billing_tier: 'free' | 'starter' | 'pro' | 'enterprise' | 'platform'
  rate_limits: {
    requests_per_minute: number
    tokens_per_day: number
    max_users: number           // Max users allowed in this org
  }

  // AI Access
  allowed_models: string[]      // ['gpt-4o', 'claude-3-5-sonnet-20241022']

  // Membership Settings
  membership_type: 'open' | 'approval' | 'invitation' | 'closed'
  is_public: boolean            // Listed in public directory

  // Metadata
  description: string | null
  website: string | null
  logo_url: string | null

  // Timestamps
  created_at: Date
  updated_at: Date
  is_active: boolean
}
```

**Indexes**:
- Primary: `id`
- Unique: `slug`
- Index: `type`, `parent_org_id`, `is_active`

**Example Organizations**:

```typescript
// Platform Owner
{
  id: 'org_00000000-0000-0000-0000-000000000000',
  slug: 'tokenhouse',
  name: 'TokenHouse',
  type: 'platform',
  parent_org_id: null,
  billing_tier: 'platform',
  membership_type: 'closed',
  is_public: false
}

// Community Group
{
  id: 'org_11111111-1111-1111-1111-111111111111',
  slug: 'ai-researchers-community',
  name: 'AI Researchers Community',
  type: 'community',
  parent_org_id: 'org_00000000-0000-0000-0000-000000000000',
  billing_tier: 'free',
  membership_type: 'approval',
  is_public: true,
  rate_limits: {
    requests_per_minute: 60,
    tokens_per_day: 500_000,
    max_users: 1000
  }
}

// Professional Group
{
  id: 'org_22222222-2222-2222-2222-222222222222',
  slug: 'healthcare-ai-consortium',
  name: 'Healthcare AI Consortium',
  type: 'professional',
  parent_org_id: 'org_00000000-0000-0000-0000-000000000000',
  billing_tier: 'pro',
  membership_type: 'invitation',
  is_public: true,
  rate_limits: {
    requests_per_minute: 200,
    tokens_per_day: 5_000_000,
    max_users: 500
  }
}

// Company
{
  id: 'org_33333333-3333-3333-3333-333333333333',
  slug: 'acme-corp',
  name: 'Acme Corporation',
  type: 'company',
  parent_org_id: 'org_00000000-0000-0000-0000-000000000000',
  billing_tier: 'enterprise',
  membership_type: 'closed',
  is_public: false,
  rate_limits: {
    requests_per_minute: 1000,
    tokens_per_day: 50_000_000,
    max_users: -1  // unlimited
  }
}
```

---

### Users Table

```typescript
interface User {
  // Identity
  id: string                    // UUID: 'usr_660e8400-e29b-41d4-a716-446655440000'
  slug: string                  // URL-friendly: 'johnny-crupi', 'alice-johnson'
  email: string                 // Unique: 'johnny@tokenhouse.ai'

  // Profile
  name: string | null           // Display name: 'Johnny Crupi'
  avatar_url: string | null
  bio: string | null

  // Authentication
  password_hash: string | null  // For email/password auth (optional)

  // Status
  is_active: boolean
  email_verified: boolean

  // Timestamps
  created_at: Date
  updated_at: Date
  last_login_at: Date | null
}
```

**Indexes**:
- Primary: `id`
- Unique: `email`, `slug`
- Index: `is_active`

**Example Users**:

```typescript
{
  id: 'usr_00000000-0000-0000-0000-000000000001',
  slug: 'johnny-crupi',
  email: 'johnny@tokenhouse.ai',
  name: 'Johnny Crupi',
  is_active: true,
  email_verified: true
}

{
  id: 'usr_11111111-1111-1111-1111-111111111111',
  slug: 'alice-johnson',
  email: 'alice@acme.com',
  name: 'Alice Johnson',
  is_active: true,
  email_verified: true
}
```

---

### Memberships Table (Join Table)

```typescript
interface Membership {
  // Identity
  id: string                    // UUID: 'mbr_770e8400-e29b-41d4-a716-446655440000'

  // Relationships
  user_id: string               // FK: users.id
  org_id: string                // FK: organizations.id

  // Role & Permissions
  role: 'owner' | 'admin' | 'member' | 'guest'
  permissions: string[]         // ['chat', 'usage:read', 'users:invite']

  // Status
  status: 'active' | 'pending' | 'suspended'

  // Metadata
  invited_by_user_id: string | null
  joined_at: Date
  suspended_at: Date | null

  // Timestamps
  created_at: Date
  updated_at: Date
}
```

**Indexes**:
- Primary: `id`
- Unique: `(user_id, org_id)`
- Index: `user_id`, `org_id`, `status`

**Roles & Permissions**:

| Role | Permissions |
|------|-------------|
| **owner** | All permissions, can delete org, transfer ownership |
| **admin** | Manage users, settings, billing, view usage |
| **member** | Use AI APIs, view own usage |
| **guest** | Read-only access (for community groups) |

**Example Memberships**:

```typescript
// Johnny is owner of TokenHouse
{
  id: 'mbr_00000000-0000-0000-0000-000000000001',
  user_id: 'usr_00000000-0000-0000-0000-000000000001',
  org_id: 'org_00000000-0000-0000-0000-000000000000',
  role: 'owner',
  permissions: ['*'],  // All permissions
  status: 'active',
  joined_at: new Date('2024-01-01')
}

// Alice is admin of Acme Corp
{
  id: 'mbr_11111111-1111-1111-1111-111111111111',
  user_id: 'usr_11111111-1111-1111-1111-111111111111',
  org_id: 'org_33333333-3333-3333-3333-333333333333',
  role: 'admin',
  permissions: ['chat', 'usage:read', 'users:invite', 'settings:update'],
  status: 'active',
  joined_at: new Date('2024-02-15')
}

// Alice is also a member of AI Researchers Community
{
  id: 'mbr_22222222-2222-2222-2222-222222222222',
  user_id: 'usr_11111111-1111-1111-1111-111111111111',
  org_id: 'org_11111111-1111-1111-1111-111111111111',
  role: 'member',
  permissions: ['chat', 'usage:read'],
  status: 'active',
  joined_at: new Date('2024-03-01')
}
```

---

## API Design

### Organization Management

#### Create Organization

```typescript
POST /admin/orgs
Headers: X-Admin-Secret: admin-secret

Body:
{
  name: "Healthcare AI Consortium",
  slug: "healthcare-ai-consortium",  // Optional, auto-generated if not provided
  type: "professional",
  billing_tier: "pro",
  membership_type: "invitation",
  is_public: true,
  allowed_models: ["gpt-4o", "claude-3-5-sonnet-20241022"],
  initial_owner_email: "admin@healthcareai.org"
}

Response:
{
  id: "org_22222222-2222-2222-2222-222222222222",
  slug: "healthcare-ai-consortium",
  name: "Healthcare AI Consortium",
  type: "professional",
  org_secret: "ths_a1b2c3d4e5f6...",  // Only returned once!
  membership_type: "invitation",
  owner: {
    email: "admin@healthcareai.org",
    role: "owner"
  },
  message: "⚠️  Save the org_secret - it will not be shown again!"
}
```

#### Get Organization

```typescript
GET /admin/orgs/:id_or_slug
Headers: X-Admin-Secret: admin-secret

Response:
{
  id: "org_22222222-2222-2222-2222-222222222222",
  slug: "healthcare-ai-consortium",
  name: "Healthcare AI Consortium",
  type: "professional",
  billing_tier: "pro",
  membership_type: "invitation",
  is_public: true,
  allowed_models: ["gpt-4o", "claude-3-5-sonnet-20241022"],
  rate_limits: {
    requests_per_minute: 200,
    tokens_per_day: 5000000,
    max_users: 500
  },
  members_count: 42,
  created_at: "2024-03-09T...",
  updated_at: "2024-03-09T..."
}
```

#### List Organizations

```typescript
GET /admin/orgs?type=community&is_public=true&limit=50&offset=0
Headers: X-Admin-Secret: admin-secret

Response:
{
  orgs: [...],
  total: 150,
  limit: 50,
  offset: 0
}
```

---

### User Management

#### Create User

```typescript
POST /admin/users
Headers: X-Admin-Secret: admin-secret

Body:
{
  email: "alice@acme.com",
  name: "Alice Johnson",
  slug: "alice-johnson"  // Optional, auto-generated if not provided
}

Response:
{
  id: "usr_11111111-1111-1111-1111-111111111111",
  slug: "alice-johnson",
  email: "alice@acme.com",
  name: "Alice Johnson",
  created_at: "2024-03-09T..."
}
```

#### Add User to Organization

```typescript
POST /admin/orgs/:org_id/members
Headers: X-Admin-Secret: admin-secret

Body:
{
  user_email: "alice@acme.com",
  role: "admin",
  permissions: ["chat", "usage:read", "users:invite"]
}

Response:
{
  membership_id: "mbr_11111111-1111-1111-1111-111111111111",
  user: {
    id: "usr_11111111-1111-1111-1111-111111111111",
    email: "alice@acme.com",
    name: "Alice Johnson"
  },
  org: {
    id: "org_33333333-3333-3333-3333-333333333333",
    slug: "acme-corp",
    name: "Acme Corporation"
  },
  role: "admin",
  status: "active",
  message: "User alice@acme.com added to Acme Corporation as admin"
}
```

#### List Organization Members

```typescript
GET /admin/orgs/:org_id/members?role=admin&status=active
Headers: X-Admin-Secret: admin-secret

Response:
{
  members: [
    {
      membership_id: "mbr_11111111-1111-1111-1111-111111111111",
      user: {
        id: "usr_11111111-1111-1111-1111-111111111111",
        slug: "alice-johnson",
        email: "alice@acme.com",
        name: "Alice Johnson"
      },
      role: "admin",
      status: "active",
      joined_at: "2024-02-15T..."
    }
  ],
  total: 1
}
```

---

## Slug Generation

### Organization Slugs

```typescript
function generateOrgSlug(name: string): string {
  // 1. Lowercase
  // 2. Replace spaces with hyphens
  // 3. Remove special characters
  // 4. Handle collisions with suffix

  let slug = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '')

  // Check for collision
  if (slugExists(slug)) {
    slug = `${slug}-${randomShortId()}`  // e.g., 'acme-corp-x3k9'
  }

  return slug
}

// Examples:
"Acme Corporation" → "acme-corporation"
"AI Researchers Community!" → "ai-researchers-community"
"Healthcare & AI Consortium" → "healthcare-ai-consortium"
```

### User Slugs

```typescript
function generateUserSlug(name: string, email: string): string {
  // Try name first
  let slug = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '')

  // Fallback to email username
  if (!slug) {
    slug = email.split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
  }

  // Handle collision
  if (slugExists(slug)) {
    slug = `${slug}-${randomShortId()}`
  }

  return slug
}

// Examples:
"Johnny Crupi" → "johnny-crupi"
"Alice Johnson" → "alice-johnson"
"alice@acme.com" (no name) → "alice"
```

---

## Authentication Flow with UUIDs

### User Authentication

```typescript
// 1. User authenticates (future feature - currently org-based only)
POST /auth/user/login
{
  email: "alice@acme.com",
  password: "***"
}

Response:
{
  access_token: "eyJhbGc...",
  user: {
    id: "usr_11111111-1111-1111-1111-111111111111",
    slug: "alice-johnson",
    email: "alice@acme.com",
    name: "Alice Johnson"
  },
  orgs: [
    {
      id: "org_33333333-3333-3333-3333-333333333333",
      slug: "acme-corp",
      name: "Acme Corporation",
      role: "admin"
    },
    {
      id: "org_11111111-1111-1111-1111-111111111111",
      slug: "ai-researchers-community",
      name: "AI Researchers Community",
      role: "member"
    }
  ]
}
```

### Organization Authentication (Current)

```typescript
// Current implementation - org credentials
POST /auth/token
{
  org_id: "org_33333333-3333-3333-3333-333333333333",
  org_secret: "ths_a1b2c3d4e5f6..."
}

Response:
{
  access_token: "eyJhbGc...",
  token_type: "Bearer",
  expires_in: 3600
}
```

### JWT Claims with UUIDs

```typescript
interface TokenHouseJWT {
  // Standard claims
  iss: 'tokenhouse.ai'
  sub: string                   // org UUID
  aud: 'tokenhouse-api'
  exp: number
  iat: number

  // Organization
  org_id: string                // UUID: 'org_33333333-3333-3333-3333-333333333333'
  org_slug: string              // 'acme-corp'
  org_name: string              // 'Acme Corporation'
  org_type: 'platform' | 'community' | 'professional' | 'company'

  // User (if authenticated as user)
  user_id?: string              // UUID: 'usr_11111111-1111-1111-1111-111111111111'
  user_slug?: string            // 'alice-johnson'
  user_email?: string           // 'alice@acme.com'
  user_role?: 'owner' | 'admin' | 'member' | 'guest'

  // Access control
  allowed_models: string[]
  rate_limits: {
    requests_per_minute: number
    tokens_per_day: number
  }

  // Session
  usage_tracking_id: string     // Session UUID for analytics
}
```

---

## URL Structure

### Public URLs

```
https://tokenhouse.ai/community/ai-researchers-community
https://tokenhouse.ai/professional/healthcare-ai-consortium
https://tokenhouse.ai/@alice-johnson
https://tokenhouse.ai/@alice-johnson/projects
```

### API URLs

```
https://api.tokenhouse.ai/v1/orgs/acme-corp
https://api.tokenhouse.ai/v1/orgs/org_33333333-3333-3333-3333-333333333333
https://api.tokenhouse.ai/v1/users/alice-johnson
https://api.tokenhouse.ai/v1/users/usr_11111111-1111-1111-1111-111111111111
```

Both UUID and slug are supported for lookups.

---

## Migration Path

### Phase 1: Update Database Schema (Current Sprint)
1. Add `id` (UUID) and `slug` fields to organizations
2. Add `id` (UUID) and `slug` fields to users
3. Create `memberships` join table
4. Migrate existing data

### Phase 2: Update API
1. Update admin endpoints to use UUIDs
2. Add slug-based lookups
3. Support both UUID and slug in API

### Phase 3: Add Organization Types
1. Implement community/professional/company types
2. Add membership type logic
3. Implement public org directory

### Phase 4: User Authentication
1. Add user login endpoints
2. Multi-org switching
3. Role-based permissions

---

## Summary

**Key Changes**:
- ✅ TokenHouse is the platform owner (parent org)
- ✅ Three org types: Community, Professional, Company
- ✅ UUIDs for all entities (orgs, users, memberships)
- ✅ Slugs for human-readable URLs
- ✅ Proper join table for user-org relationships
- ✅ Role-based access control
- ✅ Hierarchical organization structure

**Benefits**:
- Scalable multi-tenant architecture
- Clear separation of concerns
- Flexible membership models
- Enterprise-ready access control
- SEO-friendly URLs with slugs
- Database-agnostic UUID primary keys
