---
title: Grapes — AI Agent Collective
type: architecture
scope: platform
stack: NATS, Bun, AgentX
last_updated: 2026-02-25
ai_context: true
---

# Grapes — AI Agent Collective

"Grapes" is the internal name for BREE's AI agent processes. Each grape is an independent, long-running Bun process that connects to the NATS cluster and listens for work on its assigned subjects. Together they form the **Agent Collective** — a distributed AI workforce orchestrated through NATS.

---

## Terminology

| Term             | Meaning                                                         |
| ---------------- | --------------------------------------------------------------- |
| **Grape**        | An individual AI agent process (Bun)                            |
| **Vine**         | A logical channel connecting a set of participants (human + AI) |
| **Village Vine** | A specific Vine used for live talent assessment sessions        |
| **Collective**   | All connected grapes as a whole                                 |
| **AgentX**       | The orchestration service that routes work to grapes            |

---

## Agent Identity

Every grape has:

- **`agentId`** — unique string identifier (e.g. `grape-rag-001`, `grape-coding-1`)
- **`type`** — functional category (e.g. `rag`, `coding`, `interview`, `rip`)
- **`capabilities`** — list of skills the grape can perform
- **`status`** — `online` | `offline` | `busy`

---

## Agent Lifecycle

```
Grape boots
  └─ Connects to NATS
  └─ Subscribes to:
       agents.{id}.messages         ← receive work
       agent.{id}.{action}          ← specific action commands
  └─ Publishes to:
       agents.{id}.status           ← heartbeat / status response
       logs.{id}.{level}            ← log output (picked up by WS terminal)
       lifecycle.{id}.{event}       ← started, stopped, busy, idle
```

---

## NATS Subjects

### Discovery

```
agents.discover          ← broadcast: "who's there?"
agents.{id}.status      ← reply: { agentId, status, lastSeen, metadata }
```

### Messaging

```
agents.{id}.messages    ← send a message payload to this agent
agent.{id}.{action}     ← e.g. agent.grape-1.run, agent.grape-1.stop
```

### Observability (streamed to WS terminal in bree-api-realtime)

```
logs.{id}.info          ← info log line
logs.{id}.error         ← error log line
logs.{id}.debug         ← debug log line
lifecycle.{id}.started  ← agent started
lifecycle.{id}.stopped  ← agent stopped
lifecycle.{id}.busy     ← agent processing
lifecycle.{id}.idle     ← agent done
```

---

## Discovery Protocol

`GET /api/agents` triggers `nats.discoverAgents()`:

```ts
// 1. Publish broadcast
await nc.publish("agents.discover", codec.encode("{}"));

// 2. Subscribe to replies on a transient inbox
const inbox = createInbox();
const replies = nc.subscribe(inbox, { timeout: 2000 });

// 3. Collect all replies within the timeout window
const agents = [];
for await (const msg of replies) {
  agents.push(JSON.parse(codec.decode(msg.data)));
}
return agents;
```

Each grape must respond on `msg.reply` with its status object.

---

## Agent Terminal (WebSocket)

`/api/agents/:id/ws` in `bree-api-realtime` connects a browser terminal to a running grape:

```
Browser Terminal WS
  │
  ├─ open  → subscribe NATS logs.{id}.> + lifecycle.{id}.>
  │           forward all messages to the WS as:
  │           { type: 'log', ... } or { type: 'lifecycle', ... }
  │
  ├─ message { type: 'command', action: 'run', payload: {...} }
  │           → publish NATS agent.{id}.run
  │
  ├─ message { type: 'ping' }  → { type: 'pong' }
  │
  └─ close  → unsubscribe all NATS subscriptions
```

---

## AgentX Integration

AgentX (`AGENTX_URL`) is the higher-level orchestration layer. It:

- Routes complex multi-agent tasks (via `/api/collective/chat`)
- Manages agent registration and capability discovery
- Handles multi-step workflows across grapes

The BREE API proxies to AgentX for collective chat:

```
POST /api/collective/chat → AgentX → selects grape(s) → NATS → response
```

---

## Existing Grapes

| Agent ID Pattern    | Type        | Function                               |
| ------------------- | ----------- | -------------------------------------- |
| `grape-rag-*`       | `rag`       | RAG document search and Q&A            |
| `grape-coding-*`    | `coding`    | Code review and generation             |
| `grape-interview-*` | `interview` | Talent Village assessment AI           |
| `grape-ripcode-*`   | `rip`       | RipCode AI — codebase search (ripgrep) |

---

## SDK Usage (`agent-collective-sdk`)

```ts
import { AgentCollective } from "@bree-ai/agent-collective-sdk";

const collective = new AgentCollective({ natsUrl: process.env.NATS_URL });
await collective.connect();

const agents = await collective.discover();
await collective.sendMessage("grape-rag-001", {
  content: "Summarize document X",
});
await collective.subscribe("logs.grape-rag-001.>", (msg) => console.log(msg));
```

---

## Village Vine — Grapes in Assessment Mode

During a Talent Village live assessment, grapes participate directly in the vine:

```
village.vine.{id}.messages  ← grape subscribes to candidate messages
                            ← grape publishes AI responses into the same vine
                            ← Lead Expert sees all; Candidate sees only their thread
```

The AI auto-response feature in Talent Village configures which grape handles the vine and at what response rate (tokens/question limit).
