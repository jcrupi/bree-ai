# breeAPI Usage Examples

The unified `breeAPI` facade provides a single TypeScript API for all BREE services.

## Import

```typescript
import breeAPI from "@bree-ai/core/utils/breeAPI";
```

## Knowledge Operations (Ragster)

```typescript
// Search documents
const results = await breeAPI.knowledge.search({
  query: "What is AI?",
  collection: "my-collection",
  topK: 10,
  min_score: 0.7,
});

// List collections
const collections = await breeAPI.knowledge.listCollections();

// Get specific collection
const collection = await breeAPI.knowledge.getCollection("collection-id");

// List resources in a collection
const resources = await breeAPI.knowledge.listResources({
  org_id: "my-org",
  collection_id: "collection-id",
});

// Chat with RAG context
const response = await breeAPI.knowledge.chat({
  messages: [{ role: "user", content: "Tell me about the uploaded documents" }],
  org_id: "my-org",
});
```

## Agent Operations (NATS)

```typescript
// Discover all connected agents
const { success, count, agents } = await breeAPI.agents.discover();
console.log(`Found ${count} agents:`, agents);

// Get specific agent status
const agentStatus = await breeAPI.agents.getStatus("grape-1");
console.log("Agent status:", agentStatus);

// Send message to an agent
await breeAPI.agents.sendMessage("grape-1", "Hello, agent!", {
  priority: "high",
  taskId: "123",
});
```

## Collective Chat (AgentX)

```typescript
const response = await breeAPI.collective.chat({
  messages: [{ role: "user", content: "Hello!" }],
  userEmail: "user@example.com",
  orgSlug: "my-org",
});
```

## Identity Management (AgentX)

```typescript
// Get system instructions
const instructions = await breeAPI.identity.getInstructions();

// Save system instructions
await breeAPI.identity.saveInstructions("Updated instructions...");
```

## Configuration (AgentX)

```typescript
// Get brand configuration
const config = await breeAPI.config.get("kat-ai");

// Save brand configuration
await breeAPI.config.save("kat-ai", {
  theme: "dark",
  features: ["chat", "search"],
});
```

## Error Handling

All methods throw errors on failure, so use try/catch:

```typescript
try {
  const results = await breeAPI.knowledge.search({...});
} catch (error) {
  console.error('Search failed:', error.message);
}
```

## Type Safety

The facade provides full TypeScript type inference:

```typescript
// TypeScript knows the exact return type
const agents = await breeAPI.agents.discover();
// agents is typed as { success: boolean; count: number; agents: AgentInfo[] }

agents.agents.forEach((agent) => {
  // Full IntelliSense for agent properties
  console.log(agent.agentId, agent.status);
});
```

## Migration from Old Clients

**Before**:

```typescript
import { searchRagster } from '@bree-ai/core/utils/ragster';
import { collectiveChat } from '@bree-ai/core/utils/collective';

const results = await searchRagster(query, collection);
const response = await collectiveChat({...});
```

**After**:

```typescript
import breeAPI from '@bree-ai/core/utils/breeAPI';

const results = await breeAPI.knowledge.search({ query, collection });
const response = await breeAPI.collective.chat({...});
```
