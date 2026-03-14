import { execute } from "../../core/executor.js";
import { enmAdapter } from "./adapter.js";
import { ENM_AI_CATALOG } from "./catalog.js";
import { getRulesEngineMode } from "../../core/config.js";
import type { ValidationResult, EnmEncounter } from "../../core/types.js";

export interface ValidateEnmOptions {
  /** Override mode; otherwise uses ENM_RULES_ENGINE env */
  mode?: "agentx" | "typescript";
}

export interface ValidateEnmResult extends ValidationResult {
  /** Which rules source was used */
  rulesSource: "agentx" | "typescript";
}

/**
 * Validate an E/M encounter.
 */
export function validateEnm(
  encounter: EnmEncounter,
  options?: ValidateEnmOptions
): ValidateEnmResult {
  const mode = getRulesEngineMode(options?.mode);

  // Note: AgentX loading not yet implemented for ENM, default to TS
  const result = execute(ENM_AI_CATALOG, encounter, enmAdapter);
  return { ...result, rulesSource: "typescript" };
}
