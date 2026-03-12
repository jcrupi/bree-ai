import { execute } from "../../core/executor.js";
import { simple1040Adapter } from "./adapter.js";
import { SIMPLE_1040_CATALOG } from "./catalog.js";
import { loadCatalogFromAgentx } from "../../core/parser.js";
import { getRulesEngineMode } from "../../core/config.js";
import type { ValidationResult, WoundEncounter } from "../../core/types.js";

export interface Validate1040Options {
  mode?: "agentx" | "typescript";
  agentxPath?: string;
}

export interface Validate1040Result extends ValidationResult {
  rulesSource: "agentx" | "typescript";
  agentxError?: string;
}

export function validate1040Simple(
  contextPayload: any,
  options?: Validate1040Options
): Validate1040Result {
  const mode = getRulesEngineMode(options?.mode);

  if (mode === "agentx") {
    // Note: uses playbook-ai app as defined in specialty-config
    const loaded = loadCatalogFromAgentx("playbook-ai", "1040-simple", "1040-simple.algos.agentx-v1.md", options?.agentxPath);
    if (!loaded.catalog) {
      return {
        passed: false,
        findings: [
          {
            ruleId: "CONFIG",
            severity: "error",
            message: `Agentx rules failed to load: ${loaded.error}`,
            remediation: "Ensure the path to 1040-simple.algos.agentx-v1.md is correct.",
          },
        ],
        ruleCatalogVersion: 0,
        rulesSource: "agentx",
        agentxError: loaded.error,
      };
    }
    const result = execute(loaded.catalog, contextPayload as WoundEncounter, simple1040Adapter);
    return { ...result, rulesSource: "agentx" };
  }

  const result = execute(SIMPLE_1040_CATALOG, contextPayload as WoundEncounter, simple1040Adapter);
  return { ...result, rulesSource: "typescript" };
}
