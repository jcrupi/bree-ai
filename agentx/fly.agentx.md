---
title: Fly.io Deployment
type: infrastructure
scope: platform
stack: Fly.io, Docker, Bun
last_updated: 2026-02-25
ai_context: true
---

# Fly.io Deployment

All BREE AI services deploy to [Fly.io](https://fly.io) via the root `./deploy.sh` script. Each app is a separate Fly application with its own `fly.toml` and `Dockerfile`.

---

## Deploy Script

```bash
./deploy.sh [target]

# Examples
./deploy.sh all              # Deploy everything (data plane → realtime → frontends)
./deploy.sh api              # bree-api only
./deploy.sh api-realtime     # bree-api-realtime only (alias: realtime, rt)
./deploy.sh kat-ai           # KAT.ai frontend only
./deploy.sh the-vineyard     # The Vineyard only
./deploy.sh talent-village-ai
./deploy.sh habitaware-ai
./deploy.sh status           # Print fly status for all apps
./deploy.sh secrets          # Print secret setup instructions
./deploy.sh help
```

The script:

1. Validates `fly` CLI is installed and authenticated
2. Reads `app =` from each app's `fly.toml` to get the Fly app name
3. Creates the Fly app if it doesn't exist (`fly apps create`)
4. Runs `fly deploy . --dockerfile apps/{name}/Dockerfile --config apps/{name}/fly.toml`
   — **context root is the monorepo root** so Dockerfiles can `COPY packages/` etc.

---

## Deploy a Single App Manually

> [!IMPORTANT]
> **Always run `fly deploy` from the monorepo root.** The Dockerfiles use `COPY packages/ ...` which requires the repo root as the build context. Running `fly deploy` from inside an app directory will fail with a "not found" error.

```bash
# ✅ Correct — run from the monorepo root
fly deploy \
  --config apps/talent-village-ai/fly.toml \
  --dockerfile apps/talent-village-ai/Dockerfile

# ❌ Wrong — running from inside the app dir loses the monorepo context
cd apps/talent-village-ai && fly deploy
```

This pattern works for any app:

```bash
fly deploy --config apps/<app>/fly.toml --dockerfile apps/<app>/Dockerfile
```

---

## App Registry

| Deploy target       | Fly app             | URL                               | Type                 |
| ------------------- | ------------------- | --------------------------------- | -------------------- |
| `api`               | `bree-api`          | https://bree-api.fly.dev          | Bun API server       |
| `api-realtime`      | `bree-api-realtime` | https://bree-api-realtime.fly.dev | Bun real-time server |
| `kat-ai`            | `kat-ai`            | https://kat-ai.fly.dev            | Nginx + Vite SPA     |
| `habitaware-ai`     | `habitaware-ai`     | https://habitaware-ai.fly.dev     | Nginx + Vite SPA     |
| `the-vineyard`      | `the-vineyard`      | https://the-vineyard.fly.dev      | Nginx + Vite SPA     |
| `talent-village-ai` | `talent-village-ai` | https://talent-village-ai.fly.dev | Nginx + Vite SPA     |
| `genius-talent`     | `genius-talent`     | https://genius-talent.fly.dev     | Nginx + Vite SPA     |

---

## Dockerfile Patterns

### Bun API Server (bree-api, bree-api-realtime)

Multi-stage build using `oven/bun:1` (build) → `oven/bun:1-alpine` (runtime).

```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app
COPY package.json bun.lock ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
RUN bun install
WORKDIR /app/apps/api
RUN bun run build        # bun build src/index.ts --outdir ./dist --target bun

FROM oven/bun:1-alpine
WORKDIR /app
COPY --from=base /app/apps/api/dist ./dist
COPY --from=base /app/node_modules ./node_modules
EXPOSE 3000
CMD ["bun", "dist/index.js"]
```

**Critical:** Elysia must bind to `0.0.0.0`, not `localhost`:

```ts
app.listen({ port: PORT, hostname: "0.0.0.0" });
```

### Frontend SPA (Vite + React → Nginx)

Multi-stage: Node (build Vite) → Nginx (serve).

```dockerfile
FROM node:20-alpine AS builder
RUN npm install -g bun
WORKDIR /app
COPY package.json bun.lock ./
COPY packages/ ./packages/
COPY apps/kat-ai/ ./apps/kat-ai/
RUN bun install
WORKDIR /app/apps/kat-ai
RUN bun run build        # vite build → dist/

FROM nginx:alpine
COPY --from=builder /app/apps/kat-ai/dist /usr/share/nginx/html
COPY apps/kat-ai/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### bree-api-realtime — Shared Source Files

Because `api-realtime` imports from `apps/api/src/`, those files must be explicitly copied:

```dockerfile
COPY apps/api/src/nats.ts ./apps/api/src/nats.ts
COPY apps/api/src/conversation-db.ts ./apps/api/src/conversation-db.ts
COPY apps/api/src/auth.ts ./apps/api/src/auth.ts
COPY apps/api/src/auth-provider.ts ./apps/api/src/auth-provider.ts
COPY apps/api/src/db.ts ./apps/api/src/db.ts
COPY apps/api/src/routes/ ./apps/api/src/routes/
COPY apps/api/package.json ./apps/api/package.json  # pulls in jose, nats, postgres
```

---

## fly.toml Reference

### Bun API Server

```toml
app = 'bree-api'
primary_region = 'ord'

[build]

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = 'stop'
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  memory = '1gb'
  cpu_kind = 'shared'
  cpus = 1
```

### Real-Time Server (smaller footprint — WebSocket connections are lightweight)

```toml
app = 'bree-api-realtime'
primary_region = 'ord'

[http_service]
  internal_port = 3001
  [http_service.concurrency]
    type = 'connections'
    hard_limit = 500
    soft_limit = 400

[[vm]]
  memory = '512mb'
```

### Frontend SPA (static files)

```toml
app = 'kat-ai'
[http_service]
  internal_port = 80
  force_https = true
[[vm]]
  memory = '256mb'
```

---

## Setting Secrets

```bash
# Data plane
fly secrets set OPENAI_API_KEY=sk-... -a bree-api
fly secrets set NATS_URL=nats://... -a bree-api
fly secrets set JWT_SECRET=... -a bree-api
fly secrets set DATABASE_URL=postgres://... -a bree-api  # or DB_PATH for SQLite
fly secrets set REALTIME_URL=https://bree-api-realtime.fly.dev -a bree-api

# Real-time plane (same JWT_SECRET as bree-api!)
fly secrets set NATS_URL=nats://... -a bree-api-realtime
fly secrets set JWT_SECRET=... -a bree-api-realtime
fly secrets set OPENAI_API_KEY=sk-... -a bree-api-realtime
fly secrets set TWILIO_SID=... TWILIO_TOKEN=... TWILIO_PHONE_NUMBER=+1... -a bree-api-realtime

# Frontend apps (controls branding + routing)
fly secrets set VITE_API_URL=https://bree-api.fly.dev -a kat-ai
fly secrets set VITE_REALTIME_URL=https://bree-api-realtime.fly.dev -a kat-ai
fly secrets set VITE_APP_NAME="KAT.ai" -a kat-ai
fly secrets set VITE_BRAND_ID=kat-ai -a kat-ai
fly secrets set VITE_RAGSTER_DEFAULT_ORG_ID=kat.ai -a kat-ai
```

**Setting a secret triggers an automatic rolling redeploy** — no `fly deploy` needed.

---

## Volumes (Persistent Storage)

SQLite databases and village files need volumes to survive machine restarts:

```bash
# Create volume
fly volumes create bree_data --size 1 -a bree-api --region ord

# Reference in fly.toml
[[mounts]]
  source = "bree_data"
  destination = "/app/data"
```

Then set:

```bash
fly secrets set DB_PATH=/app/data/bree.db -a bree-api
fly secrets set VILLAGES_DIR=/app/data/villages -a bree-api
```

---

## Common Operations

```bash
# View live logs
fly logs -a bree-api
fly logs -a bree-api-realtime

# SSH into a machine
fly ssh console -a bree-api

# Scale machines
fly scale count 2 -a bree-api-realtime  # 2 machines for HA
fly scale memory 512 -a bree-api        # change memory

# List machines
fly machines list -a bree-api

# Restart a machine
fly machines restart <machine-id> -a bree-api
```
