---
title: BREE AI — Monorepo Architecture
type: architecture
scope: monorepo
stack: Bun, React, Elysia, NATS, Fly.io
last_updated: 2026-02-25
ai_context: true
---

# BREE AI — Monorepo Architecture

> **For AI tools:** This `agentx/` folder is the canonical knowledge base for the BREE AI monorepo. Read this file first, then consult the topic-specific notes.

---

## What is BREE?

BREE is a **multi-tenant AI platform** built as a Bun monorepo. It hosts multiple branded AI applications (KAT.ai, HabitAware AI, The Vineyard, Talent Village) that all share a common API gateway, real-time infrastructure, and component library.

**Stack mantra:** Bun · React · Elysia · NATS — no Node.js.

---

## Monorepo Layout

```
bree-ai/
├── agentx/                    ← AI knowledge base (this folder)
├── apps/
│   ├── api/                   ← bree-api       (data plane — Bun + Elysia)
│   ├── api-realtime/          ← bree-api-realtime (real-time plane — NATS/WS/SSE)
│   ├── kat-ai/                ← KAT.ai frontend (Vite + React)
│   ├── habitaware-ai/         ← HabitAware AI frontend
│   ├── the-vineyard/          ← The Vineyard (Vineyard project manager)
│   ├── talent-village-ai/     ← Talent Village (AI hiring assessment)
│   ├── antimatter-admin/      ← Internal admin UI
│   ├── antimatter-db/         ← Database management app
│   ├── ai-tracker/            ← AI usage tracking app
│   └── fatapps-ai/            ← FatApps AI frontend
├── packages/
│   ├── bree-ai-core/          ← Shared React components, hooks, API clients
│   ├── agent-collective-sdk/  ← SDK for NATS agent communication
│   └── agent-collective-ui-kit/ ← Shared UI kit for agent dashboards
├── deploy.sh                  ← Multi-app Fly.io deploy script
├── docker-compose.yml         ← Local development stack
└── package.json               ← Bun workspace root
```

---

## Design Tenets

### 1. Bun-Native Everything

No Node.js. No `node:fs`. Use `Bun.file()`, `Bun.write()`, `Bun.spawnSync()`, `Bun.Glob`. The runtime is Bun — exploit it.

### 2. Two-Plane API Architecture

Traffic is split at the service boundary:

| Plane         | App                             | Owns                                     |
| ------------- | ------------------------------- | ---------------------------------------- |
| **Data**      | `bree-api` (port 3000)          | Auth, AI proxy, DB, file storage, config |
| **Real-time** | `bree-api-realtime` (port 3001) | WebSocket, SSE, NATS pub/sub             |

Frontends use:

- `VITE_API_URL` → bree-api
- `VITE_REALTIME_URL` → bree-api-realtime

### 3. NATS as the Nervous System

All real-time communication — agent discovery, live chat, AI streaming, lifecycle events — flows through NATS. See [`nats.md`](./nats.md).

### 4. Shared Package = One Change, All Apps

`packages/bree-ai-core` is the single source of truth for:

- React components (`Login`, `SpeakingAvatar`, `FeedbackButton`, `IdentityZeroConsole`)
- API clients (`breeAPI`, `api-client`, `ragster`)
- Hooks (`useOpenAIStream`, `useTextToSpeech`, `useSpeakToText`)
- Utilities (`openai-chat`, `env`)

**Always modify the shared package, not individual apps.**

### 5. Multi-Tenant by Design

Every app is a separate Fly.io application with its own `VITE_BRAND_ID`, `VITE_APP_NAME`, `VITE_RAGSTER_DEFAULT_ORG_ID`. The same API serves all tenants, isolating data by `client_id` / `org_id`.

### 6. JWT Auth — Two Providers

Auth can be either `identity-zero` (default, custom multi-tenant) or `better-auth`. Controlled per deployment via `AUTH_PROVIDER` env var. Tokens are always `Bearer {jwt}` in the `authorization` header. JWT secret is shared between data and real-time planes.

### 7. Deploy via Fly.io

All apps deploy to Fly.io using `./deploy.sh`. See [`fly.md`](./fly.md).

---

## Data Flow — Full Request Lifecycle

```
Browser
  │
  ├─► VITE_API_URL/api/...           (HTTP REST — auth, config, AI proxy)
  │       └─ bree-api (Elysia)
  │               ├─ auth-provider.ts    (JWT verification)
  │               ├─ routes/             (auth, knowledge, bubbles, vineyard, etc.)
  │               └─ External services   (OpenAI, Ragster, AgentX, Twilio)
  │
  ├─► VITE_REALTIME_URL/api/openai/chat/stream   (POST → SSE)
  │       └─ bree-api-realtime (Elysia)
  │               └─ Bun async worker → NATS → OpenAI → NATS → SSE → Browser
  │
  └─► VITE_REALTIME_URL/api/village/:id/ws       (WebSocket)
          └─ bree-api-realtime (Elysia)
                  └─ NATS pub/sub → All connected participants
```

---

## Shared Package (`bree-ai-core`) Map

```
packages/bree-ai-core/src/
├── components/
│   ├── Login.tsx               ← Universal login modal
│   ├── SpeakingAvatar.tsx      ← Animated AI avatar with TTS
│   ├── FeedbackButton.tsx      ← Floating feedback widget
│   ├── IdentityZeroConsole.tsx ← Identity Zero auth console
│   └── index.ts
├── hooks/
│   ├── useOpenAIStream.ts      ← NATS-backed streaming chat hook
│   ├── useTextToSpeech.ts      ← OpenAI TTS hook
│   ├── useSpeakToText.ts       ← OpenAI Whisper STT hook
│   └── index.ts
├── utils/
│   ├── api-client.ts           ← API_URL + REALTIME_URL + Eden treaty client
│   ├── breeAPI.ts              ← Unified API facade (all services)
│   ├── openai-chat.ts          ← generateChatResponseStream (NATS SSE)
│   ├── ragster.ts              ← Ragster knowledge search client
│   ├── collective.ts           ← AgentX collective client
│   ├── antimatter.ts           ← Antimatter DB client
│   └── env.ts                  ← safeEnv() helper
└── index.ts
```

---

## External Services

| Service           | Role                                           | Env Var                       |
| ----------------- | ---------------------------------------------- | ----------------------------- |
| **OpenAI**        | Chat completions, TTS (tts-1), STT (whisper-1) | `OPENAI_API_KEY`              |
| **Ragster**       | RAG knowledge search + document collections    | `RAGSTER_API_URL`             |
| **AgentX**        | Multi-agent collective orchestration           | `AGENTX_URL`                  |
| **NATS**          | Real-time messaging backbone                   | `NATS_URL`                    |
| **Twilio**        | SMS invitations (Village Vine)                 | `TWILIO_SID`, `TWILIO_TOKEN`  |
| **Identity Zero** | Multi-tenant auth provider (default)           | `AUTH_PROVIDER=identity-zero` |
| **Better Auth**   | Alternative auth provider                      | `AUTH_PROVIDER=better-auth`   |
| **Fly.io**        | Cloud hosting for all apps                     | `FLY_APP_NAME`                |

---

## Key Conventions

- **Token storage:** `localStorage.getItem('bree_jwt')`
- **Auth header:** `authorization: Bearer {token}` (lowercase key)
- **Brand isolation:** `VITE_BRAND_ID` identifies the tenant in every frontend
- **Org isolation:** `VITE_RAGSTER_DEFAULT_ORG_ID` scopes knowledge search
- **File storage:** Bun-native — `VILLAGES_DIR` env var for Talent Village markdown files
- **DB:** SQLite (default, `DB_PATH`) or Postgres (`DATABASE_URL`) for conversations

---

## Related Notes

- [`agentx/nats.agentx.md`](./nats.agentx.md) — NATS subjects, patterns, and agent protocol
- [`agentx/fly.agentx.md`](./fly.agentx.md) — Fly.io deployment, secrets, machine config
- [`agentx/grapes.agentx.md`](./grapes.agentx.md) — AI Agent Collective ("Grapes") architecture
- [`agentx/streaming.agentx.md`](./streaming.agentx.md) — NATS→SSE streaming and WebSocket patterns
- [`agentx/apps/`](./apps/) — Per-app detailed notes
