# BREE AI API

Elysia backend server for the BREE AI monorepo.

## Quick Start

```bash
# Install dependencies
bun install

# Run in development mode (with hot reload)
bun run dev

# Build for production
bun run build

# Run production build
bun start
```

## API Endpoints

The API runs on `http://localhost:3000`

### Documentation

- **Swagger UI**: http://localhost:3000/swagger

### Health Check

- `GET /` - Welcome message
- `GET /health` - Health check endpoint

### Users API

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user

### Collections API

- `GET /api/collections` - Get all collections
- `GET /api/collections/:id` - Get collection by ID

### Agents API (NATS)

- `GET /api/agents` - Discover all connected AI agents (grapes)
- `GET /api/agents/:id` - Get specific agent status
- `POST /api/agents/:id/message` - Send message to an agent

## Using Eden Treaty Client

From your frontend apps, you can use the fully typed API client:

```typescript
import { api } from "@bree-ai/core/utils/api-client";

// Fully typed API call
const { data, error } = await api.api.users.get();

// POST request with validation
const { data: newUser } = await api.api.users.post({
  name: "John Doe",
  email: "john@example.com",
});

// Get specific user
const { data: user } = await api.api.users({ id: "1" }).get();

// Discover AI agents (grapes)
const { data: agentsData } = await api.api.agents.get();
console.log(agentsData.agents); // List of connected agents

// Send message to an agent
await api.api.agents({ id: "grape-1" }).message.post({
  content: "Hello, agent!",
  metadata: { priority: "high" },
});
```

## Project Structure

```
apps/api/
├── src/
│   └── index.ts       # Main server file
├── package.json
└── tsconfig.json
```

## Adding New Routes

```typescript
// In src/index.ts
app
  .get("/api/your-route", () => {
    return { message: "Hello" };
  })
  .post(
    "/api/your-route",
    ({ body }) => {
      return body;
    },
    {
      body: t.Object({
        field: t.String(),
      }),
    },
  );
```

## Features

- ✅ Full TypeScript support
- ✅ Type-safe API client with Eden Treaty
- ✅ Auto-generated Swagger documentation
- ✅ CORS enabled
- ✅ Hot reload in development
- ✅ Fast Bun runtime
