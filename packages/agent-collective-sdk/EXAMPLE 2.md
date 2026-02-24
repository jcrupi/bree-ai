# Collective SDK Example Usage

This example demonstrates how to refactor an existing agent to use the Collective SDK.

## Before (Manual NATS):

```typescript
import { connect, JSONCodec } from "nats";

const jc = JSONCodec();
const nc = await connect({ servers: "localhost:4222" });

// Manual lifecycle
nc.publish(
  `agent.lifecycle.antimatter-db`,
  jc.encode({ status: "UP", type: "database" })
);

// Manual request handling
const getSub = nc.subscribe(`agent.antimatter-db.get`);
(async () => {
  for await (const m of getSub) {
    try {
      const payload = jc.decode(m.data) as any;
      const entry = await db.get(payload.path);
      m.respond(jc.encode({ success: true, entry }));
    } catch (err) {
      m.respond(jc.encode({ success: false, error: String(err) }));
    }
  }
})();
```

## After (With SDK):

```typescript
import { CollectiveAgent, SUBJECTS } from "@katai/collective-sdk";

const agent = new CollectiveAgent({
  agentId: "antimatter-db",
  agentType: "database",
  capabilities: ["get", "list", "set", "query"],
});

await agent.connect(); // Auto-announces UP status

// Type-safe request handling
await agent.handle<DatabaseGetRequest, DatabaseEntry>(
  SUBJECTS.DATABASE_GET,
  async (payload) => {
    return await db.get(payload.path);
  }
);
```

## Benefits:

1. ✅ **Type Safety**: Full TypeScript support for requests and responses
2. ✅ **Less Boilerplate**: No manual JSON encoding/decoding
3. ✅ **Auto Error Handling**: Errors are automatically caught and formatted
4. ✅ **Lifecycle Management**: UP/DOWN announcements handled automatically
5. ✅ **Discovery Support**: Responds to discovery pings automatically
6. ✅ **Graceful Shutdown**: SIGINT/SIGTERM handlers built-in
7. ✅ **Request IDs**: Automatic request tracking
8. ✅ **Consistent Patterns**: All agents use the same communication patterns

## Running the Example:

```bash
# From AntiMatterDB directory
bun run src/cli/index.ts nats-agent-sdk /path/to/db
```
