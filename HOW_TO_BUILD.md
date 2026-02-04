# How to Build This Architecture

## Stack Decision

**Frontend:** React 19 + TypeScript + Tailwind CSS + Vite + Eden Treaty  
**Backend:** Bun + ElysiaJS + Eden Treaty  
**Package Manager:** Bun  
**Monorepo:** Workspace-based (bun workspaces)

## Complete Build Guide

### Step 1: Initialize the Monorepo

```bash
# Create root directory
mkdir bree-ai
cd bree-ai

# Initialize bun project
bun init -y

# Create monorepo structure
mkdir -p apps packages
```

**Root `package.json`:**

```json
{
  "name": "bree-ai",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev:api": "cd apps/api && bun run dev",
    "dev:kat": "cd apps/kat-ai && bun run dev",
    "dev:genius": "cd apps/genius-talent && bun run dev",
    "dev:keen": "cd apps/keen-ai && bun run dev"
  }
}
```

### Step 2: Create the Backend API (Bun + ElysiaJS)

```bash
# Create API directory
mkdir -p apps/api/src
cd apps/api
```

**`apps/api/package.json`:**

```json
{
  "name": "bree-ai-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "start": "bun src/index.ts",
    "build": "bun build src/index.ts --outdir ./dist --target bun"
  },
  "dependencies": {
    "elysia": "^1.0.0",
    "@elysiajs/cors": "^1.0.0",
    "@elysiajs/swagger": "^1.0.0"
  },
  "devDependencies": {
    "bun-types": "latest"
  }
}
```

**`apps/api/tsconfig.json`:**

```json
{
  "compilerOptions": {
    "lib": ["ESNext"],
    "module": "esnext",
    "target": "esnext",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "composite": true,
    "strict": true,
    "downlevelIteration": true,
    "skipLibCheck": true,
    "jsx": "react-jsx",
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "allowJs": true,
    "types": ["bun-types"]
  }
}
```

**`apps/api/src/index.ts`:**

```typescript
import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";

const app = new Elysia()
  .use(cors())
  .use(
    swagger({
      documentation: {
        info: {
          title: "BREE AI API",
          version: "1.0.0",
          description: "API for BREE AI applications",
        },
      },
    }),
  )
  .get("/", () => ({
    message: "Welcome to BREE AI API",
    version: "1.0.0",
    status: "running",
  }))
  .get("/health", () => ({
    status: "healthy",
    timestamp: new Date().toISOString(),
  }))
  // Example API routes
  .group("/api/users", (app) =>
    app
      .get("/", () => [{ id: 1, name: "Alice", email: "alice@example.com" }])
      .post(
        "/",
        ({ body }) => {
          // Handle user creation
          return { id: 2, ...body };
        },
        {
          body: t.Object({
            name: t.String(),
            email: t.String(),
          }),
        },
      ),
  )
  .listen(3000);

console.log(
  `🦊 Elysia server is running at ${app.server?.hostname}:${app.server?.port}`,
);

// Export the app type for Eden Treaty
export type App = typeof app;
```

**Install dependencies:**

```bash
bun install
```

**Test the API:**

```bash
bun run dev
# Visit http://localhost:3000
# Visit http://localhost:3000/swagger for API docs
```

### Step 3: Create Shared Core Package

```bash
# Create shared package
mkdir -p packages/bree-ai-core/src
cd packages/bree-ai-core
```

**`packages/bree-ai-core/package.json`:**

```json
{
  "name": "@bree-ai/core",
  "version": "1.0.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./components/*": "./src/components/*.tsx",
    "./utils/*": "./src/utils/*.ts"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.0.0"
  }
}
```

**`packages/bree-ai-core/tsconfig.json`:**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

**Create API client for Eden:**

**`packages/bree-ai-core/src/utils/api.ts`:**

```typescript
import { treaty } from "@elysiajs/eden";
import type { App } from "bree-ai-api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const api = treaty<App>(API_URL);

// Example usage:
// const { data } = await api.api.users.get();
// const user = await api.api.users.post({ name: 'John', email: 'john@example.com' });
```

**`packages/bree-ai-core/src/utils/index.ts`:**

```typescript
export * from "./api";
export * from "./ragster";
export * from "./collective";
export * from "./antimatter";
```

**`packages/bree-ai-core/src/index.ts`:**

```typescript
export * from "./utils";
export * from "./components";
export * from "./config";
```

### Step 4: Create a Frontend App (React 19 + TypeScript + Tailwind)

```bash
# Create a new Vite app with React + TypeScript
cd apps
bun create vite kat-ai --template react-ts
cd kat-ai
```

**Install dependencies:**

```bash
# Install core dependencies
bun install

# Install Tailwind CSS
bun add -D tailwindcss postcss autoprefixer
bunx tailwindcss init -p

# Install Eden for type-safe API calls
bun add @elysiajs/eden

# Link to shared core package
bun add @bree-ai/core@workspace:*
```

**`apps/kat-ai/tailwind.config.js`:**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/bree-ai-core/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

**`apps/kat-ai/postcss.config.js`:**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**`apps/kat-ai/src/index.css`:**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Update `apps/kat-ai/vite.config.ts`:**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8769, // Custom port for this app
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
```

**Create environment file `apps/kat-ai/.env.local`:**

```bash
# Local API
VITE_API_URL=http://localhost:3000

# External Services (fly.io)
VITE_AGENTX_URL=https://agent-collective-agentx.fly.dev
VITE_RAGSTER_API_URL=https://agent-collective-ragster.fly.dev/api
VITE_ANTIMATTER_URL=https://agent-collective-antimatter.fly.dev

# App Configuration
VITE_RAGSTER_DEFAULT_ORG_ID=kat.ai
VITE_RAGSTER_DEFAULT_USER_ID=user@kat.ai
VITE_APP_NAME=KAT.ai
VITE_BRAND_ID=kat-ai
```

**Example component using Eden:**

**`apps/kat-ai/src/App.tsx`:**

```typescript
import React, { useEffect, useState } from 'react';
import { api } from '@bree-ai/core/utils/api';

interface User {
  id: number;
  name: string;
  email: string;
}

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data, error } = await api.api.users.get();
        if (error) {
          console.error('Error fetching users:', error);
          return;
        }
        setUsers(data || []);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    const { data, error } = await api.api.users.post({
      name: 'New User',
      email: 'newuser@example.com'
    });

    if (error) {
      console.error('Error creating user:', error);
      return;
    }

    if (data) {
      setUsers([...users, data]);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          KAT.ai - BREE AI
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Users</h2>
          <button
            onClick={handleCreateUser}
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add User
          </button>
          <ul className="space-y-2">
            {users.map((user) => (
              <li key={user.id} className="p-3 bg-gray-50 rounded">
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-gray-600">{user.email}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
```

**Update `apps/kat-ai/src/main.tsx`:**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Update `apps/kat-ai/package.json` to add workspace dependency:**

```json
{
  "name": "kat-ai",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@elysiajs/eden": "^1.0.0",
    "@bree-ai/core": "workspace:*"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.2.2",
    "vite": "^5.1.0",
    "tailwindcss": "^3.4.1",
    "postcss": "^8.4.35",
    "autoprefixer": "^10.4.17"
  }
}
```

### Step 5: Run the Full Stack

**Terminal 1 - Start Backend:**

```bash
cd apps/api
bun run dev
# API runs at http://localhost:3000
```

**Terminal 2 - Start Frontend:**

```bash
cd apps/kat-ai
bun run dev
# App runs at http://localhost:8769
```

**Or from root:**

```bash
# Run both together (requires concurrently or similar)
bun run dev:api
bun run dev:kat
```

### Step 6: Add More Frontend Apps

Repeat Step 4 for additional apps (Genius Talent, Keen.ai), changing:

- App name
- Port number in `vite.config.ts`
- Brand configuration in `.env.local`
- App-specific features

**Example for Genius Talent:**

```bash
cd apps
bun create vite genius-talent --template react-ts
cd genius-talent

# Install dependencies
bun install
bun add -D tailwindcss postcss autoprefixer
bun add @elysiajs/eden @bree-ai/core@workspace:*

# Configure Tailwind
bunx tailwindcss init -p

# Update vite.config.ts to use port 5173
# Create .env.local with genius-talent org_id
```

## Key Architecture Patterns

### 1. Type-Safe API Calls with Eden

**Backend (ElysiaJS):**

```typescript
const app = new Elysia().post(
  "/api/users",
  ({ body }) => {
    return { id: 1, ...body };
  },
  {
    body: t.Object({
      name: t.String(),
      email: t.String(),
    }),
  },
);

export type App = typeof app;
```

**Frontend (React):**

```typescript
import { treaty } from "@elysiajs/eden";
import type { App } from "bree-ai-api";

const api = treaty<App>("http://localhost:3000");

// TypeScript knows the exact shape!
const { data } = await api.api.users.post({
  name: "John",
  email: "john@example.com",
});
```

### 2. Shared Components

**Create in `packages/bree-ai-core/src/components/`:**

```typescript
// Button.tsx
export function Button({ children, ...props }) {
  return (
    <button
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      {...props}
    >
      {children}
    </button>
  );
}
```

**Use in any app:**

```typescript
import { Button } from '@bree-ai/core/components/Button';

function MyComponent() {
  return <Button>Click me</Button>;
}
```

### 3. Environment-Based Configuration

**Development (localhost):**

```bash
VITE_API_URL=http://localhost:3000
```

**Production (fly.io):**

```bash
VITE_API_URL=https://your-api.fly.dev
VITE_RAGSTER_API_URL=https://agent-collective-ragster.fly.dev/api
```

Apps automatically use the correct endpoints based on `.env.local`.

### 4. Multi-Brand Support

**In `packages/bree-ai-core/src/config/branding.ts`:**

```typescript
export const brands = {
  "kat-ai": {
    name: "KAT.ai",
    colors: { primary: "#3B82F6", secondary: "#1E40AF" },
    collection: { orgId: "kat.ai", collectionId: "KatAI Collection V1" },
  },
  "genius-talent": {
    name: "Genius Talent",
    colors: { primary: "#10B981", secondary: "#059669" },
    collection: { orgId: "genius-talent", collectionId: "Genius Collection" },
  },
};

export function getBrand() {
  const brandId = import.meta.env.VITE_BRAND_ID || "kat-ai";
  return brands[brandId];
}
```

## Development Commands

```bash
# Install all dependencies
bun install

# Start backend API
bun run dev:api

# Start frontend apps
bun run dev:kat
bun run dev:genius
bun run dev:keen

# Build for production
cd apps/api && bun run build
cd apps/kat-ai && bun run build

# Type checking
cd apps/kat-ai && bunx tsc --noEmit
```

## Complete Dependency List

### Backend (ElysiaJS)

```json
{
  "elysia": "^1.0.0",
  "@elysiajs/cors": "^1.0.0",
  "@elysiajs/swagger": "^1.0.0"
}
```

### Frontend (React)

```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "@elysiajs/eden": "^1.0.0",
  "tailwindcss": "^3.4.1",
  "postcss": "^8.4.35",
  "autoprefixer": "^10.4.17",
  "@vitejs/plugin-react": "^4.2.1",
  "vite": "^5.1.0",
  "typescript": "^5.2.2"
}
```

### Shared Core

```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "@elysiajs/eden": "^1.0.0"
}
```

## Folder Structure Template

```
bree-ai/
├── package.json                    # Root package.json with workspaces
├── bun.lock                        # Bun lockfile
├── ARCHITECTURE.md                 # This guide
│
├── apps/
│   ├── api/                        # Backend API
│   │   ├── src/
│   │   │   └── index.ts           # Main server (export type App)
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── kat-ai/                    # Frontend App 1
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   └── index.css
│   │   ├── .env.local
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   └── tsconfig.json
│   │
│   ├── genius-talent/             # Frontend App 2
│   │   └── [same structure]
│   │
│   └── keen-ai/                   # Frontend App 3
│       └── [same structure]
│
└── packages/
    └── bree-ai-core/         # Shared package
        ├── src/
        │   ├── components/        # Shared React components
        │   ├── utils/             # API clients & utilities
        │   │   ├── api.ts        # Eden client
        │   │   ├── ragster.ts    # Ragster client
        │   │   └── index.ts
        │   ├── config/            # Configuration
        │   │   └── branding.ts
        │   └── index.ts
        ├── package.json
        └── tsconfig.json
```

## Best Practices

### 1. Always Export API Type

```typescript
// apps/api/src/index.ts
export type App = typeof app;
```

### 2. Use Eden Treaty for Type Safety

```typescript
import { treaty } from "@elysiajs/eden";
import type { App } from "bree-ai-api";

const api = treaty<App>(API_URL);
```

### 3. Validate with Elysia Schema

```typescript
.post('/api/users', ({ body }) => {
  // body is validated automatically
}, {
  body: t.Object({
    name: t.String(),
    email: t.String()
  })
})
```

### 4. Share Code via Core Package

```typescript
// Don't duplicate - create in core
import { Button } from "@bree-ai/core/components/Button";
```

### 5. Use Environment Variables

```typescript
const API_URL = import.meta.env.VITE_API_URL;
const BRAND_ID = import.meta.env.VITE_BRAND_ID;
```

## Deployment

### Backend (fly.io)

```bash
cd apps/api
fly launch
fly deploy
```

### Frontend (Vercel/Netlify)

```bash
cd apps/kat-ai
bun run build
# Deploy dist/ folder
```

---

**This is the complete blueprint for building React 19 + TypeScript + Tailwind + Eden frontends with Bun + ElysiaJS backends in a monorepo.**
