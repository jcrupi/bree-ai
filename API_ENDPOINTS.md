# API Endpoints Configuration

## Production Endpoints (fly.io)

All BREE AI applications are now configured to use the AgentX Collective on fly.io:

### Base URLs

```
AgentX Collective: https://agent-collective-agentx.fly.dev
Ragster:          https://agent-collective-ragster.fly.dev
AntiMatterDB:     https://agent-collective-antimatter.fly.dev
```

### Service Endpoints

#### 1. Ragster (Document Search & RAG)

```
https://agent-collective-ragster.fly.dev/api
```

**Available Operations:**

- `POST /search` - Search documents
- `GET /collections` - List collections
- `POST /collections` - Create collection
- `GET /collections/{id}` - Get collection details
- `DELETE /collections/{id}` - Delete collection
- `POST /index/file` - Upload and index document
- `GET /resources` - List resources
- `GET /health` - Health check
- `POST /chat` - Generate chat response

#### 2. AntiMatterDB (Identity & Organizations)

```
https://agent-collective-antimatter.fly.dev
```

**Available Operations:**

- `GET /api/health` - Health check
- `GET /api/entries?dir={path}` - List entries in directory
- `POST /api/entries` - Create/update entry
- Common paths:
  - `orgs/` - Organizations
  - `orgs/{slug}/users/` - Users in organization
  - `super-org/` - Super organization

#### 3. Collective (Orchestration)

```
https://agent-collective-agentx.fly.dev/api/collective
```

**Available Operations:**

- `POST /chat` - Collective chat
- `GET /health` - Health check

#### 4. Identity Service (via Collective)

```
https://agent-collective-agentx.fly.dev/api/identity
```

**Available Operations:**

- `GET /entries?dir={path}` - List identity entries
- `POST /entries` - Create identity entry
- `GET /entries?path={path}` - Get specific entry

## Local Development Endpoints

When `.env.local` is not present or removed, apps fall back to localhost:

### Ragster

```
http://localhost:8898/api
```

### AgentX Collective

```
http://localhost:9000
```

### AntiMatterDB

```
http://localhost:7198
```

## Application Ports

### KAT.ai

```
http://localhost:8769
```

Configured in: `apps/kat-ai/vite.config.ts`

### Genius Talent

```
http://localhost:5173 (default Vite port)
```

## Testing Endpoints

You can test the fly.io endpoints directly:

### Health Checks

```bash
# Ragster
curl https://agent-collective-ragster.fly.dev/api/health

# Collective
curl https://agent-collective-agentx.fly.dev/api/collective/health

# AntiMatterDB
curl https://agent-collective-antimatter.fly.dev/api/health
```

### List Collections

```bash
curl "https://agent-collective-ragster.fly.dev/api/collections?org_id=kat.ai" \
  -H "x-org-id: kat.ai" \
  -H "x-user-id: user@kat.ai"
```

### List Organizations

```bash
curl "https://agent-collective-agentx.fly.dev/api/identity/entries?dir=orgs"
```

## Environment Variables Reference

| Service           | Environment Variable   | Production Value                               |
| ----------------- | ---------------------- | ---------------------------------------------- |
| AgentX Collective | `VITE_AGENTX_URL`      | `https://agent-collective-agentx.fly.dev`      |
| Ragster           | `VITE_RAGSTER_API_URL` | `https://agent-collective-ragster.fly.dev/api` |
| AntiMatterDB      | `VITE_ANTIMATTER_URL`  | `https://agent-collective-antimatter.fly.dev`  |

## CORS Configuration

The AgentX Collective should have CORS configured to allow requests from:

- `http://localhost:8769` (KAT.ai dev)
- `http://localhost:5173` (Genius Talent dev)
- Production domains (when deployed)

## Authentication

Current configuration uses header-based authentication:

- `x-org-id`: Organization identifier
- `x-user-id`: User identifier

These are set via environment variables:

- `VITE_RAGSTER_DEFAULT_ORG_ID`
- `VITE_RAGSTER_DEFAULT_USER_ID`
