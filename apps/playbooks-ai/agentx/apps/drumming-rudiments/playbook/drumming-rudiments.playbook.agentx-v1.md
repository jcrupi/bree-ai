---
agentx:
  version: 1
  created_at: "2025-03-13T00:00:00.000Z"
  type: playbook
  filename: drumming-rudiments.playbook.agentx-v1.md
  domain: drumming-rudiments
---

# Drumming Rudiments Playbook v1

> Structure and validate drum rudiment practice, learning progression, and curriculum. At runtime, content (practice logs, lesson plans, rudiment checklists) is analyzed to ensure conformance to the 40 PAS International Rudiments and recommended learning order.

## Overview

Drumming Rudiments is a domain for learning and practicing the 40 Percussive Arts Society (PAS) International Drum Rudiments. The playbook defines rudiment categories, learning tiers, practice guidelines, and validation rules. At runtime, pasted content (practice logs, lesson plans, rudiment inventories) is analyzed for conformance.

## Domain

**40 PAS International Drum Rudiments** — Codified 1984. Four categories: Roll, Diddle (Paradiddle), Flam, Drag. Practice from open (slow) to close (fast) to open, or at even moderate march tempo.

## Entities

- **Rudiment** — A single PAS rudiment. Has: id, name, category, tier (1–4), sticking_pattern. Relates to: Category, PracticeSession.
- **Category** — Roll, Diddle, Flam, Drag. Has: id, name, rudiment_count. Relates to: Rudiment.
- **Tier** — Learning progression (1–4). Tier 1 = foundational; Tier 4 = advanced. Has: id, name, rudiments[]. Relates to: Rudiment.
- **PracticeSession** — A practice block. Has: rudiment_ids[], tempo_bpm, duration_min, notes. Relates to: Rudiment.
- **StickingPattern** — R/L notation (e.g., R L R L, RR LL). Has: pattern, accent_positions. Relates to: Rudiment.

## Categories (40 PAS Rudiments)

### I. Roll Rudiments (15)
- Single Stroke Roll, Single Stroke Four, Single Stroke Seven
- Multiple Bounce Roll, Triple Stroke Roll
- Double Stroke Open Roll, Five Stroke Roll, Six Stroke Roll, Seven Stroke Roll, Nine Stroke Roll, Ten Stroke Roll, Eleven Stroke Roll, Thirteen Stroke Roll, Fifteen Stroke Roll, Seventeen Stroke Roll

### II. Diddle Rudiments (4)
- Single Paradiddle, Double Paradiddle, Triple Paradiddle, Paradiddle-diddle

### III. Flam Rudiments (11)
- Flam, Flam Accent, Flam Tap, Flamacue, Flam Paradiddle, Single Flammed Mill, Flam Paradiddlediddle, Pataflafla, Swiss Army Triplet, Inverted Flam Tap, Flam Drag

### IV. Drag Rudiments (10)
- Drag, Single Drag Tap, Double Drag Tap, Lesson 25, Single Dragadiddle, Drag Paradiddle #1, Drag Paradiddle #2, Single Ratamacue, Double Ratamacue, Triple Ratamacue

## Learning Tiers (Recommended Order)

### Tier 1 — Foundation
Single Stroke Roll, Multiple Bounce Roll, Double Stroke Roll, Single Paradiddle, Flam, Drag

### Tier 2 — Core Development
Single Stroke Four, Single Stroke Seven, Double Paradiddle, Triple Paradiddle, Paradiddle-diddle, Five/Seven/Nine Stroke Rolls, Flam Tap, Flam Accent, Single Drag Tap

### Tier 3 — Intermediate
Remaining roll rudiments, Flamacue, Flam Paradiddle, Single Flammed Mill, Double Drag Tap, Lesson 25

### Tier 4 — Advanced
Flam Paradiddlediddle, Pataflafla, Swiss Army Triplet, Inverted Flam Tap, Flam Drag, Single Dragadiddle, Drag Paradiddles, Ratamacues

## Rules

### DR.RUD.001 — Rudiment name must be valid PAS
- **Check:** Rudiment name matches one of the 40 PAS International Rudiments
- **Fail:** Unknown or misspelled rudiment name

### DR.RUD.002 — Category assignment
- **Check:** Rudiment is assigned to correct category (Roll, Diddle, Flam, Drag)
- **Fail:** Incorrect category for rudiment

### DR.TIER.010 — Tier progression
- **Check:** Tier 1 rudiments mastered before Tier 2; Tier 2 before Tier 3; etc.
- **Fail:** Practice log shows Tier N+1 before Tier N complete

### DR.PRAC.020 — Practice tempo range
- **Check:** Session has tempo_bpm in valid range (40–200) or "open/close/open"
- **Fail:** Invalid or missing tempo

### DR.PRAC.021 — Session duration
- **Check:** Practice session duration_min between 5 and 120
- **Fail:** Duration outside reasonable range

### DR.STICK.030 — Sticking pattern format
- **Check:** Sticking uses R/L (right/left) or similar standard notation
- **Fail:** Unparseable sticking pattern

## API Surface

- `POST /api/drumming-rudiments/validate` — Validate practice log or curriculum
- `GET /api/drumming-rudiments/catalog` — List 40 rudiments by category
- `POST /api/playback` — Run content through playbook (Playback Runner)

## AgentX Notes

- `drumming-rudiments.algos.agentx-v1.md` — Validation rules, RuleCatalog, flow
