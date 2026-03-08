---
title: TheObserver — Server-Backed Behavioral Observation System
type: component-design
scope: habitaware-ai
stack: React, TypeScript, Bun, Elysia, NATS, AgentX, Anthropic Claude
app: habitaware-ai
last_updated: 2026-03-07
ai_context: true
tags:
  [
    theobserver,
    habitaware,
    observables,
    behavioral-tracking,
    ai-chat,
    grape-mode,
    agentx,
    ripcode,
    collective,
    server-backed,
  ]
---

# TheObserver — Server-Backed Behavioral Observation System

TheObserver is the evolution of the Observer feature. It replaces the original
localStorage-only Observer with a fully server-backed observable store, and adds
a **Grape Mode** — a second AI chat channel where the user can direct questions
directly at the AgentX collective's `grape-ripcode-*` agent, which runs
ripgrep-powered code searches against the live BREE monorepo.

---

## Design Goals

> **Core idea:** Record behavioral observations in the moment, analyze them with
> HabitAware-context AI, and — when a question is about the codebase itself —
> switch to Grape Mode and ask a ripcode agent that has live access to the repo.

| Goal                | How                                                                                |
| ------------------- | ---------------------------------------------------------------------------------- |
| Always-on capture   | Fixed `🔭` FAB visible on every tab                                                |
| Zero-friction entry | Modal, ⌘↵ to save, category + free text + tags                                     |
| Server persistence  | `POST /api/observations/` → Fly volume JSON files                                  |
| Cross-device        | All observables fetched on mount from `GET /api/observations/`                     |
| Legacy feedback     | All `/api/feedback` files auto-converted to observables on GET                     |
| Dual AI modes       | **HabitAware mode** (Claude/behavior analysis) + **Grape Mode** (ripcode/codebase) |
| Repo intelligence   | Grape Mode routes through `POST /api/collective/chat` → `grape-ripcode-*`          |

---

## Architecture

```
TheObserver.tsx  (self-contained component)
│
├── SubmitModal            ← 🔭 FAB → opens this
│   ├── Category picker (6 behaviorally-typed categories)
│   ├── Free-text textarea (⌘↵ shortcut)
│   ├── Tag system (comma or Enter to add)
│   └── POST /api/observations/ on save → server-persisted
│
├── ObservablesList        ← "📋 Observables" view in panel
│   ├── Unified card list (local obs + converted legacy feedback)
│   ├── Search bar (text, tag, name search)
│   ├── 📡 CONVERTED badge on legacy-feedback cards
│   └── 🔄 Refresh button → re-fetches from server
│
└── ObserverChat           ← "🧠 AI Analysis" view in panel
    ├── Mode selector: [HabitAware] [🍇 Grape — Repo]
    ├── Context banner (observable count + converted count)
    ├── Message thread (markdown rendered)
    ├── Suggestion chips (mode-aware)
    └── API routing (see Chat Modes below)
```

---

## Data Model

### Observable (unified schema — server canonical form)

```typescript
interface Observable {
  id: string; // 'obs-{timestamp}-{uuid}' or 'fb-{filename}'
  text: string; // the observation description
  category: string; // one of 6 types (see Categories)
  tags: string[]; // user-defined, kebab-cased
  createdAt: string; // ISO 8601
  source:
    | "observer" // newly created via TheObserver
    | "feedback"; // converted from legacy /api/feedback file
  savedBy?: string; // email of user who created (from JWT)
  metadata?: {
    // populated for legacy feedback conversions
    name?: string;
    email?: string;
    originalType?: string; // 'bug' | 'feature' | 'ai_feedback' | 'general'
  };
}
```

### Stored as JSON files on Fly volume

```
/app/data/observations/observation-{ISO-timestamp}.json  ← native observables
/app/data/feedback/feedback-{timestamp}-{uuid}.json      ← legacy feedback (read-only, converted on GET)
```

### Legacy Feedback → Observable Conversion

The `GET /api/observations/` endpoint converts legacy feedback on-the-fly:

| Feedback `type` | Observable `category` |
| --------------- | --------------------- |
| `bug`           | `challenge`           |
| `feature`       | `insight`             |
| `ai_feedback`   | `insight`             |
| `general`       | `general`             |

Both sets are merged, sorted by `createdAt` descending, and returned as one array.
The frontend tags converted items with `source: 'feedback'` and shows a `📡 CONVERTED` badge.

---

## Server API

All endpoints are in `bree-api` (`apps/api/src/index.ts`):

### GET /api/observations/

Returns unified list of observables + converted feedback. Auth required.

```typescript
// Response: Observable[]
// Sorted by createdAt descending
// Merges: data/observations/*.json + data/feedback/*.json (converted)
```

### POST /api/observations/

Creates a new server-persisted observable.

```typescript
// Request body:
{ text: string; category?: string; tags?: string[] }

// Writes to: /app/data/observations/observation-{timestamp}.json
// Adds: id, createdAt, source: 'observer', savedBy from JWT

// Response:
{ success: true; observation: Observable }
```

---

## Observable Categories

| Value       | Label               | Color     | Semantic                       |
| ----------- | ------------------- | --------- | ------------------------------ |
| `behavior`  | 🔄 Behavior Pattern | `#6366f1` | Recurring actions or habits    |
| `trigger`   | ⚡ Trigger          | `#f59e0b` | Events that precede a behavior |
| `progress`  | 📈 Progress         | `#10b981` | Positive movement toward goals |
| `challenge` | 🧱 Challenge        | `#ef4444` | Obstacles or difficulties      |
| `insight`   | 💡 Insight          | `#8b5cf6` | Realizations, "aha" moments    |
| `general`   | 📝 General          | `#64748b` | All-purpose catch-all          |

---

## FAB Design

```
Position:  fixed, bottom: 28px, right: 28px, z-index: 8888
Size:      56×56px circle
Icon:      🔭 emoji  (upgraded from 🔍 in Observer v1)
Gradient:  linear-gradient(135deg, #6366f1, #8b5cf6)

Pulse:     on new save → scale(1.08) + expanded box-shadow for 600ms
Badge:     green #10b981 pill, total observable count (hidden when 0)
```

The FAB always renders regardless of active tab. When `panelMode` is `true`
(i.e. the TheObserver tab is active), the FAB **still renders** so captures
can happen from within the panel view itself.

---

## AI Chat Modes

The `ObserverChat` component supports two distinct modes, selectable via a toggle:

```
┌─────────────────────────────────────────────────────┐
│  [🧠 HabitAware]   [🍇 Grape — Repo Code]           │
└─────────────────────────────────────────────────────┘
```

### Mode 1: HabitAware (default)

**Purpose:** Behavioral pattern analysis using all stored observables as context.

**Route:** `POST /api/habitaware/chat/analyze`

**Context injection strategy:** The full observable list is prepended to the
question so Claude receives it in the `question` field:

```typescript
const questionWithContext = `
You are analyzing TheObserver data for HabitAware — a set of behavioral observables.

${buildContext(observables)}   // serialized observable list

---

Question: ${userQuestion}
`;

// Sent as:
{ question: questionWithContext, history: previousMessages }
```

**Response field:** `data.response` (Claude Anthropic — `claude-3-haiku-20240307`)

**Suggestion chips (HabitAware mode):**

```
"What patterns do you see across all observables?"
"What are the main behavioral triggers identified?"
"Where is the most progress being made?"
"What should we focus on next?"
"Summarize the observables by category"
"What feedback themes appear most frequently?"
```

---

### Mode 2: Grape Mode — Repo Code

**Purpose:** Code intelligence against the live BREE monorepo via the
`grape-ripcode-*` agent in the Agent Collective.

**Route:** `POST /api/collective/chat`

This endpoint proxies to AgentX, which selects an available ripcode grape:

```
TheObserver UI
  └─ POST /api/collective/chat
       └─ bree-api proxies to AGENTX_URL/api/collective/chat
            └─ AgentX routes to grape-ripcode-* (type: 'rip')
                 └─ NATS: agents.grape-ripcode-001.messages
                      └─ Grape runs ripgrep against repo
                           └─ Returns code findings
```

**Request shape:**

```typescript
const res = await fetch(`${API_URL}/api/collective/chat`, {
  method: "POST",
  headers: {
    authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    messages: [
      // Inject observable context as system prime
      {
        role: "user",
        content: `
You are a code intelligence agent with live access to the BREE monorepo via ripgrep.

For reference, the user has these behavioral observables recorded:
${buildContext(observables)}

Now answer this code question using repo search:
${userQuestion}
        `,
      },
      ...previousMessages,
    ],
    userEmail: currentUser?.email ?? "observer@habitaware.ai",
    orgSlug: "habitaware",
    options: { model: "gpt-4o", stream: false },
  }),
});

const data = await res.json();
// data.response or data.choices?.[0]?.message?.content
```

**Suggestion chips (Grape mode):**

```
"Where are observables stored in the codebase?"
"Show me the /api/observations/ endpoint implementation"
"How does TheObserver POST save to the server?"
"Find all NATS subject patterns used in this repo"
"How is authentication handled in bree-api?"
"Show me the feedback-to-observable conversion logic"
```

**Observable context in Grape Mode:** The observable list is included as
background context — the grape can cross-reference what the user has been
observing with what it finds in the code. For example:

> _"I observed a bug where server feedback shows after an empty state — show
> me the code in TheObserver.tsx that renders the list"_

The grape can use ripgrep to locate `ObservationsList` in the component and
return the exact code block.

---

## Mode Switching Design

```tsx
// In ObserverChat component
const [chatMode, setChatMode] = useState<"habitaware" | "grape">("habitaware");

<div
  style={{
    display: "flex",
    gap: 4,
    marginBottom: 16,
    background: "rgba(255,255,255,0.04)",
    padding: 4,
    borderRadius: 10,
  }}
>
  <button
    onClick={() => setChatMode("habitaware")}
    style={{ ...(activeMode === "habitaware" ? activeStyle : inactiveStyle) }}
  >
    🧠 HabitAware
  </button>
  <button
    onClick={() => setChatMode("grape")}
    style={{ ...(activeMode === "grape" ? grapeActiveStyle : inactiveStyle) }}
  >
    🍇 Grape — Repo
  </button>
</div>;
```

Mode switching:

- **Clears the chat input** when switching
- **Does NOT clear chat history** (each mode has its own history key)
- Updates suggestion chips immediately
- Updates context banner: `"Analyzing N observables"` vs `"🍇 Routing via grape-ripcode → BREE monorepo"`

### Separate localStorage keys per mode:

```typescript
const CHAT_KEY_HABITAWARE = "theobserver_chat_habitaware";
const CHAT_KEY_GRAPE = "theobserver_chat_grape";
```

---

## Component Mounting Strategy

```tsx
// App.tsx — TheObserver is mounted in two simultaneous modes

// 1. Floating button on ALL tabs (always visible)
{
  mainTab !== "observer" && <TheObserver />;
}

// 2. Full panel when 🔭 TheObserver tab is active
{
  mainTab === "observer" && (
    <div className="panel">
      <TheObserver panelMode />
    </div>
  );
}
```

When `panelMode={false}` (default): only the FAB renders — lightweight.
When `panelMode={true}`: FAB + full panel (observable list + AI chat).

Both mount points share the same server data since observables are fetched on
panel mount rather than stored in parent state.

---

## Data Flow Diagram

```
User taps 🔭 FAB
  └─ SubmitModal opens
       └─ User enters text, picks category, adds tags
            └─ POST /api/observations/
                 └─ bree-api writes JSON to /app/data/observations/
                      └─ Response: { success: true, observation: {...} }
                           └─ Optimistic prepend to local state
                                └─ FAB badge increments
                                └─ Pulse animation fires

User opens TheObserver tab (panelMode)
  └─ useEffect → GET /api/observations/
       └─ bree-api reads:
            ├─ data/observations/*.json   (native)
            └─ data/feedback/*.json       (converted)
       └─ Returns merged Observable[] sorted newest-first
            └─ setObservables(data)
                 └─ Stats row renders (count by category)
                 └─ List renders (with 📡 CONVERTED badge on feedback items)

User asks AI in HabitAware mode
  └─ buildContext(observables) → prepended to question
       └─ POST /api/habitaware/chat/analyze
            └─ Claude claude-3-haiku analyzes with HabitAware system prompt
                 └─ data.response → rendered as markdown

User switches to 🍇 Grape mode
  └─ Question + observable context → POST /api/collective/chat
       └─ AgentX → grape-ripcode-* → NATS
            └─ Grape runs ripgrep against BREE monorepo
                 └─ Returns code findings as markdown
                      └─ Rendered in chat thread
```

---

## Future Enhancements

| Enhancement                 | Design sketch                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Grape streaming**         | Switch `options.stream = true` → stream grape output token-by-token via `EventSource`                              |
| **Agent status indicator**  | Show `grape-ripcode-*` online/offline state via `GET /api/agents` before sending                                   |
| **Observation → repo link** | From an observable, right-click → "Find in repo" → auto-sends to grape mode with pre-filled ripgrep query          |
| **Export as agentx.md**     | Serialize all observables as a structured `theobserver-export.agentx.md` note                                      |
| **Grape selection**         | Dropdown to choose which grape type to route to: `rip` (code search), `rag` (doc search), `coding` (code review)   |
| **Observable → Linear**     | Button on any observable to create a Linear issue populated with the observation text                              |
| **Timeline view**           | Chronological chart with category color bands and grape search overlays                                            |
| **Weekly digest grape**     | Scheduled grape job: `POST /api/observations/digest` → grape summarizes week's observables → stored as agentx note |

---

## File Layout

```
apps/habitaware-ai/src/
├── components/
│   ├── TheObserver.tsx    ← this component (FAB + modal + list + dual-mode chat)
│   └── Observer.tsx       ← previous version (deprecated, still mounted for fallback)
└── App.tsx                ← imports TheObserver, mounts panel + FAB

apps/api/src/
└── index.ts               ← /api/observations GET + POST
                           ← /api/collective/chat proxy to AgentX
                           ← /api/habitaware/chat/analyze (chat.ts via /api/habitaware/chat)

agentx/
└── apps/
    └── theobserver.agentx.md   ← this file

agentx/
├── grapes.agentx.md            ← grape architecture reference
└── agent-collective.agentx.md  ← collective chat API reference
```

---

## Key Integration Points in App.tsx

```typescript
// 1. Tab type includes observer
type MainTab = 'habitaware' | 'advanced' | 'book' | 'observer';

// 2. Tab button
<button onClick={() => setMainTab('observer')}>🔭 TheObserver</button>

// 3. Panel render (fetches observables from server)
{mainTab === 'observer' && <TheObserver panelMode />}

// 4. FAB on all other tabs
{mainTab !== 'observer' && <TheObserver />}
```

---

## Source Files

| File                                                                                                           | Role                                |
| -------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| [`apps/habitaware-ai/src/components/TheObserver.tsx`](../../apps/habitaware-ai/src/components/TheObserver.tsx) | Full TheObserver component          |
| [`apps/habitaware-ai/src/App.tsx`](../../apps/habitaware-ai/src/App.tsx)                                       | Mounts TheObserver; defines MainTab |
| [`apps/api/src/index.ts`](../../apps/api/src/index.ts)                                                         | `/api/observations/` GET + POST     |
| [`apps/api/src/routes/habitaware/chat.ts`](../../apps/api/src/routes/habitaware/chat.ts)                       | `/analyze` endpoint (Claude)        |
| [`agentx/grapes.agentx.md`](../grapes.agentx.md)                                                               | Grape architecture                  |
| [`agentx/agent-collective.agentx.md`](../agent-collective.agentx.md)                                           | Collective chat API                 |

---

_This note is AI-readable. Ask about the capture flow, the server storage model,
the HabitAware chat mode, or how to route a question to a ripcode grape._
