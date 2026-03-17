# FlySaaS Superfly

Control plane for AI-native multi-tenant SaaS platform with distributed architecture.

## Overview

Superfly is the central control plane that:
- Manages authentication and authorization (Better-Auth + JWT)
- Provides FatCRM core features (Contacts, Deals)
- Routes requests to tenant-specific org machines
- Provisions new client orgs on Fly.io

## Architecture

```
┌─────────────────────────────────────┐
│       FlySaaS Superfly              │
│                                     │
│  ┌──────────┐    ┌──────────────┐  │
│  │ Auth     │    │ FatCRM Core  │  │
│  │ (Better  │    │ - Contacts   │  │
│  │  Auth)   │    │ - Deals      │  │
│  └──────────┘    └──────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │      API Gateway             │  │
│  │  Routes to client org        │  │
│  │  machines via Fly 6PN        │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Provisioning Service       │  │
│  │  Creates Fly.io machines     │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│   Client Org Machines (Fly.io)     │
│  - Isolated SQLite databases        │
│  - Custom AI-generated features     │
│  - Tenant-specific CRM extensions   │
└─────────────────────────────────────┘
```

## Features

### Authentication & Authorization
- **Better-Auth**: Email/password auth with organization support
- **Custom JWT Claims**: `org_id`, `org_slug`, `org_role`, `org_status`
- **JWKS Endpoint**: `/auth/jwks` for token validation by client orgs
- **Multi-tenant RBAC**: owner, admin, member, viewer roles

### FatCRM Core
- **Contacts API**: `/api/core/contacts`
- **Deals API**: `/api/core/deals`
- Multi-tenant isolation (filter by `org_id`)
- Full CRUD operations with PostgreSQL

### API Gateway
- Routes `/api/orgs/:orgSlug/apps/*` to client org machines
- JWT validation and org verification
- Fly 6PN private networking in production
- Localhost proxy for local development

### Provisioning
- Automated Fly.io app creation
- Docker image deployment
- Health check polling
- Organization status management

## Quick Start

### Prerequisites
- Bun 1.0+
- PostgreSQL 16+ (or Docker)
- Fly.io account (for deployment)

### Local Development

1. **Install dependencies**:
   ```bash
   cd /path/to/monorepo
   bun install
   ```

2. **Configure environment**:
   ```bash
   cd apps/flysaas-superorg
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Start PostgreSQL** (or use Docker Compose):
   ```bash
   docker-compose up postgres -d
   ```

4. **Run migrations**:
   ```bash
   bun src/db/migrate.ts
   ```

5. **Start dev server**:
   ```bash
   bun dev
   ```

6. **Access services**:
   - API: http://localhost:3000
   - Swagger: http://localhost:3000/swagger
   - JWKS: http://localhost:3000/auth/jwks

### Docker Compose (Full Stack)

Run Superfly + Client Org + PostgreSQL:

```bash
docker-compose up
```

Access:
- Superfly: http://localhost:3000
- Client Org (corp-ai): http://localhost:3001

## API Documentation

### Authentication

**Sign Up**:
```bash
curl -X POST http://localhost:3000/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"John Doe"}'
```

**Sign In**:
```bash
curl -X POST http://localhost:3000/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Organizations

**Create Organization** (with auto-provisioning):
```bash
curl -X POST http://localhost:3000/api/orgs \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"org_slug":"my-org","org_name":"My Organization","region":"iad"}'
```

**List Organizations**:
```bash
curl http://localhost:3000/api/orgs \
  -H "Authorization: Bearer <token>"
```

### FatCRM Core

**Create Contact**:
```bash
curl -X POST http://localhost:3000/api/core/contacts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","phone":"+1-555-0100"}'
```

**Create Deal**:
```bash
curl -X POST http://localhost:3000/api/core/deals \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Enterprise Deal","amount":50000,"stage":"proposal"}'
```

### Proxy (to Client Orgs)

**Access Client Org via Proxy**:
```bash
curl http://localhost:3000/api/orgs/my-org/apps/contacts \
  -H "Authorization: Bearer <token>"
```

## Deployment

### Fly.io Deployment

1. **Install Fly CLI**:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login**:
   ```bash
   flyctl auth login
   ```

3. **Deploy**:
   ```bash
   cd /path/to/monorepo
   ./scripts/deploy-flysaas.sh
   ```

This will:
- Create and deploy Superfly app
- Set up PostgreSQL database
- Run migrations
- Build and push client template image

### Environment Variables (Production)

Set via Fly.io secrets:

```bash
flyctl secrets set \
  JWT_SECRET="<generated-secret>" \
  FLY_API_TOKEN="<your-fly-token>" \
  --app flysaas-superorg
```

## Database Schema

### Organizations
- `id` (UUID): Primary key
- `slug` (TEXT): Unique org identifier
- `name` (TEXT): Display name
- `fly_app_name` (TEXT): Fly.io app name
- `fly_machine_id` (TEXT): Machine ID
- `status` (TEXT): provisioning | active | suspended | deleted

### Users
- Managed by Better-Auth
- `id`, `email`, `name`, `email_verified`, timestamps

### Org Members (RBAC)
- `org_id` + `user_id` (composite PK)
- `role`: owner | admin | member | viewer

### Contacts (FatCRM)
- Multi-tenant with `org_id` foreign key
- Standard CRM fields (name, email, phone, company, title)

### Deals (FatCRM)
- Multi-tenant with `org_id` foreign key
- Linked to contacts
- Sales pipeline fields (title, amount, stage, probability, expected_close_date)

## Testing

### E2E Tests

Run comprehensive end-to-end tests:

```bash
./scripts/e2e-test.sh
```

Tests:
1. Health check
2. JWKS endpoint
3. User sign up/sign in
4. Organization creation
5. Contact CRUD (core CRM)
6. Deal CRUD (core CRM)
7. Proxy routing

### Manual Testing

Use the included Swagger UI:
- Local: http://localhost:3000/swagger
- Production: https://flysaas-superorg.fly.dev/swagger

## Project Structure

```
apps/flysaas-superorg/
├── src/
│   ├── auth/
│   │   ├── better-auth.ts      # Better-Auth config
│   │   └── jwks.ts             # JWKS generation
│   ├── db/
│   │   ├── schema.sql          # Database schema
│   │   ├── migrations/         # SQL migrations
│   │   └── migrate.ts          # Migration runner
│   ├── middleware/
│   │   └── auth.ts             # Auth middleware
│   ├── routes/
│   │   ├── core/
│   │   │   ├── contacts.ts     # Contacts API
│   │   │   └── deals.ts        # Deals API
│   │   └── orgs.ts             # Org management
│   ├── gateway/
│   │   └── router.ts           # Proxy router
│   ├── services/
│   │   └── provisioning.ts     # Provisioning logic
│   └── index.ts                # Main app
├── Dockerfile
├── docker-compose.yml
├── fly.toml
└── package.json
```

## Development

### Add New Core Feature

1. Create route in `src/routes/core/`
2. Add table to `src/db/schema.sql`
3. Run migration
4. Register route in `src/index.ts`

### Debugging

Enable verbose logging:
```bash
DEBUG=* bun dev
```

View logs:
```bash
# Local
bun dev

# Fly.io
flyctl logs --app flysaas-superorg
```

## Contributing

See [DEVELOPMENT.md](../../docs/DEVELOPMENT.md) for development guidelines.

## License

Proprietary - BREE AI
