import type { EnmEncounter, Finding, PassFail, RuleContext } from "../../../core/types.js";
import { EnmLevelEngine } from "./engines/enm-level-engine.js";
import { PreventiveEngine } from "./engines/preventive-engine.js";
import { CareManagementEngine } from "./engines/care-management-engine.js";
import { ModifierEngine } from "./engines/modifier-engine.js";

const levelEngine = new EnmLevelEngine();
const preventiveEngine = new PreventiveEngine();
const careMgmtEngine = new CareManagementEngine();
const modifierEngine = new ModifierEngine();

export function emEncounterIntegrity(inputs: Record<string, unknown>, _context: RuleContext): PassFail {
  const encounter = inputs.encounter as EnmEncounter;
  if (!encounter) return "FAIL";

  const required = ["date_of_service", "provider_id", "place_of_service", "patient_id"];
  for (const field of required) {
    const val = (encounter as any)[field];
    if (val == null || (typeof val === "string" && val.trim() === "")) return "FAIL";
  }

  const validPos = ["02", "10", "11", "12", "13", "21", "22", "23", "31", "32"];
  if (encounter.place_of_service && !validPos.includes(encounter.place_of_service)) return "FAIL";

  return "PASS";
}

export function emLevelConsistency(inputs: Record<string, unknown>, context: RuleContext): Finding[] {
  const encounter = (inputs.encounter as EnmEncounter) || (context.encounter as EnmEncounter);
  return levelEngine.evaluate(encounter, context);
}

export function emPreventiveAge(inputs: Record<string, unknown>, context: RuleContext): Finding[] {
  const encounter = (inputs.encounter as EnmEncounter) || (context.encounter as EnmEncounter);
  return preventiveEngine.evaluate(encounter, context);
}

export function emCareMgmtTime(inputs: Record<string, unknown>, context: RuleContext): Finding[] {
  const encounter = (inputs.encounter as EnmEncounter) || (context.encounter as EnmEncounter);
  return careMgmtEngine.evaluate(encounter, context);
}

export function emModifierConsistency(inputs: Record<string, unknown>, context: RuleContext): Finding[] {
  const encounter = (inputs.encounter as EnmEncounter) || (context.encounter as EnmEncounter);
  return modifierEngine.evaluate(encounter, context);
}

export const ENM_HANDLERS: Record<string, (i: Record<string, unknown>, c: RuleContext) => any> = {
  emEncounterIntegrity,
  emLevelConsistency,
  emPreventiveAge,
  emCareMgmtTime,
  emModifierConsistency,
};
