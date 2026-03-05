---
kind: design
apiVersion: agentx/v1
metadata:
  name: agentx-spec-design
  version: 0.1
  status: draft
---

# AgentX Spec Design

This document defines the AgentX file taxonomy and the meta→instance generation flow.

## File Types

### Runnable AgentX: *.agentx
Executable, structured, schema-validated.

### Description Docs: *.agentx.md
Human-readable, not executable.

### Meta Generators
meta.<slug>.agentx → produces <domain>.<slug>.agentx

Example:
Run meta.business.agentx with healthcare-claims.agentx.md
→ healthcare-claims.business.agentx
