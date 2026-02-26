---
title: NATS — Real-Time Messaging Backbone
type: infrastructure
scope: platform
stack: NATS, Bun, Elysia
last_updated: 2026-02-25
ai_context: true
---

# NATS — Real-Time Messaging Backbone

NATS is the central nervous system of BREE AI. Every real-time event — AI token streams, agent lifecycle events, village vine messages, log output — flows through NATS.

---

## Connection

Managed by `apps/api/src/nats.ts` (shared by both API planes).

```ts
import { getNatsService } from "../../api/src/nats";
const nats = await getNatsService(); // lazy singleton, reconnects automatically
```

### Connection Config (env vars)

| Var             | Description                                      |
| --------------- | ------------------------------------------------ |
| `NATS_URL`      | NATS server URL e.g. `nats://nats.internal:4222` |
| `NATS_USER`     | Username (optional)                              |
| `NATS_PASSWORD` | Password (optional)                              |
| `NATS_TOKEN`    | Auth token (optional, alternative to user/pass)  |

### Features Used

- **Core NATS** (pub/sub, request/reply) — primary pattern
- **JetStream** (persistent streams) — available via `nats.getJetStream()`
- **StringCodec** — all messages are JSON-stringified, UTF-8 encoded

---

## NatsService API

```ts
// Publish any object to a subject
await nats.publish('my.subject', { key: 'value' });

// Subscribe — plain callback, no subject context
const unsub = await nats.subscribe('my.subject', (data) => { ... });
unsub(); // cleanup

// Subscribe with wildcard — callback receives (data, subject)
const unsub = await nats.subscribeWildcard('my.subject.*', (data, subject) => {
  const event = subject.split('.').pop(); // e.g. 'token', 'done', 'error'
});

// Request/Reply — waits for a single response
const response = await nats.request('agents.discover', {}, 2000); // 2s timeout

// Send message to an agent
await nats.sendMessageToAgent('my-agent-id', { agentId, content, timestamp });

// Discover all connected agents (broadcasts to agents.discover)
const agents = await nats.discoverAgents();

// Get a single agent's status
const status = await nats.getAgentStatus('agent-id');
```

---

## Subject Taxonomy

### OpenAI Streaming

| Subject                    | Publisher                      | Subscriber   | Description               |
| -------------------------- | ------------------------------ | ------------ | ------------------------- |
| `openai.jobs`              | `POST /api/openai/chat/stream` | Bun worker   | Submit a streaming job    |
| `openai.stream.{id}.token` | Bun worker                     | SSE endpoint | Individual response token |
| `openai.stream.{id}.done`  | Bun worker                     | SSE endpoint | Stream complete           |
| `openai.stream.{id}.error` | Bun worker                     | SSE endpoint | Error occurred            |

### Village Vine (Real-Time Chat)

| Subject                      | Publisher                 | Subscriber              | Description            |
| ---------------------------- | ------------------------- | ----------------------- | ---------------------- |
| `village.vines.created`      | `POST /api/village/start` | Agent collective        | New vine created       |
| `village.vine.{id}.messages` | WS message handler        | All vine WS connections | Chat message broadcast |

### Agent Collective (Grapes)

| Subject                | Publisher                      | Subscriber             | Description             |
| ---------------------- | ------------------------------ | ---------------------- | ----------------------- |
| `agents.discover`      | `GET /api/agents`              | All agents             | Discovery broadcast     |
| `agents.{id}.messages` | `POST /api/agents/:id/message` | Target agent           | Send message to agent   |
| `agent.{id}.{action}`  | WS command handler             | Target agent           | Specific action command |
| `logs.{id}.>`          | Agent process                  | Agent WS endpoint      | Log stream (wildcard)   |
| `lifecycle.{id}.>`     | Agent process                  | Agent WS endpoint      | Lifecycle events        |
| `agents.{id}.status`   | Agent process                  | Status request handler | Agent status report     |

### Subject Pattern Reference

| Pattern        | Meaning                                                              |
| -------------- | -------------------------------------------------------------------- |
| `*.foo`        | Any single token before `foo`                                        |
| `foo.>`        | Any suffix after `foo` (multi-level wildcard)                        |
| `foo.{id}.bar` | Specific ID segment (not a NATS wildcard — used in docs for clarity) |

---

## Messaging Patterns

### 1. Pub/Sub (Fire-and-forget)

Used for broadcasting events to all subscribers. No reply expected.

```ts
// Publisher
await nats.publish("village.vine.abc123.messages", {
  sender: "Alice",
  content: "Hello",
});

// Subscriber (can be multiple)
await nats.subscribe("village.vine.abc123.messages", (msg) => updateUI(msg));
```

### 2. Request/Reply (RPC)

Used for agent discovery and status checks. The requester waits for exactly one response within a timeout.

```ts
// Requester
const reply = await nats.request("agents.grape-1.status", {}, 2000);

// Responder (inside the agent)
nc.subscribe("agents.grape-1.status", (msg) => {
  msg.respond(sc.encode(JSON.stringify({ status: "online" })));
});
```

### 3. Wildcard Fan-out (SSE Streaming)

Used for OpenAI token streaming. One Bun worker publishes tokens; any number of SSE clients can subscribe independently.

```ts
// Worker publishes tokens
await nats.publish(`openai.stream.${streamId}.token`, { token: "Hello" });

// SSE handler subscribes to all events for this stream
const unsub = await nats.subscribeWildcard(
  `openai.stream.${streamId}.*`,
  (data, subject) => {
    const event = subject.split(".").pop(); // 'token' | 'done' | 'error'
    sseController.enqueue(formatSSE(event, data));
  },
);
```

### 4. JetStream (Durable/Persistent)

Available for use cases requiring message replay or guaranteed delivery. Access via:

```ts
const js = await nats.getJetStream();
```

---

## Concurrency Model

Bun's event loop handles all concurrent NATS subscriptions. Each `for await (const msg of sub)` loop yields control back to the event loop between messages — no threads, no blocking.

```
Bun Process (bree-api-realtime)
├─ NATS subscriber: openai.jobs        ← fires processStreamJob() per message
├─   processStreamJob(job-1)           ← concurrent Promise, reads OpenAI stream
├─   processStreamJob(job-2)           ← concurrent Promise
├─   processStreamJob(job-3)           ← concurrent Promise
├─ NATS subscription: logs.agent-1.>  ← forwards to WS client-1
├─ NATS subscription: logs.agent-2.>  ← forwards to WS client-2
└─ NATS subscription: village.vine.>  ← forwards to all vine WS clients
```

---

## Error Handling

- **Connection loss:** `NatsService` reconnects automatically. A `DISCONNECTED` event is logged; `RECONNECTED` clears the error state.
- **Subscribe errors:** Logged per-message; don't crash the subscription loop.
- **Request timeouts:** `nats.request()` throws after the timeout — callers should catch.
- **Worker errors:** `processStreamJob` publishes `openai.stream.{id}.error` before exiting, so SSE clients always get a terminal event.

---

## Local Development

Run NATS locally via Docker Compose:

```bash
docker compose up nats
# NATS available at nats://localhost:4222
# Monitor UI at http://localhost:8222
```

Or use the NATS CLI:

```bash
nats pub village.vine.test123.messages '{"sender":"Dev","content":"test"}'
nats sub 'openai.stream.>'
```
