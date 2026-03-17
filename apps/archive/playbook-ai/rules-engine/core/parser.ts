/**
 * AgentX Rules Parser
 *
 * Parses playbook-rules-engine.agentx.md to extract RuleCatalog and tables.
 * Uses YAML package for full parsing.
 */

import { parse as parseYaml } from "yaml";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { APPS_ROOT } from "../paths.js";
import type { RuleCatalog, Rule, RuleRef } from "./types.js";

const RULE_CATALOG_YAML_RE = /```yaml\s*\n# wound-ai RuleCatalog[\s\S]*?\n```/;
const STAGE_LOCATION_YAML_RE = /```yaml\s*\n# STAGE\.CODE\.020 mapping[\s\S]*?\n```/;

/**
 * Extract the first YAML block that contains "wound-ai RuleCatalog" from agentx content.
 */
export function extractRuleCatalogYaml(content: string): string | null {
  const match = content.match(RULE_CATALOG_YAML_RE);
  return match ? match[0].replace(/^```yaml\n|```$/g, "").trim() : null;
}

/**
 * Extract the stage_location_icd YAML block from agentx content.
 */
export function extractStageLocationYaml(content: string): string | null {
  const match = content.match(STAGE_LOCATION_YAML_RE);
  return match ? match[0].replace(/^```yaml\n|```$/g, "").trim() : null;
}

function normalizeRule(raw: unknown): Rule | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = String(o.id ?? "");
  if (!id) return null;
  return {
    id,
    name: String(o.name ?? id),
    type: (o.type as "native" | "interpreted") ?? "native",
    handler: o.handler != null ? String(o.handler) : undefined,
    inputs: Array.isArray(o.inputs) ? o.inputs.map(String) : [],
    output: (o.output as Rule["output"]) ?? "PASS_FAIL",
    description: o.description != null ? String(o.description) : undefined,
    remediation: o.remediation != null ? String(o.remediation) : undefined,
    shortCircuit: o.shortCircuit === true,
    requiredFields: Array.isArray(o.requiredFields) ? o.requiredFields.map(String) : undefined,
  };
}

function normalizeFlow(raw: unknown): RuleRef[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, i) => {
      if (item && typeof item === "object" && "id" in item) {
        const o = item as Record<string, unknown>;
        return {
          id: String(o.id ?? ""),
          name: o.name != null ? String(o.name) : undefined,
          order: typeof o.order === "number" ? o.order : i + 1,
        };
      }
      return null;
    })
    .filter((r): r is RuleRef => r != null && r.id !== "");
}

/**
 * Parse agentx content to RuleCatalog.
 */
export function parseRuleCatalogFromAgentx(content: string): RuleCatalog | null {
  const yamlStr = extractRuleCatalogYaml(content);
  if (!yamlStr) return null;

  let parsed: unknown;
  try {
    parsed = parseYaml(yamlStr);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;

  const flow = normalizeFlow(o.flow);
  const rulesRaw = o.rules as Record<string, unknown> | undefined;
  const rules: Record<string, Rule> = {};
  if (rulesRaw && typeof rulesRaw === "object") {
    for (const [k, v] of Object.entries(rulesRaw)) {
      const rule = normalizeRule(v);
      if (rule) rules[k] = rule;
    }
  }

  const tables: Record<string, unknown> = {};
  const tablesRaw = o.tables as Record<string, unknown> | undefined;
  if (tablesRaw && typeof tablesRaw === "object") {
    Object.assign(tables, tablesRaw);
  }

  return {
    specialty: String(o.specialty ?? "wound-ai"),
    version: typeof o.version === "number" ? o.version : 1,
    created_at: String(o.created_at ?? new Date().toISOString()),
    flow,
    rules,
    tables: Object.keys(tables).length ? tables : undefined,
  };
}

/**
 * Load RuleCatalog from wound-ai agentx file.
 * Path uses APPS_ROOT (apps/) so wound-ai lives at apps/wound-ai/.
 */
export function loadWoundCatalogFromAgentx(
  agentxPath?: string
): { catalog: RuleCatalog; source: "agentx" } | { catalog: null; source: "agentx"; error: string } {
  const defaultPath = join(
    APPS_ROOT,
    "wound-ai",
    "agentx",
    "playbook",
    "wound-ai.playbook-rules-engine.agentx.md"
  );
  const path = agentxPath ?? defaultPath;

  if (!existsSync(path)) {
    return { catalog: null, source: "agentx", error: `Agentx file not found: ${path}` };
  }

  const content = readFileSync(path, "utf-8");
  const catalog = parseRuleCatalogFromAgentx(content);

  if (!catalog || catalog.flow.length === 0) {
    return {
      catalog: null,
      source: "agentx",
      error: "Failed to parse RuleCatalog from agentx (empty flow or parse error)",
    };
  }

  return { catalog, source: "agentx" };
}
