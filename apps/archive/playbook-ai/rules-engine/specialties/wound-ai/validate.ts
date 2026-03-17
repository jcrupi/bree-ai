/**
 * Wound AI Validation — Config-Switch Entry Point
 *
 * Validates wound encounters using either:
 * - agentx: Rules loaded from wound-ai.playbook-rules-engine.agentx.md
 * - typescript: Hardcoded WOUND_AI_CATALOG
 *
 * Set WOUND_RULES_ENGINE=agentx or WOUND_RULES_ENGINE=typescript to switch.
 */

import { execute } from "../../core/executor.js";
import { woundAdapter } from "./adapter.js";
import { WOUND_AI_CATALOG } from "./catalog.js";
import { loadWoundCatalogFromAgentx } from "../../core/parser.js";
import { getRulesEngineMode } from "../../core/config.js";
import type { RuleCatalog, ValidationResult, WoundEncounter } from "../../core/types.js";

export interface ValidateWoundOptions {
  /** Override mode; otherwise uses WOUND_RULES_ENGINE env */
  mode?: "agentx" | "typescript";
  /** Custom path to agentx file (agentx mode only) */
  agentxPath?: string;
}

export interface ValidateWoundResult extends ValidationResult {
  /** Which rules source was used */
  rulesSource: "agentx" | "typescript";
  /** Parse/load error when agentx mode fails */
  agentxError?: string;
}

/**
 * Validate a wound encounter. Uses config switch to run agentx or TypeScript rules.
 */
export function validateWound(
  encounter: WoundEncounter,
  options?: ValidateWoundOptions
): ValidateWoundResult {
  const mode = getRulesEngineMode(options?.mode);

  if (mode === "agentx") {
    const loaded = loadWoundCatalogFromAgentx(options?.agentxPath);
    if (!loaded.catalog) {
      return {
        passed: false,
        findings: [
          {
            ruleId: "CONFIG",
            severity: "error",
            message: `Agentx rules failed to load: ${loaded.error}`,
            remediation: "Set WOUND_RULES_ENGINE=typescript or fix agentx file path.",
          },
        ],
        ruleCatalogVersion: 0,
        rulesSource: "agentx",
        agentxError: loaded.error,
      };
    }
    const result = execute(loaded.catalog, encounter, woundAdapter);
    return { ...result, rulesSource: "agentx" };
  }

  const result = execute(WOUND_AI_CATALOG, encounter, woundAdapter);
  return { ...result, rulesSource: "typescript" };
}
