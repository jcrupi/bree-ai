---
agentx:
  version: 1
  created_at: "2025-03-13T00:00:00.000Z"
  type: algos
  filename: drumming-rudiments.algos.agentx-v1.md
  domain: drumming-rudiments
---

# Drumming Rudiments Algos v1

> Validation rules for drum rudiment practice, curriculum, and learning progression. At runtime, content is analyzed against these rules to ensure conformance to the 40 PAS International Rudiments.

## Overview

These algos define the validation flow for drumming rudiment content. Rudiment names, categories, tier progression, and practice session parameters must conform. The Playback Runner loads this playbook and algos to analyze pasted content at runtime.

## Validation Rules

### DR.RUD.001 — Rudiment name must be valid PAS
- **Check:** Rudiment name matches one of the 40 PAS International Rudiments (case-insensitive, normalized)
- **Fail:** Unknown or misspelled rudiment name
- **Remediation:** Use official PAS rudiment name; see catalog

### DR.RUD.002 — Category assignment
- **Check:** Rudiment is assigned to correct category (Roll, Diddle, Flam, Drag)
- **Fail:** Incorrect category for rudiment
- **Remediation:** Assign rudiment to its PAS category

### DR.TIER.010 — Tier progression
- **Check:** Tier 1 rudiments mastered (or in progress) before advancing to Tier 2; same for Tier 2→3, 3→4
- **Fail:** Practice log or curriculum shows Tier N+1 before Tier N complete
- **Remediation:** Complete lower-tier rudiments before advancing

### DR.PRAC.020 — Practice tempo range
- **Check:** Session has tempo_bpm in valid range (40–200) or mode "open/close/open"
- **Fail:** Invalid or missing tempo
- **Remediation:** Specify tempo in BPM or open/close/open

### DR.PRAC.021 — Session duration
- **Check:** Practice session duration_min between 5 and 120
- **Fail:** Duration outside reasonable range
- **Remediation:** Set duration between 5 and 120 minutes

### DR.STICK.030 — Sticking pattern format
- **Check:** Sticking uses R/L (right/left) or R L R L style notation
- **Fail:** Unparseable sticking pattern
- **Remediation:** Use R/L notation (e.g., R L R L for single stroke roll)

## RuleCatalog

| Rule ID      | Category | Severity | Description                    |
| ------------ | -------- | -------- | ------------------------------ |
| DR.RUD.001   | Rudiment | error    | Valid PAS rudiment name        |
| DR.RUD.002   | Rudiment | error    | Correct category assignment    |
| DR.TIER.010  | Tier     | warning  | Tier progression order         |
| DR.PRAC.020  | Practice | error    | Valid tempo or mode            |
| DR.PRAC.021  | Practice | warning  | Reasonable session duration    |
| DR.STICK.030 | Sticking | warning  | Parseable sticking pattern     |

## Rudiment Catalog (40 PAS)

### Roll (15)
Single Stroke Roll, Single Stroke Four, Single Stroke Seven, Multiple Bounce Roll, Triple Stroke Roll, Double Stroke Open Roll, Five Stroke Roll, Six Stroke Roll, Seven Stroke Roll, Nine Stroke Roll, Ten Stroke Roll, Eleven Stroke Roll, Thirteen Stroke Roll, Fifteen Stroke Roll, Seventeen Stroke Roll

### Diddle (4)
Single Paradiddle, Double Paradiddle, Triple Paradiddle, Paradiddle-diddle

### Flam (11)
Flam, Flam Accent, Flam Tap, Flamacue, Flam Paradiddle, Single Flammed Mill, Flam Paradiddlediddle, Pataflafla, Swiss Army Triplet, Inverted Flam Tap, Flam Drag

### Drag (10)
Drag, Single Drag Tap, Double Drag Tap, Lesson 25, Single Dragadiddle, Drag Paradiddle #1, Drag Paradiddle #2, Single Ratamacue, Double Ratamacue, Triple Ratamacue

## Flow

1. **Parse** — Extract rudiments, categories, tiers, practice sessions from content
2. **Validate names** — DR.RUD.001 against catalog
3. **Validate categories** — DR.RUD.002
4. **Validate tier order** — DR.TIER.010 (if tier/progression present)
5. **Validate practice** — DR.PRAC.020, DR.PRAC.021
6. **Validate sticking** — DR.STICK.030 (if sticking present)
7. **Report** — Return pass/fail and remediation for each rule

## AgentX Notes

- `drumming-rudiments.playbook.agentx-v1.md` — Domain entities, rules, API surface
