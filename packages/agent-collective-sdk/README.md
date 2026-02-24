# Collective SDK

TypeScript SDK for building NATS-based agents in the KatAI Collective ecosystem.

## Features

- 🎯 **Type-Safe Messaging**: Full TypeScript support for all agent communications
- 🔌 **Easy Integration**: Simple API for connecting agents to the collective
- 📡 **Automatic Discovery**: Agents automatically announce themselves and respond to discovery
- 🛡️ **Error Handling**: Built-in error handling and request/response validation
- 🔄 **Lifecycle Management**: Automatic UP/DOWN status management and graceful shutdown

## Installation

```bash
cd collective-sdk
bun install
```

## Usage

### Creating an Agent

```typescript
import {
  CollectiveAgent,
  SUBJECTS,
  type DatabaseGetRequest,
  type DatabaseEntry,
} from "@katai/collective-sdk";

// Create agent instance
const agent = new CollectiveAgent({
  agentId: "my-agent",
  agentType: "database",
  capabilities: ["get", "list", "set"],
});

// Connect to NATS
await agent.connect();

// Register request handlers
await agent.handle<DatabaseGetRequest, DatabaseEntry>(
  SUBJECTS.DATABASE_GET,
  async (payload) => {
    // Your handler logic
    const entry = await db.get(payload.path);
    return entry;
  }
);
```

### Making Requests

```typescript
// Request data from another agent
const result = await agent.request<DatabaseGetRequest, DatabaseEntry>(
  SUBJECTS.DATABASE_GET,
  { path: "orgs/acme/users/john.md" }
);

console.log(result);
```

### Publishing Logs

```typescript
agent.publishLog("info", "Processing request", { requestId: "123" });
```

## Agent Types

The SDK provides type definitions for all standard agent types:

- `database` - AntiMatterDB agents
- `knowledge-base` - Ragster agents
- `domain-modeling` - VooDo agents
- `code-analysis` - Code analysis agents
- `governance` - Governance/policy agents
- `snippet-manager` - Code snippet management

## Subject Patterns

All NATS subjects are defined in `SUBJECTS`:

```typescript
SUBJECTS.DATABASE_GET; // "agent.antimatter-db.get"
SUBJECTS.KNOWLEDGE_SEARCH; // "agent.ragster-kb.search"
SUBJECTS.DOMAIN_LIST; // "agent.voodo-modeling.list"
SUBJECTS.LIFECYCLE(agentId); // "agent.lifecycle.{agentId}"
```

## Type Safety

All request/response types are fully typed:

```typescript
interface DatabaseGetRequest {
  path: string;
}

interface DatabaseEntry {
  id: string;
  path: string;
  frontMatter: Record<string, any>;
  content: string;
}
```

## License

MIT
