---
agentx:
  version: 1
  created_at: "2026-03-14T00:00:00.000Z"
  type: meta
  filename: billy-relativity.meta.impl.agentx.md
  domain: relativity-workspace-command-center
  purpose: driver-for-generation
  references:
    - billy-relativity.meta.design.agentx.md
---

# Billy Relativity — Meta Impl Agentx (Driver)

> **Purpose**: This meta agentx drives how implementation agentx documents are generated. Use it when transforming a design spec into stepwise implementation instructions for AI or developers.

---

## 1. Impl Agentx Output Structure

Every generated impl agentx MUST follow this structure:

```markdown
---
agentx:
  version: {N}
  created_at: "{ISO8601}"
  type: implementation
  filename: billy-relativity.impl.version-{N}.agentx.md
  domain: relativity-workspace-command-center
  references:
    - billy-relativity.version-{N}.design.agentx.md
---

# Billy Relativity — Implementation Instructions v{N}

> **Purpose**: Stepwise instructions for AI to generate v{N} features. Execute one step at a time.

**Reference**: See `billy-relativity.version-{N}.design.agentx.md` for full requirements.

**Stack**: BREE — Bun, React 19, Elysia, Eden Treaty. TypeScript only. No npm/yarn/pnpm.

---

## How to Use This Document

1. **Implement steps in order** unless a step explicitly says it can be done in parallel.
2. **One step per session** — complete, test, and commit before moving on.
3. **Mock first, live later** — add mock data/endpoints first, then wire to live Relativity when available.
4. **Preserve existing behavior** — do not break mock mode or existing tabs.

---

## Step {K}: {Short Title}

**Requirement**: {Exact requirement from design}

**Files to modify**:
- `backend/src/...`
- `frontend/src/...`

**Actions**:
1. {Concrete action}
2. {Concrete action}
3. {Test/verify}

**Acceptance**: {Clear pass/fail criteria}

---

## Implementation Order Summary

| Step | Feature | Dependencies |
|------|---------|--------------|
| 1 | ... | None |
| 2 | ... | Step 1 |

---

## Conventions for AI Implementation

- **One step per response** unless the user asks for multiple.
- **Preserve BREE stack**: Bun, React, Elysia, Eden. TypeScript only.
- **Mock before live**: Implement mock behavior first.
- **No breaking changes**: Existing tabs and mock mode must continue to work.
- **Commit after each step**: Encourage `git add` + `git commit` with a descriptive message.

---

*AgentX Implementation v{N} — Billy Relativity*
```

---

## 2. Transformation Rules (Design → Impl)

### 2.1 Extract Requirements from Design

- Parse design sections (## 1. Client, ## 2. Matter, etc.)
- Each major requirement or requirement group becomes one Step
- Order steps by dependency: no dependencies first, then steps that depend on earlier ones

### 2.2 Step Format

Each step MUST include:

| Field | Description |
|-------|-------------|
| **Requirement** | Exact or paraphrased requirement from design |
| **Files to modify** | Specific file paths (backend, frontend) |
| **Actions** | Numbered, concrete actions (1. Backend: ..., 2. Frontend: ...) |
| **Acceptance** | Clear pass/fail criteria |

### 2.3 File Path Conventions

- Backend: `backend/src/index.ts`, `backend/src/data/mockData.ts`
- Frontend: `frontend/src/components/ClientDomainView.tsx`, etc.
- Use actual paths from the billy-relativity codebase

### 2.4 Dependency Graph

- Steps with no dependencies: "None"
- Steps that need prior work: "Step 1", "Steps 1, 2"
- Build the Implementation Order Summary table from this graph

---

## 3. Domain-to-Step Mapping (Billy Relativity)

### Client requirements → Steps

- Filtering → backend mock + API filter, frontend display
- Display fields → interface update, UI update
- Admins via dialog → frontend modal/dialog
- Usage metrics → backend aggregation, frontend display

### Matter requirements → Steps

- Filter → frontend filter, backend if applicable
- Display fields → UI update
- Usage metrics → backend + frontend

### Workspace requirements → Steps

- Statuses → mock data, StatusBadge styling
- Banner (e.g. yellow) → conditional styling
- Metadata → mock data, API, UI
- Usage → mock data, API, UI

---

## 4. Generation Algorithm (Pseudocode)

```
function generateImpl(designContent: string, version: number):
  sections = parseDesignSections(designContent)
  requirements = extractRequirements(sections)
  steps = []
  for req in requirements:
    step = createStep(req)
    step.files = inferFiles(req.domain)
    step.actions = inferActions(req)
    step.acceptance = inferAcceptance(req)
    steps.push(step)
  steps = orderByDependencies(steps)
  output = frontmatter(version, 'impl', designRef)
  output += title(version)
  output += howToUse()
  for step in steps:
    output += stepBlock(step)
  output += orderSummary(steps)
  output += conventions()
  return output
```

---

## 5. Quality Checks

Before finalizing a generated impl:

- [ ] Every design requirement has at least one step
- [ ] Steps are ordered by dependency
- [ ] Each step has Files, Actions, Acceptance
- [ ] File paths are valid for billy-relativity
- [ ] No placeholder text (e.g. "(Implement)")
- [ ] Implementation Order Summary matches steps

---

*Meta Impl Agentx — Driver for impl generation*
