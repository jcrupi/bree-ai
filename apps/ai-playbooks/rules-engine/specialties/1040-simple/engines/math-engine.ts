import { BaseRuleEngine } from "../../../core/base.js";
import type { Finding, RuleContext } from "../../../core/types.js";

export interface IncomeMathInputs {
  w2s?: Array<{ box_1?: number }>;
  form1040?: {
    line_1a?: number;
    line_9?: number;   // Total income
    line_11?: number;  // AGI
    line_14?: number;  // Standard deduction
    line_15?: number;  // Taxable income
    line_16?: number;  // Tax
  };
}

export class IncomeMathEngine extends BaseRuleEngine<IncomeMathInputs> {
  constructor() {
    super("MATH.ENGINE", "1040 Income & Math Engine");
  }

  evaluate(inputs: IncomeMathInputs, _context: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const w2s = inputs.w2s ?? [];
    const form = inputs.form1040 ?? {};

    // TX.W2.010 — W-2 wages required
    const totalW2Wages = w2s.reduce((sum, w2) => sum + (w2.box_1 ?? 0), 0);
    if (w2s.length === 0 || totalW2Wages <= 0) {
      this.ruleId = "TX.W2.010";
      this.ruleName = "W-2 wages required";
      findings.push(
        this.createFailFinding("CLAIM_BLOCK", {
          contradictionDetail: "No W-2 or zero wages",
          remediationPrompt: "Add at least one W-2 with wages > 0.",
        })
      );
    } else {
      this.ruleId = "TX.W2.010";
      this.ruleName = "W-2 wages required";
      findings.push(this.createPassFinding("CLAIM_BLOCK"));
    }

    // TX.W2.011 — W-2 box 1 = Line 1a
    const line1a = form.line_1a ?? 0;
    if (Math.abs(totalW2Wages - line1a) > 0.01) {
      this.ruleId = "TX.W2.011";
      this.ruleName = "W-2 box 1 = Line 1a";
      findings.push(
        this.createFailFinding("CLAIM_BLOCK", {
          contradictionDetail: `Sum W-2 box 1 (${totalW2Wages}) does not equal Line 1a (${line1a})`,
          remediationPrompt: "Reconcile W-2 total with Line 1a.",
        })
      );
    } else {
      this.ruleId = "TX.W2.011";
      this.ruleName = "W-2 box 1 = Line 1a";
      findings.push(this.createPassFinding("CLAIM_BLOCK"));
    }

    // TX.MATH.020 — AGI flow
    const line9 = form.line_9 ?? 0;
    const line11 = form.line_11 ?? 0;
    if (line11 !== line9) {
      this.ruleId = "TX.MATH.020";
      this.ruleName = "AGI flow";
      findings.push(
        this.createFailFinding("CLAIM_BLOCK", {
          contradictionDetail: `Line 11 (${line11}) != Line 9 (${line9})`,
          remediationPrompt: "For simple returns (no Schedule 1), AGI must equal total income.",
        })
      );
    } else {
      this.ruleId = "TX.MATH.020";
      this.ruleName = "AGI flow";
      findings.push(this.createPassFinding("CLAIM_BLOCK"));
    }

    // TX.MATH.021 — Taxable income
    const line14 = form.line_14 ?? 14600; // 14600 for Single 2024
    const line15 = form.line_15 ?? 0;
    const expectedTaxable = Math.max(0, line11 - line14);
    if (Math.abs(line15 - expectedTaxable) > 0.01) {
      this.ruleId = "TX.MATH.021";
      this.ruleName = "Taxable income";
      findings.push(
        this.createFailFinding("CLAIM_BLOCK", {
          contradictionDetail: `Line 15 (${line15}) != Line 11 (${line11}) - Line 14 (${line14})`,
          remediationPrompt: "Recalculate: taxable income = AGI − standard deduction.",
        })
      );
    } else {
      this.ruleId = "TX.MATH.021";
      this.ruleName = "Taxable income";
      findings.push(this.createPassFinding("CLAIM_BLOCK"));
    }

    // TX.MATH.022 — Tax from table (Mocked table logic)
    const line16 = form.line_16 ?? 0;
    // VERY simple mock of IRS Tax rate (Flat ~10% for example context)
    const mockExpectedTax = line15 > 0 ? Math.round(line15 * 0.10) : 0; 
    
    if (Math.abs(line16 - mockExpectedTax) > 100) { // arbitrary buffer for demo
      this.ruleId = "TX.MATH.022";
      this.ruleName = "Tax from table";
      findings.push(
        this.createFailFinding("CLAIM_BLOCK", {
          contradictionDetail: `Line 16 (${line16}) does not match expected tax ~(${mockExpectedTax})`,
          remediationPrompt: "Use IRS Tax Table for correct amount based on Line 15 and Single status.",
        })
      );
    } else {
      this.ruleId = "TX.MATH.022";
      this.ruleName = "Tax from table";
      findings.push(this.createPassFinding("CLAIM_BLOCK"));
    }

    return findings;
  }
}
