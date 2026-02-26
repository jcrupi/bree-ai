# Zod Domain: Schema-First Design

Design document for the Geni domain model using **Zod as the single source of truth**. TypeScript domain types, PostgreSQL tables, and domain agents stay aligned because they all derive from or validate against the same Zod schemas.

**Part of:** [Zod Domain Driven Design](README.md) — informed by [domain.agentx.md](domain.agentx.md) → drives [domain-classes](domain-classes.agentx.md), [domain-postgres](domain-postgres.agentx.md), [domain-agents](domain-agents.agentx.md)

---

## Design Principle

**One definition, three aligned representations:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Zod Schemas (@geni/domain)                               │
│                     Single source of truth                                   │
└─────────────────────────────────────────────────────────────────────────────┘
         │                         │                          │
         ▼                         ▼                          ▼
┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────────────────┐
│ TypeScript      │    │ PostgreSQL          │    │ Domain Agents                │
│ Domain Types    │    │ Tables              │    │ (Position, Assessment,       │
│                 │    │                     │    │  Candidate domains)         │
│ z.infer<Schema> │    │ Zod → SQL mapping   │    │                             │
│ Used by: API,   │    │ JSONB for value    │    │ Consume: Position,           │
│ UI, agents      │    │ objects             │    │ Assessment, JdParsed, etc.  │
│                 │    │                     │    │ Produce: JdParsed,          │
│                 │    │                     │    │ FeedbackData, etc.         │
│                 │    │                     │    │ Validate: Schema.parse()    │
└─────────────────┘    └─────────────────────┘    └─────────────────────────────┘
         │                         │                          │
         └─────────────────────────┴──────────────────────────┘
                              All aligned
```

---

## Why Alignment Matters

| Layer | Without Zod-First | With Zod-First |
|-------|-------------------|----------------|
| **TypeScript** | Manual interfaces; can drift from DB | `type X = z.infer<typeof XSchema>` — always matches schema |
| **PostgreSQL** | Hand-written migrations; JSONB shapes undocumented | Zod defines JSONB structure; migrations follow mapping table |
| **Domain agents** | Accept/produce loose objects; runtime shape mismatches | Agents typed with domain types; outputs validated with `XSchema.parse()` |

When the domain model changes (e.g. add `JdParsed.remote_policy`), update the Zod schema once. TypeScript types, validation, and (if using codegen) PostgreSQL stay in sync.

---

## Flow: Zod → TypeScript → PostgreSQL

### 1. Zod Schemas Define the Domain

All entities, value objects, and enums live in `packages/domain/src/schemas/`:

- **Enums:** `UserRoleSchema`, `PositionStatusSchema`, `AssessmentStatusSchema`, etc.
- **Value objects:** `JdParsedSchema`, `CultureDataSchema`, `QuestionSchema`, `FeedbackDataSchema`, `ResumeParsedSchema`, etc.
- **Entities:** `CompanySchema`, `UserSchema`, `PositionSchema`, `AssessmentSchema`, `MessageSchema`

See [domain-classes.agentx.md](domain-classes.agentx.md) for full schema definitions.

### 2. TypeScript Types Are Derived

```typescript
export type Position = z.infer<typeof PositionSchema>;
export type JdParsed = z.infer<typeof JdParsedSchema>;
export type Assessment = z.infer<typeof AssessmentSchema>;
// ...
```

No duplicate type definitions. Types are always consistent with the schema.

### 3. PostgreSQL Tables Follow Zod

| Zod | PostgreSQL |
|-----|------------|
| `z.string().uuid()` | `UUID` |
| `z.string()` | `TEXT` / `VARCHAR(n)` |
| `z.number().int()` | `INTEGER` |
| `z.enum([...])` | `VARCHAR` + CHECK or ENUM |
| `z.object({...})` (value object) | `JSONB` |
| `z.array(...)` | `JSONB` |

Value objects (JdParsed, CultureData, FeedbackData, etc.) are stored in JSONB columns. Zod schemas document and validate their structure. See [domain-postgres.agentx.md](domain-postgres.agentx.md) for table definitions.

---

## Domain Agents and Alignment

Domain agents (PositionParser, CultureScraper, QuestionGenerator, ScreeningAgent, AssessmentScorer, JobGenie, ResumeParser) interact with the TypeScript domain types. Because those types come from Zod, agents stay aligned.

### Agents Consume Domain Types

```typescript
// ScreeningAgent input
interface ScreeningAgentInput {
  assessment: Assessment;   // from z.infer<typeof AssessmentSchema>
  position: Position;     // from z.infer<typeof PositionSchema>
  candidate: { resume?: ResumeParsed };
  candidateMessage: string;
}

// PositionParser output type
// JdParsed from z.infer<typeof JdParsedSchema>
```

Agents receive strongly-typed inputs. The API layer loads `Position` and `Assessment` from the database (or in-memory store) and passes them. Types guarantee the shape.

### Agents Produce Domain Types (Validated)

```typescript
// PositionParser returns raw JSON from LLM
const raw = await llm.generate(...);

// Validate before use — ensures alignment with schema
const jdParsed = JdParsedSchema.parse(raw);
```

Agent outputs are validated with `XSchema.parse()` or `.safeParse()`. Invalid shapes fail at runtime with clear errors. Valid outputs are guaranteed to match the domain model.

### Agent Contract Summary

| Agent | Primary Input Types | Primary Output Type | Validation |
|-------|---------------------|---------------------|------------|
| PositionParser | string (JD text) | JdParsed | `JdParsedSchema.parse()` |
| CultureScraper | string (URL) | CultureData | `CultureDataSchema.parse()` |
| QuestionGenerator | Position, ResumeParsed? | Question[] | `z.array(QuestionSchema).parse()` |
| ScreeningAgent | Assessment, Position | Message[], ConversationState | MessageSchema, etc. |
| AssessmentScorer | Assessment, Position | FeedbackData, DetailedScores | `FeedbackDataSchema.parse()` |
| ResumeParser | file buffer | ResumeParsed | `ResumeParsedSchema.parse()` |
| JobGenie | Position, Message[] | string | N/A (free-form reply) |

---

## Package Structure

```
Geni/packages/domain/
├── package.json          # name: "@geni/domain", dependency: "zod"
├── tsconfig.json
└── src/
    ├── index.ts          # Re-exports schemas + types
    └── schemas/
        ├── enums.ts      # UserRoleSchema, PositionStatusSchema, etc.
        ├── value-objects.ts  # JdParsedSchema, CultureDataSchema, etc.
        └── entities.ts   # CompanySchema, PositionSchema, AssessmentSchema, etc.
```

**Consumers:**

| Consumer | Usage |
|----------|-------|
| `@geni/api` (Elysia) | `PositionSchema.parse(body)` for validation; `Position` type for responses |
| `@geni/ui` (React) | `Position`, `Assessment` types for props and API responses |
| `geni-backend-ts` (agents) | Domain types for inputs; `XSchema.parse()` for agent outputs |

---

## Alignment Checklist

When adding or changing a domain concept:

1. **Define in Zod** — Add or update schema in `packages/domain/src/schemas/`
2. **Export type** — `export type X = z.infer<typeof XSchema>`
3. **PostgreSQL** — Add/update column or JSONB structure per mapping table
4. **Agents** — Ensure agent inputs/outputs use the domain type; add `.parse()` for agent outputs
5. **API** — Use schema for request validation; use type for response typing

---

## Related

| Document | Purpose |
|----------|---------|
| [domain.agentx.md](domain.agentx.md) | Conceptual domain model (entities, value objects) |
| [domain-classes.agentx.md](domain-classes.agentx.md) | Full Zod schema specification and implementation details |
| [domain-postgres.agentx.md](domain-postgres.agentx.md) | PostgreSQL table definitions |
| [domain-agents.agentx.md](domain-agents.agentx.md) | Domain agent boundaries and contracts |
