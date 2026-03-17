/**
 * Rules Engine Example — Wound AI with Config Switch
 *
 * Tests both agentx and TypeScript rules modes. Use WOUND_RULES_ENGINE env
 * or pass { mode: "agentx" | "typescript" } to validateWound().
 *
 * Run:
 *   bun run rules-engine/example.ts              # default: typescript
 *   WOUND_RULES_ENGINE=agentx bun run rules-engine/example.ts
 *   bun run rules-engine/example.ts agentx       # pass mode as arg
 */

import { validateWound } from "./index.js";
import type { WoundEncounter } from "./core/types.js";

const encounterPass: WoundEncounter = {
  date_of_service: "2025-03-06",
  rendering_clinician_id: "NPI123",
  place_of_service: "11",
  patient_id: "PT001",
  documentation: "Stage 4 pressure ulcer on sacrum. 4x5cm, depth 1.5cm. Granulation tissue present.",
  ai_icd_codes: ["L89.154"],
  measurements: [
    { length_cm: 4, width_cm: 5, depth_cm: 1.5, measurement_timestamp: "2025-03-06T10:00:00Z" },
  ],
};

const encounterFail: WoundEncounter = {
  date_of_service: "2025-03-06",
  documentation: "Stage 3 pressure ulcer on hip.",
  ai_icd_codes: ["L89.152"],
};

const encounterRecon: WoundEncounter = {
  ...encounterPass,
  documentation: "Stage 3 pressure ulcer on sacrum.",
  ai_icd_codes: ["L89.152"],
};

function runTests(mode: "agentx" | "typescript") {
  console.log(`\n--- Mode: ${mode.toUpperCase()} ---\n`);

  const r1 = validateWound(encounterPass, { mode });
  console.log("1. Complete encounter:", r1.passed ? "PASS" : "FAIL", "| source:", r1.rulesSource);
  if (r1.agentxError) console.log("   Agentx error:", r1.agentxError);
  console.log("   Reconciled ICD:", r1.context?.reconciled_icd_codes);

  const r2 = validateWound(encounterFail, { mode });
  console.log("2. Missing required fields:", r2.passed ? "PASS" : "FAIL");
  console.log("   Findings:", r2.findings.map((f) => f.ruleId));

  const r3 = validateWound(encounterRecon, { mode });
  console.log("3. Reconciliation (doc Stage 3, AI Stage 2):", r3.passed ? "PASS" : "FAIL");
  console.log("   Reconciled ICD:", r3.context?.reconciled_icd_codes, "(expected L89.153)");
}

const modeArg = process.argv[2]?.toLowerCase();
const mode = modeArg === "agentx" ? "agentx" : modeArg === "typescript" ? "typescript" : undefined;

console.log("=== Wound AI Rules Engine — Config Switch Demo ===");
console.log("Env WOUND_RULES_ENGINE:", process.env.WOUND_RULES_ENGINE ?? "(not set)");
console.log("Override from argv:", process.argv[2] ?? "(none)");

runTests(mode ?? "typescript");
runTests(mode === "typescript" ? "agentx" : mode === "agentx" ? "typescript" : "agentx");

console.log("\n=== Done ===");
