---
title: bree-api-realtime — Real-Time Plane
type: app
app: bree-api-realtime
fly_app: bree-api-realtime
url: https://bree-api-realtime.fly.dev
port: 3001
stack: Bun, Elysia, NATS, WebSocket, SSE
last_updated: 2026-02-25
ai_context: true
---

# bree-api-realtime — Real-Time Plane

Owns all long-lived connections: WebSocket, Server-Sent Events, and NATS pub/sub. Completely isolated from the data plane so that high-concurrency streaming doesn't affect auth/data operations.

See also: [`agentx/streaming.agentx.md`](../streaming.agentx.md) for deep-dive on patterns.

---

## Responsibilities

- **OpenAI NATS streaming** — NATS-decoupled SSE pipeline (tokens arrive per-chunk)
- **Village Vine WebSocket** — real-time multi-participant chat via NATS fan-out
- **Agent terminal WebSocket** — live log/lifecycle streaming from grape processes
- **Twilio SMS** — village vine invite messages
- **Contact lookup** — SQLite contact store

---

## Source Structure

```
apps/api-realtime/src/
├── index.ts           ← Elysia app entry; mounts all route groups + starts worker
└── openai-stream.ts   ← NATS job publisher, Bun async worker, SSE SSE endpoint
```

---

## Route Summary

| Method | Path                           | Description                              |
| ------ | ------------------------------ | ---------------------------------------- |
| `GET`  | `/health`                      | Health check                             |
| `POST` | `/api/openai/chat/stream`      | Submit streaming job → `{ streamId }`    |
| `GET`  | `/api/openai/chat/stream/:id`  | SSE — receive tokens as they arrive      |
| `POST` | `/api/openai/chat`             | Legacy blocking chat (deprecated)        |
| `GET`  | `/api/agents`                  | Discover NATS grapes                     |
| `GET`  | `/api/agents/:id`              | Get grape status                         |
| `POST` | `/api/agents/:id/message`      | Send message to grape                    |
| `WS`   | `/api/agents/:id/ws`           | Agent terminal stream (logs + lifecycle) |
| `POST` | `/api/village/start`           | Create a new village vine                |
| `POST` | `/api/village/:id/message`     | Send message (REST)                      |
| `GET`  | `/api/village/:id/messages`    | Message history                          |
| `WS`   | `/api/village/:id/ws`          | Real-time vine chat                      |
| `POST` | `/api/village/send-invite-sms` | Twilio SMS invite                        |
| `GET`  | `/api/village/contacts`        | List all contacts                        |
| `GET`  | `/api/village/contacts/lookup` | Find contact by phone                    |

---

## OpenAI Streaming Pipeline

```
POST /api/openai/chat/stream → { streamId }   (< 1ms)
  └─ NATS publish: openai.jobs

Bun Async Worker (boot-time subscription):
  openai.jobs → processStreamJob()
    OpenAI fetch(stream: true)
    per token → NATS publish: openai.stream.{id}.token
    on [DONE] → NATS publish: openai.stream.{id}.done

GET /api/openai/chat/stream/:id  (SSE)
  → nats.subscribeWildcard('openai.stream.{id}.*')
  → token events pushed as SSE to browser
  → connection cancel → NATS unsub immediately
```

---

## Village Vine State

In-memory `Map<vineId, { topic, invited[], claimed: Set<name> }>` tracks active vines per machine lifetime. On WS open:

- Name must be in `invited` list → 406 if not
- Name must not be in `claimed` set → 409 if duplicate
- Name added to `claimed` on open, removed on close

---

## Environment Variables

| Variable              | Required | Description                           |
| --------------------- | -------- | ------------------------------------- |
| `NATS_URL`            | ✅       | NATS server URL                       |
| `OPENAI_API_KEY`      | ✅       | OpenAI API key for streaming worker   |
| `JWT_SECRET`          | ✅       | **Same value as bree-api**            |
| `AUTH_PROVIDER`       | optional | `identity-zero` or `better-auth`      |
| `DATABASE_URL`        | optional | Postgres URL for conversation history |
| `DB_PATH`             | optional | SQLite fallback                       |
| `TWILIO_SID`          | optional | Twilio account SID                    |
| `TWILIO_TOKEN`        | optional | Twilio auth token                     |
| `TWILIO_PHONE_NUMBER` | optional | Twilio from-number                    |
| `PORT`                | optional | HTTP port (default: `3001`)           |
| `DEMO_MODE`           | optional | `true` bypasses auth                  |

---

## Local Dev

```bash
cd apps/api-realtime && bun run dev
# → http://localhost:3001
```
