---
title: Talent Village AI — Live Hiring Assessment Platform
type: app
app: talent-village-ai
fly_app: talent-village-ai
url: https://talent-village-ai.fly.dev
stack: Vite, React, bree-ai-core, NATS, WebSocket
brand_id: talent-village-ai
last_updated: 2026-02-25
ai_context: true
---

# Talent Village AI — Live Hiring Assessment Platform

Talent Village is a **live AI-assisted hiring assessment system** where a Lead Expert orchestrates a real-time session with a Candidate, assisted by AI (grapes) and collaborating Experts — all connected through a NATS Village Vine.

See also: [`talent-village.agentx.md`](../../talent-village.agentx.md) for role definitions.

---

## The Three Roles

### 👤 Candidate

- Views only their own assessment chat
- Communicates via the village vine (End-to-End encrypted channel)
- Cannot see Expert Vine or AI tooling

### 👑 Lead Expert

- Full mirror of candidate chat + direct intervention capability
- Access to AI Tools Suite, Question Designer, Intervention Queue
- Controls Expert roster (can upgrade Experts to send-mode)
- Generates invite links, manages vine lifecycle

### 👥 Expert (Non-Lead)

- Read-only candidate mirror by default
- Private Expert Vine chat visible to Experts + Lead only
- Can propose questions to the Lead's Intervention Queue
- Lead can explicitly enable send capability per expert

---

## Key User Flows

1. **Setup** → Lead creates village, sets topic, invites Candidate + Experts
2. **Save to server** → `POST /api/talent-village/villages` (Bun file persistence)
3. **Start vine** → `POST /api/village/start` on bree-api-realtime → `vineId`
4. **Join vine** → WS `bree-api-realtime/api/village/:vineId/ws?name=...`
5. **Send SMS invite** → `POST /api/village/send-invite-sms` via Twilio
6. **AI auto-response** → grape subscribes to vine, responds to candidate messages
7. **AI Question Designer** → uses `useOpenAIStream` to generate interview questions
8. **Session history** → `GET /api/village/:id/messages` from conversation DB

---

## Key Pages / Components

| Component                | Description                                              |
| ------------------------ | -------------------------------------------------------- |
| `TalentVillageSetup.tsx` | Pre-session configuration — topic, invites, AI settings  |
| `LeadDashboard.tsx`      | Lead Expert control center — all panels                  |
| `TalentVillageBoard.tsx` | Main session board — candidate mirror + expert vine      |
| `LeadExpertPanel.tsx`    | Intervention queue, AI tools, question designer          |
| `ExpertPanel.tsx`        | Non-lead expert view — read-only with propose capability |

---

## Village File Format

Each village is persisted as a markdown file with YAML front matter:

```markdown
---
id: village-abc123
topic: Senior TypeScript Engineer Assessment
invited:
  - Lead Expert
  - Alice
  - Bob (Candidate)
createdAt: 2026-02-25T17:00:00Z
status: active
---

# Village: Senior TypeScript Engineer Assessment

...
```

---

## NATS Subjects Used

| Subject                      | Purpose                            |
| ---------------------------- | ---------------------------------- |
| `village.vines.created`      | Notify collective when vine starts |
| `village.vine.{id}.messages` | Real-time message broadcast        |

---

## Key Environment Variables

| Variable            | Value                               |
| ------------------- | ----------------------------------- |
| `VITE_API_URL`      | `https://bree-api.fly.dev`          |
| `VITE_REALTIME_URL` | `https://bree-api-realtime.fly.dev` |
| `VITE_APP_NAME`     | `Talent Village`                    |
| `VITE_BRAND_ID`     | `talent-village-ai`                 |

---

## Server-side (bree-api)

Village files stored at `VILLAGES_DIR` using pure Bun fs API:

```bash
fly secrets set VILLAGES_DIR=/app/data/villages -a bree-api
```

---

## Local Dev

```bash
bun run dev:talent-village-ai
# → http://localhost:5174
```
