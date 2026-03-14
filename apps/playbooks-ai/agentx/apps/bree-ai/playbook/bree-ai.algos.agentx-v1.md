---
agentx:
  version: 1
  created_at: "2025-03-07T00:00:00.000Z"
  type: algos
  filename: bree-ai.algos.agentx-v1.md
---

# BREE AI Algos v1

> Validation rules and algorithm pseudocode for BREE AI playbooks.

## Validation Rules

### RULE.PLAYBOOK.001 — Playbook must have domain
- **Check:** Playbook frontmatter or header defines a `domain` field
- **Fail:** Empty or missing domain

### RULE.PLAYBOOK.002 — Version required
- **Check:** `agentx.version` in frontmatter
- **Fail:** Missing version

### RULE.ENTITY.010 — Entities must have relationships
- **Check:** Each entity references related entities
- **Fail:** Orphan entities with no relationships

## Algorithm Pseudocode

```
function validate_playbook(playbook_content):
  parse frontmatter
  if not domain: return FAIL
  if not version: return FAIL
  return PASS

function load_playbook(slug):
  path = agentx/playbook/{slug}.playbook.agentx-v*.md
  return latest_version(path)
```
