---
title: Observer — Behavioral Observation System (HabitAware)
type: component-design
scope: habitaware-ai
stack: React, TypeScript, Vite, GPT-4o, localStorage
app: habitaware-ai
last_updated: 2026-03-07
ai_context: true
tags:
  [
    observer,
    habitaware,
    behavioral-tracking,
    ai-chat,
    floating-fab,
    local-first,
  ]
---

# Observer — Behavioral Observation System

Observer is the behavioral logging and AI analysis feature of HabitAware AI.
It replaces the old "Feedback" tab with a purpose-built tool for recording,
categorizing, and AI-analyzing behavioral patterns, triggers, and insights.

---

## Design Intent

> **Core idea:** A lightweight, always-available "capture" button that lets users
> record micro-observations in the moment — then an AI that can synthesize
> those observations into patterns, insights, and next steps.

The Observer is designed around three principles:

1. **Always available** — the floating `🔍` button is present on every tab, not buried in navigation
2. **Zero friction capture** — modal opens instantly, ⌘↵ to save, no required fields beyond the text
3. **Local-first** — observations persist to `localStorage`, no server round-trip on submit

---

## Component Architecture

```
Observer.tsx  (single file, self-contained)
│
├── SubmitModal          ← floating button → opens this
│   ├── Category picker (6 types with color coding)
│   ├── Free-text textarea (⌘↵ shortcut)
│   └── Tag system (add/remove, comma or Enter to add)
│
├── ObservationsList     ← rendered when mainTab === 'observer'
│   ├── Search bar
│   ├── Category filter pills (with per-category counts)
│   └── Observation cards (color-coded by category)
│
├── ObserverChat         ← "🧠 AI Analysis" view inside Observer tab
│   ├── Context builder (all observations → GPT-4o system prompt)
│   ├── Suggestion chips (pre-written useful questions)
│   ├── Chat message thread (markdown rendered)
│   └── Persistent history (localStorage)
│
└── ObserverPanel        ← wrapper for the tab view
    ├── Header + stats row (count per category)
    └── Toggle: Observations | AI Analysis
```

---

## Data Model

Observations are stored locally — no server, no DB.

```typescript
interface Observation {
  id: string; // 'obs-{timestamp}'
  text: string; // free-form observation text
  category: string; // one of 6 types (see below)
  tags: string[]; // user-defined, kebab-cased
  createdAt: string; // ISO 8601 timestamp
}
```

### Storage

```typescript
const STORAGE_KEY = "habitaware_observations";
const CHAT_KEY = "habitaware_observer_chat";

// Read
JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as Observation[];

// Write (full replace — array stays sorted newest-first)
localStorage.setItem(STORAGE_KEY, JSON.stringify(observations));
```

No pagination, no server sync. All observations load into memory on mount.
For HabitAware's use case (personal behavioral logging), localStorage is sufficient
and avoids auth/API dependencies for the capture path.

---

## Observation Categories

| Value       | Label               | Color     | Semantic meaning                           |
| ----------- | ------------------- | --------- | ------------------------------------------ |
| `behavior`  | 🔄 Behavior Pattern | `#6366f1` | Recurring actions or habits observed       |
| `trigger`   | ⚡ Trigger          | `#f59e0b` | Events or contexts that precede a behavior |
| `progress`  | 📈 Progress         | `#10b981` | Positive movement toward goals             |
| `challenge` | 🧱 Challenge        | `#ef4444` | Obstacles, setbacks, or difficulties       |
| `insight`   | 💡 Insight          | `#8b5cf6` | Realizations or "aha" moments              |
| `general`   | 📝 General          | `#64748b` | Catch-all for anything else                |

Each category has a consistent color used across the FAB pulse, card left border,
filter pills, category badge, and stat card background.

---

## Component Mounting Strategy

Observer is mounted in two modes depending on where it renders:

```tsx
// App.tsx — always visible floating button (on non-observer tabs)
{
  mainTab !== "observer" && <Observer />;
}

// App.tsx — full panel when Observer tab is active
{
  mainTab === "observer" && (
    <div className="panel">
      <Observer panelMode />
    </div>
  );
}
```

### Why two separate mounts?

The `panelMode` prop tells the component to render the `ObserverPanel` in addition
to the floating button. When `mainTab === "observer"`, the Observer tab IS the panel,
so the floating button is hidden (the panel has its own create flow via the FAB at
bottom-right which is always shown via `panelMode`).

When on any other tab, only the floating button renders — lightweight, no DOM overhead.

---

## Floating Action Button (FAB)

```
Position: fixed, bottom: 28px, right: 28px, z-index: 8888
Size:      56×56px circle
Icon:      🔍 emoji
Gradient:  linear-gradient(135deg, #6366f1, #8b5cf6)
```

### Badge

Green `#10b981` pill showing total observation count. Hidden when count is 0.
Positioned top-right of the FAB circle, bordered to separate from background.

### Pulse animation

When a new observation is saved:

```typescript
setPulse(true);
setTimeout(() => setPulse(false), 600);
```

The button briefly scales up (`1.08`) and expands its box-shadow to create a
"ripple" effect — visual confirmation that the observation was saved.

---

## AI Chat Design

### Context injection

All observations are serialized into the GPT-4o system prompt:

```typescript
function buildContext() {
  return observations
    .map(
      (o, i) =>
        `[${i + 1}] (${category.label} — ${formatDate(o.createdAt)})${tags}\n${o.text}`,
    )
    .join("\n\n");
}

const systemPrompt = `You are an AI assistant helping analyze behavioral observations for HabitAware.
The user has recorded the following observations:\n\n${buildContext()}\n\n
Analyze these observations thoughtfully. Look for patterns, triggers, progress
markers, and insights. Be specific, empathetic, and actionable in your responses.`;
```

The context is rebuilt on every message send, so new observations are always
reflected without requiring a chat reset.

### API call

```typescript
POST {VITE_API_URL}/api/openai/chat
{
  model: "gpt-4o",
  messages: [
    { role: "system", content: systemPrompt },
    ...history
  ]
}
```

Uses the same `bree-api` OpenAI proxy as the rest of HabitAware — auth via
`localStorage.getItem("bree_jwt")` Bearer token.

### Persistence

Chat history is persisted to `localStorage` under `habitaware_observer_chat`.
Users can clear it with the "Clear conversation" link below the input.

### Suggestion chips

On an empty chat, five pre-written prompts appear as clickable chips:

```
"What patterns do you see across my observations?"
"What are the main triggers I've identified?"
"Where am I making the most progress?"
"What should I focus on next?"
"Summarize my observations by category"
```

These are designed to get useful AI output without requiring the user to
know how to prompt — especially important since observers may not be AI-fluent.

---

## UI Patterns

### Color-coded left border on cards

Each observation card has a `3px solid {categoryColor}` left border, making
category scannable without reading the badge text.

### Category filter pills with live counts

The filter row only renders pills for categories that have at least one observation:

```typescript
const count = observations.filter((o) => o.category === c.value).length;
if (count === 0) return null;
```

This keeps the filter bar clean — users only see options that will return results.

### Stats row

On the Observer panel, a responsive grid of stat cards shows count-by-category.
Empty categories are hidden. Each card uses the category color at low opacity
as a background tint.

### Optimistic delete

Delete is instant — removes from React state first, then writes to localStorage.
No confirmation API call. A browser `confirm()` dialog prevents accidental deletion.

### Tags

Tags are normalized on entry:

```typescript
const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
```

Comma or Enter adds a tag. Tags render as `#tag` in indigo pill style.

---

## File Layout

```
apps/habitaware-ai/src/
├── components/
│   └── Observer.tsx          ← this component (self-contained)
└── App.tsx                   ← imports Observer, mounts panel + FAB
```

### Key integration points in App.tsx

```typescript
// 1. Type updated
type MainTab = "habitaware" | "advanced" | "book" | "observer";

// 2. Tab button
<button onClick={() => setMainTab("observer")}>🔍 Observer</button>

// 3. Panel render
{mainTab === "observer" && <Observer panelMode />}

// 4. Floating button on all other tabs
{mainTab !== "observer" && <Observer />}
```

---

## Future Enhancements

| Enhancement              | Notes                                                           |
| ------------------------ | --------------------------------------------------------------- |
| **Server sync**          | POST observations to `bree-api` for cross-device access         |
| **Export to agentx.md**  | Serialize observations as a structured `agentx.md` note         |
| **Reminder / nudge**     | Periodic prompts to log an observation                          |
| **Observation linking**  | Link two observations together ("this trigger → this behavior") |
| **Timeline view**        | Chronological chart with category color-coding                  |
| **AI-generated summary** | Weekly digest auto-generated from new observations              |
| **Shared observations**  | Multi-user observation rooms (Village Vine integration)         |

---

## Source Files

| File                                                                                                     | Role                                                |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| [`apps/habitaware-ai/src/components/Observer.tsx`](../../apps/habitaware-ai/src/components/Observer.tsx) | Full Observer component (FAB + modal + list + chat) |
| [`apps/habitaware-ai/src/App.tsx`](../../apps/habitaware-ai/src/App.tsx)                                 | Mounts Observer; defines `MainTab` type             |

---

_This note is AI-readable. Ask about any layer — the capture modal, the category system, the AI chat context, or the localStorage design._
