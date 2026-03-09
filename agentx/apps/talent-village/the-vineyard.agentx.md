---
title: The Vineyard — Project Intelligence Platform
type: app
app: the-vineyard
fly_app: the-vineyard
url: https://the-vineyard.fly.dev
stack: Vite, React, bree-ai-core, NATS
brand_id: the-vineyard
last_updated: 2026-02-25
ai_context: true
---

# The Vineyard — Project Intelligence Platform

The Vineyard is a **project and task management platform** augmented by AI grapes (agents). It lets teams manage Vineyard projects, assign tasks, run AI lenses over work items, and communicate via Village Vines.

---

## Core Concepts

| Term             | Meaning                                        |
| ---------------- | ---------------------------------------------- |
| **Vineyard**     | A project workspace                            |
| **Project**      | A work collection within a Vineyard            |
| **Task**         | A unit of work with status/assignee            |
| **AI Lens**      | An AI analysis pass over a project or task set |
| **Village Vine** | A real-time chat session between humans + AI   |
| **Grape**        | An AI agent process connected via NATS         |

---

## User Flows

1. **Create a Vineyard / Project / Task** → `breeAPI` CRUD calls to `/api/vineyard`
2. **Run AI Lens** → sends project context to AgentX/OpenAI, returns analysis
3. **Start a Village Vine** → POST `/api/village/start`, get `vineId`
4. **Join the Vine** → WS `bree-api-realtime/api/village/:id/ws?name=...`
5. **Chat in real-time** → NATS fan-out delivers messages to all participants
6. **Agent discovery** → `GET /api/agents` (via bree-api-realtime) shows live grapes
7. **Open Agent Terminal** → WS `/api/agents/:id/ws` streams logs

---

## Key Components

| Component                | Description                                            |
| ------------------------ | ------------------------------------------------------ |
| `Sidebar.tsx`            | Navigation between Vineyard, Projects, Agents, Village |
| `ProjectsView.tsx`       | Project list + task board                              |
| `FastFeatDashboard.tsx`  | Quick feature tracking dashboard                       |
| `FlyDeploymentPanel.tsx` | Trigger Fly.io deploys from the UI                     |
| `useVillageVine.ts`      | WebSocket hook for live vine sessions                  |

---

## External Services Used

| Service           | Purpose                                     |
| ----------------- | ------------------------------------------- |
| bree-api          | Vineyard/project CRUD, AI lenses            |
| bree-api-realtime | Village vine WS, agent WS, OpenAI streaming |
| NATS              | Real-time message backbone                  |
| Ragster           | Knowledge search for project context        |
| AgentX            | AI lens analysis                            |

---

## Key Environment Variables

| Variable                      | Value                               |
| ----------------------------- | ----------------------------------- |
| `VITE_API_URL`                | `https://bree-api.fly.dev`          |
| `VITE_REALTIME_URL`           | `https://bree-api-realtime.fly.dev` |
| `VITE_APP_NAME`               | `The Vineyard`                      |
| `VITE_BRAND_ID`               | `the-vineyard`                      |
| `VITE_RAGSTER_DEFAULT_ORG_ID` | `the-vineyard`                      |

---

## Local Dev

```bash
bun run dev:vineyard
# → http://localhost:5173
```
