# FlySaaS - Quick Start Guide

Get FlySaaS running in 5 minutes.

## Prerequisites

- [Bun](https://bun.sh) 1.0+ installed
- [Docker](https://www.docker.com/) installed
- [jq](https://stedolan.github.io/jq/) (for testing scripts)

## 🚀 Start in 3 Steps

### 1. Start the Stack

```bash
cd /path/to/bree-ai-monorepo/apps/flysaas-superorg
docker-compose up
```

This starts:
- PostgreSQL (port 5432)
- SuperOrg (port 3000)
- Client Org "corp-ai" (port 3001)

Wait for:
```
✅ Database initialized
🚀 FlySaaS SuperOrg running on port 3000
🚀 FlySaaS Client Org (corp-ai) running on port 3001
```

### 2. Create a User

```bash
curl -X POST http://localhost:3000/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@flysaas.dev",
    "password": "Demo123!",
    "name": "Demo User"
  }'
```

### 3. Sign In & Get Token

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@flysaas.dev",
    "password": "Demo123!"
  }' | jq -r '.token')

echo "Token: $TOKEN"
```

## 🎯 Try Key Features

### SuperOrg Features

**Create Contact (Core CRM)**:
```bash
curl -X POST http://localhost:3000/api/core/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@startup.io",
    "company": "StartupIO",
    "title": "CEO"
  }'
```

**Create Deal**:
```bash
curl -X POST http://localhost:3000/api/core/deals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Enterprise Package",
    "amount": 50000,
    "stage": "proposal",
    "probability": 70
  }'
```

**List Contacts**:
```bash
curl http://localhost:3000/api/core/contacts \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Client Org Features

**Create Contact in Client Org**:
```bash
curl -X POST http://localhost:3001/api/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Johnson",
    "email": "bob@enterprise.com",
    "company": "Enterprise Corp"
  }'
```

**Generate AI Feature (Mock)**:
```bash
curl -X POST http://localhost:3001/api/ai/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Add lead scoring to deals based on company size"
  }'
```

**List AI Features**:
```bash
curl http://localhost:3001/api/ai/features \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Proxy Routing (SuperOrg → Client Org)

**Access Client Org via SuperOrg Gateway**:
```bash
curl http://localhost:3000/api/orgs/corp-ai/apps/contacts \
  -H "Authorization: Bearer $TOKEN" | jq
```

## 📚 Explore APIs

### Swagger UI

- **SuperOrg**: http://localhost:3000/swagger
- **Client Org**: http://localhost:3001/swagger

### Health Checks

```bash
curl http://localhost:3000/health
curl http://localhost:3001/health
```

### JWKS Endpoint

```bash
curl http://localhost:3000/auth/jwks | jq
```

## 🧪 Run Tests

### E2E Tests (SuperOrg)

```bash
cd /path/to/bree-ai-monorepo
./scripts/e2e-test.sh
```

### Client Org Tests

```bash
./scripts/test-client-org.sh
```

## 🛠️ Development

### Watch Logs

```bash
# SuperOrg
docker-compose logs -f superorg

# Client Org
docker-compose logs -f client-corp-ai

# All services
docker-compose logs -f
```

### Restart Services

```bash
docker-compose restart superorg
docker-compose restart client-corp-ai
```

### Stop Stack

```bash
docker-compose down
```

### Clean Everything

```bash
docker-compose down -v  # Removes volumes (databases)
```

## 📖 Next Steps

1. **Read Documentation**:
   - [Main README](README.md)
   - [SuperOrg README](apps/flysaas-superorg/README.md)
   - [Client Template README](apps/flysaas-client-template/README.md)

2. **Explore Code**:
   - SuperOrg: `apps/flysaas-superorg/src/`
   - Client Template: `apps/flysaas-client-template/src/`
   - Shared Packages: `packages/flysaas-*/`

3. **Deploy to Fly.io**:
   ```bash
   export JWT_SECRET=$(openssl rand -hex 32)
   export FLY_API_TOKEN=<your-token>
   ./scripts/deploy-flysaas.sh
   ```

## 💡 Tips

### Save Token for Session

```bash
export TOKEN="<your-jwt-token>"
# Now you can use $TOKEN in all requests
```

### Pretty Print JSON

```bash
curl http://localhost:3000/api/core/contacts \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

### Create Multiple Test Users

```bash
for i in {1..5}; do
  curl -s -X POST http://localhost:3000/auth/sign-up \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"user$i@test.com\",\"password\":\"Test123!\",\"name\":\"User $i\"}"
done
```

### Seed Sample Data

The client org is automatically seeded with:
- 3 sample contacts
- 3 sample deals

View them:
```bash
curl http://localhost:3001/api/contacts -H "Authorization: Bearer $TOKEN" | jq
curl http://localhost:3001/api/deals -H "Authorization: Bearer $TOKEN" | jq
```

## 🚨 Troubleshooting

### "Connection refused" errors

Make sure Docker Compose is running:
```bash
docker-compose ps
```

### "Unauthorized" errors

Your token may have expired. Get a new one:
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@flysaas.dev","password":"Demo123!"}' \
  | jq -r '.token')
```

### Database issues

Reset the database:
```bash
docker-compose down -v  # Removes volumes
docker-compose up       # Fresh start
```

### Port conflicts

If ports 3000/3001/5432 are in use, edit `docker-compose.yml`:
```yaml
ports:
  - '3010:3000'  # Use port 3010 instead
```

## 📞 Support

- **Issues**: https://github.com/anthropics/bree-ai/issues
- **Documentation**: See README.md files
- **Implementation Details**: See IMPLEMENTATION.md

---

**Ready to build the future of multi-tenant SaaS!** 🚀
