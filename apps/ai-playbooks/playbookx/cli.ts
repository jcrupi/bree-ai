#!/usr/bin/env bun
/**
 * Playbookx CLI — Validate, sync, and watch agentx rules.
 *
 * Usage:
 *   playbookx validate [flow]   # Parse agentx, check handlers exist
 *   playbookx sync [flow]       # Parse agentx → write catalog (future)
 *   playbookx watch             # Watch agentx files, run validate on change
 */

import { join } from "node:path";
import { existsSync, readdirSync, watch } from "node:fs";
import { APPS_ROOT } from "../rules-engine/paths.js";
import { loadWoundCatalogFromAgentx } from "../rules-engine/core/parser.js";
import { WOUND_HANDLERS } from "../rules-engine/specialties/wound-ai/handlers.js";
import { SPECIALTY_CONFIG } from "../shared/specialty-config.js";

function getAgentxPath(app: string): string {
  return join(APPS_ROOT, app, "agentx", "playbook", `${app}.playbook-rules-engine.agentx.md`);
}

function validateWound(): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const loaded = loadWoundCatalogFromAgentx();
  if (!loaded.catalog) {
    errors.push(loaded.error ?? "Failed to load wound catalog");
    return { ok: false, errors };
  }
  const catalog = loaded.catalog;
  for (const ref of catalog.flow) {
    const rule = catalog.rules[ref.id];
    if (!rule) {
      errors.push(`Rule ${ref.id} in flow not found in rules`);
      continue;
    }
    const handlerName = rule.handler;
    if (handlerName && !(handlerName in WOUND_HANDLERS)) {
      errors.push(`Handler "${handlerName}" for rule ${ref.id} not found`);
    }
  }
  return { ok: errors.length === 0, errors };
}

function validateSpecialty(specialtyId: string): { ok: boolean; errors: string[] } {
  if (specialtyId === "wound" || specialtyId === "wound-ai") {
    return validateWound();
  }
  const spec = SPECIALTY_CONFIG.find((s) => s.id === specialtyId || s.app === specialtyId);
  if (!spec) {
    return { ok: false, errors: [`Unknown specialty: ${specialtyId}`] };
  }
  if (!spec.rulesEngine) {
    return { ok: true, errors: [] };
  }
  return validateWound();
}

function validateAll(): { ok: boolean; errors: string[] } {
  const allErrors: string[] = [];
  for (const spec of SPECIALTY_CONFIG) {
    if (!spec.rulesEngine) continue;
    const r = validateSpecialty(spec.id);
    if (!r.ok) {
      allErrors.push(`[${spec.name}]: ${r.errors.join("; ")}`);
    }
  }
  return { ok: allErrors.length === 0, errors: allErrors };
}

function cmdValidate(specialty?: string) {
  const r = specialty ? validateSpecialty(specialty) : validateAll();
  if (r.ok) {
    console.log("Validation passed");
    process.exit(0);
  } else {
    console.error("Validation failed:");
    r.errors.forEach((e) => console.error("  -", e));
    process.exit(1);
  }
}

function cmdSync(_specialty?: string) {
  console.log("sync: not yet implemented (would write catalog from agentx)");
  process.exit(0);
}

function cmdWatch() {
  console.log("Watching agentx directories...");
  const appsDir = APPS_ROOT;
  if (!existsSync(appsDir)) {
    console.error("APPS_ROOT not found:", appsDir);
    process.exit(1);
  }
  const apps = readdirSync(appsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  for (const app of apps) {
    const agentxDir = join(appsDir, app, "agentx");
    if (!existsSync(agentxDir)) continue;
    watch(agentxDir, { recursive: true }, (event, filename) => {
      if (filename && filename.endsWith(".md")) {
        console.log(`[${event}] ${app}/${filename}`);
        const r = validateAll();
        if (r.ok) console.log("  Validation passed");
        else r.errors.forEach((e) => console.error("  -", e));
      }
    });
    console.log(`  watching ${app}/agentx/`);
  }
}

const cmd = process.argv[2];
const arg = process.argv[3];

switch (cmd) {
  case "validate":
    cmdValidate(arg);
    break;
  case "sync":
    cmdSync(arg);
    break;
  case "watch":
    cmdWatch();
    break;
  default:
    console.log(`
Playbookx CLI — Validate, sync, and watch agentx rules.

Usage:
  playbookx validate [specialty]   Validate rules (wound, or all)
  playbookx sync [specialty]       Sync catalog from agentx (future)
  playbookx watch                  Watch agentx files, validate on change

Examples:
  bun run playbookx/cli.ts validate
  bun run playbookx/cli.ts validate wound
  bun run playbookx/cli.ts watch
`);
    process.exit(cmd ? 1 : 0);
}
