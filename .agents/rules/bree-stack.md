---
description: BREE Stack Monorepo Rules — enforced for all Antigravity AI agent work in bree-ai
alwaysApply: true
---

# bree-ai Project Rules (Antigravity)

This is the **bree-ai monorepo**. All development assistance must strictly conform to the **BREE stack**.

## The Stack

| Letter | Technology                         | Role                                                                    |
| ------ | ---------------------------------- | ----------------------------------------------------------------------- |
| **B**  | **Bun**                            | Runtime, package manager, test runner — replaces Node.js + npm entirely |
| **R**  | **React 19**                       | Frontend UI framework                                                   |
| **E**  | **Elysia**                         | Backend API framework (runs on Bun)                                     |
| **E**  | **Eden Treaty** (`@elysiajs/eden`) | Type-safe, end-to-end typed API client                                  |

## Absolute Rules

### Runtime & Package Manager

- ✅ Use `bun`, `bunx`, `bun install`, `bun add`, `bun run`, `bun test`
- ❌ Never suggest `node`, `npm`, `yarn`, or `pnpm`
- ❌ Never write scripts that invoke `node` directly
- ❌ Never write `Dockerfile` or CI steps that use `npm` or `node`

### Language

- ✅ All source files must be `.ts` or `.tsx` — no exceptions
- ✅ Use ESM `import`/`export` exclusively
- ❌ No `.js` source files in `src/` directories
- ❌ No CommonJS `require()` — ever
- ❌ No `tsconfig.json` with `"module": "commonjs"`

> **Exception:** Config files like `postcss.config.js` and `tailwind.config.js` may remain `.js` when tools require it, but they must use ESM syntax.

## Monorepo Structure

```
bree-ai/
├── apps/           # Deployable apps (Elysia backends + React/Vite frontends)
├── packages/       # Shared internal packages
│   └── bree-ai-core/   # Core shared components and utilities
├── package.json    # Root workspace
└── bun.lock
```

- All `package.json` files must have `"type": "module"`
- Internal packages are referenced with `"workspace:*"` — never with relative paths in package.json
- The monorepo uses Bun workspaces (defined in the root `package.json`)

## Backend: Elysia Pattern

```typescript
// apps/<name>/src/index.ts
import { Elysia } from "elysia";

const app = new Elysia()
  .get("/health", () => ({ status: "ok" }))
  .listen(Bun.env.PORT ?? 3000);

// ALWAYS export the App type — required for Eden Treaty type safety
export type App = typeof app;
```

- Run with: `bun src/index.ts` (never `node`)
- Always export `App` type from the entry point

## Frontend: Vite + Eden Treaty Pattern

```typescript
// src/api/client.ts
import { edenTreaty } from "@elysiajs/eden";
import type { App } from "../../../api/src/index";

const url = import.meta.env.VITE_API_URL || "/";
export const api = edenTreaty<App>(url);
```

- Never use raw `fetch()` for internal API calls — always use the typed Eden client
- `VITE_API_URL` proxied to the backend in dev; set to the Fly.io URL in production

## Critical Vite Configuration (Bun Compatibility)

The `vite.config.ts` **must always** include `babel: false` to prevent the `_lruCache is not a constructor` error that occurs with Babel internals under Bun:

```typescript
react({
  jsxRuntime: 'automatic',
  babel: false,  // MANDATORY under Bun
}),
```

## Critical PostCSS Configuration (Bun Compatibility)

The `postcss.config.js` **must always** use explicit imports — the shorthand object syntax causes a `plugin is not a function` error under Bun:

```javascript
// ✅ CORRECT — explicit imports
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
export default { plugins: [tailwindcss, autoprefixer] };

// ❌ WRONG — shorthand causes runtime error under Bun
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

## Deployment

- All apps deploy to **Fly.io** using `fly deploy`
- Each app has its own `fly.toml` and `Dockerfile`
- Dockerfiles use `oven/bun` as the base image — never `node`
- The `/deploy-app` workflow in `.agents/workflows/deploy-app.md` contains full deployment steps

## Key Packages

- `elysia` — backend framework
- `@elysiajs/eden` — Eden Treaty client
- `react`, `react-dom` — frontend
- `vite`, `@vitejs/plugin-react` — build tooling
- `tailwindcss` — styling
- `zod` — validation (Elysia has native Zod support via `@elysiajs/zod`)
- `marked` — markdown rendering in chat UIs

## Anti-Patterns to Always Reject

```typescript
// ❌ Never suggest these:
const express = require("express"); // CJS require
import http from "http"; // Node built-in as primary server
const res = await fetch("/api/foo"); // Raw fetch for internal APIs
```

```bash
# ❌ Never run these:
npm install
node server.js
yarn add react
```
