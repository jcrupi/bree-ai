---
agentx:
  version: 1
  created_at: "2026-03-12T00:00:00Z"
  type: impl
  filename: habitaware-collective-reporting.impl.agentx-v1.md
  domain: habitaware-collective
  app: habitaware-ai
  depends_on: habitaware-collective-reporting.feature.agentx-v1.md
  stack: Vite, React, Elysia, Bun, Mighty Networks API
ai_context: true
---

# HabitAware Collective — AI Reporting System Implementation Plan

**Implementation roadmap for Layers 1, 2, and 3.** Phased delivery with clear dependencies and deliverables.

---

## Phase 0: API Discovery & Data Mapping

**Goal:** Verify Mighty Networks API capabilities and map all fields to endpoints.

### Deliverables

| Task | Output | Owner |
|------|--------|-------|
| Map Network Admin API | Document endpoints for members, plans, tiers | Dev |
| Map MNI API | Document endpoints for Plans, Engagement, Host & Member | Dev |
| Verify `cancel_date` | Confirm API location; document or flag TBD | Dev |
| Verify `expiration_date` | Confirm API location; document or flag TBD | Dev |
| Field source matrix | Table: field → primary source → fallback | Dev |
| Ellen review | Decision on primary source for dual-source fields | Ellen |

### Algorithm: API Field Discovery

```
INPUT: feature spec field list
OUTPUT: data_source_map (field → endpoint, params)

PSEUDOCODE:
1. For each field in spec:
   a. Query Network Admin API docs / endpoints
   b. Query MNI API docs / endpoints
   c. If found in both → flag for Ellen
   d. Record primary + fallback
2. For cancel_date, expiration_date:
   a. Search MNI reports for field names
   b. Trace to API endpoint
   c. If not found → TBD, add to Phase 0 blockers
3. RETURN data_source_map
```

### Exit Criteria

- [ ] All Layer 1 fields mapped to API endpoints
- [ ] cancel_date and expiration_date locations confirmed or TBD documented
- [ ] Ellen has approved primary source for any dual-source fields

---

## Phase 1: Layer 1 — Weekly At a Glance

**Goal:** Weekly snapshot storage, diff engine, and At a Glance report UI.

### 1.1 Data Layer

| Task | Description | Deliverable |
|------|-------------|-------------|
| Snapshot schema | DB/table for member snapshots per week | `member_snapshots` table |
| Snapshot ingestion | Elysia job: pull from MN API, normalize, store | `POST /api/snapshots/ingest` |
| Weekly scheduler | Cron or scheduled job (same day each week) | `bun run snapshot:weekly` |
| Snapshot diff | Compare this week vs last; compute metrics | `diffSnapshots(prev, curr)` |

### 1.2 Calculated Metrics Engine

```yaml
# habitaware-collective RuleCatalog — Layer 1
metrics:
  trial_converted:
    inputs: [prev_snapshot, curr_snapshot]
    logic: "was Free Trial in prev, is All Access in curr"
  trial_left:
    inputs: [prev_snapshot, curr_snapshot]
    logic: "was Free Trial in prev, not in curr"
  new_cancellations:
    inputs: [prev_snapshot, curr_snapshot]
    logic: "cancel_date in curr, not in prev"
  actually_expired:
    inputs: [prev_snapshot, curr_snapshot]
    logic: "was in canceled-but-active in prev, gone in curr"
  net_member_change:
    inputs: [curr_snapshot, prev_snapshot]
    logic: "new in minus expired out"
  trial_conversion_rate:
    inputs: [trial_converted, trials_ended]
    logic: "converted / trials_ended * 100"
  churn_rate:
    inputs: [expired, total_paying]
    logic: "expired / total_paying * 100"
  mrr:
    inputs: [monthly_count, annual_count, prices]
    logic: "(monthly * monthly_price) + (annual * annual_price / 12)"
```

### 1.3 API Layer

| Endpoint | Method | Purpose |
|----------|--------|----------|
| `/api/snapshots/ingest` | POST | Trigger snapshot pull (or scheduled) |
| `/api/snapshots/latest` | GET | Latest snapshot metadata |
| `/api/reports/at-a-glance` | GET | Weekly At a Glance report (metrics + color coding) |
| `/api/reports/at-a-glance/drill/:metric` | GET | Member list for drill-down (e.g. `canceled`, `expired`) |

### 1.4 UI Layer

| Component | Description |
|-----------|-------------|
| At a Glance dashboard | Card grid with metrics, color coding (GREEN/ORANGE/RED) |
| Drill-down modal | Click metric → list of members (Name, Email, Tier, Billing, Last Login) |
| Export CSV | Button on drill-down list |

### 1.5 Dependencies

- Mighty Networks API credentials (Network Admin + MNI)
- Storage: SQLite, Postgres, or Fly volume JSON (match existing habitaware pattern)

### Exit Criteria

- [ ] Weekly snapshot runs successfully
- [ ] At a Glance report renders with correct metrics
- [ ] Drill-down works for all metrics
- [ ] CSV export works

---

## Phase 2: Layer 2 — Member Engagement

**Goal:** Engagement buckets, ghost levels, bucket movement, drill-down.

### 2.1 Engagement Data Capture

| Task | Description | Source |
|------|-------------|--------|
| logins | Per member/week | MNI or Network Admin API |
| post_clicks | Per member/week | MNI |
| contributions | Posts created | MNI |
| comments | Comments made | MNI |
| post_reactions | Likes/reactions | MNI |

**Verify:** MNI API for activity-level data (logins, clicks, comments, reactions).

### 2.2 Bucket Logic

```typescript
// Algorithm: engagement_bucket
function computeBucket(member: EngagementRecord): "Active" | "Lurker" | "Ghost" {
  if (member.contributions > 0 || member.comments > 0) return "Active";
  if (member.logins > 0 || member.post_clicks > 0 || member.post_reactions > 0) return "Lurker";
  return "Ghost";
}

// Algorithm: ghost_level (90+ days only)
function computeGhostLevel(member: Member, weeks: number): "Drifting" | "Cold" | "Ghost" | null {
  if (member.daysSinceJoin < 90) return null;
  if (weeks >= 6) return "Ghost";
  if (weeks >= 4) return "Cold";
  if (weeks >= 2) return "Drifting";
  return null;
}
```

### 2.3 Bucket Movement

Compare `engagement_bucket` this week vs last week per member. Surface movement types (Active→Lurker, Lurker→Ghost, etc.).

### 2.4 API

| Endpoint | Purpose |
|----------|---------|
| `/api/reports/engagement` | Weekly engagement snapshot (by tier, by age bucket) |
| `/api/reports/engagement/drill/:bucket/:tier/:age` | Member list (e.g. `ghost/all_access/90+`) |
| `/api/reports/engagement/movement` | Bucket movement counts |
| `/api/reports/engagement/movement/drill/:from/:to` | Member list for movement |

### 2.5 UI

- Engagement snapshot table (Active/Lurker/Ghost by tier and age)
- Ghost breakdown (Drifting/Cold/Ghost) for established members
- Bucket movement summary
- Drill-down + export for all

### Exit Criteria

- [ ] Engagement data captured weekly
- [ ] Buckets and ghost levels computed correctly
- [ ] Bucket movement surfaced
- [ ] Drill-down + export for all engagement metrics

---

## Phase 3: Layer 3 — Content, Trends & Copilot

**Goal:** Content capture, AI classification, weekly content summary, monthly trend report, on-demand copilot.

### 3.1 Content Capture

| Task | Description | Source |
|------|-------------|--------|
| Host posts | Pull post text, date, host | MNI or Network API |
| Engagement metrics | clicks, comments, reactions per post | MNI |
| who_engaged | Map members to posts | MNI + engagement snapshot |

### 3.2 AI Classification

- LLM call per post: content_type, monthly_theme, weekly_action
- Store in content snapshot table

### 3.3 Reports

| Report | Trigger | Content |
|--------|---------|---------|
| Weekly Content Summary | With At a Glance | Post performance, Stars, Watch List |
| Monthly Trend Report | End of month | Theme performance, content types, engagement shifts |

### 3.4 Copilot

| Component | Description |
|-----------|-------------|
| Chat UI | Conversational interface (extend existing chat or new tab) |
| Context injection | All snapshots, reports, content in RAG or prompt context |
| Memory | Session-conversation memory (follow-up questions) |
| Guardrails | Enforce NEVER/ALWAYS/PERMITTED from feature spec |

### 3.5 API

| Endpoint | Purpose |
|----------|---------|
| `/api/content/capture` | Pull and classify posts |
| `/api/reports/content-summary` | Weekly content summary |
| `/api/reports/monthly-trend` | Monthly trend report |
| `/api/copilot/chat` | Copilot chat (streaming) |

### Exit Criteria

- [ ] Content captured and classified
- [ ] Weekly content summary delivered
- [ ] Monthly trend report generated
- [ ] Copilot answers from data with guardrails
- [ ] Stars and Watch List drill-down + export

---

## Phase 4: Polish & Production

| Task | Description |
|------|-------------|
| Error handling | Retry logic for API failures, partial snapshot handling |
| Alerting | Notify Ellen if snapshot fails or metrics cross thresholds |
| Performance | Cache reports; incremental snapshot diff |
| Security | Auth for Ellen only; no member data leakage |
| Audit | Log all API pulls, exports |

---

## Implementation Order Summary

```
Phase 0: API Discovery        → 1–2 days
Phase 1: Layer 1 (At a Glance) → 2–3 weeks
Phase 2: Layer 2 (Engagement)  → 2–3 weeks (depends on Phase 1 snapshot)
Phase 3: Layer 3 (Content)     → 3–4 weeks (depends on Phase 2 engagement)
Phase 4: Polish                → 1 week
```

---

## Tech Stack Alignment (BREE)

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite |
| Backend | Elysia |
| API Client | Eden Treaty |
| Runtime | Bun |
| Storage | TBD (SQLite/Postgres recommended for snapshots) |

---

## File Layout (Proposed)

```
apps/habitaware-ai/
├── agentx/
│   ├── habitaware-collective-reporting.feature.agentx-v1.md
│   └── habitaware-collective-reporting.impl.agentx-v1.md
├── src/
│   ├── components/
│   │   ├── AtAGlanceDashboard.tsx
│   │   ├── EngagementDashboard.tsx
│   │   ├── ContentSummary.tsx
│   │   └── CopilotChat.tsx
│   └── ...
├── server/  (or bree-api routes)
│   ├── snapshots.ts
│   ├── reports.ts
│   ├── content.ts
│   └── copilot.ts
```

---

## Related

- `habitaware-collective-reporting.feature.agentx-v1.md` — Feature spec (same folder)
- `habitaware-ai.agentx.md` — App context (agentx/apps/habitaware/)
- Mighty Networks API docs (external)
