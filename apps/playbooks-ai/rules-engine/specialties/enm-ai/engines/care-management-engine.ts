import type { EnmEncounter, Finding, RuleContext } from "../../../core/types.js";

/**
 * CareManagementEngine
 * 
 * Logic for CCM/PCM time-based validation.
 */
export class CareManagementEngine {
  evaluate(encounter: EnmEncounter, _context: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const code = encounter.chosen_code;
    const staffTime = encounter.clinical_staff_time_minutes ?? 0;
    const physicianTime = encounter.physician_time_minutes ?? 0;

    if (!code) return [];

    if (code === "99490" && staffTime < 20) {
      findings.push({
        ruleId: "EM.CCM.110",
        ruleName: "Care Management Time",
        severity: "CLAIM_BLOCK",
        status: "FAIL",
        message: "CCM 99490 requires at least 20 minutes of clinical staff time.",
        remediation: "Document clinical staff time or select a code that matches the documented duration."
      });
    }

    if (code === "99491" && physicianTime < 30) {
      findings.push({
        ruleId: "EM.CCM.110",
        ruleName: "Care Management Time",
        severity: "CLAIM_BLOCK",
        status: "FAIL",
        message: "CCM 99491 requires at least 30 minutes of physician/QHP time.",
        remediation: "Document physician/QHP time or select a code that matches the documented duration."
      });
    }

    return findings;
  }
}
