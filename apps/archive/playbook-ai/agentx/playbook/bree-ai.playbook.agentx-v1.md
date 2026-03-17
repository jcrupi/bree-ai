---
agentx:
  version: 1
  created_at: "2025-03-07T00:00:00.000Z"
  type: playbook
  filename: bree-ai.playbook.agentx-v1.md
---

# BREE AI Playbook v1

> Create and manage playbooks in BREE AI. Use this as a template for domain-specific playbooks.

## Overview

This playbook defines the structure for creating playbooks in the BREE AI platform. Playbooks capture business rules, domain logic, and implementation guidance for AI-powered applications.

## Playbook Structure

1. **Domain** — The business domain (e.g., document QA, talent matching, project management)
2. **Entities** — Core concepts and their relationships
3. **Rules** — Business rules and validation logic
4. **API Surface** — Endpoints and events
5. **AgentX Notes** — References to agentx specs for AI agents

## Creating a New Playbook

1. Copy this template to `agentx/playbook/{domain}.playbook.agentx-v1.md`
2. Define your domain, entities, and rules
3. Add algos in `{domain}.algos.agentx-v1.md` for validation logic
4. Use Playbook.ai to view, chat, and iterate

## Example Domains

- **fatapps** — FatApp creation flow (Define → Design → Build → Implement)
- **document-qa** — Document Q&A and retrieval
- **talent** — Talent matching and assessments
