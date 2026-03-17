---
agentx:
  version: 1
  created_at: "2025-03-07T00:00:00.000Z"
  type: meta
  filename: meta-algos.agentx.md
  purpose: schema
  description: |
    Canonical schema for algos.agentx documents. All domain algos MUST conform.
    Use with playbookx generate to produce domain instances from domain info.
  character: deterministic
---

# Meta-Algos — Algos Schema

> **Purpose:** Defines the canonical schema for `{domain}.algos.agentx-vN.md` documents. Domain algos MUST conform to this schema. Playbookx uses this meta + domain info to generate domain instances. **Algos maintain strict schema consistency** across all specialties.
>
> **Character:** Algos.agentx is **deterministic** — it defines executable validation rules, RuleCatalog YAML, flow order, and algorithm steps. Given the same input, the rules engine produces the same output. The companion playbook.agentx is descriptive; algos.agentx is machine-executable.

---

## 1. Schema Overview

The meta-algos acts as both documentation and a **schema** that domain algos must satisfy. When generating a new algos document from domain info, the output MUST include all required sections and follow the conventions below. This ensures the rules engine can parse and execute any domain's algos.

---

## 2. Required Frontmatter

Every algos document MUST have YAML frontmatter with these fields:

```yaml
---
agentx:
  version: 1                    # Required. Integer, bumped on changes.
  created_at: "ISO8601"         # Required. e.g. "2025-03-07T00:00:00.000Z"
  type: algos                    # Required. Literal "algos" or "algo"
  filename: "{domain}.algos.agentx-v{N}.md"  # Required. Matches file name.
  domain?: string                # Optional. Human-readable domain name.
---
```

**Validation:**
- `version` must be a positive integer
- `created_at` must be valid ISO 8601
- `type` must equal `"algos"` or `"algo"`
- `filename` must match pattern `{domain}.algos.agentx-v{N}.md` or `{domain}.algo.agentx-v{N}.md`

---

## 3. Required Sections (in order)

| Section | Level | Required | Description |
|---------|-------|----------|-------------|
| Title | `#` | Yes | `# {Domain} Algos v{N}` |
| Overview | `##` | Yes | 1–3 sentence summary of validation rules and algorithms |
| Validation Rules | `##` | Yes | Rule definitions with RULE.ID pattern |
| RuleCatalog (YAML) | `##` | Yes | Canonical YAML block for rules engine |
| Validation Flow | `##` | Yes | Flow diagram defining execution order |
| Algorithm Blocks | `##` | Yes | Per-rule algorithm with Input/Output/Steps |
| Reference Tables | `##` | Optional | ICD, CPT, mappings, etc. |

---

## 4. Rule ID Pattern (REQUIRED)

Rule IDs MUST follow:

```
{PREFIX}.{CATEGORY}.{NUMBER}
```

| Part | Pattern | Examples |
|------|---------|----------|
| PREFIX | 2–4 uppercase letters | EM, WND, BH, STAGE |
| CATEGORY | 2–4 uppercase letters | ID, MDM, MEAS, RECON |
| NUMBER | 3-digit zero-padded | 001, 010, 020 |

**Examples:** `EM.ID.001`, `STAGE.RECON.010`, `WND.MEAS.010`, `BH.DSM.010`

---

## 5. RuleCatalog YAML Block (REQUIRED)

Every algos document MUST contain exactly one RuleCatalog YAML block. The rules engine parses this to build the execution flow.

```yaml
# {domain} RuleCatalog
specialty: "{domain}"           # e.g. "wound-ai", "bree-ai"
version: 1
created_at: "ISO8601"
flow:
  - id: "RULE.ID.001"
    name: "Rule Name"
    order: 1
  - id: "RULE.ID.002"
    order: 2
rules:
  RULE.ID.001:
    id: "RULE.ID.001"
    name: "Rule Name"
    type: "native" | "interpreted"
    handler: "handlerFunctionName"   # Optional, for native rules
    inputs: ["encounter", "documentation"]
    output: "PASS_FAIL" | "array" | "object"
    description: "Human-readable description"
    remediation: "Suggested fix on FAIL"
    shortCircuit: false              # If true, stop on FAIL
    requiredFields: ["field1"]      # Optional
  RULE.ID.002:
    # ...
tables:                            # Optional
  tableName:
    - { col1: val1, col2: val2 }
```

**Validation:**
- `flow` must be an array of `{ id, name?, order }`
- Every `flow[].id` must exist in `rules`
- `rules` keys must match `flow` IDs
- `type` must be `"native"` or `"interpreted"`

---

## 6. Validation Flow Diagram

A flow diagram MUST define execution order. Use ASCII art with rule IDs in parentheses:

```
│ 1. Encounter Integrity │
│    (EM.ID.001)         │
        │ PASS
        ▼
│ 2. Patient Status Gate │
│    (EM.PAT.010)        │
        │ PASS
        ▼
│ 3. ...                 │
```

**Parser extracts:** Rule IDs in sequence → `flow` array order.

---

## 7. Algorithm Block Pattern

Each rule SHOULD have an algorithm block:

```markdown
## N. Algorithm: {Name} ({RULE.ID})

**Input:** input1, input2

**Output:** PASS | FAIL

**Steps:**

1. Step one
2. Step two
3. RETURN PASS | FAIL
```

Or pseudocode:

```
ALGORITHM: {Name}
INPUT: ...
OUTPUT: ...
PSEUDOCODE:
─────────────────────────────────────────
1. ...
2. ...
```

---

## 8. File Naming Convention

```
{domain}.algos.agentx-v{N}.md
```
or
```
{domain}.algo.agentx-v{N}.md
```

- `{domain}`: lowercase, hyphenated (e.g., `bree-ai`, `wound-ai`)
- `{N}`: version number (1, 2, 3, …)

---

## 9. Generation Input (for playbookx)

When generating a domain algos document, provide:

| Input | Type | Description |
|-------|------|-------------|
| `domain` | string | Domain slug (e.g., `fatapps`, `wound-ai`) |
| `domain_name` | string | Human-readable name |
| `rules` | array | List of { id, name, type, inputs, output, description?, remediation?, shortCircuit? } |
| `flow` | array | Ordered list of rule IDs (execution order) |
| `tables` | object? | Optional reference tables |
| `algorithms` | array? | Optional per-rule step descriptions |

Playbookx merges this with the meta-algos schema to produce a conforming `{domain}.algos.agentx-v1.md` with valid RuleCatalog YAML and flow diagram.
