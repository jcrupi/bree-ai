# Playbook Rules Engine

Reusable rules engine that reads rule catalogs (from `playbook-rules-engine.agentx.md`) and executes validation via native handlers.

**Full wound.ai coverage (v2):** All 12 rules from wound-ai.algos.agentx-v1.md — STAGE.PARSE.001, STAGE.RECON.010, STAGE.CODE.020, MR.ID.001, WND.MEAS.010, DFU.SOC.100, VLU.SOC.100, PERF.010, INF.300, INF.310, WND.UTIL.500, WND.BILL.600.

## Config Switch

Use **agentx** (parsed from file) or **typescript** (hardcoded catalog):

| Switch | Source | Use case |
|--------|--------|----------|
| `typescript` | `wound-ai/catalog.ts` | Default, stable, no file I/O |
| `agentx` | `wound-ai.playbook-rules-engine.agentx.md` | Test rule changes without code edits |

**Set via env or option:**
```bash
WOUND_RULES_ENGINE=agentx bun run rules-engine/example.ts
```
```ts
validateWound(encounter, { mode: "agentx" });
```

## Structure

```
rules-engine/
├── core/             # Shared engine
│   ├── types.ts      # RuleCatalog, Rule, Finding, WoundEncounter, etc.
│   ├── executor.ts   # Generic execute() loop
│   ├── parser.ts     # Parse RuleCatalog from agentx YAML
│   └── config.ts     # RulesEngineMode, getRulesEngineMode()
├── specialties/
│   └── wound-ai/
│       ├── catalog.ts    # WOUND_AI_CATALOG (rules + flow + tables)
│       ├── handlers.ts   # Native rule implementations
│       ├── adapter.ts    # woundAdapter for executor
│       └── validate.ts   # validateWound() — config-switch entry point
├── paths.ts          # APPS_ROOT for agentx resolution
├── example.ts        # Demo: tests both modes
└── README.md
```

```
playbookx/            # CLI for validate, sync, watch
├── cli.ts
```

## Usage

```ts
import { validateWound } from "./rules-engine";
import type { WoundEncounter } from "./rules-engine";

const encounter: WoundEncounter = {
  date_of_service: "2025-03-06",
  rendering_clinician_id: "NPI123",
  place_of_service: "11",
  patient_id: "PT001",
  documentation: "Stage 4 pressure ulcer on sacrum.",
  ai_icd_codes: ["L89.154"],
};

const result = validateWound(encounter, { mode: "agentx" });
console.log(result.passed, result.findings, result.rulesSource);
```

## Run Example

```bash
cd apps/playbook-ai

# Default (typescript)
bun run rules-engine:example

# Agentx mode via env
bun run rules-engine:agentx

# TypeScript mode via env
bun run rules-engine:typescript
```

## Related

- `apps/playbook-ai/agentx/algos-rules-engine.agentx.md` — Engine design
- `apps/wound-ai/agentx/playbook/wound-ai.playbook-rules-engine.agentx.md` — Rules in agentx format
- `apps/wound-ai/agentx/playbook/wound-ai.algos.agentx-v1.md` — Full algorithm pseudocode
