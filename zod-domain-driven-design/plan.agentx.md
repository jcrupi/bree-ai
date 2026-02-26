# Plan: Refactor to Zod Domain Driven Design

Actionable plan to migrate the current Geni codebase to the [Zod Domain Driven Design](README.md) flow. Each phase is incremental and shippable.

---

## Current State

| Component | Current | Target |
|-----------|---------|--------|
| **@geni/domain** | Plain interfaces, const arrays for enums | Zod schemas + `z.infer` types |
| **backend-ts (agents)** | Own types (JdParsed in extractBrokenJson, etc.); no @geni/domain | Import from @geni/domain; validate outputs with `XSchema.parse()` |
| **apps/api** | Elysia `t.Object` validation; in-memory Maps; types from @geni/domain | Zod validation at boundaries; same types (now from Zod) |
| **apps/ui** | Types from @geni/domain | Same (transparent) |
| **PostgreSQL** | Migrations exist; API uses JSON files | Optional: wire DB; validate JSONB with Zod on read |
| **Agent structure** | Flat: jdParser, cultureScraper, etc. | Domain folders: position/, assessment/, candidate/ |

---

## Phase Overview

```
Phase 1: Add Zod to domain package
Phase 2: Replace interfaces with Zod schemas (backward-compatible)
Phase 3: Add agent output validation
Phase 4: API validation with Zod
Phase 5: Reorganize agents by domain
Phase 6: (Optional) PostgreSQL + Zod validation on read
```

---

## Phase 1: Add Zod to Domain Package

**Goal:** Add Zod dependency and create schema files without breaking consumers.

**Tasks:**

1. Add `zod` to `packages/domain`:
   ```bash
   cd Geni/packages/domain && bun add zod
   ```

2. Create `packages/domain/src/schemas/`:
   - `enums.ts` — UserRoleSchema, UserStatusSchema, PositionStatusSchema, AssessmentStatusSchema, RecruiterStatusSchema, MessageRoleSchema
   - `value-objects.ts` — RequiredSkillSchema, CulturalTraitSchema, ScoringWeightsSchema, ScoreRangesSchema, JdParsedSchema, CultureDataSchema, QuestionSchema, FeedbackDataSchema, WorkExperienceSchema, ResumeParsedSchema
   - `entities.ts` — CompanySchema, UserSchema, PositionSchema, AssessmentSchema, MessageSchema

3. Implement schemas per [domain-classes.agentx.md](domain-classes.agentx.md) (copy from spec).

4. **Do not change** `packages/domain/src/index.ts` yet — keep existing exports. Add new exports:
   ```typescript
   export * from "./schemas/enums.js";
   export * from "./schemas/value-objects.js";
   export * from "./schemas/entities.js";
   ```
   Ensure types are re-exported (e.g. `export type Position = z.infer<typeof PositionSchema>`).

**Verification:** `bun run build` (or `bun run dev`) in apps/api, apps/ui — no type errors. Existing imports still work.

---

## Phase 2: Replace Interfaces with Zod-Derived Types

**Goal:** Make `@geni/domain` types come from Zod. Remove duplicate interface definitions.

**Tasks:**

1. In `packages/domain/src/index.ts`:
   - Remove manual interfaces and const arrays.
   - Re-export only from schemas:
     ```typescript
     export * from "./schemas/enums.js";
     export * from "./schemas/value-objects.js";
     export * from "./schemas/entities.js";
     ```
   - Ensure enum constants (USER_ROLES, etc.) are exported if used — derive from schema:
     ```typescript
     export const USER_ROLES = UserRoleSchema.options;
     ```

2. Align schema with existing domain (e.g. JdParsed.salary_range — domain has `string | null`, extractBrokenJson has object; pick one per domain.agentx).

3. Run typecheck across workspace:
   ```bash
   cd Geni && bun run build
   ```

**Verification:** All consumers (api, ui, backend-ts once wired) build. No runtime behavior change.

---

## Phase 3: Add Agent Output Validation

**Goal:** Agents validate their outputs with Zod before returning. Ensures alignment with domain.

**Tasks:**

1. Add `@geni/domain` to `backend-ts`:
   ```json
   "dependencies": { "@geni/domain": "workspace:*" }
   ```

2. **jdParserAgent:**
   - Import `JdParsedSchema` from `@geni/domain`.
   - Replace local `JdParsed` from extractBrokenJson with `JdParsed` from @geni/domain.
   - After parsing/extraction, add: `return JdParsedSchema.parse(parsed)` (or `.safeParse` with error handling).
   - Update extractBrokenJson to return shape compatible with JdParsedSchema (or make it internal and coerce).

3. **cultureScraperAgent:**
   - Import `CultureDataSchema` from `@geni/domain`.
   - Validate output: `return CultureDataSchema.parse(raw)`.

4. **questionGeneratorAgent:**
   - Import `QuestionSchema` from `@geni/domain`.
   - Validate: `return z.array(QuestionSchema).parse(questions)`.

5. **scoringAgent:**
   - Import `FeedbackDataSchema` from `@geni/domain`.
   - Validate feedbackData output: `FeedbackDataSchema.parse(feedbackData)`.

6. **resumeParser** (if exists as service):
   - Import `ResumeParsedSchema`.
   - Validate: `ResumeParsedSchema.parse(parsed)`.

7. **conversationAgent:**
   - Use `MessageSchema` for each message if returning structured messages.
   - Validate message array if applicable.

**Verification:** Run agent tests. Invalid LLM output should trigger Zod parse errors (handle with safeParse + fallback or clear error).

---

## Phase 4: API Validation with Zod

**Goal:** Use Zod schemas at Elysia route boundaries instead of (or in addition to) `t.Object`.

**Tasks:**

1. Add `@geni/domain` to `apps/api` (already present).

2. Import schemas for request bodies:
   - `POST /api/v1/positions` — validate body with PositionSchema.pick({ title, ... }) or a CreatePositionSchema.
   - `POST /api/v1/assessments` — validate with AssessmentSchema.pick({ position_id, candidate_email, candidate_name }).
   - `POST /api/v1/auth/register` — optional: UserSchema.pick({ email, name }) + password.

3. Create request schemas (e.g. `CreatePositionSchema = PositionSchema.pick({ title }).extend({ ... })`) for partial payloads.

4. Use Elysia validator with Zod:
   - Elysia supports `t.Schema`; for Zod, use `zodValidator` or map Zod to Elysia's validator. Alternatively, validate manually in handler:
     ```typescript
     const result = CreatePositionSchema.safeParse(body);
     if (!result.success) throw new Error(result.error.message);
     const pos = result.data;
     ```

5. Validate JSON loaded from files (e.g. users.json, positions.json) on startup:
   ```typescript
   const usersList = UserSchema.array().parse(JSON.parse(usersRaw));
   ```

**Verification:** Invalid requests return 400 with validation errors. Valid requests unchanged.

---

## Phase 5: Reorganize Agents by Domain

**Goal:** Structure agents by domain (Position, Assessment, Candidate) per [domain-agents.agentx.md](domain-agents.agentx.md).

**Tasks:**

1. Create folder structure:
   ```
   backend-ts/src/agents/
   ├── position/
   │   ├── jdParserAgent.ts      (from jdParser/)
   │   ├── cultureScraperAgent.ts (from cultureScraper/)
   │   └── questionGeneratorAgent.ts (from questionGenerator/)
   ├── assessment/
   │   ├── conversationAgent.ts
   │   └── scoringAgent.ts
   ├── candidate/
   │   ├── jobGenieAgent.ts
   │   └── resumeParser.ts       (if exists)
   └── index.ts
   ```

2. Move files:
   - `jdParser/jdParserAgent.ts` → `position/jdParserAgent.ts`
   - `jdParser/extractBrokenJson.ts` → `position/extractBrokenJson.ts` (or internal)
   - `cultureScraper/cultureScraperAgent.ts` → `position/cultureScraperAgent.ts`
   - `questionGenerator/questionGeneratorAgent.ts` → `position/questionGeneratorAgent.ts`
   - `conversation/conversationAgent.ts` → `assessment/conversationAgent.ts`
   - `scoring/scoringAgent.ts` → `assessment/scoringAgent.ts`
   - `jobGenie/jobGenieAgent.ts` → `candidate/jobGenieAgent.ts`

3. Update `backend-ts/src/agents/index.ts` and all internal imports.

4. Update `apps/api` imports (e.g. `from "geni-backend-ts"` — ensure exports still work).

5. (Optional) Rename to domain names: PositionParser, CultureScraper, etc. — can be deferred.

**Verification:** `bun run build`; all tests pass; API endpoints work.

---

## Phase 6: PostgreSQL + Zod Validation (Optional)

**Goal:** Wire PostgreSQL if desired; validate JSONB columns with Zod on read.

**Tasks:**

1. Add DB client (e.g. postgres, drizzle, Zodgres) to apps/api.

2. Replace in-memory Maps with DB queries (or hybrid during migration).

3. On read: validate JSONB with Zod before use:
   ```typescript
   const row = await db.query(...);
   const pos = PositionSchema.parse({
     ...row,
     jd_parsed: row.jd_parsed ? JdParsedSchema.parse(row.jd_parsed) : undefined,
   });
   ```

4. On write: validate before insert:
   ```typescript
   const validated = PositionSchema.parse(position);
   await db.insert(positions).values(validated);
   ```

5. Run migrations from [domain-postgres.agentx.md](domain-postgres.agentx.md).

**Verification:** API reads/writes from PostgreSQL; JSONB validated.

---

## Dependency Summary

| Phase | Depends On |
|-------|------------|
| 1 | — |
| 2 | 1 |
| 3 | 2 |
| 4 | 2 |
| 5 | 3, 4 (optional) |
| 6 | 2, 4 |

Phases 3 and 4 can run in parallel after Phase 2.

---

## Checklist

- [x] Phase 1: Zod + schemas in packages/domain
- [x] Phase 2: Types from Zod; remove interfaces
- [x] Phase 3: Agent output validation (JdParsed, CultureData, Question[], FeedbackData)
- [x] Phase 4: API uses domain schemas (load validation deferred for Zod 4 nested compat)
- [x] Phase 5: Agent folder structure (position/, assessment/, candidate/)
- [ ] Phase 6: (Optional) PostgreSQL + JSONB validation

---

## Rollback

- **Phase 1–2:** Revert package/domain changes; restore interfaces.
- **Phase 3:** Remove `.parse()` calls; keep local types if needed.
- **Phase 4:** Revert to Elysia `t.Object` validation.
- **Phase 5:** Move files back to flat structure.
- **Phase 6:** Keep in-memory; remove DB client.

---

## Related

- [README.md](README.md) — Document flow
- [domain-classes.agentx.md](domain-classes.agentx.md) — Zod schema spec
- [domain-agents.agentx.md](domain-agents.agentx.md) — Agent contracts
- [domain-postgres.agentx.md](domain-postgres.agentx.md) — PostgreSQL schema
