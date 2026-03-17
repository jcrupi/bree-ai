---
agentx:
  version: 1
  created_at: "2025-03-06T00:00:00Z"
  type: design
  filename: algos-rules-engine.agentx.md
---

# Algos Rules Engine — Reusable Rules & Pattern Engine

> **Purpose:** High-level design for a reusable rules engine that reads `*.algos.agentx` (and `*.algo.agentx`) files from any specialty and processes encounters through a generic execution pipeline. Describes patterns, parsing conventions, and implementation approach.

**Related:**
- `specialty-backend-generation.agentx.md` — Backend generation options
- `pattern-driven-playbook-impl.agentx.md` — Playbook → code pattern
- `apps/*/agentx/playbook/*.algos.agentx-v*.md` — Source algos per specialty

---

## 1. Overview

The **Algos Rules Engine** is a specialty-agnostic component that:

1. **Loads** algos.agentx content for a given specialty (via playbook-loader or equivalent)
2. **Parses** rules into a canonical intermediate representation (IR)
3. **Executes** rules in sequence against an encounter context
4. **Returns** validation results (PASS/FAIL, findings, remediations)

Any specialty (E/M, wound, behavioral, pain, derm, etc.) can be processed by the same engine; only the algos content and optional specialty adapters differ.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ALGOS RULES ENGINE — HIGH-LEVEL FLOW                                             │
└─────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
  │  Specialty Config   │     │  Algos Loader       │     │  Encounter Input    │
  │  (em, wound, bh…)   │────▶│  loadAlgos(app,     │     │  (documentation,    │
  │                     │     │  baseName)          │     │  codes, metadata)   │
  └─────────────────────┘     └──────────┬──────────┘     └──────────┬──────────┘
                                         │                            │
                                         ▼                            │
  ┌─────────────────────────────────────────────────────────────────┐│
  │  ALGOS PARSER                                                     ││
  │  • Parse frontmatter (version, type)                               ││
  │  • Extract validation flow (diagram → rule sequence)               ││
  │  • Extract algorithms (rule ID, Input, Output, Steps)                ││
  │  • Extract reference tables (ICD, CPT, mappings)                    ││
  │  • Output: RuleCatalog (IR)                                         ││
  └─────────────────────────────────────────────────────────────────┘│
                                         │                            │
                                         ▼                            ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │  RULES EXECUTOR                                                    │
  │  • Context = { encounter, ruleCatalog, specialty }                 │
  │  • For each rule in flow order:                                    │
  │    - Resolve inputs from context                                   │
  │    - Execute rule (native impl or interpreted)                     │
  │    - If FAIL → append finding, optionally short-circuit            │
  │    - If PASS → continue                                            │
  │  • Output: ValidationResult { passed, findings[], remediations[] }  │
  └─────────────────────────────────────────────────────────────────┘
```

---

## 3. Algos.agentx Conventions (Input Contract)

The engine expects algos files to follow these conventions so they can be parsed and executed generically.

### 3.1 Frontmatter

```yaml
---
agentx:
  version: 1
  created_at: "2025-03-06T00:00:00Z"
  type: algo
  filename: {specialty}.algos.agentx-v1.md
---
```

### 3.2 Rule ID Pattern

Rule IDs follow `{PREFIX}.{CATEGORY}.{NUMBER}`:

| Specialty | Prefix | Examples |
|-----------|--------|----------|
| E/M | EM | EM.ID.001, EM.MDM.020, EM.TIM.030 |
| Wound | STAGE, WND | STAGE.PARSE.001, STAGE.RECON.010 |
| Behavioral | BH | BH.DSM.010, BH.MOD.040 |

The parser extracts these from section headers, flow diagrams, and algorithm blocks.

### 3.3 Algorithm Block Pattern

```
## N. Algorithm: {Name} ({RULE.ID})

**Input:** input1, input2

**Output:** PASS | FAIL

**Steps:**

1. Step one
2. Step two
3. RETURN PASS | FAIL
```

Or pseudocode blocks:

```
ALGORITHM: {Name}
INPUT: ...
OUTPUT: ...
PSEUDOCODE:
─────────────────────────────────────────
1. ...
2. ...
```

### 3.4 Validation Flow Diagram

Flow order is derived from ASCII diagrams:

```
│ 1. Encounter Integrity │
│    (EM.ID.001)         │
        │ PASS
        ▼
│ 2. Patient Status Gate │
│    (EM.PAT.010)        │
```

The parser extracts rule IDs in sequence to build the execution order.

### 3.5 Reference Tables

Markdown tables with headers like "ICD-10-CM", "CPT", "DSM-5-TR to ICD-10-CM Mapping" become lookup data for rules.

---

## 4. Intermediate Representation (IR)

The parser produces a **RuleCatalog** that the executor consumes.

```typescript
// Conceptual schema — implement in target language

interface RuleCatalog {
  specialty: string;
  version: number;
  created_at: string;
  flow: RuleRef[];           // Ordered rule IDs from flow diagram
  rules: Record<string, Rule>;
  tables: Record<string, Table>;
}

interface RuleRef {
  id: string;                // e.g. "EM.ID.001"
  name?: string;
  order: number;
}

interface Rule {
  id: string;
  name: string;
  inputs: string[];          // e.g. ["encounter", "documentation"]
  output: "PASS" | "FAIL";
  steps: string[];          // Human-readable; may need interpretation
  remediation?: string;     // Suggested fix on FAIL
}

interface Table {
  name: string;
  rows: Record<string, unknown>[];  // Or key-value pairs
  columns?: string[];
}
```

---

## 5. Execution Patterns

### 5.1 Generic Execution Loop

```
FUNCTION execute(specialty, encounter, ruleCatalog):
  context = { encounter, tables: ruleCatalog.tables, findings: [] }
  FOR each ruleRef IN ruleCatalog.flow:
    rule = ruleCatalog.rules[ruleRef.id]
    IF rule is null: CONTINUE  // Rule not yet implemented
    inputs = resolveInputs(rule.inputs, context)
    result = runRule(rule, inputs, context)
    IF result === FAIL:
      context.findings.push({ ruleId: rule.id, severity, remediation })
      IF rule.shortCircuit: BREAK
  RETURN { passed: length(context.findings) === 0, findings: context.findings }
```

### 5.2 Rule Implementation Strategies

| Strategy | Description | Use Case |
|----------|-------------|----------|
| **Native** | Rule logic implemented in code; algos is documentation | EM.ID.001, STAGE.RECON.010 |
| **Interpreted** | Parser converts steps to executable form (e.g., expression tree) | Simple lookup/range checks |
| **Hybrid** | Native for complex rules; interpreted for simple ones | Most specialties |

### 5.3 Common Rule Types (Cross-Specialty)

| Type | Pattern | Examples |
|------|---------|----------|
| **Encounter integrity** | Check required fields present | EM.ID.001, BH.ID.001 |
| **Code validation** | Code in allowed set, modifier required | EM.POS.050, BH.MOD.040 |
| **Mapping validation** | Diagnosis/code consistency | BH.DSM.010, STAGE.CODE.020 |
| **Reconciliation** | Documented value overrides AI | STAGE.RECON.010 |
| **Medical necessity** | Diagnosis supports procedure | EM.ICD.070, BH.MN.030 |

The engine can provide **built-in handlers** for these types; specialty algos reference them by pattern.

---

## 6. Parsing Implementation

### 6.1 Parser Phases

1. **Frontmatter** — Extract version, type, created_at
2. **Flow extraction** — Regex/block parse on flow diagram; capture `(RULE.ID)` in order
3. **Section scan** — For each `## N. Algorithm: ... (RULE.ID)` or `### N.N RuleName (RULE.ID)`:
   - Parse Input/Output/Steps
   - Build Rule object
4. **Table extraction** — For each markdown table under known headers, parse into Table

### 6.2 Regex Patterns (Reference)

```
# Rule ID in flow diagram
/\(([A-Z]{2,4}\.[A-Z]{2,3}\.\d{3})\)/

# Algorithm section
/## \d+\. Algorithm: ([^(]+) \(([A-Z.]+\d+)\)/

# Input line
/\*\*Input:\*\*\s*(.+)/

# Steps block
/\*\*Steps:\*\*\s*\n((?:\d+\. .+\n?)+)/
```

### 6.3 Fallback: LLM-Assisted Parsing

For algos that don't strictly follow conventions, an LLM can:
- Extract rule IDs and flow from prose
- Generate RuleCatalog JSON from unstructured algos
- Output is still the same IR; execution is unchanged

---

## 7. Specialty Adapters

Some rules require specialty-specific logic that can't be fully derived from algos text. Use **adapters** to plug in native code.

```typescript
interface SpecialtyAdapter {
  specialty: string;
  ruleHandlers: Record<string, (inputs: unknown, context: Context) => "PASS" | "FAIL">;
  inputResolvers?: Record<string, (context: Context) => unknown>;
}

// Example: wound-ai adapter
const woundAdapter: SpecialtyAdapter = {
  specialty: "wound-ai",
  ruleHandlers: {
    "STAGE.RECON.010": reconcileICDWithDocumentedStage,
    "STAGE.PARSE.001": parseWoundTypeAndSeverity,
  },
};
```

The engine:
1. Loads algos for specialty
2. Parses to RuleCatalog
3. For each rule, checks adapter for native handler
4. If found, runs handler; else runs interpreted or skips

---

## 8. Integration Points

| Consumer | How It Uses the Engine |
|----------|------------------------|
| **Playbook.ai** | Serves algos content; engine not required at runtime |
| **Coding-ai** | Optional: run validation rules post-extraction |
| **Specialty apps** (wound-ai, pain-ai, etc.) | Call engine with specialty + encounter; get validation result |
| **CLI / batch** | Validate many encounters; output report |

### 8.1 API Shape (Conceptual)

```
POST /validate
  Body: { specialty: "behavioral", encounter: { ... } }
  Response: { passed: boolean, findings: [...], ruleCatalogVersion: 1 }

GET /rules/{specialty}
  Response: { flow: [...], rules: {...}, tables: {...} }  // Parsed IR
```

---

## 9. Implementation Roadmap

| Phase | Deliverable |
|-------|-------------|
| **1. Parser** | Parse algos.agentx → RuleCatalog (JSON); support EM, wound, behavioral |
| **2. Executor** | Generic loop; native handlers for common types (integrity, code validation) |
| **3. Adapters** | Specialty adapters for wound, E/M; fallback to "not implemented" |
| **4. API** | Validate endpoint in playbook-ai or shared service |
| **5. Interpreted rules** | Optional: simple rules (lookup, range) executed from parsed steps |

---

## 10. Summary

- **Algos.agentx** = source of truth for rules; conventions enable parsing
- **RuleCatalog (IR)** = parsed, versioned, executable representation
- **Rules Executor** = generic loop; specialty-specific via adapters
- **Patterns** = encounter integrity, code validation, mapping, reconciliation, medical necessity
- **Reusability** = one engine, many specialties; add specialty = add algos + optional adapter

---

**END OF ALGOS RULES ENGINE**
