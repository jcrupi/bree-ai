---
agentx:
  version: 1
  created_at: "2026-03-12T00:00:00Z"
  type: feature
  filename: habitaware-collective-reporting.feature.agentx-v1.md
  domain: habitaware-collective
  app: habitaware-ai
  owner: Ellen @HabitAware
  source: ai_feedback (converted from Ellen's spec)
  tags:
    - habitaware
    - collective
    - mighty-networks
    - reporting
    - mni
    - engagement
    - content-analysis
    - copilot
ai_context: true
---

# HabitAware Collective — AI Reporting System Feature Note

**Domain:** HabitAware Collective (Mighty Networks community)
**Owner:** Ellen @HabitAware
**Scope:** Layers 1, 2, and 3 — Weekly At a Glance, Member Engagement, Content & Copilot

---

## Overview

Build an AI system that pulls member data from the Mighty Networks API (Network Admin + MNI), stores weekly snapshots, and generates a weekly At a Glance report. The system serves as the **historical database** since MNI does not retain historical member lists. The AI never asks MNI "who canceled this week" — it derives all movement metrics by comparing snapshots.

---

## Layer 1: Weekly At a Glance

### How It Works

1. **API Pull** — Pull full member list from Mighty Networks API weekly (same day each week). Data lives in Network Admin and MNI; pull from whichever source gives the cleanest version of each field.
2. **Weekly Snapshot** — Store full member list with timestamp. One row per person. This is the historical record.
3. **Compare Snapshots** — Diff this week vs last week to calculate all movement metrics.
4. **Weekly Report** — Generate At a Glance dashboard from calculated metrics.

### Member Record (Snapshot Schema)

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | Display name |
| `email` | string | Member email |
| `current_tier` | enum | All Access / Limited / Free Trial |
| `billing_type` | enum | Monthly / Annual / n/a (All Access only) |
| `join_date` | date | First joined |
| `current_plan_start_date` | date | When current plan began (priority) |
| `trial_start_date` | date | If applicable |
| `trial_end_date` | date | If applicable |
| `cancel_date` | date | Clicked cancel; still has access until expiration |
| `expiration_date` | date | When paid access actually ends |

**Important:** `cancel_date` vs `expiration_date` are separate events. `current_plan_start_date` captures when their current plan started, not first join. Free trialers and Limited members do not overlap.

### Data Source Map

| Field | Source | Notes |
|-------|--------|-------|
| name | Network Admin > Members | |
| email | Network Admin > Members | |
| current_tier | Network Admin + MNI > Plans | All Access & Limited in Network Admin; Free Trialers in MNI |
| billing_type | MNI > Plans | Monthly vs Annual |
| join_date | Network Admin + MNI | Pull from cleaner endpoint |
| current_plan_start_date | Network Admin | Priority field |
| trial_start_date | MNI > Plans | |
| trial_end_date | MNI > Plans | |
| cancel_date | TBD — verify in API | MNI shows; location not yet mapped |
| expiration_date | TBD — verify in API | MNI shows both; verify in API |

**Developer action:** Verify `cancel_date` and `expiration_date` in API. Flag fields that exist in both sources for Ellen to choose primary.

### Calculated Metrics (from snapshot diff)

| Metric | Calculation |
|--------|-------------|
| Trial Converted | Was Free Trial last week, is All Access this week |
| Trial Left | Was Free Trial last week, gone this week |
| New Cancellations | `cancel_date` appeared that wasn't there last week |
| Actually Expired | Was in canceled-but-active gap, now gone |
| Net Member Change | New in minus expired out |
| Trial Conversion Rate | Converted / total trials ended × 100 |
| Churn Rate | Expired / total paying members × 100 |
| MRR | (monthly count × price) + (annual count × price / 12) |

**Definitions:** Net Change uses expired (not canceled). Churn uses expired (not canceled). MRR = predictable monthly income.

### Weekly At a Glance Report (Sample)

| Metric | Sample | Color |
|--------|--------|-------|
| All Access Members | 712 | Neutral |
| Limited Members | 148 | Neutral |
| Active Free Trialers | 23 | Neutral |
| Monthly / Annual Split | 524 / 188 | Neutral |
| New Subscribers | +18 | GREEN |
| Trials Converted (rate) | 8 (53%) | GREEN |
| Canceled This Week | 5 | ORANGE |
| Expired This Week | 6 | RED |
| Net Change | +12 | GREEN if +, RED if − |
| Churn Rate | 1.5% | ORANGE |
| MRR | $19,840 | Neutral |
| Total Revenue This Week | $5,240 | Neutral |

**Color coding:** GREEN = growth; ORANGE = warning; RED = loss.

---

## Layer 2: Member Engagement

### Overview

Track who's showing up, what they're doing, and who's going dark. Every paying member falls into one of three engagement buckets each week, with different lenses for new (0–90 days) vs established (90+ days).

### Three Buckets

| Bucket | Definition |
|--------|------------|
| **ACTIVE** | Posted, commented, or contributed at least once this week |
| **LURKER** | Logged in and/or clicked posts, reacted; didn't contribute or comment |
| **GHOST** | No login, no clicks, no activity |

### Ghost Levels (Established Members, 90+ Days Only)

| Level | Definition |
|-------|------------|
| DRIFTING | No login for 2 weeks — recoverable |
| COLD | No login for 4 weeks — harder to bring back |
| GHOST | No login for 6+ weeks — cancellation imminent |

### New Member Phases (0–90 Days)

| Phase | Focus |
|-------|-------|
| 0–30 days | Did they log in? Do anything at all? |
| 30–60 days | Starting to engage or fading? |
| 60–90 days | Forming habit or drifting toward exit? |

### Engagement Fields (Added to Member Record)

| Field | Purpose |
|-------|---------|
| `logins` | Count this week — Lurker vs Ghost |
| `post_clicks` | Lurker signal |
| `contributions` | Active signal |
| `comments` | Active signal |
| `post_reactions` | Lurker signal |
| `engagement_bucket` | Active / Lurker / Ghost |
| `ghost_level` | Drifting / Cold / Ghost (90+ only) |
| `is_free_trialer` | Filter flag |

### Bucket Movement (Calculated Weekly)

- Active → Lurker — Watch list
- Lurker → Ghost — Red flag
- Lurker → Active — Win
- Ghost → Lurker — Recovery
- New Member (0–30) → Ghost — Onboarding problem

### Drill Down

Every number in every report → click to see member list (Name, Email, Tier, Billing Type, Last Login, Member Since). Exportable as CSV.

---

## Layer 3: Content, Trends & Copilot

### Content Data Captured

| Field | Type | Notes |
|-------|------|-------|
| post_text | string | Full text |
| post_date | datetime | |
| host | string | Ellen, Barbara, Mari, Aneela |
| content_type | AI-tagged | challenge prompt, educational, personal share, discussion question, etc. |
| monthly_theme | AI-tagged | e.g. "Shame," "March Madness" |
| weekly_action | AI-tagged | |
| post_clicks | number | |
| comments | number | |
| post_reactions | number | |
| who_engaged | array | Members + bucket they came from |

### Performance Metrics (Calculated)

- vs_average_clicks, vs_average_comments, vs_average_reactions
- lurker_activation, ghost_activation
- conversation_depth (comment-to-click ratio)

### Reports

1. **Weekly Content Summary** — What hosts posted, performance, Stars (who to celebrate), Watch List (who needs attention)
2. **Monthly Trend Report** — Theme performance, content types, engagement shifts, host patterns
3. **On-Demand Copilot** — Chat with data; conversational memory; cross-references; challenges assumptions

### Copilot Guardrails

**NEVER:** Contact members directly; make clinical/therapeutic recommendations; share individual data outside platform.

**ALWAYS:** Ground recommendations in data; acknowledge when data is insufficient; defer to Ellen on tone and culture.

**PERMITTED:** Challenge strategy; flag revenue decline; question content strategy; push back like a strategic thought partner.

---

## Future Layers (Out of Scope)

- Layer 4: Reactivations — Members who left and came back
- Layer 5: Predictive Insights — Churn modeling, LTV, optimal intervention timing

---

## Related AgentX Notes

- [`habitaware-collective-reporting.impl.agentx-v1.md`](./habitaware-collective-reporting.impl.agentx-v1.md) — Implementation plan (phased delivery)
- `habitaware-ai.agentx.md` — App context (agentx/apps/habitaware/)
- `theobserver.agentx.md` — Observer / feedback capture

---

## Source Traceability

- Ellen @HabitAware feedback (Mar 10, 2026)
- #ai_feedback #from:ellen-@habitaware
- #feature
- Converted from developer spec document
