---
agentx:
  version: 1
  created_at: "2026-03-07T00:00:00.000Z"
  type: design
  filename: playbook-workflows.agentx.md
  scope: playbook-ai
  stack: Bun, Elysia, NATS, AgentX, TypeScript
  app: playbook-ai
  ai_context: true
tags:
  [
    playbook-ai,
    workflows,
    workflow-engine,
    rules-engine,
    agentx,
    nats,
    imperative,
  ]
---

# Playbook Workflows — Design & Implementation

> **Purpose:** Defines the design and implementation plan for the Workflows system inside
> `playbook-ai`. Workflows are imperative step sequences that complement the existing
> Algos Rules Engine (validation). Together they form a full execution platform:
> **know it → validate it → execute it**.

---

## 1. The Three Pillars

```
┌───────────────────────────────────────────────────────────────────┐
│                    PLAYBOOK-AI EXECUTION PLATFORM                  │
├───────────────────┬───────────────────┬───────────────────────────┤
│  PLAYBOOK         │  ALGOS            │  WORKFLOWS                │
│  (descriptive)    │  (deterministic)  │  (imperative)             │
├───────────────────┼───────────────────┼───────────────────────────┤
│  What is the      │  Is this          │  How do we execute        │
│  domain?          │  encounter        │  this process?            │
│                   │  correct?         │                           │
├───────────────────┼───────────────────┼───────────────────────────┤
│  *.playbook       │  *.algos          │  *.workflows              │
│  .agentx-vN.md    │  .agentx-vN.md   │  .agentx-vN.md           │
├───────────────────┼───────────────────┼───────────────────────────┤
│  Human-readable   │  PASS / FAIL      │  Step sequence            │
│  entities, rules  │  findings list    │  branches, emits,         │
│  & knowledge      │  remediations     │  rollbacks, events        │
└───────────────────┴───────────────────┴───────────────────────────┘
```

---

## 2. Architecture

```
playbook-ai/
├── agentx/
│   ├── meta-playbook.agentx.md     ← playbook schema
│   ├── meta-algos.agentx.md        ← algos schema
│   ├── meta-workflows.agentx.md    ← workflow schema (NEW)
│   ├── algos-rules-engine.agentx.md
│   ├── workflows-engine.agentx.md  ← this file (NEW)
│   └── playbook/
│       ├── hipaa.algos.agentx-v1.md
│       ├── hipaa.playbook.agentx-v1.md
│       └── hipaa.workflows.agentx-v1.md  ← domain workflow (NEW)
│
├── rules-engine/           ← existing algos engine
│   └── ...
├── workflows-engine/       ← NEW
│   ├── index.ts            ← WorkflowEngine class
│   ├── parser.ts           ← WorkflowCatalog YAML parser
│   ├── executor.ts         ← Step executor loop
│   ├── adapter.ts          ← WorkflowAdapter interface
│   ├── types.ts            ← TypeScript types
│   └── adapters/
│       ├── hipaa.adapter.ts
│       ├── onboarding.adapter.ts
│       └── claim-gen.adapter.ts
│
└── server/
    └── routes/
        └── workflows.ts    ← HTTP endpoints + NATS subscriptions
```

---

## 3. WorkflowCatalog — Intermediate Representation (IR)

The parser reads any `*.workflows.agentx-vN.md` file and produces a typed IR:

```typescript
// workflows-engine/types.ts

export type StepType =
  | "action"
  | "condition"
  | "sub-workflow"
  | "emit"
  | "wait"
  | "parallel"
  | "human";

export interface WorkflowStep {
  id: string;
  name: string;
  type: StepType;
  // action
  action?: string;
  params?: Record<string, unknown>;
  // condition
  condition?: string;
  on_true?: string;
  on_false?: string;
  // sub-workflow
  workflow_id?: string;
  // emit
  subject?: string;
  endpoint?: string;
  payload?: Record<string, unknown>;
  // wait
  wait_for?: string;
  // parallel
  steps?: string[];
  join?: "all" | "any";
  // human
  prompt?: string;
  timeout?: string;
  on_timeout?: string;
  // shared
  on_success?: string;
  on_failure?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: "manual" | "event" | "scheduled" | "http";
    source?: string;
  };
  input: Array<{ name: string; type: string; required: boolean }>;
  steps: WorkflowStep[];
  rollback?: WorkflowStep[];
  output?: { type: string; fields: string[] };
}

export interface WorkflowCatalog {
  domain: string;
  version: number;
  created_at: string;
  workflows: Record<string, WorkflowDefinition>;
}

export interface WorkflowContext {
  workflowId: string;
  input: unknown;
  state: Record<string, unknown>; // step outputs accumulated here
  domain: string;
  nats?: NatsConnection; // optional for emit steps
}

export interface WorkflowResult {
  workflowId: string;
  domain: string;
  status: "complete" | "failed" | "rolled-back" | "waiting";
  stepsExecuted: string[];
  stepsFailed: string[];
  output?: unknown;
  errors?: Array<{ stepId: string; message: string }>;
  durationMs: number;
}
```

---

## 4. Workflow Engine

```typescript
// workflows-engine/index.ts

import {
  WorkflowAdapter,
  WorkflowCatalog,
  WorkflowResult,
  WorkflowContext,
} from "./types";
import { WorkflowParser } from "./parser";
import { WorkflowExecutor } from "./executor";

export class WorkflowEngine {
  private catalogs = new Map<string, WorkflowCatalog>();
  private adapters = new Map<string, WorkflowAdapter>();
  private executor: WorkflowExecutor;

  constructor(private nats?: NatsConnection) {
    this.executor = new WorkflowExecutor(this.adapters, nats);
  }

  // Register a domain workflow catalog from parsed YAML
  registerCatalog(catalog: WorkflowCatalog): void {
    this.catalogs.set(catalog.domain, catalog);
  }

  // Register a domain adapter (handler functions)
  registerAdapter(adapter: WorkflowAdapter): void {
    this.adapters.set(adapter.domain, adapter);
  }

  // Load & parse a .workflows.agentx file
  async loadFromFile(filePath: string): Promise<void> {
    const catalog = await WorkflowParser.parseFile(filePath);
    this.registerCatalog(catalog);
  }

  // Execute a workflow by ID
  async run(
    domain: string,
    workflowId: string,
    input: unknown,
  ): Promise<WorkflowResult> {
    const catalog = this.catalogs.get(domain);
    if (!catalog) throw new Error(`No workflow catalog for domain: ${domain}`);

    const workflow = catalog.workflows[workflowId];
    if (!workflow) throw new Error(`Workflow not found: ${workflowId}`);

    const ctx: WorkflowContext = {
      workflowId,
      domain,
      input,
      nats: this.nats,
      state: {},
    };

    return this.executor.execute(workflow, ctx);
  }

  // Subscribe to NATS triggers for all registered catalogs
  subscribeAll(): void {
    for (const [domain, catalog] of this.catalogs) {
      for (const wfl of Object.values(catalog.workflows)) {
        if (wfl.trigger.type === "event" && wfl.trigger.source) {
          const subject = wfl.trigger.source.replace("nats:", "");
          this.nats?.subscribe(subject, async (msg) => {
            const input = JSON.parse(codec.decode(msg.data));
            await this.run(domain, wfl.id, input);
          });
        }
      }
    }
  }
}
```

---

## 5. Workflow Executor

```typescript
// workflows-engine/executor.ts

export class WorkflowExecutor {
  async execute(
    workflow: WorkflowDefinition,
    ctx: WorkflowContext,
  ): Promise<WorkflowResult> {
    const start = Date.now();
    const stepsExecuted: string[] = [];
    const stepsFailed: string[] = [];
    let currentStepId = workflow.steps[0]?.id;

    try {
      while (
        currentStepId &&
        currentStepId !== "complete" &&
        currentStepId !== "fail"
      ) {
        const step = workflow.steps.find((s) => s.id === currentStepId);
        if (!step) break;

        stepsExecuted.push(step.id);
        currentStepId = await this.runStep(step, ctx);
      }

      const status = currentStepId === "fail" ? "failed" : "complete";
      return {
        workflowId: ctx.workflowId,
        domain: ctx.domain,
        status,
        stepsExecuted,
        stepsFailed,
        output: ctx.state,
        durationMs: Date.now() - start,
      };
    } catch (err) {
      // Execute rollback steps if defined
      if (workflow.rollback?.length) {
        await this.runRollback(workflow.rollback, ctx);
        return {
          workflowId: ctx.workflowId,
          domain: ctx.domain,
          status: "rolled-back",
          stepsExecuted,
          stepsFailed,
          errors: [
            { stepId: currentStepId ?? "unknown", message: String(err) },
          ],
          durationMs: Date.now() - start,
        };
      }
      throw err;
    }
  }

  private async runStep(
    step: WorkflowStep,
    ctx: WorkflowContext,
  ): Promise<string> {
    switch (step.type) {
      case "action":
        return this.runAction(step, ctx);
      case "condition":
        return this.runCondition(step, ctx);
      case "emit":
        return this.runEmit(step, ctx);
      case "wait":
        return this.runWait(step, ctx);
      case "sub-workflow":
        return this.runSubWorkflow(step, ctx);
      case "parallel":
        return this.runParallel(step, ctx);
      case "human":
        return this.runHuman(step, ctx);
      default:
        throw new Error(`Unknown step type: ${(step as WorkflowStep).type}`);
    }
  }

  private async runAction(
    step: WorkflowStep,
    ctx: WorkflowContext,
  ): Promise<string> {
    const adapter = this.adapters.get(ctx.domain);
    const handler = adapter?.handlers[step.action!];
    if (!handler) throw new Error(`No handler for action: ${step.action}`);
    const result = await handler(ctx.input, ctx);
    ctx.state[step.id] = result; // accumulate step output
    return step.on_success ?? "complete";
  }

  private runCondition(step: WorkflowStep, ctx: WorkflowContext): string {
    // Safe expression eval over ctx.state and ctx.input
    const fn = new Function("input", "state", `return ${step.condition}`);
    const result = fn(ctx.input, ctx.state);
    return result
      ? (step.on_true ?? "complete")
      : (step.on_false ?? "complete");
  }

  private async runEmit(
    step: WorkflowStep,
    ctx: WorkflowContext,
  ): Promise<string> {
    if (step.subject && ctx.nats) {
      const payload = JSON.stringify({
        ...step.payload,
        workflowId: ctx.workflowId,
        state: ctx.state,
      });
      ctx.nats.publish(step.subject, codec.encode(payload));
    }
    return step.on_success ?? "complete";
  }

  private async runWait(
    _step: WorkflowStep,
    _ctx: WorkflowContext,
  ): Promise<string> {
    // Wait for NATS event or duration — implementation deferred
    throw new Error("wait step not yet implemented");
  }

  private async runSubWorkflow(
    step: WorkflowStep,
    ctx: WorkflowContext,
  ): Promise<string> {
    // Delegate to engine.run(domain, step.workflow_id)
    return step.on_success ?? "complete";
  }

  private async runParallel(
    _step: WorkflowStep,
    _ctx: WorkflowContext,
  ): Promise<string> {
    // Promise.all over sub-step IDs
    return "complete";
  }

  private async runHuman(
    _step: WorkflowStep,
    _ctx: WorkflowContext,
  ): Promise<string> {
    // Publish event; suspend; resume on reply — implementation deferred
    return "waiting";
  }

  private async runRollback(
    rollback: WorkflowStep[],
    ctx: WorkflowContext,
  ): Promise<void> {
    for (const step of rollback) {
      await this.runAction(step, ctx).catch(() => {});
    }
  }
}
```

---

## 6. WorkflowAdapter Interface

```typescript
// workflows-engine/adapter.ts

export interface WorkflowAdapter {
  domain: string;
  handlers: Record<
    string,
    (input: unknown, ctx: WorkflowContext) => Promise<unknown>
  >;
}

// Example: HIPAA adapter
export const hipaaAdapter: WorkflowAdapter = {
  domain: "hipaa",
  handlers: {
    validatePHIFields: async (input, ctx) => {
      /* ... */
    },
    encryptAtRest: async (input, ctx) => {
      /* ... */
    },
    generateAuditTrail: async (input, ctx) => {
      /* ... */
    },
    notifyComplianceTeam: async (input, ctx) => {
      /* ... */
    },
    runAlgosValidation: async (input, ctx) => {
      // Compose with algos rules engine — workflow can call algos
      const result = await algosEngine.validate("hipaa", input);
      if (!result.passed)
        throw new Error(result.findings.map((f) => f.ruleId).join(", "));
      return result;
    },
  },
};
```

---

## 7. Parsing a .workflows.agentx File

````typescript
// workflows-engine/parser.ts

export class WorkflowParser {
  // Parse the WorkflowCatalog YAML block from the agentx markdown file
  static async parseFile(filePath: string): Promise<WorkflowCatalog> {
    const content = await Bun.file(filePath).text();

    // 1. Extract YAML frontmatter
    const frontmatter = parseFrontmatter(content);
    if (frontmatter.agentx?.type !== "workflows") {
      throw new Error(`Not a workflows agentx file: ${filePath}`);
    }

    // 2. Find the WorkflowCatalog YAML block
    //    Matches: ```yaml\n# {domain} WorkflowCatalog\n...\n```
    const yamlMatch = content.match(
      /```yaml\n# .+? WorkflowCatalog\n([\s\S]+?)```/,
    );
    if (!yamlMatch)
      throw new Error(`No WorkflowCatalog YAML block found in ${filePath}`);

    // 3. Parse YAML → WorkflowCatalog IR
    const catalog = parseYAML(yamlMatch[1]) as WorkflowCatalog;

    // 4. Validate required fields
    validateCatalog(catalog);

    return catalog;
  }
}
````

---

## 8. HTTP API (Elysia routes)

```typescript
// server/routes/workflows.ts

import { Elysia, t } from "elysia";
import { workflowEngine } from "../engine";

export const workflowRoutes = new Elysia({ prefix: "/api/workflows" })

  // List all registered workflows
  .get("/", () => {
    return { workflows: workflowEngine.listAll() };
  })

  // Run a workflow manually
  .post(
    "/:domain/run",
    async ({ params, body }) => {
      const result = await workflowEngine.run(
        params.domain,
        body.workflowId,
        body.input,
      );
      return result;
    },
    {
      params: t.Object({ domain: t.String() }),
      body: t.Object({
        workflowId: t.String(),
        input: t.Optional(t.Unknown()),
      }),
    },
  )

  // Get result/status of a past run (if persisted)
  .get("/:domain/runs/:runId", async ({ params }) => {
    return workflowEngine.getResult(params.domain, params.runId);
  })

  // List workflows for a domain
  .get("/:domain", ({ params }) => {
    return { workflows: workflowEngine.listForDomain(params.domain) };
  });
```

---

## 9. NATS Integration

```
Workflow triggers via NATS:

  playbook.{domain}.{event}    ← inbound trigger
  │
  └─ WorkflowEngine.subscribeAll()
       └─ Matches registered workflow triggers
            └─ engine.run(domain, workflowId, msg.data)
                 └─ emits: playbook.{domain}.{event}.completed
                           playbook.{domain}.{event}.failed
```

```typescript
// server/index.ts — register + subscribe on startup
await workflowEngine.loadFromFile(
  "./agentx/playbook/hipaa.workflows.agentx-v1.md",
);
await workflowEngine.loadFromFile(
  "./agentx/playbook/onboarding.workflows.agentx-v1.md",
);
workflowEngine.registerAdapter(hipaaAdapter);
workflowEngine.registerAdapter(onboardingAdapter);
workflowEngine.subscribeAll(); // wire up all NATS triggers
```

---

## 10. Composing Workflows with Algos (Validation inside Execution)

A workflow step of `type: action` can invoke the algos rules engine:

```
CLAIM.GENERATE.020 (workflow)
  │
  ▼
  step: "validate-hipaa-compliance"
  action: "runAlgosValidation"
  params: { specialty: "hipaa", ruleId: "HIPAA.PHI.001" }
  │
  ├─ PASS → step: "generate-claim"
  └─ FAIL → fail (with findings)
```

This keeps validation logic in algos (single source of truth) while workflows
orchestrate when and how to apply it.

---

## 11. Domain Workflow Example Files

| File                                      | Domain            | Workflows defined                       |
| ----------------------------------------- | ----------------- | --------------------------------------- |
| `hipaa.workflows.agentx-v1.md`            | HIPAA             | PHI validation, audit trail, encryption |
| `onboarding.workflows.agentx-v1.md`       | Client Onboarding | Contract → setup → notify → go-live     |
| `claim-generation.workflows.agentx-v1.md` | Claim Gen         | Fetch → validate → generate → submit    |
| `bree-ai.workflows.agentx-v1.md`          | Bree Platform     | Agent registration, grape lifecycle     |

---

## 12. Implementation Roadmap

| Phase                    | Deliverable                                                 |
| ------------------------ | ----------------------------------------------------------- |
| **1. Type system**       | `types.ts` — all TS interfaces                              |
| **2. Parser**            | Parse `*.workflows.agentx-vN.md` → `WorkflowCatalog` IR     |
| **3. Executor**          | `action`, `condition`, `emit` step types                    |
| **4. Adapter interface** | `WorkflowAdapter` + sample HIPAA adapter                    |
| **5. HTTP API**          | Elysia routes: run, list, status                            |
| **6. NATS triggers**     | `subscribeAll()` — auto-wire NATS event triggers            |
| **7. Advanced steps**    | `parallel`, `human`, `wait`, `sub-workflow`                 |
| **8. Domain workflows**  | Write `hipaa.workflows.agentx-v1.md` as first real instance |
| **9. Playbookx codegen** | `playbookx generate-workflow --domain hipaa`                |

---

## 13. Source Files

| File                                  | Role                                  |
| ------------------------------------- | ------------------------------------- |
| `agentx/meta-workflows.agentx.md`     | Schema for all workflows.agentx files |
| `agentx/algos-rules-engine.agentx.md` | Parallel algos engine (reference)     |
| `workflows-engine/types.ts`           | TypeScript interfaces                 |
| `workflows-engine/index.ts`           | WorkflowEngine class                  |
| `workflows-engine/parser.ts`          | `.workflows.agentx` file parser       |
| `workflows-engine/executor.ts`        | Step execution loop                   |
| `workflows-engine/adapter.ts`         | WorkflowAdapter interface             |
| `server/routes/workflows.ts`          | HTTP API routes                       |

---

_This note is AI-readable. Ask about the step execution loop, how to define a new domain workflow file, composing algos validation inside a workflow step, or the NATS trigger subscription model._
