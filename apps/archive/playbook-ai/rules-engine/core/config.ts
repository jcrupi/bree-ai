/**
 * Rules Engine Config
 *
 * Config switch for wound.ai: use agentx rules (parsed from file) or
 * TypeScript rules (hardcoded catalog). Set via env or explicit option.
 */

export type RulesEngineMode = "agentx" | "typescript";

const ENV_KEY = "WOUND_RULES_ENGINE";

/**
 * Resolve rules engine mode from env or explicit option.
 * Default: "typescript" (stable, no file I/O)
 */
export function getRulesEngineMode(override?: RulesEngineMode): RulesEngineMode {
  if (override === "agentx" || override === "typescript") return override;
  const env = process.env[ENV_KEY]?.toLowerCase();
  if (env === "agentx" || env === "typescript") return env;
  return "typescript";
}

/**
 * Check if agentx mode is active.
 */
export function useAgentxRules(override?: RulesEngineMode): boolean {
  return getRulesEngineMode(override) === "agentx";
}
