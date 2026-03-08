---
title: Talent Village — Browser → Bun → NATS Pipeline
type: architecture-note
scope: talent-village
stack: React, Bun, Elysia, NATS JetStream, WebSocket
app: talent-village-ai + bree-api-realtime + bree-api
last_updated: 2026-03-06
ai_context: true
tags: [nats, websocket, village-vine, real-time, pipeline, comparison]
---

# Talent Village — Browser → Bun → NATS Pipeline

> **The core question:** Why does a chat message travel Browser → Bun → NATS → Bun → Browser
> instead of Browser → NATS directly?
> This note answers that fully, with annotated call flows for both paths.

---

## 🏗 System Topology

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TALENT VILLAGE SYSTEM                         │
│                                                                       │
│  ┌──────────────────┐      ┌──────────────────┐                      │
│  │  talent-village  │      │    bree-api       │  Port 3000           │
│  │      -ai         │─────▶│  (REST plane)     │  Village CRUD        │
│  │  React + Vite    │      │  Elysia + Bun     │  agentx.md writes    │
│  │  (Browser)       │      └──────────────────┘                      │
│  │                  │                                                  │
│  │                  │      ┌──────────────────┐                      │
│  │  useVillageVine  │══WS══│ bree-api-realtime │  Port 3001           │
│  │  hook (client)   │      │  (RT plane)       │  WebSocket bridge    │
│  └──────────────────┘      │  Elysia + Bun     │  NATS proxy          │
│                            └────────┬─────────┘                      │
│                                     │ TCP                              │
│                            ┌────────▼─────────┐                      │
│                            │      NATS         │  Port 4222           │
│                            │  JetStream        │  agent-collective    │
│                            │  Message Bus      │  -nats.fly.dev       │
│                            └──────────────────┘                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📡 Path A — The BREE Way (Browser → Bun → NATS → Bun → Browser)

This is how **every Village Vine message** actually flows today.

### Step-by-Step Call Flow

```
BROWSER                     BUN (bree-api-realtime)           NATS (JetStream)
──────────                  ───────────────────────           ────────────────

① VINE CREATION
─────────────────────────────────────────────────────────────────────────────
useVillageVine.createVine()
  │
  │  POST /api/village/start
  │  { topic: "Assessment", invited: ["Alice","Bob"] }
  │  ──────────────────────────────────────────────►
  │                          villageVines.set(vineId, {
  │                            topic, invited, claimed: Set()
  │                          })                               publish ──────►
  │                           │                              'village.vines.created'
  │                           │                              { vineId, topic, invited }
  │  ◄────────────────────────┘
  │  { success: true, vineId: "village-abc123" }
  │
  │  [sync — ~2ms round trip]


② WEBSOCKET CONNECTION
─────────────────────────────────────────────────────────────────────────────
useVillageVine.connect()
  │
  │  WS upgrade: /api/village/village-abc123/ws?name=Alice
  │  ══════════════════════════════════════════════════════►
  │                          ws.open:
  │                            check vine.invited.includes('Alice') ✓
  │                            check vine.claimed.has('Alice')      ✗
  │                            vine.claimed.add('Alice')
  │                                                                 subscribe ──►
  │                                                                 'village.vine.
  │                                                                  abc123.messages'
  │  ◄══════════════════════════════════════════════════════
  │  { type: 'connected', vineId, name: 'Alice' }
  │
  │  [WS persistent — survives until tab close or 4min idle]


③ SEND MESSAGE (the main path)
─────────────────────────────────────────────────────────────────────────────
user types → sendMessage('Alice', 'Hello!')
  │
  │  ─── Optimistic UI ───────────────────────────────────
  │  setMessages(prev => [...prev, localMsg])    [instant, no wait]
  │  ───────────────────────────────────────────────────────
  │
  │  ws.send({ type:'message', sender:'Alice', content:'Hello!' })
  │  ══════════════════════════════════════════════════════►
  │                          ws.message handler:
  │                            const msg = {
  │                              vineId, sender, content, timestamp
  │                            }
  │                                                                 publish ──────►
  │                                                                 'village.vine.
  │                                                                  abc123.messages'
  │                                                                 { msg }
  │                                                                 [JetStream write]
  │                                                                      │
  │                                                                      │ fan-out
  │                                                                 ◄────┘
  │                          nats callback fires for each subscriber:
  │                            ws.send({ type:'message', ...msg })
  │  ◄══════════════════════════════════════════════════════
  │  { type:'message', sender:'Alice', content:'Hello!', timestamp }
  │
  │  dedup check (±2s same sender+content)
  │  if duplicate → skip (was already in optimistic state)
  │  else → append to messages[]
  │
  │  [async — ~5–15ms end-to-end on Fly internal network]


④ BOB RECEIVES THE SAME MESSAGE (no extra round trip)
─────────────────────────────────────────────────────────────────────────────
[Bob's browser, also connected via WS to the same vine]
  │
  │  ◄══════════════════════════════════════════════════════
  │  { type:'message', sender:'Alice', content:'Hello!', timestamp }
  │
  │  NATS fan-out pushed this to ALL vine.abc123 subscribers simultaneously
  │  Bob never polls — it arrives as a WS push event


⑤ HISTORY ON RECONNECT
─────────────────────────────────────────────────────────────────────────────
[tab refresh, reconnect, or mount]
useVillageVine.fetchHistory()
  │
  │  GET /api/village/village-abc123/messages?limit=500
  │  ──────────────────────────────────────────────────►
  │                          nats.getVillageHistory('abc123', 500)
  │                                                                 JetStream ──►
  │                                                                 consumer read
  │                                                                 last 500 msgs
  │                                                                 ◄────────────
  │  ◄────────────────────────────────────────────────────
  │  { success: true, messages: [...] }
  │
  │  merge with live messages, deduplicate by id
  │  [survives server restarts — JetStream is durable]
```

### Timing Summary — Path A

| Step                       | Type             | Latency            |
| -------------------------- | ---------------- | ------------------ |
| Vine creation              | REST (HTTP)      | ~2–5 ms            |
| WS handshake               | TCP upgrade      | ~5–10 ms           |
| Message send (optimistic)  | Local state      | **0 ms** (instant) |
| Message confirmed via NATS | WS push          | ~5–20 ms           |
| History replay             | REST + JetStream | ~20–100 ms         |

---

## ⚡ Path B — Browser → NATS via WebSocket (`nats.ws`)

NATS has an official WebSocket transport called **`nats.ws`**. This is the real,
practical alternative to Path A. The browser connects directly to NATS over a
WebSocket — no Bun bridge in the message path at all.

> This path **can work** — but only if the NATS server is configured for it and
> you accept the architectural trade-offs below.

### What `nats.ws` Requires

```
NATS server config (nats-server.conf):

websocket {
  port: 8080               # WebSocket listener (separate from TCP 4222)
  tls: { ... }             # TLS required in production
  no_tls: true             # dev-only: allow ws:// without TLS
}

Fly.io:
  [[services]]
  internal_port = 8080     # must expose this port publicly
  protocol = "tcp"

NATS package in browser:
  npm install nats.ws      # nats.ws ships a pure ESM browser client
```

### Hypothetical Call Flow — Browser → nats.ws → NATS

```
BROWSER (nats.ws client)              NATS (port 8080, WS listener)
────────────────────────              ─────────────────────────────

① CONNECT
─────────────────────────────────────────────────────────────────────────────
import { connect } from 'nats.ws';
const nc = await connect({
  servers: 'wss://agent-collective-nats.fly.dev:8080',
  user:    'villageUser',          // ← credentials must live in browser bundle
  pass:    'secretPassword',       // ← or use NKey / JWT token
});

  │  WS upgrade to wss://…:8080
  │  ──────────────────────────────────────────────────────────────────────►
  │                                         NATS INFO handshake (over WS frames)
  │  ◄──────────────────────────────────────────────────────────────────────
  │  CONNECT { user, pass, name:'alice-browser-client' }
  │  ──────────────────────────────────────────────────────────────────────►
  │  ◄── +OK ──────────────────────────────────────────────────────────────
  │
  │  [WS persistent — NATS protocol runs inside WS frames from here]


② SUBSCRIBE to the vine subject
─────────────────────────────────────────────────────────────────────────────
const sub = nc.subscribe('village.vine.abc123.messages');

  │  SUB village.vine.abc123.messages 1
  │  ──────────────────────────────────────────────────────────────────────►
  │  [no response — fire and forget sub registration]
  │
  │  (async iterator — messages arrive here as they are published)
  │
  │  for await (const msg of sub) {
  │    const data = JSON.parse(msg.string());
  │    setMessages(prev => [...prev, data]);   // update React state directly
  │  }


③ SEND A MESSAGE
─────────────────────────────────────────────────────────────────────────────
nc.publish(
  'village.vine.abc123.messages',
  JSON.stringify({ sender:'Alice', content:'Hello!', timestamp: now })
);

  │  PUB village.vine.abc123.messages 55
  │  {"sender":"Alice","content":"Hello!","timestamp":"..."}
  │  ──────────────────────────────────────────────────────────────────────►
  │                                         [NATS fan-out — sync in server]
  │  ◄── MSG village.vine.abc123.messages 1 55 ────────────────────────────
  │  {"sender":"Alice","content":"Hello!","timestamp":"..."}
  │
  │  Alice receives her own message back (NATS echoes to all subs incl. sender)
  │  Bob's browser also receives it the same way — simultaneously
  │
  │  [no Bun involved — NATS routes directly to all WS subscribers]


④ HISTORY — No JetStream consumer API for browsers
─────────────────────────────────────────────────────────────────────────────
[On reconnect — to fetch history from JetStream]

  Option 1: JetStream consumer via nats.ws (requires JetStream permissions)
    const js = nc.jetstream();
    const consumer = await js.consumers.get('VILLAGE_MESSAGES', 'alice-consumer');
    // ↳ requires: create stream, bind consumer, manage ack policies
    // ↳ browser must have JetStream API access — admin-level permissions

  Option 2: Still call Bun REST for history only
    fetch('https://bree-api-realtime.fly.dev/api/village/abc123/messages')
    // ↳ hybrid approach — live chat direct, history via Bun
    // ↳ now you have TWO connection paths to manage
```

### Timing Summary — Path B

| Step             | Type                                | Latency                    |
| ---------------- | ----------------------------------- | -------------------------- |
| NATS WS connect  | TCP → WS upgrade                    | ~10–20 ms                  |
| Subscribe        | NATS SUB frame                      | ~1 ms (async, no ack)      |
| Message send     | NATS PUB frame                      | **~2–8 ms** (fastest path) |
| Message received | NATS MSG frame                      | ~2–8 ms                    |
| History replay   | JetStream (complex) or Bun fallback | ~20–200 ms                 |

### What Breaks Without Bun in the Middle

```
Gap 1: Access control disappears
────────────────────────────────────────────────────────
  In Path A, Bun's ws.open handler enforces:
    vine.invited.includes(name)     ← only invited people get in
    vine.claimed.has(name)          ← no seat-stealing

  In Path B, NATS has no concept of a "vine invite list".
  Anyone with NATS credentials can SUB to ANY vine subject:
    nc.subscribe('village.vine.*.messages')  ← subscribe to ALL vines
    nc.subscribe('village.vine.abc123.messages')  ← spy on any vine

  Fix: NATS Accounts with per-user subject permissions
  ↳ requires a NKey or JWT per-user issued by an auth-callout server
  ↳ that server IS Bun — you've just built a more complex version of Path A

Gap 2: Credentials in the browser
────────────────────────────────────────────────────────
  NATS user/pass or NKey must be shipped to the browser.
  Anyone who opens DevTools → Application → Session Storage can read it.
  That credential grants direct NATS access — not scoped to one vine.

  Path A: JWT lives in localStorage. It's scoped to bree-api endpoints only.
  Even if leaked, the attacker hits Bun's middleware — not raw NATS.

Gap 3: JetStream history is complex for browsers
────────────────────────────────────────────────────────
  JetStream consumers require:
    - Stream binding (VILLAGE_MESSAGES stream must exist)
    - Consumer policy configuration (AckPolicy, DeliverPolicy, etc.)
    - Separate ack/nak lifecycle per message
    - Stream admin permissions

  Bun already handles this in nats.getVillageHistory() — 4 lines of code.
  Browser JetStream via nats.ws is doable but complex and requires
  elevated NATS permissions in the browser bundle.

Gap 4: NATS echoes your own messages
────────────────────────────────────────────────────────
  When Alice publishes, she also receives her own message via her subscription.
  Path A uses optimistic UI + deduplication to handle this cleanly.
  Path B requires manual echo suppression:
    if (msg.sender === currentUser) return;  // brittle — name collision possible

Gap 5: The NATS server needs a public WS port
────────────────────────────────────────────────────────
  agent-collective-nats.fly.dev currently only exposes port 4222 (TCP).
  Adding WebSocket means:
    - New port (8080) exposed on Fly.io public internet
    - TLS termination on NATS itself (not behind Bun/Elysia)
    - NATS becomes a public-facing service — higher attack surface
```

### Side-by-Side Comparison

```
                      PATH A (BREE)                  PATH B (nats.ws direct)
                      ─────────────                  ───────────────────────
Protocol              WS → Bun → NATS TCP            WS → NATS WS listener
Browser library       Native WebSocket API            nats.ws (npm package)
NATS port exposed     ❌ stays internal (4222)        ⚠️  requires public :8080
Auth enforcement      ✅ Bun JWT middleware            ⚠️  NATS accounts/NKeys
Access control        ✅ invited list in Bun           ❌ not built into NATS
Credentials           ✅ JWT scoped to bree-api        ⚠️  NATS creds in browser
Message history       ✅ Bun → JetStream REST         ⚠️  JetStream API (complex)
Optimistic UI / dedup ✅ useVillageVine hook           ⚠️  manual per client
Self-echo suppression ✅ dedup by sender+content+time  ❌ NATS echoes all subs
Fan-out               ✅ NATS (server-side)            ✅ NATS (same mechanism)
Message latency       ~5–20 ms (via Bun bridge)       ~2–8 ms (one less hop)
Setup complexity      ✅ already running               ⚠️  NATS WS config + TLS
Dev/prod parity       ✅ same path everywhere          ⚠️  WS vs TCP mismatch locally
Attack surface        ✅ one public endpoint (Bun)     ⚠️  two (Bun + NATS WS)
```

> **Summary:** Path B saves ~5–10ms per message but requires Bun for auth anyway
> (to issue scoped NATS tokens), doubles the public attack surface, and hands
> JetStream complexity to every browser client. The marginal latency gain is
> not worth the security and operational cost for Talent Village's access patterns.

---

## 🛡 Security & Governance — Why Bun Coordinates All NATS Access

> **Architectural principle:** No browser ever touches NATS directly.
> Every read, every write, every subscription is coordinated by Bun.
> Bun is the single security boundary and governance layer for the entire NATS bus.

This is not just a convenience — it is a deliberate design constraint with cascading benefits:

### Bun as the Single Coordinator

```
                    ┌─────────────────────────────────────────┐
                    │                BUN                       │
                    │                                          │
  Browser ─── WS ──│──► access check ──► nats.publish()  ────│──► NATS
  Browser ─── WS ──│──► access check ──► nats.subscribe() ◄──│─── NATS
  Browser ─── HTTP ─│──► JWT verify  ──► nats.request()   ────│──► NATS
                    │                                          │
                    │  vine.invited[]   vine.claimed   JWT     │
                    │  ─────────────────────────────────────── │
                    │  EVERY NATS operation passes through here │
                    └─────────────────────────────────────────┘

NO browser has a NATS connection.
NO browser knows a NATS subject name beyond what Bun tells it.
NO browser can read from or write to NATS without Bun authorising the action.
```

### What This Buys You

| Governance Property     | How Bun Enforces It                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Identity**            | JWT verified on every HTTP req; WS name checked against `vine.invited[]`                                                       |
| **Authorization**       | Bun decides which vineId a client may subscribe to — client cannot pick arbitrarily                                            |
| **Isolation**           | One vine's subject (`village.vine.X.messages`) is never exposed to a client on vine Y                                          |
| **Auditability**        | All NATS publishes go through one code path (`ws.message` handler) — one place to add logging, rate-limiting, or policy checks |
| **Subject opacity**     | Clients send `{ type:'message', content }` — they never see the raw NATS subject string                                        |
| **Credential safety**   | NATS credentials (`NATS_URL`, `NATS_USER`, `NATS_PASSWORD`) are env vars on the Bun server only — never shipped to a browser   |
| **Denial of service**   | Bun can throttle, queue, or reject messages before they ever reach NATS                                                        |
| **Future policy hooks** | Any new rule (rate limit, content filter, HIPAA audit log, Chatterbox hash) is added in one Bun handler, not in every client   |

### Contrast With Path B (nats.ws direct)

In Path B, governance becomes **client-enforced** — and therefore unenforceable:

```
Path A (BREE):
  Browser wants to send a message
    → Bun checks: is this user invited? is the vine active? is JWT valid?
    → Bun publishes to NATS (or rejects)
    → Bun is the authority. No bypass exists.

Path B (nats.ws):
  Browser has a direct NATS WS connection
    → Browser publishes whatever subject it wants
    → nc.publish('village.vine.OTHER-VINE.messages', 'injected!')  ← no check
    → nc.subscribe('village.vine.*.messages')  ← subscribe to ALL vines
    → Governance must now be enforced inside NATS server config (NKeys, accounts)
    → That config is per-user, complex, and rotated outside Bun's awareness
```

### The Governing Code — One Place, One Authority

All NATS coordination for Village Vine lives in a single `ws.message` handler
in `api-realtime/src/index.ts`. This is the **entire governance surface** for live chat:

```typescript
// The complete security + coordination boundary for all village messages
async message(ws, message: any) {
  const { id } = ws.data.params;           // vineId — server-controlled
  if (message?.type === 'ping') {
    ws.send({ type: 'pong', ... });
    return;
  }
  if (message?.type === 'message') {
    // ① Bun is already past the invited/claimed check (enforced in ws.open)
    // ② Bun stamps the timestamp — client cannot forge it
    // ③ Bun controls the NATS subject — client never sees 'village.vine.X.messages'
    // ④ This is the ONLY code path that can write to NATS for this vine
    const nats = await getNatsService();
    const timestamp = new Date().toISOString();    // ← server-side, not client
    const msg = { vineId: id, sender: message.sender, content: message.content, timestamp };
    await nats.publishVillageMessage(id, msg);
    // ⑤ Future: add rate limiting, content policy, Chatterbox hashing here
  }
}
```

Adding audit logging, rate limiting, or HIPAA-compliant message hashing is a
**one-line change** in this handler. With Path B (nats.ws direct), you would need
to push that logic to every client or re-route through Bun anyway — defeating the purpose.

---

## 🔄 Request vs Async Call Patterns in Path A

Bun uses three distinct communication patterns depending on the use case:

### 1. Synchronous REST (req/response)

Used for: village metadata, history, contacts, SMS invites.

```
Browser ──HTTP POST──► Bun ──Bun.write()──► Filesystem
Browser ◄──{ ok }────── Bun

BLOCKING — caller waits for full response before continuing.
Typical path: talent-village.ts route handlers.
```

### 2. WebSocket + NATS Pub/Sub (async fire-and-forget)

Used for: all live chat messages.

```
Browser ──WS send──► Bun ──nats.publish()──► NATS
                                                │
[Bun does NOT await a reply from NATS]          │ fan-out (async)
[browser continues immediately]                 │
                                          ◄─────┘
Browser ◄──WS push── Bun ◄──nats.subscribe callback fires

ASYNC — sender gets no direct acknowledgement.
Bun's NATS subscription callback delivers to each WS client independently.
```

### 3. JetStream Request/Pull (async with durable read)

Used for: history replay on connect/reconnect.

```
Browser ──HTTP GET──► Bun ──nats.getVillageHistory()──► NATS JetStream
                             [await consumer.fetch()]         │
                             [blocks until msgs arrive]       │
                      Bun ◄──────────────────────────────────┘
Browser ◄──messages── Bun

ASYNC with await — Bun awaits JetStream before responding to HTTP.
JetStream consumer is ephemeral-ordered, created per-request.
```

---

## 🌿 The Village Vine Lifecycle (complete state machine)

```
                        ┌─────────────┐
                        │   CREATED   │  POST /api/village/start
                        │  (in-memory │  vineId generated
                        │   + NATS)   │  invited[] set
                        └──────┬──────┘
                               │ users call useVillageVine({ vineId })
                        ┌──────▼──────┐
                        │  CONNECTING  │  WS upgrade
                        │             │  name checked vs invited[]
                        └──────┬──────┘
                               │ ws.onopen fires
                        ┌──────▼──────┐
                        │   ACTIVE    │  NATS subscription live
                        │  (NATS sub  │  claimed.add(name)
                        │   running)  │  messages flow bidirectionally
                        └──────┬──────┘
                               │ ws.onclose (tab close, timeout, error)
                        ┌──────▼──────┐
                        │ DISCONNECTED│  claimed.delete(name)
                        │             │  NATS sub cleaned up (unsub())
                        └──────┬──────┘
                               │ reconnect: setTimeout(connect, 5000)
                        ┌──────▼──────┐
                        │ RECONNECTING│  new WS, same vineId
                        │             │  history fetched from JetStream
                        └─────────────┘

Note: vineId and messages persist (JetStream) even if ALL clients disconnect.
      The in-memory villageVines Map is ephemeral — it resets on server restart.
      This means vine access control resets on restart, but message history survives.
```

---

## 🔑 Key Design Decisions

| Decision                           | Rationale                                                                                                                                                                         |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Bun as the NATS-WS bridge**      | `nats.ws` direct is technically possible but requires public NATS WS port, credentials in browser, no invite-list enforcement, and complex JetStream access — Bun solves all four |
| **Optimistic UI first**            | Message appears at `t=0`; NATS confirmation arrives ~10ms later; dedup (±2s same sender+content) merges them cleanly                                                              |
| **JetStream for chat history**     | Durable across Fly machine restarts; no DB needed for chat; JetStream API complexity stays server-side in Bun                                                                     |
| **agentx.md for village metadata** | Village structure (name, slots, lead) is file-based and AI-readable; live chat is NATS-only — clean separation                                                                    |
| **4min WS idle timeout**           | Hook sends periodic pings to reset the timer; long assessment sessions stay connected without reconnecting                                                                        |
| **Invited list in-memory**         | Gate-keeping is O(1) Set lookup; vineId itself is the "secret" shared out-of-band (SMS invite or URL)                                                                             |
| **No public NATS WS port**         | NATS stays on internal Fly network (4222 TCP); only Bun faces the public internet — single attack surface                                                                         |
| **No plaintext in future**         | Current: messages carry content. Future: route through Chatterbox (BLAKE2b-256 ehash — no PII stored in NATS)                                                                     |

---

## 📁 Source Files

| File                                                                                                          | Role                                                     |
| ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [`apps/talent-village-ai/src/hooks/useVillageVine.ts`](../apps/talent-village-ai/src/hooks/useVillageVine.ts) | Browser hook — WS connect, send, receive, history        |
| [`apps/api-realtime/src/index.ts`](../apps/api-realtime/src/index.ts)                                         | WS server — NATS bridge, vine access control             |
| [`apps/api/src/nats.ts`](../apps/api/src/nats.ts)                                                             | NatsService singleton — publish, subscribe, JetStream    |
| [`apps/api/src/routes/talent-village.ts`](../apps/api/src/routes/talent-village.ts)                           | Village REST API — CRUD → `data/villages/{id}/agentx.md` |
| [`agentx/nats.agentx.md`](../nats.agentx.md)                                                                  | Full NATS subject taxonomy and patterns                  |
| [`agentx/apps/bree-api-realtime.agentx.md`](./bree-api-realtime.agentx.md)                                    | RT plane routes and OpenAI streaming pipeline            |

---

## 🚀 Local Dev Quick Reference

```bash
# 1. Start NATS
docker compose up nats
# NATS at nats://localhost:4222
# Monitor at http://localhost:8222

# 2. Start bree-api (REST plane)
cd apps/api && bun run dev
# → http://localhost:3000

# 3. Start bree-api-realtime (WS + NATS bridge)
cd apps/api-realtime && bun run dev
# → http://localhost:3001

# 4. Start the frontend
cd apps/talent-village-ai && bun run dev
# → http://localhost:5173

# Confirm the pipeline is live:
nats sub 'village.vine.>'        # watch all vine messages
nats sub 'village.vines.created' # watch vine creation events
```

---

_This note is AI-readable. Ask about any layer — the hook, the bridge, or the NATS patterns._
