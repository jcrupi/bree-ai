---
title: AgentX Collective — Multi-Agent Orchestration
type: service
scope: platform
stack: AgentX, NATS, Bun, agent-collective-sdk
last_updated: 2026-02-25
ai_context: true
---

# AgentX Collective — Multi-Agent Orchestration

AgentX is the **orchestration layer** that coordinates multiple AI grapes (agents) to handle complex, multi-step tasks. It sits above individual NATS-connected agents and routes work intelligently across the collective.

---

## Role in the Stack

```
Frontend
  └─ breeAPI.collective.chat(params) / POST /api/collective/chat
       └─ bree-api proxies to AgentX (AGENTX_URL)
            └─ AgentX selects grape(s) based on capability
                 └─ NATS: agents.{id}.messages
                      └─ Grape processes, may call other grapes
                           └─ Response assembled → returned
```

---

## Integration

### Via breeAPI Facade

```ts
import { breeAPI } from "@bree-ai/core";

const result = await breeAPI.collective.chat({
  messages: [
    { role: "user", content: "Analyze this codebase for security issues" },
  ],
  userEmail: "dev@example.com",
  orgSlug: "my-org",
  options: { model: "gpt-4o", stream: false },
});
```

### Via Direct API

```ts
const response = await fetch(`${API_URL}/api/collective/chat`, {
  method: "POST",
  headers: {
    authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ messages, userEmail, orgSlug, options }),
});
```

---

## Agent Capability Discovery

AgentX discovers available grapes via NATS:

```
Broadcast: agents.discover → all connected grapes reply with:
{
  agentId: 'grape-rag-001',
  type: 'rag',
  capabilities: ['search', 'summarize', 'embed'],
  status: { status: 'online', lastSeen: '...' }
}
```

AgentX routes tasks to the most appropriate grape based on `capabilities` and `status`.

---

## `agent-collective-sdk` Package

```ts
import { AgentCollective } from "@bree-ai/agent-collective-sdk";

const sdk = new AgentCollective({
  natsUrl: process.env.NATS_URL,
  agentxUrl: process.env.AGENTX_URL,
});
await sdk.connect();

// Discover all online grapes
const grapes = await sdk.discover();

// Send work to a specific grape
await sdk.sendMessage("grape-coding-001", {
  content: "Review this TypeScript for type safety issues",
  metadata: { file: "index.ts", context: sourceCode },
});

// Subscribe to grape output
await sdk.subscribe("logs.grape-coding-001.>", (msg) => console.log(msg));
```

---

## agent-collective-ui-kit Package

Provides React components for visualizing the agent collective:

```tsx
import { AgentStatusPanel, AgentTerminal, CollectiveMonitor } from '@bree-ai/agent-collective-ui-kit';

// Shows all connected grapes + their status
<CollectiveMonitor />

// Log stream for a specific grape
<AgentTerminal agentId="grape-rag-001" realtimeUrl={REALTIME_URL} />

// Status badge for a single grape
<AgentStatusPanel agentId="grape-coding-001" />
```

---

## Vineyard AI Lenses

In The Vineyard, AgentX powers "AI Lenses" — on-demand analysis passes over projects:

```
User clicks "Run AI Lens" on a project
  └─ POST /api/vineyard/projects/:id/lens
       └─ bree-api collects project + tasks context
            └─ POST to AGENTX_URL/api/lens
                 └─ AgentX routes to appropriate analysis grape
                      └─ Returns structured insights
```

---

## Configuration

| Env Var             | Where Set                           | Description                       |
| ------------------- | ----------------------------------- | --------------------------------- |
| `AGENTX_URL`        | bree-api                            | AgentX service base URL           |
| `NATS_URL`          | bree-api, bree-api-realtime, grapes | Shared NATS cluster               |
| `VITE_REALTIME_URL` | frontends                           | For agent terminal WS connections |
