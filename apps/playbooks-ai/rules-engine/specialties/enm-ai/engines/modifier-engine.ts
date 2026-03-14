import type { EnmEncounter, Finding, RuleContext } from "../../../core/types.js";

/**
 * ModifierEngine
 * 
 * Logic for E/M modifiers (24, 25, 57).
 */
export class ModifierEngine {
  evaluate(encounter: EnmEncounter, _context: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const modifiers = encounter.modifiers ?? [];
    const claims = encounter.claims ?? [];

    // Check for Modifier 25 when E/M is billed with a procedure
    const hasProcedure = claims.some(c => this.isProcedure(c.code));
    const isEmCode = this.isEm(encounter.chosen_code);

    if (hasProcedure && isEmCode && !modifiers.includes("25")) {
      findings.push({
        ruleId: "EM.MOD.120",
        ruleName: "Modifier 25 Consistency",
        severity: "CLAIM_BLOCK",
        status: "FAIL",
        message: "Significant separately identifiable E/M service on the same day as a procedure requires Modifier 25.",
        remediation: "Append modifier 25 to the E/M code if it is separate and significant."
      });
    }

    return findings;
  }

  private isProcedure(code?: string): boolean {
    if (!code) return false;
    // Simple check: most surgery/procedure codes start with 1-6
    const c = code.charAt(0);
    return ["1", "2", "3", "4", "5", "6"].includes(c);
  }

  private isEm(code?: string): boolean {
    return !!code && code.startsWith("99");
  }
}
