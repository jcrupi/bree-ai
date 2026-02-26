---
title: bree-api — Data Plane
type: app
app: bree-api
fly_app: bree-api
url: https://bree-api.fly.dev
port: 3000
stack: Bun, Elysia, SQLite, Postgres
last_updated: 2026-02-25
ai_context: true
---

# bree-api — Data Plane

The main BREE API gateway. All frontend apps point `VITE_API_URL` here. Handles auth, AI proxying, data persistence, file storage, and external service integration.

---

## Responsibilities

- **Authentication** — JWT verification via Identity Zero or Better Auth
- **OpenAI proxy** — `/api/openai/chat` (legacy blocking), TTS, STT
- **Knowledge / RAG** — Ragster proxy at `/api/knowledge`
- **Agent Collective** — AgentX proxy at `/api/collective`
- **Talent Village files** — markdown CRUD on disk at `/api/talent-village`
- **Conversation history** — SQLite/Postgres at `/api/village/:id/messages`
- **Brand config** — `/api/config/:brandId`
- **Bubbles** — suggested questions at `/api/bubbles`
- **Feedback** — file saves at `/api/feedback`
- **Vineyard** — project/task/lens management at `/api/vineyard`

> **Note:** `/api/agents` and `/api/village` (WebSocket real-time) are stubs that 301 redirect to `bree-api-realtime`.

---

## Source Structure

```
apps/api/src/
├── index.ts               ← Elysia app entry, all route registrations
├── nats.ts                ← NatsService singleton (shared with api-realtime)
├── auth.ts                ← requireAuth(), getTenantEncryptionKey()
├── auth-provider.ts       ← Provider switcher: identity-zero | better-auth
├── conversation-db.ts     ← SQLite/Postgres for vine message history
├── db.ts                  ← contactDb (SQLite) for village contacts
└── routes/
    ├── talent-village.ts  ← Village file CRUD (pure Bun fs)
    └── identity-zero/
        └── db.ts          ← Identity Zero multi-tenant Postgres client
```

---

## Route Groups

| Prefix                 | Auth   | Description                            |
| ---------------------- | ------ | -------------------------------------- |
| `/api/auth`            | varies | Login, register, me, refresh, JWKS     |
| `/api/openai`          | JWT    | Chat (blocking legacy), TTS, STT       |
| `/api/knowledge`       | JWT    | Ragster search, collections, resources |
| `/api/collective`      | JWT    | AgentX multi-agent chat                |
| `/api/talent-village`  | JWT    | Village markdown file CRUD             |
| `/api/config/:brandId` | JWT    | Brand configuration                    |
| `/api/bubbles`         | JWT    | Suggested questions per brand          |
| `/api/feedback`        | none   | Save text feedback files               |
| `/api/vineyard`        | JWT    | Projects, tasks, agents, AI lenses     |
| `/api/areas`           | JWT    | Org area management                    |
| `/api/agents`          | —      | **301 → bree-api-realtime**            |
| `/api/village`         | —      | **301 → bree-api-realtime**            |

---

## Authentication

Controlled by `AUTH_PROVIDER` env var:

### `identity-zero` (default)

- Per-tenant `jwt_secret` stored encrypted in Postgres
- JWT verified by decrypting the tenant's secret, then `jose.jwtVerify`
- Tenant encryption key used for data isolation per client

### `better-auth`

- JWKS-based verification via `BETTER_AUTH_JWKS_URL`
- Session fetched from `BETTER_AUTH_URL/api/auth/get-session`

`requireAuth()` returns `JWTPayload { userId, email, name, roles }`.

---

## File Persistence (Talent Village)

Villages = `.md` files with YAML front matter in `VILLAGES_DIR`. **Pure Bun — no node:fs:**

```ts
await Bun.write(`${dir}/village.md`, content);
Bun.file(`${dir}/village.md`).text();
new Bun.Glob("**/*.md").scan(VILLAGES_DIR);
Bun.spawnSync(["mkdir", "-p", dir]);
Bun.spawnSync(["rm", "-rf", dir]);
```

---

## Environment Variables

| Variable          | Required | Description                                   |
| ----------------- | -------- | --------------------------------------------- |
| `OPENAI_API_KEY`  | ✅       | OpenAI API key                                |
| `NATS_URL`        | ✅       | NATS server connection string                 |
| `JWT_SECRET`      | ✅       | JWT signing secret (shared with api-realtime) |
| `AUTH_PROVIDER`   | optional | `identity-zero` (default) or `better-auth`    |
| `DATABASE_URL`    | optional | Postgres URL (SQLite fallback if unset)       |
| `DB_PATH`         | optional | SQLite path (default: `bree.db`)              |
| `VILLAGES_DIR`    | optional | Village markdown file directory               |
| `AGENTX_URL`      | optional | AgentX orchestration URL                      |
| `RAGSTER_API_URL` | optional | Ragster knowledge search URL                  |
| `REALTIME_URL`    | optional | bree-api-realtime URL for stub redirects      |
| `DEMO_MODE`       | optional | `true` bypasses all auth                      |
| `PORT`            | optional | HTTP port (default: `3000`)                   |

---

## Local Dev

```bash
cd apps/api && bun run dev
# → http://localhost:3000
```
