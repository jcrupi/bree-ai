# FlySaaS - AI-Native Multi-Tenant SaaS Platform

**Proof-of-concept for distributed multi-tenancy with AI-powered customization**

FlySaaS demonstrates a novel architectural pattern where each tenant gets their own isolated application instance with AI-generated features, all orchestrated from a central control plane.

## 🎯 Concept

Traditional multi-tenant SaaS forces all tenants to share the same code and features. FlySaaS enables:

1. **Distributed Multi-Tenancy**: Each tenant runs in their own isolated Fly.io machine
2. **AI-Powered Customization**: Tenants can generate custom features using AI
3. **FatCRM Base**: Core CRM functionality (contacts, deals) available to all tenants
4. **Federated Auth**: Centralized authentication with org-scoped JWT tokens
5. **API Gateway**: Intelligent routing between core features and tenant-specific apps

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────┐
│              FlySaaS SuperOrg                      │
│  (Control Plane - flysaas-superorg.fly.dev)       │
│                                                    │
│  ┌──────────────┐  ┌──────────────┐               │
│  │  Better-Auth │  │  FatCRM Core │               │
│  │  + JWKS      │  │  Contacts    │               │
│  │              │  │  Deals       │               │
│  └──────────────┘  └──────────────┘               │
│                                                    │
│  ┌──────────────────────────────────────────┐     │
│  │          API Gateway Router              │     │
│  │  /api/core/*     → SuperOrg (shared)     │     │
│  │  /api/orgs/X/apps/* → Client Org X       │     │
│  └──────────────────────────────────────────┘     │
│                                                    │
│  ┌──────────────────────────────────────────┐     │
│  │      Provisioning Service                │     │
│  │  - Fly.io API integration                │     │
│  │  - Automated org machine creation        │     │
│  └──────────────────────────────────────────┘     │
└────────────────────────────────────────────────────┘
                       ↓ Fly 6PN
┌────────────────────────────────────────────────────┐
│         Client Org Machines (Tenant Apps)          │
│                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Org: A   │  │ Org: B   │  │ Org: C   │        │
│  │ SQLite   │  │ SQLite   │  │ SQLite   │        │
│  │ JWKS Val │  │ JWKS Val │  │ JWKS Val │        │
│  │ CRM Ext  │  │ CRM Ext  │  │ CRM Ext  │        │
│  │ AI Feat  │  │ AI Feat  │  │ AI Feat  │        │
│  └──────────┘  └──────────┘  └──────────┘        │
│                                                    │
│  Each org = Isolated machine + database           │
│  Custom AI-generated features per org             │
└────────────────────────────────────────────────────┘
```

## ✨ Key Features

### SuperOrg (Control Plane)
- ✅ Better-Auth with organization plugin
- ✅ Custom JWT claims (`org_id`, `org_role`, `org_status`)
- ✅ JWKS endpoint for federated token validation
- ✅ FatCRM core (Contacts & Deals APIs)
- ✅ API Gateway with proxy routing
- ✅ Automated Fly.io provisioning

### Client Org (Tenant Apps)
- ✅ JWKS token validation
- ✅ Isolated SQLite database per tenant
- ✅ CRM extensions (contacts, deals)
- ✅ AI feature generation (MVP stub)
- ✅ Auto-provisioned on Fly.io

### Shared Packages
- ✅ `@bree-ai/flysaas-types`: Shared TypeScript types
- ✅ `@bree-ai/flysaas-auth`: JWKS validation utilities
- ✅ `@bree-ai/flysaas-provisioning`: Fly.io orchestration

## 🚀 Quick Start

### Prerequisites
- Bun 1.0+
- Docker & Docker Compose (for local dev)
- Fly.io account (for deployment)

### Local Development (Full Stack)

1. **Clone and install**:
   ```bash
   cd /path/to/bree-ai-monorepo
   bun install
   ```

2. **Start with Docker Compose**:
   ```bash
   cd apps/flysaas-superorg
   docker-compose up
   ```

   This starts:
   - PostgreSQL (port 5432)
   - SuperOrg (port 3000)
   - Client Org "corp-ai" (port 3001)

3. **Access services**:
   - SuperOrg API: http://localhost:3000
   - SuperOrg Swagger: http://localhost:3000/swagger
   - Client Org API: http://localhost:3001
   - Client Org Swagger: http://localhost:3001/swagger

### Manual Setup (Without Docker)

**Terminal 1 - PostgreSQL**:
```bash
docker run -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=flysaas postgres:16-alpine
```

**Terminal 2 - SuperOrg**:
```bash
cd apps/flysaas-superorg
cp .env.example .env
bun src/db/migrate.ts
bun dev
```

**Terminal 3 - Client Org**:
```bash
cd apps/flysaas-client-template
cp .env.example .env
ORG_ID=corp-ai bun src/db/migrate.ts
ORG_ID=corp-ai bun src/db/seed.ts
ORG_ID=corp-ai bun dev
```

## 📖 Usage Examples

### 1. Sign Up & Sign In

```bash
# Sign up
curl -X POST http://localhost:3000/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"John Doe"}'

# Sign in
curl -X POST http://localhost:3000/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Save the token from response
export TOKEN="<your-jwt-token>"
```

### 2. Create Organization (Auto-Provisions Client Org)

```bash
curl -X POST http://localhost:3000/api/orgs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"org_slug":"my-startup","org_name":"My Startup Inc","region":"iad"}'
```

### 3. Use FatCRM Core (SuperOrg)

```bash
# Create contact in core CRM
curl -X POST http://localhost:3000/api/core/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Smith","email":"jane@startup.io","company":"StartupIO"}'

# Create deal
curl -X POST http://localhost:3000/api/core/deals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Enterprise Deal","amount":50000,"stage":"proposal"}'
```

### 4. Use Client Org Features (Tenant-Specific)

```bash
# Create contact in client org (via proxy)
curl -X POST http://localhost:3000/api/orgs/my-startup/apps/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob Johnson","email":"bob@enterprise.com"}'

# Or access client org directly
curl -X POST http://localhost:3001/api/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Williams","email":"alice@company.com"}'
```

### 5. Generate AI Features (MVP Stub)

```bash
curl -X POST http://localhost:3001/api/ai/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Add lead scoring to deals based on company size and engagement"}'

# List generated features
curl http://localhost:3001/api/ai/features \
  -H "Authorization: Bearer $TOKEN"

# Get feature code
curl http://localhost:3001/api/ai/features/<feature-id> \
  -H "Authorization: Bearer $TOKEN"
```

## 🧪 Testing

### E2E Tests

**SuperOrg Tests**:
```bash
./scripts/e2e-test.sh
```

Tests: Auth, Organizations, Core CRM, Proxy routing

**Client Org Tests**:
```bash
./scripts/test-client-org.sh
```

Tests: Contacts, Deals, AI features, Proxy routing

### Manual Testing

Use Swagger UI:
- SuperOrg: http://localhost:3000/swagger
- Client Org: http://localhost:3001/swagger

## 🚢 Deployment

### Deploy to Fly.io

```bash
# Set environment variables
export JWT_SECRET=$(openssl rand -hex 32)
export FLY_API_TOKEN=<your-fly-token>

# Run deployment script
./scripts/deploy-flysaas.sh
```

This will:
1. Create Fly app: `flysaas-superorg`
2. Provision PostgreSQL database
3. Set secrets (JWT_SECRET, FLY_API_TOKEN)
4. Deploy SuperOrg
5. Build and push client template image
6. Run database migrations

### Access Production

- SuperOrg: https://flysaas-superorg.fly.dev
- Swagger: https://flysaas-superorg.fly.dev/swagger
- JWKS: https://flysaas-superorg.fly.dev/auth/jwks

## 📚 Documentation

- [SuperOrg README](apps/flysaas-superorg/README.md)
- [Client Template README](apps/flysaas-client-template/README.md)
- [Architecture Details](../../docs/ARCHITECTURE.md)
- [Development Guide](../../docs/DEVELOPMENT.md)

## 🎯 Success Criteria (MVP)

- [x] SuperOrg deployed and accessible
- [x] Better-Auth working with JWT + custom claims
- [x] JWKS endpoint returning valid public keys
- [x] Client org "corp-ai" provisioned (local dev)
- [x] Proxy routing `/api/orgs/:slug/apps/*` working
- [x] JWKS validation in client org successful
- [x] Contacts and Deals CRUD in both SuperOrg and client org
- [x] AI feature generation stub returning mock code
- [x] Data isolation verified (no cross-org leakage)

## 🔮 Future Enhancements

### Phase 2 (Post-MVP)
1. **Real AI Code Generation**:
   - Claude API integration
   - In-browser Monaco Editor
   - Hot module reload

2. **Advanced Provisioning**:
   - Auto-scaling client orgs
   - Multi-region deployment
   - Cost tracking per tenant

3. **Enhanced Security**:
   - Rate limiting
   - DDoS protection
   - Audit logging

4. **Data Sync**:
   - Real-time sync SuperOrg ↔ Client Org
   - Conflict resolution
   - Webhook notifications

## 🏆 Why FlySaaS?

### Traditional Multi-Tenant SaaS
- ❌ All tenants share same code
- ❌ Customization through configuration only
- ❌ Feature flags for everyone
- ❌ Security risks from shared infrastructure

### FlySaaS Approach
- ✅ Each tenant gets isolated app instance
- ✅ AI-generated custom features per tenant
- ✅ True data and code isolation
- ✅ Scalable via Fly.io's edge compute

## 📝 License

Proprietary - BREE AI

## 🤝 Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

---

**Built with**: Bun, ElysiaJS, Better-Auth, PostgreSQL, SQLite, Fly.io
