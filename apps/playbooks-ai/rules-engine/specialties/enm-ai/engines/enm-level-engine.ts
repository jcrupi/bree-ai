import type { EnmEncounter, Finding, RuleContext } from "../../../core/types.js";

/**
 * EnmLevelEngine
 * 
 * Refers to Section 10/17 of Algos. Ensures the chosen CPT code 
 * is consistent with documented MDM level and Time.
 */
export class EnmLevelEngine {
  evaluate(encounter: EnmEncounter, context: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const chosenCode = encounter.chosen_code;
    const mdm = encounter.mdm_level;
    const time = encounter.documented_time_minutes ?? 0;

    if (!chosenCode) return [];

    // Simple validation against the CODE_TIME_TABLE from Algos
    // This is a simplified version of the full matrix
    const expected = this.getExpectedCode(mdm, time, encounter.patient_status);
    
    if (expected && expected !== chosenCode) {
      findings.push({
        ruleId: "EM.LVL.040",
        ruleName: "Level Consistency",
        severity: "CLAIM_BLOCK",
        status: "FAIL",
        message: `Chosen code ${chosenCode} does not match MDM (${mdm}) or time (${time} min). Expected: ${expected}.`,
        remediation: `Review documentation to ensure code ${chosenCode} is fully supported by either MDM or total time.`
      });
    }

    return findings;
  }

  private getExpectedCode(mdm?: string, time?: number, status?: string): string | null {
    // Basic mapping for Office visit (99202-99215)
    if (status === "new") {
      if (time >= 60 || mdm === "high") return "99205";
      if (time >= 45 || mdm === "moderate") return "99204";
      if (time >= 30 || mdm === "low") return "99203";
      if (time >= 15 || mdm === "straightforward") return "99202";
    } else {
      if (time >= 40 || mdm === "high") return "99215";
      if (time >= 30 || mdm === "moderate") return "99214";
      if (time >= 20 || mdm === "low") return "99213";
      if (time >= 10 || mdm === "straightforward") return "99212";
    }
    return null;
  }
}
