# FatApps AI: Zod Domain Driven Design

Guide for AI tools that generate Zod schema-first domain implementations from business and domain specifications. Feed the AI **business.agentx** and **domain.agentx.md** to produce aligned TypeScript types, PostgreSQL schema, and domain agent contracts.

---

## Input Documents

| Document | Purpose |
|----------|---------|
| **business.agentx** | Describes the business problem, solution, philosophy, stakeholders, and non-negotiables. Defines *why* the app exists and *how* it should behave. |
| **domain.agentx.md** | Outlines the domain model: domain objects, domain values, relationships, and interactions with principals (users, roles, statuses). Defines *what* the app manages. |

---

## What to Extract from business.agentx

1. **Problem statement** — Who has the problem? (e.g. recruiters, candidates)
2. **Solution** — What does the app do? (e.g. 12-minute conversational assessment)
3. **Stakeholders** — Who uses the app? What value do they get?
4. **Philosophy** — Core principles (e.g. conversation over forms, candidate-first)
5. **Non-negotiables** — Constraints that must hold (e.g. 12-minute target, four pillars)
6. **Domain language** — Terms the business uses (e.g. position, assessment, candidate, screening)

Use this to:
- Validate that domain objects align with business concepts
- Name domain objects and domain values in domain language
- Ensure status enums and workflows match business rules

---

## What to Extract from domain.agentx.md

1. **Domain objects** — Core types with identity (Company, User, Position, Assessment, Message)
2. **Domain values** — Embedded types without identity (JdParsed, CultureData, Question, FeedbackData, ResumeParsed)
3. **Relationships** — Domain object associations (Company has Users, Position has Assessments)
4. **Status enums** — Lifecycle states (User.status, Position.status, Assessment.status)
5. **Principals** — Actors and their roles: User (recruiter/staff) with user_role; Message.role (assistant/user); implicit Candidate. Map to permission levels and who can perform which actions.
6. **Interactions** — How principals interact with domain objects (Recruiter creates Position; Candidate completes Assessment; AI produces FeedbackData). Use to define agent boundaries and API surface.
7. **Field semantics** — Types, optionality, constraints (e.g. scoring_weights sum to 100)

Use this to:
- Define Zod schemas for each domain object and domain value
- Map Zod types to PostgreSQL (UUID, TEXT, JSONB, CHECK constraints)
- Derive TypeScript types via `z.infer<typeof XSchema>`
- Define domain agent input/output contracts

---

## Outputs the AI Should Produce

Given business.agentx + domain.agentx.md, the AI should generate or update:

| Output | Content |
|--------|---------|
| **zod-domain.agentx.md** | Design doc: Zod as single source of truth; alignment of TS, PostgreSQL, agents |
| **domain-classes.agentx.md** | Full Zod schema spec: enums, domain values, domain objects with `z.infer` types |
| **domain-postgres.agentx.md** | PostgreSQL tables: domain object → table mapping, JSONB for domain values |
| **domain-agents.agentx.md** | Domain AI agents: boundaries, contracts, input/output types per agent |
| **plan.agentx.md** | Refactor plan: phases to migrate existing codebase to this design |

---

## Schema Generation Rules

### From domain.agentx to Zod

| Domain Field | Zod |
|--------------|-----|
| `string (UUID)` | `z.string().uuid()` |
| `string` | `z.string()` |
| `string?` | `z.string().optional()` |
| `int` | `z.number().int()` |
| `datetime` | `z.string()` or `z.string().datetime()` |
| `"a" \| "b" \| "c"` | `z.enum(["a", "b", "c"])` |
| `Entity` (FK) | `z.string().uuid()` |
| Domain value (embedded) | Reference `XSchema` |
| Domain value[] | `z.array(XSchema)` |

### From domain.agentx to PostgreSQL

| Zod | PostgreSQL |
|-----|------------|
| `z.string().uuid()` | `UUID` |
| `z.string()` | `TEXT` / `VARCHAR(n)` |
| `z.number().int()` | `INTEGER` |
| `z.enum([...])` | `VARCHAR` + CHECK or ENUM |
| `z.object({...})` (domain value) | `JSONB` |
| `z.array(...)` | `JSONB` |

---

## Domain Agent Mapping

For each AI agent or service that produces domain data:

1. **Identify output type** — Which domain value does the agent produce? (e.g. JdParsed, CultureData)
2. **Add validation** — Agent output must be validated with `XSchema.parse()` or `.safeParse()` before use
3. **Define contract** — Input types (domain objects) and output type (domain value) in domain-agents.agentx.md

---

## Validation Checklist

Before finalizing outputs, verify:

- [ ] All domain objects from domain.agentx have Zod schemas
- [ ] All domain values have Zod schemas
- [ ] All status/role enums use `z.enum([...])`
- [ ] Domain object names and field names match domain language from business.agentx
- [ ] Relationships (FKs) are represented correctly
- [ ] Optional fields use `.optional()`
- [ ] PostgreSQL JSONB columns match domain value schemas

---

## Example Flow

```
Input: business.agentx
  → "Geni replaces manual screening with 12-minute conversational assessment"
  → "Four pillars: Technical, Cultural, Experience, Market"
  → "Stakeholders: Recruiters, Candidates, Companies"

Input: domain.agentx.md
  → Domain object: Assessment (position_id, candidate_email, status, scores, feedback_data)
  → Domain value: FeedbackData (overall_summary, skill_breakdown, ai_recommendation)
  → Domain value: ScoringWeights (technical, cultural, experience, market — sum 100)

Output: domain-classes.agentx.md
  → AssessmentSchema with AssessmentStatusSchema, FeedbackDataSchema
  → ScoringWeightsSchema with .refine() for sum 100
  → type Assessment = z.infer<typeof AssessmentSchema>
```

---

## Related

- [geni-v3.7-Refactor-Bree/zod-domain-driven-design/](geni-v3.7-Refactor-Bree/zod-domain-driven-design/README.md) — Document flow overview
- [geni.business.agentx.md](geni.business.agentx.md) — Business input (Geni)
- [geni-v3.7-Refactor-Bree/zod-domain-driven-design/domain.agentx.md](geni-v3.7-Refactor-Bree/zod-domain-driven-design/domain.agentx.md) — Domain model input
- [geni-v3.7-Refactor-Bree/zod-domain-driven-design/zod-domain.agentx.md](geni-v3.7-Refactor-Bree/zod-domain-driven-design/zod-domain.agentx.md) — Design output
- [geni-v3.7-Refactor-Bree/zod-domain-driven-design/domain-classes.agentx.md](geni-v3.7-Refactor-Bree/zod-domain-driven-design/domain-classes.agentx.md) — Schema output
