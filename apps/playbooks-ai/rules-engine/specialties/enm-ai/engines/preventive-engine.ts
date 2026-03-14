import type { EnmEncounter, Finding, RuleContext } from "../../../core/types.js";

/**
 * PreventiveEngine
 * 
 * Logic for age-based validation of Preventive Medicine codes (99381-99397).
 */
export class PreventiveEngine {
  evaluate(encounter: EnmEncounter, _context: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const code = encounter.chosen_code;
    const age = encounter.patient_age_years;

    if (!code || age === undefined) return [];

    // Map of code ranges to age requirements
    const ageRules: Record<string, { min?: number; max?: number }> = {
      "99381": { max: 0 }, // < 1 year
      "99391": { max: 0 },
      "99382": { min: 1, max: 4 },
      "99392": { min: 1, max: 4 },
      "99383": { min: 5, max: 11 },
      "99393": { min: 5, max: 11 },
      "99384": { min: 12, max: 17 },
      "99394": { min: 12, max: 17 },
      "99385": { min: 18, max: 39 },
      "99395": { min: 18, max: 39 },
      "99386": { min: 40, max: 64 },
      "99396": { min: 40, max: 64 },
      "99387": { min: 65 },
      "99397": { min: 65 },
    };

    const rule = ageRules[code];
    if (rule) {
      if ((rule.min !== undefined && age < rule.min) || (rule.max !== undefined && age > rule.max)) {
        findings.push({
          ruleId: "EM.PRV.100",
          ruleName: "Preventive Age Logic",
          severity: "CLAIM_BLOCK",
          status: "FAIL",
          message: `Code ${code} is for patients age ${this.formatAgeRule(rule)}. Current patient age is ${age}.`,
          remediation: `Correct the preventive medicine code to match the patient's age range.`
        });
      }
    }

    return findings;
  }

  private formatAgeRule(rule: { min?: number; max?: number }): string {
    if (rule.min === undefined) return `< 1 year`;
    if (rule.max === undefined) return `${rule.min}+ years`;
    return `${rule.min}–${rule.max} years`;
  }
}
