---
agentx:
  version: 1
  created_at: "2026-03-07T00:00:00.000Z"
  type: meta
  filename: meta-workflows.agentx.md
  purpose: schema
  description: |
    Canonical schema for workflows.agentx documents. All domain workflows MUST conform.
    Use with playbookx generate to produce domain workflow instances from domain info.
  character: imperative
---

# Meta-Workflows — Workflow Schema

> **Purpose:** Defines the canonical schema for `{domain}.workflows.agentx-vN.md` documents.
> Domain workflows MUST conform to this schema. Playbookx uses this meta + domain info to
> generate domain instances.
>
> **Character:** Workflows.agentx is **imperative** — it defines _what to do and in what order_,
> with branching, side effects, triggers, and completion conditions.
> It complements the existing document types:
>
> | Document type      | Character      | Purpose                                         |
> | ------------------ | -------------- | ----------------------------------------------- |
> | `playbook.agentx`  | Descriptive    | Domain knowledge, entities, rules               |
> | `algos.agentx`     | Deterministic  | Executable validation rules → PASS/FAIL         |
> | `workflows.agentx` | **Imperative** | Ordered step sequences, branching, side effects |

---

## 1. Schema Overview

A workflow is a **named, ordered sequence of steps** that transforms a subject from one state
to another. Steps can branch on conditions, call other workflows (sub-flows), emit NATS events,
invoke APIs, and define rollback logic.

Workflows are NOT validation rules. A validation rule answers "is this correct?" — a workflow
answers "how do we get this done?"

```
algos.agentx   → VALIDATE an encounter (PASS / FAIL)
workflows.agentx → EXECUTE a process (steps, branches, side effects)
```

---

## 2. Required Frontmatter

Every workflows document MUST have YAML frontmatter:

```yaml
---
agentx:
  version: 1 # Required. Integer, bumped on changes.
  created_at: "ISO8601" # Required.
  type: workflows # Required. Literal "workflows"
  filename: "{domain}.workflows.agentx-v{N}.md"
  domain: string # Required. Human-readable domain name.
  triggers: # Optional. Events that can invoke workflows.
    - nats: "playbook.{domain}.>"
    - http: "POST /api/workflows/{domain}/run"
---
```

---

## 3. Workflow ID Pattern (REQUIRED)

Workflow IDs MUST follow:

```
{PREFIX}.{VERB}.{NUMBER}
```

| Part   | Pattern                               | Examples                              |
| ------ | ------------------------------------- | ------------------------------------- |
| PREFIX | 2–4 uppercase letters matching domain | HIPAA, ONBRD, CLAIM, BREE             |
| VERB   | Verb describing the workflow action   | RUN, VALIDATE, GENERATE, NOTIFY, SYNC |
| NUMBER | 3-digit zero-padded                   | 001, 010, 020                         |

**Examples:**

- `HIPAA.VALIDATE.001` — HIPAA validation workflow
- `ONBRD.RUN.010` — Onboarding execution flow
- `CLAIM.GENERATE.020` — Claim generation workflow
- `BREE.SYNC.001` — Data sync workflow

---

## 4. WorkflowCatalog YAML Block (REQUIRED)

Every workflows document MUST contain exactly one `WorkflowCatalog` YAML block.
The workflow engine parses this to build the execution registry.

```yaml
# {domain} WorkflowCatalog
domain: "{domain}"
version: 1
created_at: "ISO8601"

workflows:
  WFL.ID.001:
    id: "WFL.ID.001"
    name: "Workflow Name"
    description: "What this workflow does"
    trigger:
      type: "manual" | "event" | "scheduled" | "http"
      source: "nats:playbook.domain.event" | "POST /endpoint" | "cron:0 9 * * 1"
    input:
      - name: "subjectId"
        type: string
        required: true
      - name: "options"
        type: object
        required: false
    steps:
      - id: "step-1"
        name: "Step One"
        type: "action" | "condition" | "sub-workflow" | "emit" | "wait"
        action: "handlerFunctionName"   # for type: action
        on_success: "step-2"           # next step ID or "complete"
        on_failure: "rollback-1"       # step ID, "fail", or "complete"
      - id: "step-2"
        name: "Branch on condition"
        type: "condition"
        condition: "input.status === 'active'"
        on_true: "step-3"
        on_false: "step-4"
    rollback:
      - id: "rollback-1"
        action: "undoStepOne"
    output:
      type: "WorkflowResult"
      fields: ["status", "errors", "artifacts"]
```

---

## 5. Step Types

| Type           | Description                          | Required fields                           |
| -------------- | ------------------------------------ | ----------------------------------------- | ------ |
| `action`       | Calls a function/handler with inputs | `action`, `on_success`, `on_failure`      |
| `condition`    | Branches based on an expression      | `condition`, `on_true`, `on_false`        |
| `sub-workflow` | Invokes another workflow by ID       | `workflow_id`, `on_success`, `on_failure` |
| `emit`         | Publishes a NATS event or HTTP call  | `subject` or `endpoint`, `payload`        |
| `wait`         | Pauses for an event or duration      | `wait_for`: event or duration             |
| `parallel`     | Runs multiple steps concurrently     | `steps: []`, `join: "all"                 | "any"` |
| `human`        | Requires human approval to continue  | `prompt`, `timeout`, `on_timeout`         |

---

## 6. Workflow Flow Diagram (REQUIRED)

Every workflow MUST have an ASCII flow diagram showing the execution path:

```
┌──────────────────────────┐
│  TRIGGER                 │
│  (WFL.ONBRD.RUN.001)     │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│  Step 1: Validate Input  │  ── FAIL ──▶ [FAIL: invalid-input]
│  (action: validateInput) │
└────────────┬─────────────┘
             │ PASS
             ▼
┌──────────────────────────┐
│  Step 2: Create Entity   │  ── FAIL ──▶ [ROLLBACK: undo-create]
│  (action: createEntity)  │
└────────────┬─────────────┘
             │ OK
             ▼
┌──────────────────────────┐
│  Step 3: Notify          │
│  (emit: nats subject)    │
└────────────┬─────────────┘
             │
             ▼
         [COMPLETE]
```

**Parser extracts:** Step IDs in sequence → `steps` array order.

---

## 7. Required Sections (in order)

| Section              | Level | Required           | Description                                  |
| -------------------- | ----- | ------------------ | -------------------------------------------- |
| Title                | `#`   | Yes                | `# {Domain} Workflows v{N}`                  |
| Overview             | `##`  | Yes                | 1–3 sentence purpose summary                 |
| WorkflowCatalog YAML | `##`  | Yes                | Canonical YAML block for workflow engine     |
| Workflow Definitions | `##`  | Yes                | One `##` section per workflow                |
| Flow Diagrams        | `###` | Yes (per workflow) | ASCII flow diagram                           |
| Step Descriptions    | `###` | Yes (per workflow) | Human-readable step docs                     |
| Trigger Reference    | `##`  | Optional           | All events/HTTP routes that invoke workflows |
| Rollback Reference   | `##`  | Optional           | All rollback handlers                        |

---

## 8. Workflow Definition Section Pattern

Each workflow gets its own `##` section:

```markdown
## {N}. Workflow: {Name} ({WFL.ID.NNN})

**Trigger:** {trigger type/source}
**Input:** {input description}
**Output:** {output description}

### {N}.1 Flow Diagram

[ASCII flow diagram]

### {N}.2 Steps

| Step   | Type   | Action / Condition           | On Success | On Failure |
| ------ | ------ | ---------------------------- | ---------- | ---------- |
| step-1 | action | validateInput                | step-2     | fail       |
| step-2 | action | createEntity                 | step-3     | rollback-1 |
| step-3 | emit   | nats:playbook.domain.created | complete   | complete   |

### {N}.3 Rollback

| Rollback ID | Action     | Undoes |
| ----------- | ---------- | ------ |
| rollback-1  | undoCreate | step-2 |
```

---

## 9. Trigger Reference (Convention)

Workflows can be triggered three ways:

```
# 1. NATS event
nats: playbook.{domain}.{event}
      e.g. playbook.hipaa.validate-requested

# 2. HTTP endpoint (via playbook-ai server)
POST /api/workflows/{domain}/run
Body: { workflowId: "WFL.ID.001", input: { ... } }

# 3. Scheduled (cron)
trigger.type: scheduled
trigger.source: "cron:0 9 * * 1"  # every Monday 9am
```

---

## 10. Execution Engine Integration

The **Workflow Engine** (parallel to the Algos Rules Engine) consumes WorkflowCatalog YAML:

```typescript
interface WorkflowEngine {
  register(catalog: WorkflowCatalog): void;
  run(workflowId: string, input: unknown): Promise<WorkflowResult>;
  subscribe(natsSubject: string): void; // auto-trigger via NATS
}

interface WorkflowResult {
  workflowId: string;
  status: "complete" | "failed" | "rolled-back";
  stepsExecuted: string[];
  output?: unknown;
  errors?: WorkflowError[];
}
```

Handler functions referenced in WorkflowCatalog steps are registered via a
**WorkflowAdapter** — the domain-specific plugin, exactly mirroring the
SpecialtyAdapter pattern from `algos-rules-engine.agentx.md`.

```typescript
interface WorkflowAdapter {
  domain: string;
  handlers: Record<
    string,
    (input: unknown, context: WorkflowContext) => Promise<unknown>
  >;
}
```

---

## 11. File Naming Convention

```
{domain}.workflows.agentx-v{N}.md
```

- `{domain}`: lowercase, hyphenated (e.g., `hipaa`, `onboarding`, `claim-gen`)
- `{N}`: version number (1, 2, …)

**Example filenames:**

```
hipaa.workflows.agentx-v1.md
onboarding.workflows.agentx-v1.md
claim-generation.workflows.agentx-v1.md
bree-ai.workflows.agentx-v1.md
```

---

## 12. Relationship to Other Agentx Types

```
{domain}.playbook.agentx-vN.md    ← WHAT the domain is (entities, rules, knowledge)
{domain}.algos.agentx-vN.md       ← VALIDATE: is this encounter correct? (PASS/FAIL)
{domain}.workflows.agentx-vN.md   ← EXECUTE: run this process step by step (imperative)
```

A workflow step CAN invoke an algos validation rule:

```yaml
- id: "step-2"
  name: "Validate HIPAA compliance"
  type: "action"
  action: "runAlgosValidation"
  params:
    specialty: "hipaa"
    ruleId: "HIPAA.PHI.001"
  on_success: "step-3"
  on_failure: "fail"
```

This creates a clean composition layer:
**Playbook = knowledge → Algos = validation → Workflows = execution**

---

## 13. Generation Input (for playbookx)

When generating a domain workflows document, provide:

| Input         | Type   | Description                                                      |
| ------------- | ------ | ---------------------------------------------------------------- |
| `domain`      | string | Domain slug (e.g., `hipaa`, `onboarding`)                        |
| `domain_name` | string | Human-readable name                                              |
| `workflows`   | array  | List of `{ id, name, trigger, input, steps, rollback?, output }` |
| `triggers`    | array? | Optional NATS subjects or HTTP routes                            |
| `adapters`    | array? | Optional handler function names used in steps                    |

Playbookx merges this with the meta-workflows schema to produce a conforming
`{domain}.workflows.agentx-v1.md` with valid WorkflowCatalog YAML and flow diagrams.

---

_This note is AI-readable. It defines the full schema, conventions, and engine integration
for workflows.agentx documents. Ask about step types, trigger conventions, the WorkflowCatalog
YAML format, or how workflows compose with algos._
