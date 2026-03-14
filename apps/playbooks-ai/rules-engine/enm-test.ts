import { validateEnm } from "./index.js";
import type { EnmEncounter } from "./core/types.js";

const scenarios: Array<{ name: string; encounter: EnmEncounter }> = [
  {
    name: "Scenario 1: Correct Office Visit (99214)",
    encounter: {
      date_of_service: "2026-03-12",
      provider_id: "P123",
      place_of_service: "11",
      patient_id: "PT456",
      patient_status: "established",
      chosen_code: "99214",
      mdm_level: "moderate",
      documented_time_minutes: 35
    }
  },
  {
    name: "Scenario 2: Preventive Medicine Age Mismatch (99386 for age 25)",
    encounter: {
      date_of_service: "2026-03-12",
      provider_id: "P123",
      place_of_service: "11",
      patient_id: "PT456",
      patient_age_years: 25,
      chosen_code: "99386", // 40-64 years
    }
  },
  {
    name: "Scenario 3: Missing Modifier 25 with Procedure",
    encounter: {
      date_of_service: "2026-03-12",
      provider_id: "P123",
      place_of_service: "11",
      patient_id: "PT456",
      chosen_code: "99213",
      claims: [
        { code: "99213", type: "CPT" },
        { code: "17000", type: "CPT" }, // Destruct lesion (procedure)
      ],
      modifiers: [] // Missing 25 for 99213
    }
  },
  {
    name: "Scenario 4: CCM Time Insufficient",
    encounter: {
      date_of_service: "2026-03-12",
      provider_id: "P123",
      place_of_service: "11",
      patient_id: "PT456",
      chosen_code: "99490",
      clinical_staff_time_minutes: 15 // Requires 20
    }
  }
];

console.log("=== ENM-AI Rule Engine Expansion Test ===\n");

scenarios.forEach((s, i) => {
  console.log(`${i + 1}. ${s.name}`);
  const result = validateEnm(s.encounter);
  if (result.passed) {
    console.log("   ✅ PASS");
  } else {
    console.log("   ❌ FAIL");
    result.findings.filter(f => f.status === "FAIL").forEach(f => {
      console.log(`     - [${f.ruleId}]: ${f.message}`);
    });
  }
  console.log("");
});

console.log("=== Done ===");
