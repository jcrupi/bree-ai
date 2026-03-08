---
agentx:
  version: 1
  created_at: "2025-03-07T00:00:00.000Z"
  type: meta
  filename: meta-playbook.agentx.md
  purpose: schema
  description: |
    Canonical schema for playbook.agentx documents. All domain playbooks MUST conform.
    Use with playbookx generate to produce domain instances from domain info.
  character: descriptive
---

# Meta-Playbook — Playbook Schema

> **Purpose:** Defines the canonical schema for `{domain}.playbook.agentx-vN.md` documents. Domain playbooks MUST conform to this schema. Playbookx uses this meta + domain info to generate domain instances.
>
> **Character:** Playbook.agentx is **descriptive** — it describes the domain, entities, rules, and business logic in human-readable form. It does not define executable steps; the companion algos.agentx provides deterministic validation.

---

## 1. Schema Overview

The meta-playbook acts as both documentation and a **schema** that domain playbooks must satisfy. When generating a new playbook from domain info, the output MUST include all required sections and follow the conventions below.

---

## 2. Required Frontmatter

Every playbook MUST have YAML frontmatter with these fields:

```yaml
---
agentx:
  version: 1                    # Required. Integer, bumped on changes.
  created_at: "ISO8601"          # Required. e.g. "2025-03-07T00:00:00.000Z"
  type: playbook                 # Required. Literal "playbook"
  filename: "{domain}.playbook.agentx-v{N}.md"  # Required. Matches file name.
  domain?: string                # Optional. Human-readable domain name.
---
```

**Validation:**
- `version` must be a positive integer
- `created_at` must be valid ISO 8601
- `type` must equal `"playbook"`
- `filename` must match pattern `{domain}.playbook.agentx-v{N}.md`

---

## 3. Required Sections (in order)

| Section | Level | Required | Description |
|---------|-------|----------|-------------|
| Title | `#` | Yes | `# {Domain} Playbook v{N}` |
| Overview | `##` | Yes | 1–3 sentence summary of the playbook's purpose |
| Domain | `##` | Yes | Business domain (e.g., wound care, E/M, project management) |
| Entities | `##` | Yes | Core concepts and their relationships |
| Rules | `##` | Yes | Business rules and validation logic |
| API Surface | `##` | Optional | Endpoints, events, NATS subjects |
| AgentX Notes | `##` | Optional | References to related agentx specs |

---

## 4. Section Conventions

### 4.1 Domain

- Single paragraph or bullet list
- Identifies the business domain (e.g., `wound care`, `E/M coding`, `FatApp creation`)

### 4.2 Entities

- Use markdown lists or tables
- Each entity: name, description, relationships to other entities
- Example:

  ```markdown
  - **Encounter** — Clinical visit record. Relates to: Patient, Documentation, Codes.
  - **Patient** — Subject of care. Relates to: Encounter.
  ```

### 4.3 Rules

- Use `### RULE.{PREFIX}.{NUMBER}` for rule headers
- Rule ID pattern: `{PREFIX}.{CATEGORY}.{NUMBER}` (e.g., `EM.ID.001`, `WND.MEAS.010`)
- Each rule: Check, Fail condition, Remediation (optional)

---

## 5. File Naming Convention

```
{domain}.playbook.agentx-v{N}.md
```

- `{domain}`: lowercase, hyphenated (e.g., `bree-ai`, `wound-ai`, `fatapps`)
- `{N}`: version number (1, 2, 3, …)

---

## 6. Generation Input (for playbookx)

When generating a domain playbook, provide:

| Input | Type | Description |
|-------|------|-------------|
| `domain` | string | Domain slug (e.g., `fatapps`, `document-qa`) |
| `domain_name` | string | Human-readable name |
| `entities` | array | List of { name, description, relationships } |
| `rules` | array | List of { id, name, check, fail, remediation? } |
| `api_surface` | array? | Optional endpoints/events |
| `agentx_refs` | array? | Optional related agentx file paths |

Playbookx merges this with the meta-playbook schema to produce a conforming `{domain}.playbook.agentx-v1.md`.
