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
import { readFileSync } from "node:fs";

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

async function runAnalysis(specialtyId: string, content: string) {
  const url = process.env.SERVER_URL || "http://localhost:9001";
  console.log(`\n\x1b[34m[ANALYZING]\x1b[0m Specialty: ${specialtyId} ...`);
  
  try {
    const res = await fetch(`${url}/api/chart-ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        specialty: specialtyId,
        action: "identify",
        documentation: content
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`API failed: ${err}`);
    }

    const data = await res.json();
    
    console.log("\x1b[32m[RESULTS]\x1b[0m");
    console.log(`\x1b[1mIdentified Code:\x1b[0m ${data.target_code || "N/A"}`);
    console.log(`\x1b[1mSummary:\x1b[0m ${data.summary}`);
    console.log(`\x1b[1mOptimization Advice:\x1b[0m\n${data.optimization || "None"}`);
    
    if (data.evaluations?.length) {
      console.log(`\n\x1b[1mRule Evaluations (${data.evaluations.length}):\x1b[0m`);
      data.evaluations.forEach((ev: any) => {
        const color = ev.status === "PASS" ? "\x1b[32m" : ev.status === "FAIL" ? "\x1b[31m" : "\x1b[33m";
        console.log(`  ${color}[${ev.status}]\x1b[0m ${ev.ruleId}: ${ev.finding}`);
      });
    }

    return data;
  } catch (e) {
    console.error(`\x1b[31m[ERROR]\x1b[0m ${(e as Error).message}`);
    console.log("\x1b[33m[TIP]\x1b[0m Make sure the server is running (npm run dev)");
    return null;
  }
}

async function cmdLearn(specialtyId?: string, caseFilter?: string) {
  for (const spec of SPECIALTY_CONFIG) {
    if (specialtyId && spec.id !== specialtyId) continue;

    const learningDir = join(APPS_ROOT, spec.app, "agentx", "apps", spec.id, "learning");
    if (!existsSync(learningDir)) continue;

    const files = readdirSync(learningDir).filter(f => f.endsWith(".agentx.md"));
    
    for (const file of files) {
      if (caseFilter && !file.includes(caseFilter)) continue;
      
      console.log(`\x1b[1m\n------------------------------------------------------------\x1b[0m`);
      console.log(`\x1b[1mRUNNING CASE:\x1b[0m ${file} (${spec.name})`);
      const content = readFileSync(join(learningDir, file), "utf8");
      await runAnalysis(spec.id, content);
    }
  }
}

const cmd = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

switch (cmd) {
  case "validate":
    cmdValidate(arg1);
    break;
  case "sync":
    cmdSync(arg1);
    break;
  case "watch":
    cmdWatch();
    break;
  case "learn":
    await cmdLearn(arg1, arg2);
    break;
  default:
    console.log(`
Playbookx CLI — Validate, sync, watch, and learn from agentx rules.

Usage:
  playbookx validate [specialty]   Validate rules
  playbookx sync [specialty]       Sync catalog (future)
  playbookx watch                  Watch for changes
  playbookx learn [specialty]      Run learning cases through Analyzer

Examples:
  playbookx validate
  playbookx learn enm-ai
  playbookx learn security-ai
`);
    process.exit(cmd ? 1 : 0);
}
