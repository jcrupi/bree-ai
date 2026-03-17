# FlySaaS Client Org Template

Tenant-specific application template for FlySaaS multi-tenant architecture.

## Overview

Client Org Template is the foundation for each tenant's isolated application instance:
- **JWKS Validation**: Validates JWT tokens from SuperOrg
- **SQLite Database**: Isolated per-tenant data storage
- **FatCRM Extensions**: Tenant-specific CRM functionality
- **AI Feature Generation**: Mock AI code generation (MVP)

Each tenant gets their own Fly.io machine running this template with:
- Isolated database
- Custom features
- AI-powered extensions

## Features

### Authentication
- **JWKS Validation**: Verifies JWT from SuperOrg using public keys
- **Org Verification**: Ensures token `org_id` matches instance
- **Session Management**: Extracts user and org context from JWT

### CRM (FatCRM Extensions)
- **Contacts API**: `/api/contacts` - Tenant-specific contact management
- **Deals API**: `/api/deals` - Tenant-specific deal pipeline
- SQLite storage for fast, isolated data access

### AI Feature Generation (MVP Stub)
- **Generate Features**: `/api/ai/generate` - Mock code generation
- **List Features**: `/api/ai/features` - View generated features
- **Feature Management**: Enable/disable generated code

## Quick Start

### Prerequisites
- Bun 1.0+
- Running SuperOrg instance (for JWKS validation)

### Local Development

1. **Install dependencies**:
   ```bash
   cd /path/to/monorepo
   bun install
   ```

2. **Configure environment**:
   ```bash
   cd apps/flysaas-client-template
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Run migrations & seed**:
   ```bash
   bun src/db/migrate.ts
   bun src/db/seed.ts
   ```

4. **Start dev server**:
   ```bash
   ORG_ID=corp-ai bun dev
   ```

5. **Access services**:
   - API: http://localhost:3001
   - Swagger: http://localhost:3001/swagger
   - Health: http://localhost:3001/health

## API Documentation

### Contacts

**List Contacts**:
```bash
curl http://localhost:3001/api/contacts \
  -H "Authorization: Bearer <token>"
```

**Create Contact**:
```bash
curl -X POST http://localhost:3001/api/contacts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Smith","email":"jane@startup.io","company":"StartupIO"}'
```

**Update Contact**:
```bash
curl -X PATCH http://localhost:3001/api/contacts/<id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"CEO"}'
```

### Deals

**List Deals**:
```bash
curl http://localhost:3001/api/deals \
  -H "Authorization: Bearer <token>"
```

**Create Deal**:
```bash
curl -X POST http://localhost:3001/api/deals \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Startup Package","amount":25000,"stage":"negotiation"}'
```

### AI Features

**Generate Feature** (MVP stub):
```bash
curl -X POST http://localhost:3001/api/ai/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Add lead scoring to deals"}'
```

**List Generated Features**:
```bash
curl http://localhost:3001/api/ai/features \
  -H "Authorization: Bearer <token>"
```

**Get Feature Code**:
```bash
curl http://localhost:3001/api/ai/features/<id> \
  -H "Authorization: Bearer <token>"
```

## Database Schema

### Contacts
- `id` (TEXT): UUID primary key
- `org_id` (TEXT): Organization identifier
- `name`, `email`, `phone`, `company`, `title`: CRM fields
- `created_at`, `updated_at`: Timestamps

### Deals
- `id` (TEXT): UUID primary key
- `org_id` (TEXT): Organization identifier
- `contact_id` (TEXT): Foreign key to contacts
- `title`, `amount`, `stage`, `probability`, `expected_close_date`: Sales fields
- `created_at`, `updated_at`: Timestamps

### Features (AI-Generated)
- `id` (TEXT): UUID primary key
- `org_id` (TEXT): Organization identifier
- `name`, `description`: Feature metadata
- `code` (TEXT): Generated code
- `enabled` (INTEGER): 1 = active, 0 = disabled
- `created_at`, `updated_at`: Timestamps

## Deployment

### Fly.io Provisioning

Client orgs are automatically provisioned when created via SuperOrg:

```bash
curl -X POST https://flysaas-superorg.fly.dev/api/orgs \
  -H "Authorization: Bearer <token>" \
  -d '{"org_slug":"my-org","org_name":"My Organization"}'
```

This:
1. Creates Fly app: `flysaas-my-org`
2. Deploys client template image
3. Mounts persistent volume for SQLite
4. Configures environment variables
5. Waits for health check

### Manual Deployment

For testing or custom deployments:

```bash
# Build and push image
docker build -f Dockerfile -t registry.fly.io/flysaas-my-org:latest ../..
flyctl auth docker
docker push registry.fly.io/flysaas-my-org:latest

# Deploy
flyctl apps create flysaas-my-org
flyctl volumes create client_data --size 1 --app flysaas-my-org
flyctl secrets set ORG_ID=my-org SUPERORG_JWKS_URL=https://flysaas-superorg.fly.dev/auth/jwks --app flysaas-my-org
flyctl deploy --image registry.fly.io/flysaas-my-org:latest --app flysaas-my-org
```

## Testing

### Client Org Tests

Run client org-specific tests:

```bash
./scripts/test-client-org.sh
```

Tests:
1. Health check
2. Contact creation
3. Deal creation
4. AI feature generation
5. Feature code retrieval
6. Proxy routing (via SuperOrg)

## Project Structure

```
apps/flysaas-client-template/
├── src/
│   ├── auth/
│   │   └── jwks-validator.ts   # JWKS validation
│   ├── db/
│   │   ├── schema.sql          # SQLite schema
│   │   ├── migrate.ts          # Migration runner
│   │   └── seed.ts             # Seed data
│   ├── middleware/
│   │   └── auth.ts             # Auth middleware
│   ├── routes/
│   │   ├── contacts.ts         # Contacts API
│   │   ├── deals.ts            # Deals API
│   │   └── ai.ts               # AI features
│   └── index.ts                # Main app
├── Dockerfile
├── fly.template.toml
└── package.json
```

## Development

### Add New Route

1. Create route in `src/routes/`
2. Add table to `src/db/schema.sql` (if needed)
3. Run migration
4. Register route in `src/index.ts`

### Debugging

```bash
# Local
DEBUG=* ORG_ID=corp-ai bun dev

# Fly.io
flyctl logs --app flysaas-<org-slug>
```

### Database Access

```bash
# Local
sqlite3 ./data/corp-ai.db

# Fly.io
flyctl ssh console --app flysaas-<org-slug>
sqlite3 /app/data/client.db
```

## AI Feature Generation (Future)

Current MVP stub will be replaced with:
- Claude API integration for real code generation
- In-browser Monaco Editor for code editing
- Hot module reload system
- Version control for generated features
- Testing framework for AI-generated code

## Contributing

See [DEVELOPMENT.md](../../docs/DEVELOPMENT.md) for development guidelines.

## License

Proprietary - BREE AI
