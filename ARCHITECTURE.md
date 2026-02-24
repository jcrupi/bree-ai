# BREE AI Architecture

## Tech Stack Overview

```
┌─────────────────────────────────────────────┐
│  FRONTEND APPLICATIONS                      │
│  React 19 • TypeScript • Tailwind • Eden    │
│                                             │
│  ┌─────────┐  ┌──────────┐  ┌──────────────┐  ┌─────────┐   │
│  │ KAT.ai  │  │  Genius  │  │ HabitAware   │  │ Keen.ai │   │
│  │  App    │  │  Talent  │  │ AI (Habit)   │  │   App   │   │
│  └────┬────┘  └────┬─────┘  └──────┬───────┘  └────┬────┘   │
│       │            │             │         │
└───────┼────────────┼─────────────┼─────────┘
        │            │             │
        └────────────┴─────────────┘
                     │ Eden (type-safe HTTP)
                     ▼
┌─────────────────────────────────────────────┐
│  LOCAL API BACKEND                          │
│  Bun • ElysiaJS • Eden Treaty               │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │  ElysiaJS Server (Port 3000)         │  │
│  │  • Type-safe routes                  │  │
│  │  • Auto-generated types via Eden     │  │
│  │  • Swagger documentation             │  │
│  │  • CORS enabled                      │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│  SHARED CORE PACKAGE                        │
│  @bree-ai/core                         │
│                                             │
│  • API client utilities                    │
│  • Shared UI components                    │
│  • Type definitions                        │
│  • Utility functions                       │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│  EXTERNAL SERVICES (fly.io)                 │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │  Ragster                             │  │
│  │  agent-collective-ragster.fly.dev    │  │
│  │  • Document search & RAG             │  │
│  │  • Collections management            │  │
│  │  • Embedding & indexing              │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │  AgentX Collective                   │  │
│  │  agent-collective-agentx.fly.dev     │  │
│  │  • Orchestration hub                 │  │
│  │  • Multi-agent coordination          │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │  AntiMatterDB                        │  │
│  │  agent-collective-antimatter.fly.dev │  │
│  │  • Identity management               │  │
│  │  • Organization management           │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

> **🔥 IMPORTANT:** We follow a specific "Bun Monorepo" pattern for production.
> Please review **[BUN_MONOREPO_BEST_PRACTICES.md](BUN_MONOREPO_BEST_PRACTICES.md)** for the definitive guide on repo structure and Fly.io deployment.

**🔗 See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed architecture documentation.**

## Frontend Stack

### Applications

All frontend apps use the same modern tech stack:

- **React 19** - Latest React with improved performance and features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Build tool and dev server
- **Eden** - Type-safe HTTP client for Elysia backend

### Application Details

#### 1. KAT.ai (`apps/kat-ai`)

- **Port**: 8769
- **Purpose**: Knowledge Assistant Tool AI
- **Features**: Document Q&A, RAG search, admin settings
- **Org ID**: `kat.ai`

#### 2. Genius Talent (`apps/genius-talent`)

- **Port**: 5173
- **Purpose**: Talent management and recruitment AI
- **Features**: Job management, candidate search, dashboard
- **Org ID**: `genius-talent`

#### 3. HabitAware AI (`apps/habitaware-ai`)

- **Port**: 8770
- **Purpose**: Habit change and behavioral awareness AI
- **Features**: Document Q&A, awareness coaching, admin settings
- **Org ID**: `habitaware`

#### 4. Keen.ai (`apps/keen-ai`)

- **Port**: (default Vite)
- **Purpose**: Specialized knowledge interface
- **Features**: Document management, knowledge base
- **Org ID**: `keen.ai`

## Backend Stack

### Local API Server (`apps/api`)

**Technology:**

- **Bun** - Fast JavaScript runtime
- **ElysiaJS** - Fast, type-safe web framework
- **Eden Treaty** - End-to-end type safety between client and server
- **@elysiajs/cors** - CORS support
- **@elysiajs/swagger** - Auto-generated API documentation

**Port:** 3000

**Features:**

- ✅ Type-safe routes with automatic validation
- ✅ End-to-end type safety with Eden
- ✅ Swagger UI at `/swagger`
- ✅ CORS enabled for frontend apps
- ✅ Hot reload with `bun --watch`

**API Endpoints:**

```
GET  /                    - API info
GET  /health             - Health check
GET  /api/users          - List users
GET  /api/users/:id      - Get user by ID
POST /api/users          - Create user
GET  /api/collections    - List collections
GET  /api/collections/:id - Get collection by ID
```

### AntiMatterDB (`apps/antimatter-db`)

**Technology:**

- **Bun** - Fast JavaScript runtime
- **AntiMatter Core** - Graph-based markdown database
- **REST API** - Standard endpoints for entries and collections

**Port:** 3000 (standard, can be configured via PORT env)

**Features:**

- ✅ Graph-based identity management
- ✅ Multi-tenant isolation
- ✅ Built-in schema support
- ✅ CLI for bulk operations

## Eden Type Safety Flow

```typescript
// Backend (apps/api/src/index.ts)
const app = new Elysia()
  .get("/api/users", () => users)
  .post(
    "/api/users",
    ({ body }) => {
      // body is automatically validated
      return newUser;
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String(),
      }),
    },
  );

export type App = typeof app;

// Frontend (packages/bree-ai-core or apps/*/src)
import { treaty } from "@elysiajs/eden";
import type { App } from "bree-ai-api";

const client = treaty<App>("http://localhost:3000");

// Fully type-safe calls - TypeScript knows the response type!
const { data, error } = await client.api.users.get();
// data is inferred as: { id: number; name: string; email: string }[]

const result = await client.api.users.post({
  name: "John Doe",
  email: "john@example.com",
});
// TypeScript validates the request body matches the schema
```

## Shared Core Package

**Location:** `packages/bree-ai-core`

**Contents:**

- **Components** (`src/components/`)
  - `DocumentQA.tsx` - Document Q&A interface
  - `AdminSettings.tsx` - Admin panel
  - `ui/` - Shared UI components (ActionGroup, PageHeader, etc.)
- **Utilities** (`src/utils/`)
  - `ragster.ts` - Ragster API client
  - `collective.ts` - Collective API client
  - `antimatter.ts` - AntiMatterDB client
  - `api.ts` - Eden client for local API (if configured)

- **Config** (`src/config/`)
  - `branding.ts` - Multi-brand configuration

## External Services (fly.io)

### 1. Ragster

**URL:** `https://agent-collective-ragster.fly.dev/api`

**Purpose:** Document search and RAG (Retrieval-Augmented Generation)

**Endpoints:**

- `POST /search` - Semantic search
- `GET /collections` - List collections
- `POST /collections` - Create collection
- `POST /index/file` - Upload & index document
- `POST /chat` - Generate chat response

### 2. AgentX Collective

**URL:** `https://agent-collective-agentx.fly.dev`

**Purpose:** Multi-agent orchestration hub

**Endpoints:**

- `POST /api/collective/chat` - Collective chat
- `GET /api/identity/entries` - Identity management

### 3. AntiMatterDB

**URL:** `https://agent-collective-antimatter.fly.dev`

**Purpose:** Identity and organization management

**Endpoints:**

- `GET /api/health` - Health check
- `GET /api/entries?dir={path}` - List entries
- `POST /api/entries` - Create/update entry

## Development Workflow

### Starting the Full Stack

**1. Start the Local API:**

```bash
cd apps/api
bun run dev
# Server runs at http://localhost:3000
# Swagger docs at http://localhost:3000/swagger
```

**2. Start a Frontend App:**

```bash
# KAT.ai
cd apps/kat-ai
bun run dev

# Genius Talent
cd apps/genius-talent
bun run dev

# Keen.ai
cd apps/keen-ai
bun run dev
```

**Or from root:**

```bash
bun run dev:api      # Start API server
bun run dev:antimatter # Start AntiMatterDB
bun run dev:kat      # Start KAT.ai
bun run dev:genius   # Start Genius Talent
bun run dev:keen     # Start Keen.ai
```

### Type Safety in Action

When you export `type App` from the Elysia server, Eden Treaty can automatically infer:

- ✅ Available routes
- ✅ Request body schemas
- ✅ Response types
- ✅ URL parameters
- ✅ Query parameters

**No code generation needed** - it's all done through TypeScript's type inference!

## Environment Configuration

### Frontend Apps

Each app has `.env.local` configured with:

```bash
# Local API (if using)
VITE_API_URL=http://localhost:3000

# External Services (fly.io)
VITE_AGENTX_URL=https://agent-collective-agentx.fly.dev
VITE_RAGSTER_API_URL=https://agent-collective-ragster.fly.dev/api
VITE_ANTIMATTER_URL=https://agent-collective-antimatter.fly.dev

# App-specific
VITE_RAGSTER_DEFAULT_ORG_ID=<app-org-id>
VITE_RAGSTER_DEFAULT_USER_ID=<app-user-id>
VITE_APP_NAME=<app-name>
VITE_BRAND_ID=<brand-id>
```

### API Server

Currently uses default configuration. Can be extended with:

```bash
PORT=3000
NODE_ENV=development
```

## Monorepo Structure

```
bree-ai/
├── apps/
│   ├── api/                    # Bun + ElysiaJS backend
│   │   ├── src/
│   │   │   └── index.ts       # Main server file (exports App type)
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── antimatter-db/          # Identity & Org management
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── kat-ai/                # React 19 + TypeScript + Tailwind
│   │   ├── src/
│   │   ├── .env.local
│   │   └── vite.config.ts
│   │
│   ├── genius-talent/         # React 19 + TypeScript + Tailwind
│   │   ├── src/
│   │   ├── .env.local
│   │   └── vite.config.ts
│   │
│   └── keen-ai/               # React 19 + TypeScript + Tailwind
│       ├── src/
│       ├── .env.local
│       └── vite.config.ts
│
├── packages/
│   └── bree-ai-core/     # Shared package
│       ├── src/
│       │   ├── components/    # Shared React components
│       │   ├── utils/         # API clients & utilities
│       │   └── config/        # Configuration
│       └── package.json
│
├── package.json               # Root package.json
└── bun.lock                   # Bun lockfile
```

## Key Benefits

### 1. End-to-End Type Safety

- Changes to API routes automatically update frontend types
- Catch errors at compile-time, not runtime
- Full IntelliSense support in VS Code

### 2. Fast Development

- **Bun** - Fast runtime and package manager
- **Vite** - Lightning-fast dev server with HMR
- **ElysiaJS** - Optimized for Bun, fastest TS framework

### 3. Shared Code

- UI components shared across apps via `@bree-ai/core`
- Utilities and API clients centralized
- Consistent branding and styling

### 4. Flexible Architecture

- Frontend apps can use local API or external services
- Easy to add new apps to the monorepo
- Services can be swapped (local vs fly.io)

## Next Steps

1. **Expand Local API**: Add more routes for business logic
2. **Integrate Eden Client**: Use Eden Treaty in frontend apps
3. **Add Authentication**: Implement auth middleware in Elysia
4. **Database Integration**: Connect to PostgreSQL or other DBs
5. **Deploy API**: Deploy Elysia API to fly.io if needed

---

**Stack Summary:**

- 🎯 **Frontend**: React 19 + TypeScript + Tailwind + Vite + Eden
- 🚀 **Backend**: Bun + ElysiaJS + Eden Treaty
- 📦 **Package Manager**: Bun
- 🔗 **Type Safety**: End-to-end via Eden
- ☁️ **External Services**: Ragster, AgentX, AntiMatter (fly.io)
