---
agentx:
  version: 1
  created_at: "2025-03-12T00:00:00.000Z"
  type: playbook
  filename: habit-streaks.playbook.agentx-v1.md
  domain: habit-streaks
---

# Habit Streaks Playbook v1

> Validate habit logs and streak records against consistency rules. At runtime, content is analyzed to ensure it conforms to the playbook and algos.

## Overview

Habit Streaks is a domain for tracking habits and their completion streaks. The playbook defines how habit records, streak updates, and logs must be structured and validated. At runtime, pasted content (habit logs, streak reports, completion entries) is analyzed to ensure conformance.

## Domain

**Habit tracking with streaks** — Users record habit completions. Streaks are consecutive days of completion. The system validates that records are consistent, time-bounded, and free of duplicates or gaps that would invalidate a streak.

## Entities

- **Habit** — A recurring behavior (e.g., "Morning run", "Meditate 10 min"). Has: id, name, schedule (daily/weekly), time_window. Relates to: Record, Streak.
- **Record** — A single completion event. Has: habit_id, completed_at (ISO8601), notes. Relates to: Habit.
- **Streak** — Consecutive completions. Has: habit_id, start_date, end_date, count. Relates to: Habit, Record.
- **Trigger** — Cue that prompts the habit (optional). Has: habit_id, trigger_type, value. Relates to: Habit.
- **Reward** — Incentive on completion (optional). Has: habit_id, reward_type. Relates to: Habit.

## Rules

### HS.REC.001 — Record must have habit_id
- **Check:** Every record references a valid habit
- **Fail:** Record without habit_id or unknown habit

### HS.REC.002 — completed_at required and valid
- **Check:** Record has completed_at in ISO8601 format
- **Fail:** Missing or malformed completed_at

### HS.STR.010 — Streak continuity
- **Check:** Streak records have no gaps; each day in range has a completion
- **Fail:** Gap in streak (missing day)

### HS.STR.011 — No duplicate records per habit per day
- **Check:** At most one completion record per habit per calendar day
- **Fail:** Multiple records for same habit on same day

### HS.TIM.020 — Time window (if defined)
- **Check:** If habit has time_window, completed_at falls within it
- **Fail:** Completion outside allowed window

## API Surface

- `POST /api/habits/records` — Submit completion record
- `GET /api/habits/:id/streak` — Get current streak
- `POST /api/playback` — Run content through playbook (Playback Runner)

## AgentX Notes

- `habit-streaks.algos.agentx-v1.md` — Validation rules, RuleCatalog, flow
