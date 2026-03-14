/**
 * Playbook Rules Engine
 *
 * Reusable rules engine for specialty validation. Consumes rule catalogs
 * (from playbook-rules-engine.agentx.md) and executes via native handlers.
 *
 * Config switch: WOUND_RULES_ENGINE=agentx | typescript
 *
 * @example
 * ```ts
 * import { validateWound } from "./rules-engine";
 *
 * const result = validateWound(encounter, { mode: "agentx" });
 * console.log(result.passed, result.findings, result.rulesSource);
 * ```
 */

export * from "./core/index.js";
export { woundAdapter, validateWound, type ValidateWoundOptions, type ValidateWoundResult } from "./specialties/wound-ai/index.js";
export { simple1040Adapter, validate1040Simple, type Validate1040Options, type Validate1040Result } from "./specialties/1040-simple/index.js";
export { enmAdapter, validateEnm, type ValidateEnmOptions, type ValidateEnmResult } from "./specialties/enm-ai/index.js";
export { APPS_ROOT } from "./paths.js";
