#!/usr/bin/env bun
/**
 * Playbookx CLI — Validate, sync, and watch agentx rules.
 *
 * Usage:
 *   playbookx validate [specialty]   # Parse agentx, check handlers exist
 *   playbookx sync [specialty]       # Parse agentx → write catalog (future)
 *   playbookx watch                 # Watch agentx files, run validate on change
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
    return { ok: true, errors: [] }; // No rules engine yet
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
    console.log("✓ Validation passed");
    process.exit(0);
  } else {
    console.error("✗ Validation failed:");
    r.errors.forEach((e) => console.error("  -", e));
    process.exit(1);
  }
}

async function cmdSync(specialtyId?: string) {
  const specs = specialtyId
    ? SPECIALTY_CONFIG.filter((s) => s.id === specialtyId || s.app === specialtyId)
    : SPECIALTY_CONFIG.filter((s) => s.rulesEngine);

  if (specs.length === 0) {
    console.error("No specialties found to sync");
    process.exit(1);
  }

  for (const spec of specs) {
    console.log(`Syncing ${spec.name}...`);
    const agentxPath = getAgentxPath(spec.app);
    if (!existsSync(agentxPath)) {
      console.warn(`  ! Agentx path not found: ${agentxPath}`);
      continue;
    }

    const loaded = loadWoundCatalogFromAgentx(agentxPath);
    if (!loaded.catalog) {
      console.error(`  ✗ Error parsing ${spec.name}: ${loaded.error}`);
      continue;
    }

    const outPath = join(APPS_ROOT, spec.app, "agentx", "catalog.json");
    try {
      const fs = await import("node:fs/promises");
      await fs.writeFile(outPath, JSON.stringify(loaded.catalog, null, 2), "utf-8");
      console.log(`  ✓ Wrote catalog to ${outPath}`);
    } catch (e: any) {
      console.error(`  ✗ Failed to write ${outPath}: ${e.message}`);
    }
  }
}

async function cmdGenerate(specialtyId?: string) {
  const specs = specialtyId
    ? SPECIALTY_CONFIG.filter((s) => s.id === specialtyId || s.app === specialtyId)
    : SPECIALTY_CONFIG.filter((s) => s.app.includes("-ai"));

  if (specs.length === 0) {
    console.error("No specialties found to generate");
    process.exit(1);
  }

  for (const spec of specs) {
    console.log(`Generating code for ${spec.name}...`);
    console.log(`  → Analyzing agentx/${spec.app}.playbook.agentx.md`);
    console.log(`  → Analyzing agentx/${spec.app}.algos.agentx.md`);
    console.log(`  → Updating specialty implementation in apps/${spec.app}/`);
    
    // In a fully automated agent flow, this would trigger the LLM to rewrite the code.
    // For now, it signals the AI Assistant to perform the generation.
    console.log(`  ✓ Generation task initiated for ${spec.app}`);
  }
}

function cmdWatch(specialtyId?: string) {
  const spec = specialtyId 
    ? SPECIALTY_CONFIG.find(s => s.id === specialtyId || s.app === specialtyId)
    : null;

  if (specialtyId && !spec) {
    console.error(`Unknown specialty for watch: ${specialtyId}`);
    process.exit(1);
  }

  console.log(spec ? `Watching ${spec.name} agentx directory...` : "Watching all agentx directories...");
  
  const appsDir = APPS_ROOT;
  if (!existsSync(appsDir)) {
    console.error("APPS_ROOT not found:", appsDir);
    process.exit(1);
  }

  const appsToWatch = spec ? [spec.app] : readdirSync(appsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  for (const app of appsToWatch) {
    const agentxDir = join(appsDir, app, "agentx");
    if (!existsSync(agentxDir)) {
      if (spec) console.error(`Agentx directory not found for ${app}: ${agentxDir}`);
      continue;
    }
    watch(agentxDir, { recursive: true }, async (event, filename) => {
      if (filename && filename.endsWith(".md")) {
        console.log(`[${event}] ${app}/${filename}`);
        const r = specialtyId ? validateSpecialty(specialtyId) : validateAll();
        if (r.ok) {
          console.log("  ✓ Validation passed");
          await cmdSync(specialtyId);
          await cmdGenerate(specialtyId);
        } else {
          r.errors.forEach((e) => console.error("  -", e));
        }
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
    await cmdSync(arg);
    break;
  case "generate":
    await cmdGenerate(arg);
    break;
  case "watch":
    cmdWatch(arg);
    break;
  default:
    console.log(`
Playbookx CLI — Validate, sync, and watch agentx rules.

Usage:
  playbookx validate [specialty]   Validate rules (wound, or all)
  playbookx sync [specialty]       Sync catalog from agentx
  playbookx generate [specialty]   Generate implementation code from agentx
  playbookx watch [specialty]      Watch agentx files, validate/sync on change

Examples:
  bun run playbookx/cli.ts validate wound
  bun run playbookx/cli.ts sync wound
  bun run playbookx/cli.ts generate wound
  bun run playbookx/cli.ts watch wound
`);
    process.exit(cmd ? 1 : 0);
}
