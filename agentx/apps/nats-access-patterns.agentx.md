---
title: NATS Access Patterns — Browser Direct vs Bun-Mediated
type: architecture-comparison
scope: platform
stack: React, Bun, Elysia, NATS JetStream, WebSocket, nats.ws
last_updated: 2026-03-06
ai_context: true
tags: [nats, websocket, security, governance, comparison, architecture]
see_also:
  - apps/talent-village-bree-nats.agentx.md # deep-dive with full call flows
  - nats.agentx.md # full NATS subject taxonomy
  - apps/bree-api-realtime.agentx.md # RT plane route reference
---

# NATS Access Patterns — Browser Direct vs Bun-Mediated

Two ways a browser can interact with NATS. One is a short-cut with long-term costs.
The other trades ~10ms of latency for complete security governance.

---

## The Two Architectures

### Pattern A — Browser → IdP → Bun → NATS (BREE default)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION CHAIN                         │
└─────────────────────────────────────────────────────────────────────┘

Browser
  │
  │  POST /api/auth/login  (Identity Zero)
  │  POST /api/auth/...    (Better Auth / JWKS)
  │
  ▼
IdP — Identity Zero or Better Auth
  │  Identity Zero:  AES-encrypted per-tenant JWT secret (Postgres)
  │  Better Auth:    JWKS endpoint, org context, token balance
  │
  │  ← accessToken (JWT)
  │
  ▼
Browser  (stores JWT in memory / localStorage)
  │
  │  Authorization: Bearer <JWT>     ← all HTTP requests
  │  WebSocket upgrade + name param  ← real-time vine connection
  │
  ▼
Bun / Elysia  ─── bree-api-realtime (:3001)
  │
  │  requireAuth():  verifies JWT against IdP (Identity Zero: per-tenant
  │                  secret from Postgres; Better Auth: JWKS public key)
  │  ✅ Identity confirmed    (userId, email, roles, org_id)
  │  ✅ Vine invite check     (vine.invited[] against WS name param)
  │  ✅ Authorization         (which subjects can this user touch?)
  │  ✅ Timestamp stamped     (server-side, not forgeable)
  │  ✅ Subject routing       (client never sees raw NATS subject)
  │
  │  TCP (nats://)  — internal network only
  │
  ▼
NATS JetStream  ───  internal network only (port 4222)
```

**Bun is the sole coordinator.** The browser authenticates with an IdP and receives
a JWT. Every subsequent request — HTTP or WebSocket — carries that JWT. Bun verifies
it before any NATS operation is started. The browser never interacts with NATS directly.

---

### Pattern B — Browser → NATS via WebSocket (nats.ws)

```
Browser ── nats.ws client ──────────────────────────────────►
  │                                                          │
  │  WebSocket (wss://)                                      │
  │  NATS protocol inside WS frames                         │
  ▼                                                          ▼
NATS  ─── WebSocket listener (:8080, publicly exposed)
  │
  │  ⚠️  Client picks its own subjects
  │  ⚠️  Fan-out happens here, unmediated
  │  ⚠️  JetStream history requires elevated browser perms
  │  ⚠️  NATS credentials must live in the browser bundle
```

**NATS is exposed directly.** Access control, credential management, and
subject governance must be configured inside NATS itself (NKeys, Accounts) —
or pushed back to Bun anyway for token issuance.

---

## 🔐 Pattern A — Full Auth Flow (Browser → IdP → JWT → Bun → NATS)

This is the complete end-to-end authentication and NATS access chain for Talent Village:

```
BROWSER                   IdP (Identity Zero / Better Auth)         BUN                    NATS
───────                   ─────────────────────────────────         ───                    ────

① AUTHENTICATION
──────────────────────────────────────────────────────────────────────────────────────────────
user logs in
  │
  │  POST /api/auth/login { email, password, clientId }
  │  ──────────────────────────────────────────────────────────────────────────────────────►
  │                                 Identity Zero:
  │                                   SELECT jwt_secret FROM client WHERE client_id = iss
  │                                   AES-256-GCM decrypt(jwt_secret)
  │                                   bcrypt.verify(password, hash)
  │                                   jose.sign({ userId, email, roles, iss: clientId })
  │
  │                                 Better Auth:
  │                                   JWKS-signed JWT
  │                                   { sub, org_id, org_role, token_balance, ... }
  │
  │  ◄────────────────────────────── { accessToken: "eyJ..." } ──────────────────────────
  │  store JWT (memory / localStorage)
  │
  │  [one-time — token reused for all subsequent requests]


② REST CALLS — JWT verified on every request
──────────────────────────────────────────────────────────────────────────────────────────────
  │  POST /api/village/start
  │  Authorization: Bearer eyJ...
  │  ────────────────────────────────────────────────────────────────────────────────────►
  │                                                               requireAuth():
  │                                                                 Identity Zero:
  │                                                                   decodeJwt → iss
  │                                                                   Postgres lookup
  │                                                                   AES decrypt secret
  │                                                                   jwtVerify ✓
  │                                                                 Better Auth:
  │                                                                   JWKS.verify ✓
  │                                                               vine created in-memory
  │                                                                                      publish ──►
  │                                                                                      village.vines
  │                                                                                      .created
  │  ◄──────────────────────────────────────────────────────────────────────────────────
  │  { success: true, vineId }


③ WEBSOCKET — JWT for REST, invite-list for WS identity
──────────────────────────────────────────────────────────────────────────────────────────────
  │  WS upgrade: /api/village/{vineId}/ws?name=Alice
  │  [WS upgrade requests bypass Authorization header — name param is the identity claim]
  │  ════════════════════════════════════════════════════════════════════════════════════►
  │                                                               ws.open:
  │                                                                 vineId = param (server-set)
  │                                                                 name   = query param
  │                                                                 vine.invited.includes(name) ✓
  │                                                                 vine.claimed.has(name)      ✗
  │                                                                 vine.claimed.add('Alice')
  │                                                                                      subscribe ──►
  │                                                                                      village.vine
  │                                                                                      .{id}.messages
  │  ◄════════════════════════════════════════════════════════════════════════════════════
  │  { type: 'connected', vineId, name: 'Alice' }


④ SEND MESSAGE — no re-auth, Bun already verified identity at connection time
──────────────────────────────────────────────────────────────────────────────────────────────
  │  ws.send({ type:'message', sender:'Alice', content:'Hello!' })
  │  ════════════════════════════════════════════════════════════════════════════════════►
  │                                                               ws.message:
  │                                                                 vineId from params ← server
  │                                                                 timestamp = Date.now() ← server
  │                                                                 [not from client — cannot forge]
  │                                                                                      publish ──►
  │                                                                                      village.vine
  │                                                                                      .{id}.messages
  │                                                                                           │ fan-out
  │  ◄════════════════════════════════════════════════════════════════════════════════════════╗
  │  { type:'message', sender:'Alice', content:'Hello!', timestamp }    ← all vine subscribers
```

### Auth Providers Supported

| Provider                    | How JWT is verified                                                   | Multi-tenant                             | Extra claims                                                         |
| --------------------------- | --------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------- |
| **Identity Zero** (default) | Per-tenant AES-encrypted secret in Postgres, looked up by `iss` claim | ✅ Yes — each client has isolated secret | `clientId`, `roles`                                                  |
| **Better Auth**             | JWKS public key from `BETTER_AUTH_JWKS_URL`                           | ✅ Via `org_id` / `org_role`             | `org_id`, `org_role`, `token_balance`, `allowed_models`, `plan_tier` |

> **Key security property:** The JWT secret for Identity Zero is **never stored in plaintext**.
> It is AES-256-GCM encrypted at rest in Postgres. Even database exposure does not leak secrets
> across tenants. Each tenant's JWT can only be verified using that tenant's decrypted key.

---

## At a Glance

| Concern                  | Browser → Bun → NATS                                                    | Browser → nats.ws → NATS                                  |
| ------------------------ | ----------------------------------------------------------------------- | --------------------------------------------------------- |
| **IdP / Auth flow**      | ✅ Browser authenticates with IdP, JWT verified by Bun on every request | ❌ No IdP flow — NATS credential in browser, no JWT chain |
| **Security boundary**    | ✅ Bun (one place)                                                      | ⚠️ NATS server config + per-user NKeys                    |
| **Identity enforcement** | ✅ JWT verified (Identity Zero or JWKS)                                 | ⚠️ NATS user/pass or NKey in browser bundle               |
| **Subject control**      | ✅ Client never sees subject names                                      | ❌ Client chooses any subject                             |
| **Invite-list / access** | ✅ `vine.invited[]` checked in Bun                                      | ❌ No concept in NATS core                                |
| **Multi-tenancy**        | ✅ Per-tenant JWT secret (Identity Zero)                                | ❌ Shared NATS credentials across tenants                 |
| **Audit / logging hook** | ✅ One handler, one change                                              | ❌ Must push to every client                              |
| **NATS public exposure** | ✅ None (port 4222 internal only)                                       | ⚠️ Port 8080 must be public                               |
| **Credential safety**    | ✅ Server env vars + encrypted Postgres                                 | ❌ Visible in DevTools                                    |
| **JetStream history**    | ✅ Bun REST, 4 lines of code                                            | ⚠️ Browser JetStream API (complex)                        |
| **Self-echo handling**   | ✅ Bun dedup + optimistic UI                                            | ❌ Client must suppress manually                          |
| **Message latency**      | ~5–20 ms (Bun hop)                                                      | ~2–8 ms (one less hop)                                    |
| **Future policy hooks**  | ✅ Add in one Bun handler                                               | ❌ Re-route through Bun anyway                            |

---

## 💻 Code Comparison — Pattern A (Real) vs Pattern B (Hypothetical)

### 1. Authentication

**Pattern A — Browser (actual code)**

```typescript
// apps/talent-village-ai/src/hooks/useVillageVine.ts (auth happens before hook is called)
// The app authenticates with bree-api, receives a JWT, stores it, passes vineId to the hook.

const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password, clientId }), // clientId = tenant
});
const { accessToken } = await response.json();
localStorage.setItem("token", accessToken);
// accessToken is a signed JWT — Identity Zero used per-tenant AES-encrypted secret
```

**Pattern A — Bun verifies (actual code, `api-realtime/src/index.ts`)**

```typescript
// requireAuth() runs on every HTTP request before any NATS call
async function requireAuth(headers, jwtCtx, set): Promise<JWTPayload | null> {
  const authHeader = headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    set.status = 401;
    return null;
  }
  const token = authHeader.slice(7);
  // Identity Zero: decodes iss → Postgres lookup → AES decrypt secret → jwtVerify
  // Better Auth:   JWKS public key fetch → jwtVerify
  const payload = await verifyToken(token, identityZeroVerifyToken);
  return payload; // { userId, email, roles, org_id, ... }
}
```

**Pattern B — Browser (hypothetical, nats.ws)**

```typescript
// ⚠️  No IdP. Credentials live directly in the browser bundle.
import { connect } from "nats.ws";

const nc = await connect({
  servers: "wss://agent-collective-nats.fly.dev:8080",
  user: "village-user", // ← hardcoded or read from env at build time
  pass: "village-secret-123", // ← visible in DevTools → Application → Storage
  // OR: NKey-based token — still must be shipped to browser
});
// No JWT. No tenant isolation. No role checking. All users share one NATS identity.
```

---

### 2. Connect & Subscribe

**Pattern A — Browser (actual code, `useVillageVine.ts`)**

```typescript
// Browser opens a plain WebSocket — no NATS library needed in the browser
const wsUrl = `${REALTIME_BASE_URL.replace(/^http/, "ws")}/api/village/${vineId}/ws?name=Alice`;
const ws = new WebSocket(wsUrl);

ws.onopen = () => setIsConnected(true);
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "message") setMessages((prev) => [...prev, data]);
};
// Browser knows: { type, sender, content, timestamp }
// Browser does NOT know: 'village.vine.abc123.messages' (the NATS subject)
```

**Pattern A — Bun subscribes to NATS (actual code, `api-realtime/src/index.ts`)**

```typescript
// Runs in ws.open — after identity + invite checks pass
const nats = await getNatsService();
ws.send({ type: "connected", vineId: id, name });

// This is the NATS subscription — entirely server-side
const unsub = await nats.subscribe(`village.vine.${id}.messages`, (message) => {
  ws.send({ type: "message", ...message }); // bridge NATS → WebSocket
});
wsConnections.set(ws, unsub); // stored so we can cleanup on ws.close
```

**Pattern B — Browser subscribes direct (hypothetical)**

```typescript
// Browser has a live NATS connection and chooses its own subjects
const sub = nc.subscribe("village.vine.abc123.messages");

// ⚠️  Nothing stops the browser from subscribing to ANY vine:
const allVines = nc.subscribe("village.vine.*.messages"); // spy on everything
const allMsg = nc.subscribe("village.vine.>"); // even broader

for await (const msg of sub) {
  const data = JSON.parse(msg.string());
  setMessages((prev) => [...prev, data]);
}
// No Bun in this path. No invite check. No identity verification.
```

---

### 3. Send a Message

**Pattern A — Browser (actual code, `useVillageVine.ts`)**

```typescript
// Optimistic UI — message shown immediately, no wait
setMessages(prev => [...prev, { id: `opt-${Date.now()}`, sender, content, ... }]);

// Fire over WebSocket — Bun handles the rest
ws.send(JSON.stringify({ type: 'message', sender, content }));
// Browser sends: sender + content only. vineId and timestamp come from Bun.
```

**Pattern A — Bun stampings & publishes (actual code, `api-realtime/src/index.ts`)**

```typescript
async message(ws, message: any) {
  if (message?.type === 'message') {
    const nats = await getNatsService();
    const msg = {
      vineId: ws.data.params.id,          // ← server controls vineId
      sender:  message.sender,
      content: message.content,
      timestamp: new Date().toISOString() // ← server stamps time (not forgeable)
    };
    await nats.publishVillageMessage(msg.vineId, msg);
    // One place. Add rate limiting / audit log / Chatterbox hash here.
  }
}
```

**Pattern B — Browser publishes direct (hypothetical)**

```typescript
// Browser controls everything — subject, vineId, timestamp
nc.publish(
  "village.vine.abc123.messages", // ← client picks the subject
  JSON.stringify({
    sender: "Alice",
    content: "Hello!",
    timestamp: new Date().toISOString(), // ← client stamps time (forgeable)
    vineId: "abc123", // ← client sets this (spoofable)
  }),
);

// ⚠️  Alice can also publish to a vine she was never invited to:
nc.publish(
  "village.vine.OTHER-VINE.messages",
  JSON.stringify({ sender: "Alice", content: "Injected!" }),
);
```

---

### 4. Receive Messages & History

**Pattern A — Browser receives (actual code, `useVillageVine.ts`)**

```typescript
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "message") {
    // Dedup: skip if same sender+content within ±2s (optimistic echo guard)
    const isDuplicate = prev.some(
      (m) =>
        m.sender === data.sender &&
        m.content === data.content &&
        Math.abs(new Date(m.timestamp) - new Date(data.timestamp)) < 2000,
    );
    if (!isDuplicate) setMessages((prev) => [...prev, data]);
  }
};

// History on mount — simple REST call, Bun reads from JetStream
const res = await fetch(
  `${REALTIME_BASE_URL}/api/village/${vineId}/messages?limit=500`,
);
const { messages } = await res.json();
```

**Pattern A — Bun serves history (actual code, `api-realtime/src/index.ts`)**

```typescript
.get('/:id/messages', async ({ params: { id }, query }) => {
  const limit = parseInt(query.limit ?? '500', 10);
  const nats = await getNatsService();
  const messages = await nats.getVillageHistory(id, limit); // JetStream consumer pull
  return { success: true, messages, vineId: id };
})
```

**Pattern B — Browser receives and fetches history (hypothetical)**

```typescript
// Receive — NATS echoes your own messages back to you
for await (const msg of sub) {
  const data = JSON.parse(msg.string());
  // ⚠️  NATS echoes publisher back to themselves — must suppress manually
  if (data.sender === currentUserName) continue; // brittle: name collision possible
  setMessages((prev) => [...prev, data]);
}

// History — requires JetStream API with elevated browser permissions
const js = nc.jetstream();
// ⚠️  Stream must already exist. Browser must have permission to bind a consumer.
const consumer = await js.consumers.get("VILLAGE_MESSAGES");
const iter = await consumer.fetch({ max_messages: 500 });
for await (const msg of iter) {
  const data = JSON.parse(msg.string());
  setMessages((prev) => [...prev, data]);
  msg.ack(); // ⚠️  Browser must manage ack/nak lifecycle too
}
```

---

## Why the Latency Trade-off Is Worth It

Pattern B is **~10ms faster per message** on the hot path. That is the only
concrete advantage. Everything else is a cost:

```
Pattern B latency gain:  ~10ms per message
Pattern B costs:
  - NATS port open to the public internet
  - Credentials shipped to every browser client
  - Access control rebuilt in NATS config (NKeys/Accounts)
  - JetStream complexity moved to every browser
  - Any future audit/policy hook requires client-side changes
  - If you need auth tokens, you need Bun anyway → two connections
```

For Talent Village's access pattern (assessment sessions, ~10–50 messages/min),
10ms is imperceptible. The governance savings are permanent.

---

## The Governance Principle

> **In Pattern A, Bun is the single authority over all NATS data.**
> No browser reads, writes, or subscribes to NATS without passing through
> Bun's access checks. This makes every future policy change a server-side
> decision — not a client deployment.

```
               WHAT BUN CONTROLS IN PATTERN A
               ────────────────────────────────
               Who can connect to a vine
               Which vine they connect to
               What subjects exist
               When messages are timestamped
               Which messages reach JetStream
               What gets logged or audited
               What gets rate-limited
               What gets hashed (Chatterbox, future)
```

In Pattern B, all of the above moves into NATS server config or client-side code.
Neither is auditable, neither is centralised.

---

## When You Might Choose Pattern B

Pattern B makes sense when:

- All users are **internal, trusted operators** (e.g. admin tooling, internal dashboards)
- NATS credentials are short-lived, automatically rotated, and scoped per-user via NKeys
- You have deep NATS Accounts expertise and operational capacity to manage them
- Latency is a hard requirement (financial trading, sub-10ms sensor telemetry)
- The client application runs in a controlled environment (Electron, native app) — not a browser

**None of these apply to Talent Village.** Assessment participants are external candidates,
credentials are browser-based, and the priority is data isolation between sessions.

---

## Decision

**BREE uses Pattern A.** Bun coordinates all NATS access. This is not a workaround —
it is the correct architecture for a multi-tenant, browser-based, externally-accessed system.

See [`talent-village-bree-nats.agentx.md`](./talent-village-bree-nats.agentx.md) for the
full annotated call flows, timing breakdowns, and the complete governance code.
