---
title: chatterbox — Secure Conversational Store
type: app
app: chatterbox
fly_app: bree-chatterbox
url: https://bree-chatterbox.fly.dev
port: 3002
stack: Bun, Elysia, NATS, JetStream
last_updated: 2026-02-27
ai_context: true
---

# chatterbox — Secure Conversational Store

A privacy-first, append-only conversational store built on NATS JetStream. Chatterbox persists conversation turns without ever storing question or answer text — only encrypted hashes (`ehash`). Any service in the bree-ai platform can push a turn via NATS and retrieve it by any index field.

---

## Core Design Principle

**No plaintext is ever stored.** Question and answer content is reduced to one-way salted BLAKE2b hashes before entering the system. The hash is a stable fingerprint for deduplication, auditing, and cross-service correlation — not a retrieval mechanism for the original content.

```
question: "What is my leave balance?"
  │
  └─► BLAKE2b( orgId + ":" + userId + ":" + questionText )
        → question_ehash: "a3f8c2d1..."   ← only this is stored
```

---

## Data Model

### ConversationTurn

```typescript
interface ConversationTurn {
  // Identity
  turnId:        string;   // ULID — globally unique, time-ordered
  appId:         string;   // Originating application (e.g. "kat-ai", "habitaware")
  orgId:         string;   // Organization / tenant identifier
  userId:        string;   // User identifier (opaque — ID, not PII)

  // Security context
  claims:        Record<string, unknown>;  // JWT or RBAC claims snapshot at time of turn

  // Conversation content fingerprints (one-way, no recovery)
  questionEhash: string;   // BLAKE2b-256 hex of (orgId + ":" + userId + ":" + question)
  answerEhash:   string;   // BLAKE2b-256 hex of (orgId + ":" + userId + ":" + answer)

  // Associations
  resourceIds:   string[]; // Related resource IDs (docs, tickets, items, etc.)
  metadata:      Record<string, unknown>; // Flexible key-value (model, tokens, latency, etc.)

  // Timestamp
  ts:            string;   // ISO 8601 UTC
}
```

### Zod Schema (source of truth for validation)

```typescript
import { z } from "zod";
import { ulid } from "ulid";

export const ConversationTurnSchema = z.object({
  turnId:        z.string().default(() => ulid()),
  appId:         z.string().min(1),
  orgId:         z.string().min(1),
  userId:        z.string().min(1),
  claims:        z.record(z.unknown()).default({}),
  questionEhash: z.string().regex(/^[0-9a-f]{64}$/, "must be 64-char hex (BLAKE2b-256)"),
  answerEhash:   z.string().regex(/^[0-9a-f]{64}$/, "must be 64-char hex (BLAKE2b-256)"),
  resourceIds:   z.array(z.string()).default([]),
  metadata:      z.record(z.unknown()).default({}),
  ts:            z.string().datetime().default(() => new Date().toISOString()),
});

export type ConversationTurn = z.infer<typeof ConversationTurnSchema>;
```

---

## Ehash Design

### Algorithm

`BLAKE2b-256` (built into Bun's `crypto` module — no extra dependency).

```typescript
// apps/chatterbox/src/hash.ts
import { createHash } from "crypto";

/**
 * Produces a stable, salted one-way fingerprint of conversational content.
 * The salt (orgId + userId) ensures the same question from different tenants
 * produces a different hash — privacy isolation by design.
 *
 * IMPORTANT: This is NOT reversible. The original text cannot be recovered.
 */
export function ehash(orgId: string, userId: string, content: string): string {
  return createHash("blake2b256")
    .update(`${orgId}:${userId}:${content}`)
    .digest("hex");
}
```

### Properties

| Property | Behavior |
|---|---|
| **Deterministic** | Same inputs always produce the same hash |
| **Tenant-isolated** | Same question from different orgs → different hash |
| **User-isolated** | Same question from different users in same org → different hash |
| **Non-reversible** | No way to recover original text from hash |
| **Deduplication** | Identical turns from same user/org are detectable |
| **Correlation** | Services can cross-reference turns without sharing text |

---

## NATS Subject Taxonomy

```
chatterbox.
├── turns.store              ← publish a turn to persist (pub/sub)
├── turns.ack.{turnId}       ← chatterbox emits on successful store
├── query.app.{appId}        ← request/reply: turns for an appId
├── query.org.{orgId}        ← request/reply: turns for an orgId
├── query.user.{userId}      ← request/reply: turns for a userId
├── query.turn.{turnId}      ← request/reply: single turn by ID
└── query.ehash.{ehash}      ← request/reply: turns matching a hash
```

### Subject Details

| Subject | Pattern | Publisher | Handler | Description |
|---|---|---|---|---|
| `chatterbox.turns.store` | pub/sub | Any bree-ai service | Chatterbox store worker | Persist a ConversationTurn |
| `chatterbox.turns.ack.{turnId}` | pub/sub | Chatterbox | Original publisher | Storage confirmed |
| `chatterbox.query.app.{appId}` | request/reply | Any service | Chatterbox | All turns for an app |
| `chatterbox.query.org.{orgId}` | request/reply | Any service | Chatterbox | All turns for an org |
| `chatterbox.query.user.{userId}` | request/reply | Any service | Chatterbox | All turns for a user |
| `chatterbox.query.turn.{turnId}` | request/reply | Any service | Chatterbox | Single turn by ID |
| `chatterbox.query.ehash.{ehash}` | request/reply | Any service | Chatterbox | Turns matching question or answer hash |

### Push a Turn (Fire-and-forget)

```typescript
// Any service — publish and optionally await ack
await nats.publish("chatterbox.turns.store", {
  appId:         "kat-ai",
  orgId:         "acme-corp",
  userId:        "usr_01HZ...",
  claims:        { role: "candidate", sub: "usr_01HZ..." },
  questionEhash: ehash("acme-corp", "usr_01HZ...", questionText),
  answerEhash:   ehash("acme-corp", "usr_01HZ...", answerText),
  resourceIds:   ["job_4821", "assessment_99"],
  metadata:      { model: "claude-sonnet-4-6", tokens: 412, latencyMs: 830 },
});
```

### Query Turns (Request/Reply)

```typescript
// Query all turns for a user — 5s timeout
const result = await nats.request(
  `chatterbox.query.user.${userId}`,
  { limit: 50, cursor: null },
  5000
);
// result: { turns: ConversationTurn[], nextCursor: string | null }

// Look up by question hash (dedup / audit)
const result = await nats.request(
  `chatterbox.query.ehash.${questionEhash}`,
  {},
  5000
);
```

---

## JetStream Stream

### Stream: `CHATTERBOX_STORE`

```typescript
// apps/chatterbox/src/store.ts
await jsm.streams.add({
  name:        "CHATTERBOX_STORE",
  subjects:    ["chatterbox.turns.store"],
  storage:     StorageType.File,          // durable, survives restarts
  retention:   RetentionPolicy.Limits,
  max_age:     90 * 24 * 60 * 60 * 1_000_000_000, // 90 days in nanoseconds
  max_msgs:    5_000_000,
  max_bytes:   512 * 1024 * 1024,         // 512 MB
  num_replicas: 1,
  discard:     DiscardPolicy.Old,
  duplicate_window: 2 * 60 * 1_000_000_000, // 2-min dedup window by turnId
});
```

### Durable Consumer: `chatterbox-store-worker`

```typescript
await jsm.consumers.add("CHATTERBOX_STORE", {
  durable_name:    "chatterbox-store-worker",
  ack_policy:      AckPolicy.Explicit,
  deliver_policy:  DeliverPolicy.New,
  max_deliver:     3,                     // retry up to 3x on failure
  ack_wait:        30 * 1_000_000_000,    // 30s ack window
  filter_subject:  "chatterbox.turns.store",
});
```

---

## Source Structure

```
apps/chatterbox/
├── src/
│   ├── index.ts        ← Elysia app entry; mounts routes + boots NATS worker
│   ├── store.ts        ← JetStream stream init, publish, query, get-by-id
│   ├── hash.ts         ← ehash() utility — BLAKE2b-256 salted hashing
│   ├── routes.ts       ← REST API (health, admin query endpoints)
│   ├── worker.ts       ← NATS consumer loop: store turns, emit acks, handle queries
│   └── types.ts        ← Zod schemas + TypeScript types (ConversationTurn, QueryRequest, etc.)
├── package.json
├── tsconfig.json
├── Dockerfile
├── fly.toml
└── .env.example
```

---

## Route Summary

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check + NATS connection status |
| `GET` | `/api/turns` | Query turns (REST fallback) — params: `appId`, `orgId`, `userId`, `ehash`, `limit`, `cursor` |
| `GET` | `/api/turns/:turnId` | Fetch single turn by ID |
| `POST` | `/api/turns` | Store a turn directly via REST (calls same path as NATS worker) |

> **Primary interface is NATS.** REST routes are for admin tooling and local development.

---

## Worker Architecture

```
Boot
 └─ ensureChatterboxStream()          ← create CHATTERBOX_STORE if missing
 └─ subscribe: chatterbox.query.*     ← request/reply query handler
 └─ consume: CHATTERBOX_STORE (durable)

NATS Store Worker (durable consumer):
  chatterbox.turns.store
    → validate(ConversationTurnSchema)
    → assign turnId (ULID) if missing
    → writeToJetStream(turn)
    → publish ack: chatterbox.turns.ack.{turnId}
    → msg.ack()

NATS Query Handler (plain subscribe, request/reply):
  chatterbox.query.app.{appId}   → readByAppId(appId, opts)   → msg.respond(result)
  chatterbox.query.org.{orgId}   → readByOrgId(orgId, opts)   → msg.respond(result)
  chatterbox.query.user.{userId} → readByUserId(userId, opts)  → msg.respond(result)
  chatterbox.query.turn.{turnId} → readById(turnId)            → msg.respond(result)
  chatterbox.query.ehash.{hash}  → readByEhash(hash, opts)     → msg.respond(result)
```

---

## package.json

```json
{
  "name": "chatterbox",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev":   "bun --watch src/index.ts",
    "build": "bun build src/index.ts --outdir ./dist --target bun",
    "start": "bun dist/index.js"
  },
  "dependencies": {
    "elysia":           "^1.4.0",
    "@elysiajs/cors":   "^1.2.0",
    "@elysiajs/swagger":"^1.2.0",
    "nats":             "^2.28.2",
    "ulid":             "^2.3.0",
    "zod":              "^3.25.0"
  },
  "devDependencies": {
    "typescript":       "^5.2.0",
    "@types/bun":       "latest"
  }
}
```

---

## Dockerfile

```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Copy workspace root + shared packages + this app
COPY package.json bun.lock ./
COPY packages/ ./packages/
COPY apps/chatterbox/ ./apps/chatterbox/
# Shared NATS service from bree-api
COPY apps/api/src/nats.ts ./apps/api/src/nats.ts
COPY apps/api/package.json ./apps/api/package.json

RUN bun install
WORKDIR /app/apps/chatterbox
RUN bun run build

# Runtime — minimal alpine image
FROM oven/bun:1-alpine
WORKDIR /app
COPY --from=base /app/apps/chatterbox/dist ./dist
COPY --from=base /app/node_modules ./node_modules
EXPOSE 3002
CMD ["bun", "dist/index.js"]
```

---

## fly.toml

```toml
app            = 'bree-chatterbox'
primary_region = 'iad'

[build]

[http_service]
  internal_port        = 3002
  force_https          = true
  auto_stop_machines   = false   # always running — event-driven worker
  min_machines_running = 1

[env]
  PORT     = "3002"
  NODE_ENV = "production"

[[vm]]
  memory   = '512mb'
  cpu_kind = 'shared'
  cpus     = 1
```

> No volume mount required — all state lives in NATS JetStream.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NATS_URL` | ✅ | NATS server URL e.g. `nats://nats.internal:4222` |
| `NATS_USER` | optional | NATS username |
| `NATS_PASSWORD` | optional | NATS password |
| `NATS_TOKEN` | optional | NATS auth token (alternative to user/pass) |
| `PORT` | optional | HTTP port (default: `3002`) |
| `NODE_ENV` | optional | `production` or `development` |
| `CHATTERBOX_RETENTION_DAYS` | optional | JetStream max age in days (default: `90`) |
| `CHATTERBOX_MAX_MSGS` | optional | JetStream max message count (default: `5000000`) |

---

## .env.example

```bash
# NATS
NATS_URL=nats://localhost:4222
NATS_USER=
NATS_PASSWORD=
NATS_TOKEN=

# Chatterbox
PORT=3002
CHATTERBOX_RETENTION_DAYS=90
CHATTERBOX_MAX_MSGS=5000000
```

---

## Local Dev

```bash
cd apps/chatterbox && bun run dev
# → http://localhost:3002
# NATS must be running: docker compose up nats
```

Publish a test turn:
```bash
nats pub chatterbox.turns.store '{
  "appId": "kat-ai",
  "orgId": "acme",
  "userId": "usr_test",
  "claims": {},
  "questionEhash": "a3f8c2d1e4b56789...",
  "answerEhash":   "b7e2a1f0c3d45678...",
  "resourceIds":   ["job_001"],
  "metadata":      { "model": "claude-sonnet-4-6" }
}'
```

Query by user:
```bash
nats req chatterbox.query.user.usr_test '{"limit":10}'
```

---

## Root package.json — Add Scripts

```json
{
  "scripts": {
    "dev:chatterbox":   "bun --filter chatterbox dev",
    "build:chatterbox": "bun --filter chatterbox build"
  }
}
```

---

## Integration with Existing Apps

Any bree-ai service that uses `nats.ts` can push and query chatterbox with zero additional dependencies:

```typescript
// Example: bree-api stores a turn after an AI response
import { getNatsService } from "./nats";
import { ehash } from "../../chatterbox/src/hash"; // or inline the function

const nats = await getNatsService();

await nats.publish("chatterbox.turns.store", {
  appId:         "kat-ai",
  orgId:         ctx.orgId,
  userId:        ctx.userId,
  claims:        ctx.claims,
  questionEhash: ehash(ctx.orgId, ctx.userId, userMessage),
  answerEhash:   ehash(ctx.orgId, ctx.userId, assistantReply),
  resourceIds:   ctx.resourceIds ?? [],
  metadata: {
    model:     "claude-sonnet-4-6",
    tokens:    usage.total_tokens,
    latencyMs: Date.now() - startTime,
  },
});
```

---

## Security Notes

- **ehash is irreversible** — BLAKE2b-256 with orgId+userId salt cannot be brute-forced without knowing the salt composition and original content.
- **Claims are opaque** — stored as-is from the JWT; no claims processing occurs in chatterbox.
- **No auth on NATS subjects** — chatterbox trusts the internal NATS network. External access is only via the REST API which should be protected by the standard bree-api JWT middleware.
- **resourceIds are opaque strings** — chatterbox stores them without validation; semantics are defined by the publishing app.

---

## See Also

- [`agentx/nats.agentx.md`](../nats.agentx.md) — NATS backbone, subject patterns, NatsService API
- [`agentx/apps/bree-api-realtime.agentx.md`](bree-api-realtime.agentx.md) — JetStream stream setup reference
- [`agentx/fly.agentx.md`](../fly.agentx.md) — fly.toml patterns and deployment
