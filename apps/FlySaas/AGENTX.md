# FlySaaS AgentX Documentation

**Version**: 1.0.0
**Last Updated**: 2026-03-15
**Purpose**: Comprehensive AI-readable documentation for FlySaaS multi-tenant SaaS platform

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Core Components](#core-components)
4. [Database Schema](#database-schema)
5. [API Reference](#api-reference)
6. [Authentication System](#authentication-system)
7. [Development Guide](#development-guide)
8. [Deployment Architecture](#deployment-architecture)
9. [Common Patterns](#common-patterns)
10. [Troubleshooting](#troubleshooting)

---

## Executive Summary

### What is FlySaaS?

FlySaaS is a multi-tenant SaaS platform that enables automatic provisioning of isolated client organizations on Fly.io infrastructure. Each organization gets its own dedicated Fly.io machine with a complete application stack.

### Core Value Proposition

- **Multi-Tenancy**: Organizations are logically isolated with role-based access control
- **Auto-Provisioning**: New client orgs get automatic Fly.io infrastructure deployment
- **Observer AI**: Built-in user feedback system for bugs, enhancements, and feature requests
- **Core CRM**: Basic contact and deal management for each organization
- **Scalable Architecture**: Each org can scale independently on Fly.io

### Key Stakeholders

- **Platform Admin**: Manages the superorg and creates new client organizations
- **Organization Owner**: Manages their organization, users, and settings
- **Organization Members**: Standard users with role-based permissions
- **Observer Admins**: Special role for managing user feedback and feature requests

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     FlySaaS Platform                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐    ┌──────────────────┐             │
│  │  FlySaaS Admin   │    │  FlySaaS Client  │             │
│  │   (Port 3002)    │    │   Template       │             │
│  │   React + Vite   │    │   React + Vite   │             │
│  └────────┬─────────┘    └────────┬─────────┘             │
│           │                       │                         │
│           │ REST API              │ REST API                │
│           │                       │                         │
│           └───────────┬───────────┘                         │
│                       ▼                                      │
│            ┌──────────────────────┐                         │
│            │  FlySaaS Superorg    │                         │
│            │    (Port 7800)       │                         │
│            │   Bun + Elysia       │                         │
│            └──────────┬───────────┘                         │
│                       │                                      │
│                       ▼                                      │
│            ┌──────────────────────┐                         │
│            │    PostgreSQL        │                         │
│            │  (localhost:5432)    │                         │
│            │  Database: flysaas   │                         │
│            └──────────────────────┘                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Fly.io Provisioning Layer                   │  │
│  │  - Creates isolated Fly.io apps per organization    │  │
│  │  - Deploys client template to dedicated machines    │  │
│  │  - Manages DNS: {org-slug}.fly.dev                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Backend (FlySaaS Superorg)**
- **Runtime**: Bun 1.x (JavaScript/TypeScript runtime)
- **Framework**: Elysia (Fast, type-safe web framework)
- **Database**: PostgreSQL 14+ (via postgres.js)
- **Authentication**: JWT (via jose library with HS256)
- **Password Hashing**: Argon2 (via Bun.password)

**Frontend (FlySaaS Admin)**
- **Framework**: React 18
- **Build Tool**: Vite 5
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Styling**: Tailwind CSS (assumed)
- **Type Safety**: TypeScript

**Shared Packages**
- **@bree-ai/flysaas-types**: Shared TypeScript types
- **@bree-ai/flysaas-auth**: Authentication utilities
- **@bree-ai/flysaas-provisioning**: Fly.io provisioning service

**Infrastructure**
- **Cloud Platform**: Fly.io
- **Deployment**: Docker containers per organization
- **DNS**: Fly.io managed DNS ({org-slug}.fly.dev)

---

## Core Components

### 1. FlySaaS Superorg (Backend API)

**Location**: `/apps/flysaas-superorg`
**Port**: 7800
**Purpose**: Central API server managing all organizations, users, and resources

#### Directory Structure

```
flysaas-superorg/
├── src/
│   ├── index.ts              # Main entry point, Elysia app setup
│   ├── auth/
│   │   └── jwt.ts            # JWT generation and verification
│   ├── db/
│   │   ├── migrate.ts        # Database migration runner
│   │   ├── seed-orgs.ts      # Organization seeding script
│   │   └── migrations/
│   │       ├── 001_initial.sql
│   │       ├── 002_add_password_hash.sql
│   │       └── 003_add_observations.sql
│   ├── middleware/
│   │   └── auth.ts           # (Deprecated) Auth middleware
│   └── routes/
│       ├── auth.ts           # Authentication endpoints
│       ├── orgs.ts           # Organization management
│       ├── observations.ts   # Observer AI endpoints
│       └── core/
│           ├── contacts.ts   # Contact management
│           └── deals.ts      # Deal management
├── .env                      # Environment configuration
└── package.json
```

#### Key Modules

**`src/index.ts`**
- Initializes Elysia server
- Mounts all route modules
- Configures CORS and middleware
- Starts server on port 7800

**`src/auth/jwt.ts`**
```typescript
// JWT Payload Structure
interface JWTPayload {
  user_id: string;      // UUID
  email: string;
  name: string;
  org_id: string;       // User's primary organization
  org_slug: string;
  org_role: string;     // 'owner' | 'admin' | 'member'
  iat: number;          // Issued at timestamp
  exp: number;          // Expiration timestamp (7 days)
}

// Key Functions
- generateToken(payload: JWTPayload): Promise<string>
- verifyToken(token: string): Promise<JWTPayload>
```

**Authentication Pattern**
All protected routes use this pattern:
```typescript
async ({ headers, set }) => {
  const authHeader = headers['authorization'];
  const token = authHeader?.replace(/^Bearer\s+/i, '');

  if (!token) {
    set.status = 401;
    return { error: 'Unauthorized' };
  }

  let payload: JWTPayload;
  try {
    payload = await verifyToken(token);
  } catch (error) {
    set.status = 401;
    return { error: 'Invalid token' };
  }

  const userId = payload.user_id;
  // ... route logic
}
```

### 2. FlySaaS Admin (Admin Frontend)

**Location**: `/apps/flysaas-admin`
**Port**: 3002
**Purpose**: Administrative interface for platform management

#### Directory Structure

```
flysaas-admin/
├── src/
│   ├── main.tsx              # React app entry point
│   ├── App.tsx               # Root component with routing
│   ├── lib/
│   │   └── api.ts            # API client with auth handling
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Organizations.tsx
│   │   ├── Contacts.tsx
│   │   ├── Deals.tsx
│   │   └── Observations.tsx
│   └── components/
└── package.json
```

#### API Client (`src/lib/api.ts`)

```typescript
class ApiClient {
  private token: string | null = null;

  // Configuration
  API_URL = 'http://localhost:7800'
  CLIENT_API_URL = 'http://localhost:3001'

  // Token Management
  setToken(token: string): void
  getToken(): string | null
  clearToken(): void

  // Authentication
  async signUp(email, password, name): Promise<{ user }>
  async signIn(email, password): Promise<{ token, user }>
  async signOut(): void

  // Organizations
  async getOrganizations(): Promise<{ organizations: Organization[] }>
  async getOrganization(slug): Promise<{ organization: Organization }>
  async createOrganization(org_slug, org_name, region?): Promise<{ organization, fly_url }>

  // Core CRM
  async getCoreContacts(): Promise<{ contacts: Contact[] }>
  async createCoreContact(data): Promise<{ contact: Contact }>
  async updateCoreContact(id, data): Promise<{ contact: Contact }>
  async deleteCoreContact(id): Promise<{ success: boolean }>

  async getCoreDeals(): Promise<{ deals: Deal[] }>
  async createCoreDeal(data): Promise<{ deal: Deal }>
  async updateCoreDeal(id, data): Promise<{ deal: Deal }>
  async deleteCoreDeal(id): Promise<{ success: boolean }>

  // Observer AI
  async getObservations(): Promise<{ observations: Observation[] }>
  async createObservation(data): Promise<{ observation: Observation }>
  async updateObservation(id, data): Promise<{ observation: Observation }>
}
```

### 3. FlySaaS Client Template

**Location**: `/apps/flysaas-client-template`
**Purpose**: Template application deployed for each client organization

**Note**: This gets provisioned to Fly.io with organization-specific configuration.

### 4. Shared Packages

**`@bree-ai/flysaas-types`**
- Shared TypeScript type definitions
- Ensures type consistency across frontend/backend

**`@bree-ai/flysaas-provisioning`**
```typescript
class ProvisioningService {
  constructor(flyApiToken: string)

  async provisionOrg(params: {
    org_slug: string;
    org_name: string;
    region?: string;
    owner_user_id: string;
  }): Promise<{
    success: boolean;
    organization?: {
      fly_app_name: string;
      fly_machine_id: string;
    };
    error?: string;
  }>
}
```

---

## Database Schema

### Core Tables

#### `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,      -- Argon2 hash via Bun.password
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose**: Stores user accounts across all organizations
**Authentication**: Password hashed with Argon2
**Note**: Users can belong to multiple organizations

#### `organizations`
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,        -- URL-safe identifier
  name TEXT NOT NULL,
  fly_app_name TEXT,                -- Fly.io app name
  fly_machine_id TEXT,              -- Fly.io machine ID
  status TEXT DEFAULT 'active',     -- 'active' | 'suspended' | 'deleted'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose**: Organizations are the top-level tenant boundary
**Fly.io Integration**: Each org gets dedicated Fly.io infrastructure
**Slug**: Used in URLs and Fly.io app naming

#### `org_members`
```sql
CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',  -- 'owner' | 'admin' | 'member'
  is_observer_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);
```

**Purpose**: Junction table for many-to-many user-organization relationship
**Roles**:
- `owner`: Full control, billing, organization deletion
- `admin`: User management, settings, Observer AI
- `member`: Standard access to organization resources

**Observer Admin**: Special permission to manage user feedback

#### `observations`
```sql
CREATE TABLE observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'enhancement', 'feature')),
  description TEXT NOT NULL,
  url TEXT,                         -- Optional URL context
  status TEXT DEFAULT 'new' CHECK (status IN (
    'new', 'reviewing', 'planned', 'in_progress', 'completed', 'rejected'
  )),
  priority TEXT DEFAULT 'medium' CHECK (priority IN (
    'low', 'medium', 'high', 'urgent'
  )),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,                       -- Admin notes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose**: Observer AI feedback tracking system
**Types**:
- `bug`: Something broken or not working correctly
- `enhancement`: Improvement to existing feature
- `feature`: New functionality request

**Workflow**: new → reviewing → planned → in_progress → completed/rejected

#### `contacts` (Core CRM)
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose**: Basic contact management per organization
**Isolation**: Contacts are scoped to organization via `org_id`

#### `deals` (Core CRM)
```sql
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  value NUMERIC(10, 2),
  stage TEXT DEFAULT 'lead',        -- 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose**: Sales pipeline tracking per organization
**Relationship**: Deals can be linked to contacts

### Database Migrations

**Migration Files**: `/apps/flysaas-superorg/src/db/migrations/`

1. **001_initial.sql** - Core tables (users, orgs, org_members, contacts, deals)
2. **002_add_password_hash.sql** - Added password_hash column to users
3. **003_add_observations.sql** - Observer AI tables and is_observer_admin flag

**Running Migrations**:
```bash
cd /apps/flysaas-superorg
bun src/db/migrate.ts
```

**Seeding Data**:
```bash
bun src/db/seed-orgs.ts
```

Creates:
- 2 organizations (SuperFly, FlyHigh)
- 4 users with hashed passwords
- Sample org memberships
- Sample observations

---

## API Reference

### Base URL
```
http://localhost:7800
```

### Authentication Endpoints

#### POST `/auth/sign-up`
Create new user account

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "User Name"
}
```

**Response**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

#### POST `/auth/sign-in`
Authenticate user and receive JWT token

**Request Body**:
```json
{
  "email": "johnny@superfly.ai",
  "password": "SuperFly123"
}
```

**Response**:
```json
{
  "user": {
    "id": "a0000000-0000-0000-0000-000000000001",
    "email": "johnny@superfly.ai",
    "name": "Johnny Admin",
    "org_id": "b0000000-0000-0000-0000-000000000001",
    "org_slug": "superfly",
    "org_role": "owner"
  },
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Token Expiration**: 7 days (604800 seconds)

### Organization Endpoints

All endpoints require `Authorization: Bearer {token}` header.

#### GET `/api/orgs`
List organizations user is a member of

**Response**:
```json
{
  "organizations": [
    {
      "id": "uuid",
      "slug": "superfly",
      "name": "SuperFly",
      "fly_app_name": null,
      "fly_machine_id": null,
      "status": "active",
      "created_at": "2026-03-15T18:19:36.583Z",
      "updated_at": "2026-03-15T18:19:36.583Z",
      "role": "owner"
    }
  ]
}
```

#### GET `/api/orgs/:slug`
Get single organization details

**Response**:
```json
{
  "organization": {
    "id": "uuid",
    "slug": "superfly",
    "name": "SuperFly",
    "fly_app_name": null,
    "fly_machine_id": null,
    "status": "active",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "role": "owner"
  }
}
```

#### POST `/api/orgs`
Create new organization with Fly.io provisioning

**Request Body**:
```json
{
  "org_slug": "neworg",
  "org_name": "New Organization",
  "region": "sea"  // Optional: Fly.io region
}
```

**Response**:
```json
{
  "organization": {
    "id": "uuid",
    "slug": "neworg",
    "name": "New Organization",
    "fly_app_name": "neworg-flysaas",
    "fly_machine_id": "machine-id",
    "status": "active"
  },
  "fly_url": "https://neworg-flysaas.fly.dev"
}
```

**Note**: Automatically provisions Fly.io infrastructure and adds creator as owner.

#### PATCH `/api/orgs/:slug`
Update organization (admin/owner only)

**Request Body**:
```json
{
  "status": "suspended"
}
```

### Observer AI Endpoints

#### POST `/api/observations`
Submit new observation (bug/enhancement/feature)

**Request Body**:
```json
{
  "type": "bug",
  "description": "The login button doesn't work on mobile",
  "url": "https://app.example.com/login"  // Optional
}
```

**Response**:
```json
{
  "observation": {
    "id": "uuid",
    "org_id": "uuid",
    "user_id": "uuid",
    "type": "bug",
    "description": "...",
    "url": "...",
    "status": "new",
    "priority": "medium",
    "created_at": "timestamp"
  }
}
```

#### GET `/api/observations`
List observations (Observer Admin only)

**Query Parameters**:
- `status`: Filter by status (new, reviewing, planned, in_progress, completed, rejected)
- `type`: Filter by type (bug, enhancement, feature)
- `priority`: Filter by priority (low, medium, high, urgent)
- `limit`: Results per page (default: 100)
- `offset`: Pagination offset (default: 0)

**Response**:
```json
{
  "observations": [
    {
      "id": "uuid",
      "type": "bug",
      "description": "...",
      "url": "...",
      "status": "new",
      "priority": "high",
      "notes": null,
      "created_at": "timestamp",
      "updated_at": "timestamp",
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "assigned_to_name": null
    }
  ],
  "total": 42,
  "limit": 100,
  "offset": 0
}
```

#### GET `/api/observations/:id`
Get single observation details

**Permission**: Creator, Observer Admin, or owner/admin

#### PATCH `/api/observations/:id`
Update observation (Observer Admin only)

**Request Body**:
```json
{
  "status": "in_progress",
  "priority": "high",
  "assigned_to": "user-uuid",
  "notes": "Working on a fix for next release"
}
```

#### DELETE `/api/observations/:id`
Delete observation (Observer Admin only)

#### GET `/api/observations/stats/summary`
Get observation statistics (Observer Admin only)

**Response**:
```json
{
  "stats": {
    "total": 42,
    "new": 12,
    "reviewing": 5,
    "planned": 8,
    "in_progress": 10,
    "completed": 5,
    "rejected": 2,
    "bugs": 20,
    "enhancements": 15,
    "features": 7,
    "urgent": 3,
    "high": 10,
    "medium": 20,
    "low": 9
  }
}
```

### Core CRM Endpoints

#### Contacts

- **GET** `/api/core/contacts` - List contacts
- **POST** `/api/core/contacts` - Create contact
- **PATCH** `/api/core/contacts/:id` - Update contact
- **DELETE** `/api/core/contacts/:id` - Delete contact

#### Deals

- **GET** `/api/core/deals` - List deals
- **POST** `/api/core/deals` - Create deal
- **PATCH** `/api/core/deals/:id` - Update deal
- **DELETE** `/api/core/deals/:id` - Delete deal

---

## Authentication System

### JWT Structure

**Algorithm**: HS256 (HMAC with SHA-256)
**Library**: `jose` (JavaScript Object Signing and Encryption)
**Secret**: Stored in `JWT_SECRET` environment variable

**Token Payload**:
```typescript
{
  user_id: string;      // Primary key from users table
  email: string;        // User email
  name: string;         // Display name
  org_id: string;       // User's primary/default organization
  org_slug: string;     // Organization slug for routing
  org_role: string;     // User's role in this organization
  iat: number;          // Issued at (Unix timestamp)
  exp: number;          // Expiration (7 days from iat)
}
```

### Password Security

**Hashing Algorithm**: Argon2 (via Bun.password)
**Implementation**:
```typescript
// Hashing
const hash = await Bun.password.hash(plainPassword);

// Verification
const isValid = await Bun.password.verify(plainPassword, hash);
```

**Why Argon2**: Memory-hard function resistant to GPU cracking attacks.

### Token Verification Pattern

Used in all protected routes:

```typescript
import { verifyToken } from "../auth/jwt";
import type { JWTPayload } from "../auth/jwt";

async ({ headers, set }) => {
  // Extract token from Authorization header
  const authHeader = headers['authorization'];
  const token = authHeader?.replace(/^Bearer\s+/i, '');

  if (!token) {
    set.status = 401;
    return { error: 'Unauthorized' };
  }

  // Verify and decode token
  let payload: JWTPayload;
  try {
    payload = await verifyToken(token);
  } catch (error) {
    set.status = 401;
    return { error: 'Invalid token' };
  }

  // Extract user ID for authorization
  const userId = payload.user_id;

  // Perform operation...
}
```

### Role-Based Access Control

**Roles**:
1. **owner** - Full control of organization
2. **admin** - User and settings management
3. **member** - Standard user access

**Special Permissions**:
- **is_observer_admin**: Can manage observations (separate from admin role)

**Authorization Checks**:
```typescript
// Check if user is owner or admin
const member = await sql`
  SELECT role FROM org_members
  WHERE org_id = ${orgId} AND user_id = ${userId}
`.then(rows => rows[0]);

if (!['owner', 'admin'].includes(member.role)) {
  set.status = 403;
  return { error: 'Insufficient permissions' };
}
```

---

## Development Guide

### Prerequisites

- **Bun**: v1.0+ (JavaScript runtime)
- **Node.js**: v18+ (for Vite dev server)
- **PostgreSQL**: v14+ (database)
- **Fly.io CLI**: For deployment (optional for local dev)

### Environment Setup

#### 1. Database Setup

```bash
# Create PostgreSQL database
createdb flysaas

# Or using psql
psql -U postgres
CREATE DATABASE flysaas;
```

#### 2. Backend Setup

```bash
cd /apps/flysaas-superorg

# Create .env file
cat > .env << EOF
PORT=7800
DATABASE_URL=postgres://johnnycrupi@localhost:5432/flysaas
JWT_SECRET=local-dev-secret-change-in-production
FLY_API_TOKEN=your-fly-api-token
EOF

# Install dependencies
bun install

# Run migrations
bun src/db/migrate.ts

# Seed data (optional)
bun src/db/seed-orgs.ts

# Start server
bun src/index.ts
```

Server runs on http://localhost:7800

#### 3. Frontend Setup

```bash
cd /apps/flysaas-admin

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs on http://localhost:3002

### Default Test Accounts

After seeding:

**SuperFly Organization**:
- johnny@superfly.ai / SuperFly123 (Owner, Observer Admin)
- sarah@superfly.ai / SuperFly123 (Admin)

**FlyHigh Organization**:
- mike@flyhigh.ai / FlyHigh123 (Owner, Observer Admin)
- emily@flyhigh.ai / FlyHigh123 (Member)

### Common Development Tasks

#### Create Database Migration

```bash
cd /apps/flysaas-superorg/src/db/migrations
touch 004_new_migration.sql
```

Update `/apps/flysaas-superorg/src/db/migrate.ts` to include new migration.

#### Test API Endpoint

```bash
# Login
TOKEN=$(curl -X POST http://localhost:7800/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"johnny@superfly.ai","password":"SuperFly123"}' \
  -s | jq -r '.token')

# Test endpoint
curl -X GET "http://localhost:7800/api/orgs" \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq '.'
```

#### Reset Database

```bash
# Drop and recreate database
dropdb flysaas
createdb flysaas

# Run migrations and seed
cd /apps/flysaas-superorg
bun src/db/migrate.ts
bun src/db/seed-orgs.ts
```

---

## Deployment Architecture

### Fly.io Multi-Tenant Model

```
┌────────────────────────────────────────────────────┐
│            FlySaaS Platform (Superorg)             │
│                                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │  superfly-flysaas.fly.dev                    │ │
│  │  - Backend API (Elysia)                      │ │
│  │  - PostgreSQL (Fly Postgres)                 │ │
│  │  - Manages all organizations                 │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
└────────────────────────────────────────────────────┘
                         │
                         │ Provisions
                         ▼
        ┌────────────────────────────────┐
        │    Client Organizations        │
        │                                 │
        │  ┌──────────────────────────┐  │
        │  │  acme-flysaas.fly.dev    │  │
        │  │  - Client Template App   │  │
        │  │  - Org-specific config   │  │
        │  └──────────────────────────┘  │
        │                                 │
        │  ┌──────────────────────────┐  │
        │  │  widgets-flysaas.fly.dev │  │
        │  │  - Client Template App   │  │
        │  │  - Org-specific config   │  │
        │  └──────────────────────────┘  │
        │                                 │
        └────────────────────────────────┘
```

### Provisioning Flow

1. **Create Organization** (via POST `/api/orgs`)
2. **ProvisioningService.provisionOrg()**:
   - Creates Fly.io app: `{org_slug}-flysaas`
   - Deploys client template Docker image
   - Configures environment variables
   - Allocates machine in specified region
   - Returns `fly_app_name` and `fly_machine_id`
3. **Store in Database**: Update organizations table
4. **DNS Ready**: Organization accessible at `{org_slug}-flysaas.fly.dev`

### Environment Variables (Production)

**Superorg Backend**:
```env
PORT=8080
DATABASE_URL=postgres://user:pass@host:5432/flysaas
JWT_SECRET=production-secret-key-minimum-32-chars
FLY_API_TOKEN=fly_api_token_here
NODE_ENV=production
```

**Client Template**:
```env
SUPERORG_API_URL=https://superfly-flysaas.fly.dev
ORG_SLUG=client-org-slug
ORG_ID=uuid-from-database
```

---

## Common Patterns

### 1. Multi-Tenancy Pattern

**Organization Isolation**:
All data queries must scope by `org_id`:

```typescript
// ✅ CORRECT: Scoped to organization
const contacts = await sql`
  SELECT * FROM contacts
  WHERE org_id = ${orgId}
`;

// ❌ WRONG: Returns all contacts across all orgs
const contacts = await sql`
  SELECT * FROM contacts
`;
```

**User Authorization**:
Always verify user belongs to organization:

```typescript
const membership = await sql`
  SELECT om.role
  FROM org_members om
  JOIN organizations o ON o.id = om.org_id
  WHERE o.slug = ${orgSlug} AND om.user_id = ${userId}
`.then(rows => rows[0]);

if (!membership) {
  set.status = 404;
  return { error: 'Organization not found' };
}
```

### 2. Frontend Data Fetching Pattern

Using TanStack Query:

```typescript
// hooks/useOrganizations.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: () => api.getOrganizations(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Component usage
function OrganizationsPage() {
  const { data, isLoading, error } = useOrganizations();

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      {data.organizations.map(org => (
        <OrgCard key={org.id} org={org} />
      ))}
    </div>
  );
}
```

### 3. Error Handling Pattern

**Backend**:
```typescript
try {
  const result = await someOperation();
  return { success: true, data: result };
} catch (error) {
  console.error('Operation failed:', error);
  set.status = 500;
  return { error: 'Internal server error' };
}
```

**Frontend**:
```typescript
try {
  const result = await api.createOrganization(slug, name);
  toast.success('Organization created!');
  return result;
} catch (error) {
  toast.error(error.message || 'Failed to create organization');
  throw error;
}
```

### 4. Timestamp Pattern

All tables use `created_at` and `updated_at`:

```sql
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
```

Update `updated_at` on modifications:
```typescript
await sql`
  UPDATE organizations
  SET
    name = ${newName},
    updated_at = NOW()
  WHERE id = ${orgId}
`;
```

---

## Troubleshooting

### Common Issues

#### 1. "Invalid token" on API requests

**Symptoms**: API returns 401 with "Invalid token" error

**Causes**:
- Token expired (7 day expiration)
- JWT_SECRET mismatch between environments
- Token not properly formatted in Authorization header

**Solutions**:
```bash
# Check token expiration
echo "TOKEN_HERE" | cut -d. -f2 | base64 -d | jq '.exp'

# Verify Authorization header format
curl -v "http://localhost:7800/api/orgs" \
  -H "Authorization: Bearer TOKEN_HERE"

# Re-login to get fresh token
curl -X POST http://localhost:7800/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"johnny@superfly.ai","password":"SuperFly123"}'
```

#### 2. Database connection errors

**Symptoms**: "role 'postgres' does not exist" or connection refused

**Causes**:
- PostgreSQL not running
- Wrong DATABASE_URL format
- User doesn't have database permissions

**Solutions**:
```bash
# Check if PostgreSQL is running
pg_isready

# Verify database exists
psql -l | grep flysaas

# Test connection
psql postgres://johnnycrupi@localhost:5432/flysaas

# Fix DATABASE_URL in .env
DATABASE_URL=postgres://YOUR_USERNAME@localhost:5432/flysaas
```

#### 3. "0 Organizations" showing on frontend

**Symptoms**: Organizations page shows empty list despite user having orgs

**Causes**:
- Frontend pointing to wrong API URL
- CORS issues
- Token not being sent with requests

**Solutions**:
```typescript
// Check API_URL in /apps/flysaas-admin/src/lib/api.ts
const API_URL = 'http://localhost:7800'; // Must match backend port

// Verify token is stored
console.log(localStorage.getItem('flysaas_token'));

// Check network tab in browser DevTools
// Look for Authorization header in request
```

#### 4. Observations returning 403 "Not authorized as Observer Admin"

**Symptoms**: User can't view observations list

**Causes**:
- User not marked as Observer Admin
- User not owner/admin of organization

**Solutions**:
```sql
-- Check user's Observer Admin status
SELECT om.role, om.is_observer_admin
FROM org_members om
WHERE om.user_id = 'USER_UUID';

-- Grant Observer Admin permission
UPDATE org_members
SET is_observer_admin = true
WHERE user_id = 'USER_UUID' AND org_id = 'ORG_UUID';
```

#### 5. Port already in use (EADDRINUSE)

**Symptoms**: Can't start server, port 7800 or 3002 already in use

**Solutions**:
```bash
# Find process on port 7800
lsof -i:7800

# Kill process
lsof -ti:7800 | xargs kill -9

# Or use different port in .env
PORT=7801
```

### Debugging Tips

**Enable Verbose Logging**:
```typescript
// In src/index.ts
app.onRequest(({ request }) => {
  console.log(`${request.method} ${request.url}`);
});

app.onError(({ error, request }) => {
  console.error('Error:', error);
  console.error('Request:', request.method, request.url);
});
```

**Check SQL Queries**:
```typescript
// Add before sql`` tagged template
console.log('Executing query:', query);
const result = await sql`...`;
console.log('Result:', result);
```

**Monitor Database**:
```bash
# Watch live queries
psql flysaas
\x auto
SELECT * FROM pg_stat_activity WHERE datname = 'flysaas';
```

---

## API Quick Reference

### Authentication
- `POST /auth/sign-up` - Create account
- `POST /auth/sign-in` - Login (returns JWT)

### Organizations
- `GET /api/orgs` - List user's organizations
- `GET /api/orgs/:slug` - Get organization details
- `POST /api/orgs` - Create organization (provisions Fly.io)
- `PATCH /api/orgs/:slug` - Update organization

### Observer AI
- `POST /api/observations` - Submit feedback
- `GET /api/observations` - List (Observer Admin)
- `GET /api/observations/:id` - Get details
- `PATCH /api/observations/:id` - Update (Observer Admin)
- `DELETE /api/observations/:id` - Delete (Observer Admin)
- `GET /api/observations/stats/summary` - Statistics

### Core CRM - Contacts
- `GET /api/core/contacts` - List
- `POST /api/core/contacts` - Create
- `PATCH /api/core/contacts/:id` - Update
- `DELETE /api/core/contacts/:id` - Delete

### Core CRM - Deals
- `GET /api/core/deals` - List
- `POST /api/core/deals` - Create
- `PATCH /api/core/deals/:id` - Update
- `DELETE /api/core/deals/:id` - Delete

---

## Key Takeaways for AI Assistants

### When helping with FlySaaS:

1. **Always scope by organization**: Check `org_id` in all database queries
2. **Verify authentication**: Use the direct token verification pattern, not middleware
3. **Use TypeScript types**: Import from `@bree-ai/flysaas-types` for consistency
4. **Test with seeded data**: Use johnny@superfly.ai or mike@flyhigh.ai accounts
5. **Check role permissions**: Verify user role before allowing operations
6. **Handle errors gracefully**: Return proper HTTP status codes and error messages
7. **Use TanStack Query**: For frontend data fetching with caching
8. **Follow migration pattern**: New DB changes go in new migration files
9. **Update both frontend and backend**: API changes need updates in api.ts client
10. **Test with curl**: Verify API endpoints work before testing in frontend

### Architecture Decisions

- **No middleware for auth**: Direct token verification in routes (Elysia middleware didn't work reliably)
- **Bun for backend**: Faster than Node.js, built-in password hashing
- **PostgreSQL**: ACID compliance for multi-tenant data integrity
- **JWT**: Stateless authentication for scalability
- **Fly.io**: Geographic distribution and automatic scaling per org

---

**End of FlySaaS AgentX Documentation**

For questions or updates, refer to the source code or database schema directly.
