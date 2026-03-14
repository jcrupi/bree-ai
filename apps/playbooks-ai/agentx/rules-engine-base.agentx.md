---
title: Base Rules Engine Migration (Bun/TS)
version: 1.0.0
description: Design and implementation plan for porting Python Base Rule Engine to Bun/TypeScript
---

# Base Rules Engine Migration

## 1. Goal
Bring the object-oriented, deterministic `BaseRuleEngine` from python (`grelin-ai/apps/wound-ai/validation/engines/base.py`) into the Bree-AI Monorepo as a Bun/TypeScript abstract class package in `apps/playbooks-ai/rules-engine/core/base.ts`. 

## 2. Rationale
Currently, the `executor.ts` runs functional mappings (`handler(inputs, context)`) utilizing specialized adapters. While functional execution is fast, it lacks standardized finding generators, strict interface adherence per-rule (like `evaluate()`), and encapsulation compared to the Python class structure (which strictly scopes rule_id, rule_name, and _create_fail_finding). 

By adopting an abstract `BaseRuleEngine` class in TypeScript, we achieve:
- **Traceability**: Standardization of `createFailFinding()` with `MRPointer`-like traceability (linking the failing field back to the UI/API response).
- **Extensibility**: Complex engines (like Wastage or Code Contradiction) can manage internal state/utilities seamlessly and be instantated within the handler mappings.
- **Strong Typing**: Bun/TypeScript enforces exact generic typing on `TInputs` for `evaluate(inputs: TInputs)`.

## 3. Architecture

### Core Interface
We define an abstract `BaseRuleEngine<TInputs>` class that mimics `base.py`.
It will contain:
- `constructor(ruleId: string, ruleName: string)`
- `abstract evaluate(inputs: TInputs, context: RuleContext): ValidationResult | PassFail`
- `protected createPassFinding(payload?: Record<string, unknown>): ValidationResult`
- `protected createFailFinding(options: FailOptions): ValidationResult`

### Types Integration
We will update `types.ts` or extend it within `base.ts` to include:
- `MRPointer`: `{ object: string, id?: string, field: string }`
- Enhanced `Finding` with `missingFields`, `mrPointers`, `contradictionDetail`.

## 4. Implementation Steps

1. **Create `base.ts`**: Implement the `BaseRuleEngine` abstract class.
2. **Export in `index.ts`**: Expose it through `rules-engine/core/index.ts`.
3. **Refactor a Handler**: Demonstrate usage by allowing handlers to instantiate these classes or use them as singletons.
