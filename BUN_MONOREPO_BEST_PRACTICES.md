# Bun Monorepo & Agent Architecture Best Practices

This document outlines the **Mandatory** architecture for all agent-based applications in this workspace. We follow a "Bun Monorepo" pattern that ensures clean boundaries, high performance, and simple deployment.

## Core Philosophy

- **Bun** for everything (Runtime, Package Manager, Test Runner).
- **Monorepo** for shared state and isolated boundaries.
- **Single Container** deployment for production (Fly.io).
- **Type Safety** across boundaries (Eden Treaty).

---

## 🏗️ Monorepo Structure

We use Bun Workspaces to manage dependencies and link local packages.

```text
repo/
├─ apps/
│  ├─ web/          # Vite + UI (React 19)
│  │  ├─ src/
│  │  ├─ index.html
│  │  ├─ vite.config.ts
│  │  └─ package.json
│  └─ api/          # Elysia (Backend)
│     ├─ src/
│     │  └─ server.ts
│     └─ package.json
│
├─ packages/
│  ├─ shared/       # Shared types / utils / schemas
│  │  ├─ src/
│  │  └─ package.json
│
├─ package.json     # Workspace root
├─ bun.lockb
└─ Dockerfile       # Multi-stage build
```

---

## 📦 Service Boundaries

### 1. The Frontend (`apps/web` / per-agent UI)

- **Tech**: Vite, React 19, Tailwind.
- **Role**: Pure UI. No direct DB access. Talks only to its specialized API.
- **Build**: Outputs to `../../dist` (repo root) or local `dist` depending on deploy strategy.
- **Dev**: Runs on port `5173` (proxies `/api` to backend).

### 2. The Backend (`apps/api` / per-agent Brain)

- **Tech**: Bun, Elysia, Eden Treaty.
- **Role**: Domain logic, Database access, NATS connectivity.
- **Prod**: Serves the frontend static assets AND the API API.
- **Dev**: Runs on port `3000`.

### 3. Shared Libraries (`packages/*`)

- **Tech**: TypeScript, `bun build`.
- **Role**: Shared logical kernels, schemas, and types.
- **Rule**: Pure functions preferred. No side effects.

---

## 🏗️ Database & State Management

### 1. Avoid "Transaction-per-Request"

We **NEVER** use a global middleware that opens a database transaction at the start of a request and commits at the end.

- **Why**:
  - **Scalability**: Transactions hold locks and connections. In an async agentic system, a "request" might involve waiting for external AI APIs (OpenAI, AgentX), during which the DB would be blocked.
  - **Correctness**: We want explicit control over what is atomic.
- **Pattern**:
  - Perform DB operations as needed.
  - If atomicity is required for a specific set of writes, use an **explicit, scoped transaction** block for _only_ those writes.
  - Do **NOT** perform `await fetch(...)` or expensive computation inside a DB transaction block.

### 2. SQLite / Direct Access

- Use `bun:sqlite` for fastest local state management.
- Keep the schema simple and managed via `db.ts` initializers.

---

## 🚀 Production Deployment Pattern (The "Holy Grail")

For production (Fly.io), we use a **Single Container** strategy where the API serves the Frontend.

### Why?

1. **One Fly Machine** = Lower cost, simpler scaling.
2. **Zero CORS** issues (Same origin).
3. **Atomic Deploys** (Frontend and Backend always match).

### Implementation

**1. Vite Config (`vite.config.ts`)**
Builds to a shared dist folder or known location.

```typescript
export default defineConfig({
  build: {
    outDir: "../../dist", // Or keep local and copy in Docker
  },
});
```

**2. Elysia Server (`server.ts`)**
Serves the static files from the build output.

```typescript
import { Elysia } from "elysia";
import { staticPlugin } from "@elysiajs/static";

const app = new Elysia()
  // Serve API
  .get("/api/health", () => ({ ok: true }))
  // Serve Frontend
  .use(
    staticPlugin({
      assets: "dist", // Folder containing index.html and assets
      prefix: "/",
    }),
  )
  .listen({ port: 3000, hostname: "0.0.0.0" });
```

**3. Dockerfile (Multi-Stage)**

```dockerfile
# --- BUILD ---
FROM oven/bun:latest AS build
WORKDIR /app
COPY . .
RUN bun install
RUN bun run --filter web build  # Build frontend

# --- RUNTIME ---
FROM oven/bun:slim
WORKDIR /app
# Copy built assets to dist
COPY --from=build /app/apps/web/dist ./dist
# Copy backend source
COPY --from=build /app/apps/api ./apps/api
COPY --from=build /app/packages ./packages
COPY --from=build /app/package.json ./

RUN bun install --production

ENV NODE_ENV=production
EXPOSE 3000
CMD ["bun", "run", "apps/api/src/server.ts"]
```

---

## 🧪 Local Development

In development, we run two processes for speed (HMR + Backend Restart).

```bash
bun install
bun run dev
```

**Root `package.json`:**

```json
"scripts": {
  "dev": "bun run --filter web dev & bun run --filter api dev"
}
```

- **Frontend**: `http://localhost:5173` (Proxies `/api` -> `3000`)
- **Backend**: `http://localhost:3000`

---

## 🦾 Reliable Messaging (NATS JetStream)

For task processing and persistent streams, use **JetStream Pull Subscriptions**. This ensures at-least-once delivery and prevents message loss if a consumer is down.

### Mandatory Pull Pattern

```typescript
const js = nc.jetstream();
// Pull subscribe with a durable name
const sub = await js.pullSubscribe("agent.tasks", { durable: "agent-v1" });

for await (const msg of sub) {
  try {
    const data = JSON.parse(sc.decode(msg.data));
    await handle(data);

    // Explicit ACK only on success
    msg.ack();
  } catch (e) {
    // message is NOT acked → JetStream will redeliver based on AckWait
    console.error("Task failed, will retry:", e);
  }
}
```

---

## 🔥 Evolution Path

This structure is designed to scale:

1. **Start**: One Monorepo, One App, One API.
2. **Grow**: Multiple Apps (`apps/agent-a`, `apps/agent-b`).
3. **Scale**: Split into per-agent Fly apps by creating separate Dockerfiles or Fly configs for each `apps/` entry if needed, while keeping shared code in `packages/`.
