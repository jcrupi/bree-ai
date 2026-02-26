---
title: Real-Time Streaming — NATS, SSE, WebSocket
type: architecture
scope: platform
stack: NATS, SSE, WebSocket, Bun, Elysia
last_updated: 2026-02-25
ai_context: true
---

# Real-Time Streaming — NATS, SSE, WebSocket

`bree-api-realtime` owns all long-lived connections. This note documents the two primary streaming patterns and how they interplay.

---

## Pattern 1 — NATS → SSE (OpenAI Streaming)

Used for: AI chat responses in KAT.ai, HabitAware, The Vineyard, Talent Village.

### Why Not Just Fetch + Stream?

The old approach held one HTTP connection open per request for up to 30 seconds. Under concurrent load this blocks Bun's ability to schedule other work. The NATS-decoupled pattern fixes this:

- **POST** returns in `<1ms` — the HTTP connection closes immediately
- OpenAI streaming runs in a separate Bun async task
- The SSE endpoint is a stateless subscription — any number can connect concurrently
- Client disconnects clean up instantly without killing the OpenAI request

### Full Flow

```
① POST /api/openai/chat/stream
   Body: { query, context, options }
   Auth: Bearer token (optional — DEMO_MODE skips)
   ↓
   Validates → generates streamId (UUID) → publishes to NATS openai.jobs
   Returns: { streamId, model, hint }     (HTTP connection closes)

② NATS: openai.jobs → Bun async worker picks up job
   worker.processStreamJob(job):
     fetch OpenAI { stream: true }
     while (chunk = reader.read()):
       parse SSE lines from OpenAI
       publish each token → NATS openai.stream.{id}.token
     publish done → NATS openai.stream.{id}.done

③ GET /api/openai/chat/stream/:streamId   (SSE)
   Opens ReadableStream backed Response
   Subscribes via nats.subscribeWildcard('openai.stream.{id}.*')
   On token  → enqueue: "event: token\ndata: {...}\n\n"
   On done   → enqueue: "event: done\ndata: {...}\n\n" → close()
   On cancel → unsubscribe NATS immediately
```

### SSE Event Format

```
event: connected
data: {"streamId":"abc-123"}

event: token
data: {"token":"Hello","streamId":"abc-123"}

event: token
data: {"token":" world","streamId":"abc-123"}

event: done
data: {"streamId":"abc-123"}
```

### Frontend — `useOpenAIStream` Hook

```ts
import { useOpenAIStream } from "@bree-ai/core";

const { ask, response, isStreaming, abort, error } = useOpenAIStream({
  systemPrompt: "You are a helpful AI.",
});

// response updates on every token — React re-renders progressively
await ask("What is TypeScript?", documentContext);
```

### Frontend — Direct API

```ts
import { generateChatResponseStream } from "@bree-ai/core";

const full = await generateChatResponseStream(
  query,
  context,
  options,
  (token, accumulated) => setDisplay(accumulated), // per-token
  (fullText) => persist(fullText), // on done
);
```

---

## Pattern 2 — WebSocket ↔ NATS Fan-out (Village Vine)

Used for: Talent Village live assessment sessions.

### Architecture

```
Participant A (WS)  ─────────────────────────────────────────┐
Participant B (WS)  ─── bree-api-realtime WebSocket server ──┼── NATS ── village.vine.{id}.messages
Participant C (WS)  ─────────────────────────────────────────┘
AI Grape (NATS)     ─────────────────────────────────────────┘
```

Every participant (human or AI) publishes to the same NATS subject. Every subscriber receives every message. The vine is the shared room.

### WebSocket Lifecycle

```
Client → WS connect /api/village/{vineId}/ws?name={displayName}
  ↓
Server:
  1. Look up vine in villageVines map
  2. Check name is in invited list → reject if not
  3. Check name not already claimed → reject if duplicate
  4. Mark name as claimed
  5. Connect to NATS, subscribe to village.vine.{id}.messages
  6. Send { type: 'connected', vineId, name }

Client → { type: 'message', sender, content }
  ↓
Server:
  1. Publish to NATS: village.vine.{id}.messages
  2. Persist to conversationDb (SQLite/Postgres)

NATS fires event → Server → all connected WS clients receive:
  { type: 'message', vineId, sender, content, timestamp }

Client disconnects:
  1. name removed from claimed set
  2. NATS subscription unsubscribed
```

### Grape Participation

An AI grape can join a vine as a named participant, publishing AI responses as messages. From the participant's perspective it's just another vine member.

```ts
// Inside a grape process
await nats.subscribe(`village.vine.${vineId}.messages`, async (msg) => {
  if (msg.sender === "AI") return; // avoid self-loops
  const reply = await generateResponse(msg.content);
  await nats.publish(`village.vine.${vineId}.messages`, {
    sender: "AI",
    content: reply,
    timestamp: new Date().toISOString(),
  });
});
```

---

## Pattern 3 — WebSocket → NATS (Agent Terminal)

Used for: Live log streaming from a running grape to a browser terminal.

```
Browser Terminal WS → /api/agents/{agentId}/ws
  open:
    subscribe NATS: logs.{id}.>      → forward as { type: 'log', ... }
    subscribe NATS: lifecycle.{id}.> → forward as { type: 'lifecycle', ... }
  message { type: 'command', action, payload }:
    publish NATS: agent.{id}.{action}
  close:
    unsubscribe all
```

---

## Idle Timeout Configuration

| Connection        | Timeout     | Reasoning                    |
| ----------------- | ----------- | ---------------------------- |
| Agent terminal WS | 3600s (1hr) | Long debugging sessions      |
| Village vine WS   | 240s (4min) | Client sends keepalive pings |
| SSE stream        | n/a         | Closes on `done` / `error`   |

**Keepalive ping pattern (client):**

```ts
setInterval(() => ws.send(JSON.stringify({ type: "ping" })), 30_000);
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.type === "pong") return; // keepalive ack
  handleMessage(msg);
};
```

---

## `X-Accel-Buffering: no`

SSE responses include this header to disable response buffering in Nginx and Fly.io's proxy layer. Without it, tokens get batched before reaching the browser and the streaming effect is lost.

```ts
set.headers["X-Accel-Buffering"] = "no";
```
