---
title: chatterbox — Realtime Contextual Intelligence Store
type: app
app: chatterbox
fly_app: bree-chatterbox
url: https://bree-chatterbox.fly.dev
port: 3002
stack: Bun, Elysia, NATS, JetStream
last_updated: 2026-03-03
ai_context: true
---

# chatterbox — Realtime Contextual Intelligence

A privacy-first, append-only conversational intelligence store built on NATS JetStream. Chatterbox persists **Convo Turns** without ever storing question or answer text — only salted BLAKE2b-256 hashes (`ehash`). It provides the memory backbone for AI agents, tracking context windows, smart summarization, and automatic branching.

---

## Core Design Principles

1. **Privacy-First (eHash).** No plaintext is ever stored. Question and answer content is reduced to one-way salted BLAKE2b hashes before entering the system.
2. **Convos have identity.** Every chat session gets a `convoId` (ULID) that persists for its lifetime.
3. **Deterministic Context.** The `contextId` is a hash of the sorted active resource IDs. Change the resources, change the context.
4. **AI Lenses.** Context is viewed through "Lenses" (Domain, Feature, Customer, Claims) to provide high-fidelity intelligence without PII exposure.
5. **Smart Memory.** Automated, iterative summarization (periodic LLM triggers) to keep context windows dense and relevant.

---

## Data Model

### ConvoTurn

The atomic unit. One question → one answer exchange.

```typescript
interface ConvoTurn {
  turnId: string; // ULID — unique per turn, time-ordered

  // Session
  convoId: string; // ULID — assigned when convo starts
  contextId: string; // BLAKE2b-256(sorted(resourceIds)) — the resource window
  parentContextId?: string; // set when this turn is the first in a new branch

  // Participant
  appId: string; // originating app (e.g. "kat-ai", "the-vineyard")
  orgId: string; // org / tenant identifier
  userId: string; // user identifier (opaque — not PII)
  claims: Record<string, unknown>; // JWT claims snapshot

  // Content fingerprints — ONE WAY, no recovery
  questionEhash: string; // BLAKE2b-256(orgId:userId:questionText)
  answerEhash: string; // BLAKE2b-256(orgId:userId:answerText)

  // Resource context — the active set driving this turn's contextId
  resourceIds: string[]; // UUIDs of files, images, docs, etc.
  metadata: Record<string, unknown>;
  ts: string; // ISO 8601 UTC
}
```

### Convo

The session envelope. Created when a convo starts and updated with each turn.

```typescript
interface Convo {
  convoId: string; // ULID
  appId: string;
  orgId: string;
  userId: string;
  currentContextId: string; // most recent contextId
  contextHistory: string[]; // ordered list of all contextIds seen (branches)
  turnCount: number;
  metadata?: Record<string, unknown>;
  turns?: ConvoTurn[]; // optional embedded turns for retrieval
  createdAt: string;
  updatedAt: string;
}
```

---

## Contexts & Branching

### What is a contextId?

A `contextId` is a deterministic 64-char hex (BLAKE2b-256) of the **sorted** active resource IDs. It defines the "Lens" through which the conversation is currently viewed.

```typescript
// hash.ts
export function contextId(resourceIds: string[]): string {
  if (!resourceIds || resourceIds.length === 0) return "0".repeat(64);
  const sorted = [...resourceIds].sort().join(":");
  return createHash("blake2b256").update(sorted).digest("hex");
}
```

### Branching Example

```
convoId = convo_01JNPX

  Context A — resourceIds: [doc-001, doc-002]
  Turn 1: convoId=convo_01JNPX, contextId=a3f8...

  ── User adds doc-003 ──

  Context B — resourceIds: [doc-001, doc-002, doc-003]
  Turn 2: convoId=convo_01JNPX, contextId=b7e9..., parentContextId=a3f8...

Convo.contextHistory = ["a3f8...", "b7e9..."]
```

---

## Smart Memory

Smart Memory prevents the AI context window from growing unbounded. Every `N` turns (default `10`), Chatterbox triggers an AI summarization (`SmartMemory`).

1. **Compression:** AI generates a semantic, dense summary from new turns + previous memory.
2. **Summary Storage:** Summaries are stored in plaintext (as they are AI-generated metadata, not user PII).
3. **Context Assembly:** Calling `/api/convos/:id/context` returns:
   - Latest `SmartMemory` summary
   - `recentTurns` (ehash placeholders)

---

## NATS Subject Taxonomy

```
chatterbox.
├── convo.start                     ← req/reply: start a convo, get convoId
├── turns.store                      ← pub/sub: publish a turn to persist
├── turns.ack.{turnId}               ← pub/sub: emitted on successful store
├── query.app.{appId}                ← req/reply: turns for an app
├── query.org.{orgId}                ← req/reply: turns for an org
├── query.user.{userId}              ← req/reply: turns for a user
├── query.turn.{turnId}              ← req/reply: single turn by ID
├── query.ehash.{ehash}              ← req/reply: turns matching a hash
├── query.convo.envelope.{convoId}   ← req/reply: convo envelope (metadata)
├── query.convo.turns.{convoId}      ← req/reply: all turns in a convo
├── query.context.{contextId}        ← req/reply: turns in a specific context branch
├── query.resource.{resourceId}      ← req/reply: turns that used a resource
├── memory.trigger.{convoId}         ← pub/sub: emitted when N turns reached
├── memory.create                    ← req/reply: create a smart memory
├── memory.latest.{convoId}          ← req/reply: get latest SmartMemory
├── context.{convoId}                ← req/reply: assembled context for next AI call
└── memory.created.{convoId}         ← pub/sub: emitted when memory is ready
```

---

## Usage Patterns

### 1. Start a convo

```typescript
const res = await nats.request("chatterbox.convo.start", {
  appId: "kat-ai",
  orgId: "acme",
  userId: "usr_1",
  resourceIds: ["doc-001"],
});
const { convoId } = res.convo;
```

### 2. Store a turn

```typescript
await nats.publish("chatterbox.turns.store", {
  convoId: "01JNPX...",
  appId: "kat-ai",
  orgId: "acme",
  userId: "usr_1",
  questionEhash: ehash("acme", "usr_1", qText),
  answerEhash: ehash("acme", "usr_1", aText),
  resourceIds: ["doc-001"],
});
```

---

## REST API

| Method | Path                      | Description                                   |
| ------ | ------------------------- | --------------------------------------------- |
| `GET`  | `/health`                 | Health + turn/convo counts                    |
| `POST` | `/api/convos`             | Start a convo → `{ convoId, contextId }`      |
| `GET`  | `/api/convos`             | List convos — via `userId`, `orgId`, `cursor` |
| `GET`  | `/api/convos/:id`         | Get convo envelope (+ `turns=true` param)     |
| `GET`  | `/api/convos/:id/context` | **Smart Memory:** Assembled AI context        |
| `GET`  | `/api/convos/:id/memory`  | **Smart Memory:** List all memories           |
| `GET`  | `/api/turns`              | Query turns (app, org, user, convo, ehash)    |
| `POST` | `/api/turns`              | Store a turn                                  |

---

## Source Structure

```
apps/chatterbox/
├── src/
│   ├── index.ts        ← Elysia entry; boots NATS + workers
│   ├── hash.ts         ← ehash() + contextId()
│   ├── types.ts        ← Zod schemas: ConvoTurn, Convo, SmartMemory
│   ├── memory-store.ts ← Pure in-memory index: turns + convos
│   ├── smart-memory.ts ← Pure in-memory index: smart memories
│   ├── context.ts      ← Context assembly logic
│   ├── summarizer.ts   ← AI summarization wrapper
│   ├── memory-handler.ts ← Coordinates AI summary triggers
│   ├── store.ts        ← NATS wiring
│   ├── routes.ts       ← REST API
│   └── worker.ts       ← NATS consumer loop
```

---

## AI Lenses (Future)

Chatterbox is designed to support **Contextual Lenses**:

- **Domain Lens:** (e.g. Claims, Policies) - Narrows context to specific business domains.
- **Feature Lens:** (e.g. Dashboard, Billing) - Focuses on UX/UI context.
- **Customer Lens:** (e.g. High Value, Tier 1) - Adjusts response tone and depth.
- **Claims Lens:** (e.g. Admin, Editor) - Filters context based on permissions.

---

## Environment Variables

| Variable                 | Default                 | Description                   |
| ------------------------ | ----------------------- | ----------------------------- |
| `NATS_URL`               | `nats://localhost:4222` | NATS server                   |
| `ANTHROPIC_API_KEY`      | —                       | Required for Smart Memory     |
| `SMART_MEMORY_THRESHOLD` | `10`                    | Turns before AI summarization |

---

## See Also

- [`agentx/apps/chatterbox-ui.agentx.md`](chatterbox-ui.agentx.md) — Admin UI
- [`agentx/nats.agentx.md`](../nats.agentx.md) — NATS backbone
