# BREE AI

> **Multi-Tenant Document Intelligence Platform**
> Modern AI-powered applications with end-to-end type safety, built on Bun, ElysiaJS, React 19, and Eden Treaty.

---

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Development](#development)
- [Environment Configuration](#environment-configuration)
- [Applications](#applications)
- [Building & Deployment](#building--deployment)
- [Documentation](#documentation)
- [Contributing](#contributing)

---

## Overview

**BREE AI** is a modern monorepo platform hosting multiple AI-powered applications with shared infrastructure. It demonstrates best practices for building type-safe, scalable web applications using cutting-edge technologies.

The platform serves **multi-tenant document intelligence** through specialized applications, each tailored for different use cases while sharing a common core library and backend API.

### What Makes BREE AI Different?

- **🔒 End-to-End Type Safety** - Zero runtime errors with automatic type inference via Eden Treaty
- **⚡ Blazing Fast** - Bun runtime + ElysiaJS framework for optimal performance
- **🎯 No Code Generation** - Types flow automatically from backend to frontend
- **🧩 Modular Architecture** - Shared core package for consistent UI and utilities
- **🚀 Modern Stack** - React 19, TypeScript, Tailwind CSS, Vite
- **🤖 AI-First** - Integrated with RAG, multi-agent orchestration, and OpenAI services

---

## Features

### Core Capabilities

- ✅ **Document Q&A with RAG** - Semantic search and retrieval-augmented generation
- ✅ **Multi-Agent Orchestration** - Coordinated AI agents via AgentX Collective
- ✅ **Identity Management** - Organization and user management via AntiMatterDB
- ✅ **Type-Safe API Gateway** - Local ElysiaJS API with automatic type inference
- ✅ **Shared Component Library** - Reusable UI components across all apps
- ✅ **Multi-Brand Support** - Configurable branding per application
- ✅ **OpenAI Integration** - Chat completions, text-to-speech, audio processing
- ✅ **Real-time Updates** - Hot module replacement and live development

### Developer Experience

- 🔧 **Auto-generated API Docs** - Swagger UI at `/swagger`
- 🔍 **IntelliSense Everywhere** - Full TypeScript support across the stack
- 🎨 **Tailwind CSS** - Utility-first styling with shared design system
- 📦 **Workspace Management** - Bun workspaces for efficient dependency management
- 🔄 **Hot Reload** - Instant feedback during development

---

## Tech Stack

### Frontend

| Technology       | Version | Purpose                                           |
| ---------------- | ------- | ------------------------------------------------- |
| **React**        | 19      | UI framework with latest performance improvements |
| **TypeScript**   | 5.2+    | Type-safe development                             |
| **Tailwind CSS** | 3.4+    | Utility-first styling                             |
| **Vite**         | 5.0+    | Lightning-fast build tool and dev server          |
| **Eden Treaty**  | 1.0+    | Type-safe HTTP client for Elysia backend          |

### Backend

| Technology         | Version | Purpose                                     |
| ------------------ | ------- | ------------------------------------------- |
| **Bun**            | Latest  | Fast JavaScript runtime and package manager |
| **ElysiaJS**       | 1.0+    | High-performance, type-safe web framework   |
| **better-sqlite3** | 11.0+   | Local database for auth and storage         |
| **NATS**           | 2.28+   | Messaging system for service communication  |
| **JWT**            | -       | Authentication and authorization            |

### Shared Infrastructure

| Service               | Purpose                   | URL                                            |
| --------------------- | ------------------------- | ---------------------------------------------- |
| **Ragster**           | Document search & RAG     | `https://agent-collective-ragster.fly.dev/api` |
| **AgentX Collective** | Multi-agent orchestration | `https://agent-collective-agentx.fly.dev`      |
| **AntiMatterDB**      | Identity & org management | `https://agent-collective-antimatter.fly.dev`  |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  FRONTEND APPLICATIONS                      │
│  React 19 • TypeScript • Tailwind • Eden    │
│                                             │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  │
│  │ KAT.ai  │  │  Genius  │  │HabitAware│  │
│  │ :8769   │  │  Talent  │  │    AI    │  │
│  │         │  │  :5173   │  │  :8770   │  │
│  └────┬────┘  └────┬─────┘  └────┬─────┘  │
└───────┼────────────┼──────────────┼────────┘
        │            │              │
        └────────────┴──────────────┘
                     │ Eden Treaty (type-safe)
                     ▼
┌─────────────────────────────────────────────┐
│  LOCAL API GATEWAY                          │
│  Bun • ElysiaJS • Eden Treaty               │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │  ElysiaJS Server (:3000)             │  │
│  │  • Type-safe routes                  │  │
│  │  • Auto-generated types              │  │
│  │  • Swagger documentation             │  │
│  │  • JWT authentication                │  │
│  │  • SQLite database                   │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│  SHARED CORE PACKAGE                        │
│  @bree-ai/core                              │
│                                             │
│  • UI Components (DocumentQA, Admin, etc)  │
│  • API Clients (Ragster, Collective, etc)  │
│  • Hooks (useTextToSpeech, etc)            │
│  • Utilities & Configuration               │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│  EXTERNAL SERVICES (fly.io)                 │
│                                             │
│  • Ragster (Document Search & RAG)          │
│  • AgentX Collective (Orchestration)        │
│  • AntiMatterDB (Identity Management)       │
└─────────────────────────────────────────────┘
```

**🔗 See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed architecture documentation.**

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **[Bun](https://bun.sh/)** v1.0.0 or higher
- **Node.js** v18.0.0 or higher (for compatibility)
- **Git** for version control

### Installation

```bash
# Install Bun (macOS, Linux, WSL)
curl -fsSL https://bun.sh/install | bash

# Or using npm
npm install -g bun

# Verify installation
bun --version
```

---

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd bree-ai

# Install all dependencies
bun install
```

### 2. Start Development Servers

**Option A: Start Everything**

```bash
# Terminal 1 - API Backend
bun run dev:api

# Terminal 2 - KAT.ai Frontend
bun run dev:kat

# Terminal 3 - Genius Talent Frontend
bun run dev:genius

# Terminal 4 - HabitAware AI Frontend
bun run dev:habitaware
```

**Option B: Start Individually**

```bash
# API Server
cd apps/api && bun run dev

# KAT.ai
cd apps/kat-ai && bun run dev

# Genius Talent
cd apps/genius-talent && bun run dev

# HabitAware AI
cd apps/habitaware-ai && bun run dev
```

### 3. Access Applications

- **API Server**: http://localhost:3000
- **API Swagger Docs**: http://localhost:3000/swagger
- **KAT.ai**: http://localhost:8769
- **Genius Talent**: http://localhost:5173
- **HabitAware AI**: http://localhost:8770

---

## Project Structure

```
bree-ai/
├── apps/                           # Application directory
│   ├── api/                        # Backend API server
│   │   ├── src/
│   │   │   ├── index.ts           # Main server file (exports App type)
│   │   │   ├── auth.ts            # JWT authentication
│   │   │   ├── db.ts              # SQLite database
│   │   │   └── nats.ts            # NATS messaging client
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── kat-ai/                    # KAT.ai - Knowledge Assistant Tool
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   └── index.css
│   │   ├── .env.local
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tailwind.config.js
│   │
│   ├── genius-talent/             # Genius Talent - Recruitment AI
│   │   └── [same structure as kat-ai]
│   │
│   └── habitaware-ai/             # HabitAware AI - Behavioral coaching
│       └── [same structure as kat-ai]
│
├── packages/                      # Shared packages
│   └── bree-ai-core/              # Core shared library
│       ├── src/
│       │   ├── components/        # Shared React components
│       │   │   ├── DocumentQA.tsx
│       │   │   ├── AdminSettings.tsx
│       │   │   └── ui/           # Base UI components
│       │   ├── hooks/            # Custom React hooks
│       │   │   └── useTextToSpeech.ts
│       │   ├── utils/            # Utilities & API clients
│       │   │   ├── breeAPI.ts   # Unified API facade
│       │   │   ├── ragster.ts   # Ragster client
│       │   │   ├── collective.ts # AgentX client
│       │   │   ├── antimatter.ts # AntiMatterDB client
│       │   │   ├── openai-chat.ts
│       │   │   └── openai-audio.ts
│       │   └── config/           # Configuration
│       │       └── branding.ts   # Multi-brand config
│       └── package.json
│
├── fly/                           # Fly.io deployment configs
│   ├── kat-ai/
│   └── keen-ai/
│
├── package.json                   # Root package.json (workspaces)
├── bun.lock                       # Lockfile
├── ARCHITECTURE.md                # Architecture documentation
├── API_ENDPOINTS.md               # API documentation
├── ENV_CONFIG.md                  # Environment setup guide
├── HOW_TO_BUILD.md                # Build guide
└── README.md                      # This file
```

---

## Development

### Available Commands

From the **root directory**:

```bash
# Install dependencies
bun install

# Development servers
bun run dev:api          # Start API server (:3000)
bun run dev:kat          # Start KAT.ai (:8769)
bun run dev:genius       # Start Genius Talent (:5173)
bun run dev:habitaware   # Start HabitAware AI (:8770)

# Build for production
bun run build:api        # Build API server
bun run build:kat        # Build KAT.ai
bun run build:genius     # Build Genius Talent
bun run build:habitaware # Build HabitAware AI
bun run build:all        # Build everything

# Cleanup
bun run clean            # Remove all node_modules
```

From **individual app directories**:

```bash
# Development
bun run dev              # Start dev server with hot reload

# Production build
bun run build            # Build for production

# Type checking
bun run typecheck        # Run TypeScript compiler check

# API specific
bun run api:init-db      # Initialize SQLite database
bun run api:seed         # Seed database with test data
```

### Type Safety in Action

**Backend (ElysiaJS):**

```typescript
// apps/api/src/index.ts
import { Elysia, t } from "elysia";

const app = new Elysia().post(
  "/api/users",
  ({ body }) => {
    // body is automatically validated
    return { id: 1, ...body };
  },
  {
    body: t.Object({
      name: t.String(),
      email: t.String(),
    }),
  },
);

export type App = typeof app; // Export type for Eden
```

**Frontend (React + Eden Treaty):**

```typescript
// apps/kat-ai/src/App.tsx
import { treaty } from "@elysiajs/eden";
import type { App } from "bree-ai-api";

const client = treaty<App>("http://localhost:3000");

// Fully type-safe - TypeScript knows exact response shape!
const { data, error } = await client.api.users.post({
  name: "John Doe",
  email: "john@example.com",
});
// data is typed as: { id: number; name: string; email: string }
```

### Using Shared Components

```typescript
// Import from core package
import { DocumentQA, AdminSettings } from '@bree-ai/core/components';
import { useTextToSpeech } from '@bree-ai/core/hooks';
import breeAPI from '@bree-ai/core/utils/breeAPI';

function MyApp() {
  const { speak, speaking } = useTextToSpeech();

  // Use unified API
  const results = await breeAPI.knowledge.search({
    query: 'AI development',
    collection: 'my-collection'
  });

  return <DocumentQA />;
}
```

---

## Environment Configuration

Each application uses environment variables for configuration. Create `.env.local` files in each app directory.

### Example: KAT.ai Configuration

```bash
# apps/kat-ai/.env.local

# Local API (optional)
VITE_API_URL=http://localhost:3000

# External Services (fly.io)
VITE_AGENTX_URL=https://agent-collective-agentx.fly.dev
VITE_RAGSTER_API_URL=https://agent-collective-ragster.fly.dev/api
VITE_ANTIMATTER_URL=https://agent-collective-antimatter.fly.dev

# App-specific
VITE_RAGSTER_DEFAULT_ORG_ID=kat.ai
VITE_RAGSTER_DEFAULT_USER_ID=user@kat.ai
VITE_APP_NAME=KAT.ai
VITE_BRAND_ID=kat-ai
```

### API Server Configuration

```bash
# apps/api/.env

# Server
PORT=3000
NODE_ENV=development

# OpenAI (for proxy endpoints)
OPENAI_API_KEY=sk-...

# Database
DB_PATH=./data/bree.db
```

**📘 See [ENV_CONFIG.md](ENV_CONFIG.md) for complete environment configuration guide.**

---

## Applications

### 🎓 KAT.ai - Knowledge Assistant Tool

**Port:** 8769
**Purpose:** Document Q&A and knowledge management with RAG search
**Org ID:** `kat.ai`

**Features:**

- Semantic document search
- Q&A interface with context-aware responses
- Admin settings for collection management
- Multi-document indexing

---

### 💼 Genius Talent - Recruitment AI

**Port:** 5173
**Purpose:** AI-powered talent management and recruitment
**Org ID:** `genius-talent`

**Features:**

- Job posting management
- Candidate search and matching
- Interview scheduling
- Analytics dashboard

---

### 🧠 HabitAware AI - Behavioral Coaching

**Port:** 8770
**Purpose:** Habit change and behavioral awareness coaching
**Org ID:** `habitaware`

**Features:**

- Document Q&A for habit resources
- Awareness coaching interface
- Progress tracking
- Admin configuration

---

## Building & Deployment

### Local Production Build

```bash
# Build API
cd apps/api
bun run build
bun run start

# Build frontend apps
cd apps/kat-ai
bun run build
# Outputs to: dist/
```

### Deploy to fly.io

**API Server:**

```bash
cd apps/api
fly launch
fly deploy
```

**Frontend Apps (via Vercel/Netlify):**

```bash
cd apps/kat-ai
bun run build

# Deploy dist/ folder to your platform
vercel deploy
# or
netlify deploy
```

### Environment Variables for Production

Set these in your deployment platform:

```bash
# Frontend (Vercel/Netlify)
VITE_API_URL=https://your-api.fly.dev
VITE_AGENTX_URL=https://agent-collective-agentx.fly.dev
VITE_RAGSTER_API_URL=https://agent-collective-ragster.fly.dev/api

# Backend (fly.io)
PORT=3000
OPENAI_API_KEY=sk-...
NODE_ENV=production
```

---

## Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Complete system architecture and tech stack details
- **[HOW_TO_BUILD.md](HOW_TO_BUILD.md)** - Step-by-step guide to building from scratch
- **[API_ENDPOINTS.md](API_ENDPOINTS.md)** - API endpoint documentation
- **[ENV_CONFIG.md](ENV_CONFIG.md)** - Environment configuration guide
- **[CONFIGURATION_CHANGES.md](CONFIGURATION_CHANGES.md)** - Recent configuration changes
- **[ACCESSING_ADMIN_SETTINGS.md](ACCESSING_ADMIN_SETTINGS.md)** - Admin panel guide
- **[RAGSTER_CONNECTION_STATUS.md](RAGSTER_CONNECTION_STATUS.md)** - Ragster integration status
- **[BUN_MONOREPO_BEST_PRACTICES.md](BUN_MONOREPO_BEST_PRACTICES.md)** - 🏆 Definitive guide to our Monorepo & Fly.io deployment architecture

---

## Key Benefits

### 🔒 End-to-End Type Safety

- Changes to API routes **automatically update** frontend types
- Catch errors at **compile-time**, not runtime
- Full **IntelliSense** support in VS Code
- **Zero code generation** - types flow naturally via TypeScript

### ⚡ Blazing Fast Performance

- **Bun** - 2-3x faster than Node.js
- **Vite** - Lightning-fast HMR (Hot Module Replacement)
- **ElysiaJS** - One of the fastest TypeScript frameworks
- **Optimized builds** with tree-shaking and code splitting

### 🧩 Shared Code Architecture

- **UI components** shared via `@bree-ai/core`
- **Utilities and clients** centralized
- **Consistent branding** across all apps
- **DRY principle** - Don't repeat yourself

### 🚀 Modern Developer Experience

- **Hot reload** for instant feedback
- **Auto-generated API docs** at `/swagger`
- **TypeScript everywhere** for confidence
- **Monorepo** for easy cross-app changes

---

## Contributing

### Development Workflow

1. **Fork and clone** the repository
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Install dependencies**: `bun install`
4. **Make your changes** with proper type safety
5. **Test locally** across affected apps
6. **Commit**: `git commit -m 'Add amazing feature'`
7. **Push**: `git push origin feature/amazing-feature`
8. **Open a Pull Request**

### Code Standards

- ✅ **TypeScript strict mode** enabled
- ✅ **ESLint** for code quality
- ✅ **Prettier** for formatting (if configured)
- ✅ **Type-safe** API contracts via Eden
- ✅ **Component-driven** architecture
- ✅ **Responsive design** with Tailwind CSS

---

## Troubleshooting

### Common Issues

**Issue: `Cannot find module '@bree-ai/core'`**

```bash
# From root directory
bun install
```

**Issue: CORS errors when calling API**

```bash
# Ensure API has CORS enabled (already configured)
# Check .env.local has correct VITE_API_URL
```

**Issue: Types not updating after API changes**

```bash
# Restart TypeScript server in VSCode
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

**Issue: Environment variables not loading**

```bash
# Restart dev server after changing .env.local
# Variables are loaded at build time, not runtime
```

---

## License

This project is proprietary. See LICENSE file for details.

---

## Support

For questions or issues:

1. Check the [documentation](#documentation)
2. Review [ARCHITECTURE.md](ARCHITECTURE.md) for system details
3. Open an issue in the repository
4. Contact the development team

---

**Built with ❤️ using [Bun](https://bun.sh/), [ElysiaJS](https://elysiajs.com/), [React](https://react.dev/), and [Eden Treaty](https://elysiajs.com/eden/overview.html)**
