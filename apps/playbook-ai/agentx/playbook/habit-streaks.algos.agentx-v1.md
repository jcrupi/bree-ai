---
agentx:
  version: 1
  created_at: "2025-03-12T00:00:00.000Z"
  type: algos
  filename: habit-streaks.algos.agentx-v1.md
  domain: habit-streaks
---

# Habit Streaks Algos v1

> Validation rules for habit records and streaks. At runtime, content is analyzed against these rules to ensure conformance.

## Overview

These algos define the validation flow for habit-streaks content. Records must have required fields, streaks must be continuous, and duplicates are disallowed. The Playback Runner (or grape) loads this playbook and algos to analyze pasted content at runtime.

## Validation Rules

### HS.REC.001 — Record must have habit_id
- **Check:** Every record references a valid habit
- **Fail:** Record without habit_id or unknown habit
- **Remediation:** Add habit_id or reference an existing habit

### HS.REC.002 — completed_at required and valid
- **Check:** Record has completed_at in ISO8601 format
- **Fail:** Missing or malformed completed_at
- **Remediation:** Add completed_at as ISO8601 (e.g. 2025-03-12T09:30:00Z)

### HS.STR.010 — Streak continuity
- **Check:** Streak records have no gaps; each day in range has a completion
- **Fail:** Gap in streak (missing day)
- **Remediation:** Ensure all days in streak range have a completion record

### HS.STR.011 — No duplicate records per habit per day
- **Check:** At most one completion record per habit per calendar day
- **Fail:** Multiple records for same habit on same day
- **Remediation:** Remove duplicate or merge into single record

### HS.TIM.020 — Time window (if defined)
- **Check:** If habit has time_window, completed_at falls within it
- **Fail:** Completion outside allowed window
- **Remediation:** Adjust completed_at or extend time_window

## RuleCatalog

```yaml
# habit-streaks RuleCatalog
specialty: "habit-streaks"
version: 1
created_at: "2025-03-12T00:00:00.000Z"
flow:
  - id: "HS.REC.001"
    name: "Record must have habit_id"
    order: 1
  - id: "HS.REC.002"
    name: "completed_at required and valid"
    order: 2
  - id: "HS.STR.011"
    name: "No duplicate records per habit per day"
    order: 3
  - id: "HS.STR.010"
    name: "Streak continuity"
    order: 4
  - id: "HS.TIM.020"
    name: "Time window"
    order: 5
rules:
  HS.REC.001:
    id: "HS.REC.001"
    name: "Record must have habit_id"
    type: "interpreted"
    inputs: ["records", "habits"]
    output: "PASS_FAIL"
    description: "Every record references a valid habit"
    remediation: "Add habit_id or reference an existing habit"
    shortCircuit: false
  HS.REC.002:
    id: "HS.REC.002"
    name: "completed_at required and valid"
    type: "interpreted"
    inputs: ["records"]
    output: "PASS_FAIL"
    description: "Record has completed_at in ISO8601 format"
    remediation: "Add completed_at as ISO8601"
    shortCircuit: false
  HS.STR.010:
    id: "HS.STR.010"
    name: "Streak continuity"
    type: "interpreted"
    inputs: ["records", "streaks"]
    output: "PASS_FAIL"
    description: "No gaps in streak; each day has completion"
    remediation: "Ensure all days in streak range have a completion"
    shortCircuit: false
  HS.STR.011:
    id: "HS.STR.011"
    name: "No duplicate records per habit per day"
    type: "interpreted"
    inputs: ["records"]
    output: "PASS_FAIL"
    description: "At most one completion per habit per calendar day"
    remediation: "Remove duplicate or merge"
    shortCircuit: false
  HS.TIM.020:
    id: "HS.TIM.020"
    name: "Time window"
    type: "interpreted"
    inputs: ["records", "habits"]
    output: "PASS_FAIL"
    description: "completed_at within habit time_window if defined"
    remediation: "Adjust completed_at or extend time_window"
    shortCircuit: false
```

## Validation Flow

```
│ 1. Record must have habit_id │
│    (HS.REC.001)             │
        │ PASS
        ▼
│ 2. completed_at required    │
│    (HS.REC.002)            │
        │ PASS
        ▼
│ 3. No duplicate per day    │
│    (HS.STR.011)            │
        │ PASS
        ▼
│ 4. Streak continuity      │
│    (HS.STR.010)            │
        │ PASS
        ▼
│ 5. Time window             │
│    (HS.TIM.020)            │
        │ PASS
        ▼
     CONFORMANT
```

## Algorithm Blocks

### 1. Algorithm: Record Habit ID (HS.REC.001)

**Input:** records, habits

**Output:** PASS | FAIL

**Steps:**

1. For each record, extract habit_id
2. If habit_id missing or empty → RETURN FAIL
3. If habit_id not in habits list → RETURN FAIL
4. RETURN PASS

### 2. Algorithm: Completed At Valid (HS.REC.002)

**Input:** records

**Output:** PASS | FAIL

**Steps:**

1. For each record, extract completed_at
2. If completed_at missing → RETURN FAIL
3. Parse as ISO8601; if invalid → RETURN FAIL
4. RETURN PASS

### 3. Algorithm: No Duplicates Per Day (HS.STR.011)

**Input:** records

**Output:** PASS | FAIL

**Steps:**

1. Group records by (habit_id, calendar_date(completed_at))
2. If any group has count > 1 → RETURN FAIL
3. RETURN PASS

### 4. Algorithm: Streak Continuity (HS.STR.010)

**Input:** records, streaks

**Output:** PASS | FAIL

**Steps:**

1. For each streak, get date range [start, end]
2. For each day in range, check if exists record for that habit
3. If any day missing → RETURN FAIL
4. RETURN PASS

### 5. Algorithm: Time Window (HS.TIM.020)

**Input:** records, habits

**Output:** PASS | FAIL

**Steps:**

1. For each habit with time_window, get (start, end) in local time
2. For each record of that habit, parse completed_at
3. If completed_at outside window → RETURN FAIL
4. RETURN PASS
