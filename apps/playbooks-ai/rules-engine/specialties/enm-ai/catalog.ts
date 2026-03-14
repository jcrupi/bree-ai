import type { RuleCatalog } from "../../core/types.js";

/**
 * ENM AI Rule Catalog — TypeScript Implementation
 * 
 * Aligned with enm-ai.algos.agentx-v2.md
 */
export const ENM_AI_CATALOG: RuleCatalog = {
  specialty: "enm-ai",
  version: 2,
  created_at: "2026-03-12T20:00:00Z",
  flow: [
    { id: "EM.ID.001", name: "Encounter Integrity", order: 1 },
    { id: "EM.LVL.040", name: "Level Consistency", order: 2 },
    { id: "EM.PRV.100", name: "Preventive Age Logic", order: 3 },
    { id: "EM.CCM.110", name: "Care Management Time Logic", order: 4 },
    { id: "EM.MOD.120", name: "Modifier 25 Consistency", order: 5 },
  ],
  rules: {
    "EM.ID.001": {
      id: "EM.ID.001",
      name: "EncounterIntegrity",
      type: "native",
      handler: "emEncounterIntegrity",
      inputs: ["encounter"],
      output: "PASS_FAIL",
      requiredFields: ["date_of_service", "provider_id", "place_of_service", "patient_id"],
      shortCircuit: true,
      remediation: "Complete required encounter fields. Use valid CMS POS (02, 10, 11, 12, 13, 21, 22, 23, 31, 32).",
    },
    "EM.LVL.040": {
      id: "EM.LVL.040",
      name: "EnmLevelConsistency",
      type: "native",
      handler: "emLevelConsistency",
      inputs: ["encounter"],
      output: "object",
      remediation: "Chosen code must match MDM level or documented time.",
    },
    "EM.PRV.100": {
      id: "EM.PRV.100",
      name: "EmPreventiveAge",
      type: "native",
      handler: "emPreventiveAge",
      inputs: ["encounter"],
      output: "object",
      remediation: "Correct the preventive code to match the patient's age range.",
    },
    "EM.CCM.110": {
      id: "EM.CCM.110",
      name: "EmCareMgmtTime",
      type: "native",
      handler: "emCareMgmtTime",
      inputs: ["encounter"],
      output: "object",
      remediation: "Ensure CCM time requirements are met for the selected code.",
    },
    "EM.MOD.120": {
      id: "EM.MOD.120",
      name: "EmModifierConsistency",
      type: "native",
      handler: "emModifierConsistency",
      inputs: ["encounter"],
      output: "object",
      remediation: "Append Modifier 25 when an E/M is significant and separate from a procedure.",
    },
  },
};
