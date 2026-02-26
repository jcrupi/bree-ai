# Zod Domain Driven Design

Agent-oriented documentation for Geni's domain model using **Zod schema-first** design. All domain artifacts derive from a single source of truth and stay aligned.

---

## Document Flow

```
┌─────────────────────┐
│  business.agentx    │  Why Geni exists; philosophy; value props
└──────────┬──────────┘
           │ informs
           ▼
┌─────────────────────┐
│  domain.agentx      │  Conceptual domain model (entities, value objects)
└──────────┬──────────┘
           │ informs
           ▼
┌─────────────────────┐
│  zod-domain.agentx  │  Design: Zod as single source of truth
└──────────┬──────────┘
           │ drives
     ┌─────┴─────┬─────────────────┐
     ▼           ▼                 ▼
┌──────────┐ ┌──────────────┐ ┌─────────────────┐
│ domain-  │ │ domain-      │ │ domain-agents   │
│ classes  │ │ postgres     │ │ .agentx          │
│ .agentx  │ │ .agentx      │ │                  │
│          │ │              │ │ AI agent mapping │
│ Zod      │ │ PostgreSQL   │ │ & contracts      │
│ schemas  │ │ tables       │ │                  │
│ + TS     │ │              │ │                  │
│ types    │ │              │ │                  │
└──────────┘ └──────────────┘ └─────────────────┘
```

---

## Files

| File | Purpose |
|------|---------|
| [FatApps-ai.Zod-Domain.agentx.md](../FatApps-ai.Zod-Domain.agentx.md) | **AI guide:** How to use business.agentx + domain.agentx to produce Zod DDD outputs |
| [plan.agentx.md](plan.agentx.md) | **Refactor plan:** Current → Zod DDD in 6 phases |
| [business.agentx.md](business.agentx.md) | Business problem, philosophy, non-negotiables |
| [domain.agentx.md](domain.agentx.md) | Conceptual domain model (entities, value objects, relationships) |
| [zod-domain.agentx.md](zod-domain.agentx.md) | Zod schema-first design; alignment of TS, PostgreSQL, agents |
| [domain-classes.agentx.md](domain-classes.agentx.md) | Zod schemas + TypeScript types (`@geni/domain`) |
| [domain-postgres.agentx.md](domain-postgres.agentx.md) | PostgreSQL schema (tables, JSONB columns) |
| [domain-agents.agentx.md](domain-agents.agentx.md) | Domain AI agents: boundaries, contracts, mapping |

---

## Usage

1. **Start with business** — Understand why and how Geni behaves.
2. **Define domain** — Entities and value objects from business concepts.
3. **Implement with Zod** — Schemas in `domain-classes`; design in `zod-domain`.
4. **Persist** — PostgreSQL schema in `domain-postgres`.
5. **Automate** — AI agents consume/produce domain types per `domain-agents`.

When the domain changes, update `domain.agentx` first, then `zod-domain` and the three derived docs.

---

## Refactor Plan

See [plan.agentx.md](plan.agentx.md) for the step-by-step plan to migrate the current codebase to this design.
