import { BaseRuleEngine } from "../../../core/base.js";
import type { Finding, RuleContext } from "../../../core/types.js";

// Basic inputs matching the 1040 layout
export interface IdentificationInputs {
  taxpayer?: {
    ssn?: string;
  };
  form1040?: {
    filing_status?: string;
    signature?: string;
    date?: string;
  };
}

export class IdentificationEngine extends BaseRuleEngine<IdentificationInputs> {
  constructor() {
    super("ID.ENGINE", "1040 Identification Engine");
  }

  evaluate(inputs: IdentificationInputs, _context: RuleContext): Finding[] {
    const findings: Finding[] = [];

    // TX.ID.001 — SSN/TIN format
    const ssn = inputs.taxpayer?.ssn ?? "";
    const cleanSsn = ssn.replace(/-/g, "");
    if (!cleanSsn || cleanSsn.length !== 9 || !/^\d+$/.test(cleanSsn)) {
      this.ruleId = "TX.ID.001";
      this.ruleName = "SSN/TIN format";
      findings.push(
        this.createFailFinding("CLAIM_BLOCK", {
          contradictionDetail: "Invalid or missing SSN",
          remediationPrompt: "Provide a valid 9-digit SSN (e.g. 123-45-6789).",
          missingFields: ["taxpayer.ssn"],
        })
      );
    } else {
      this.ruleId = "TX.ID.001";
      this.ruleName = "SSN/TIN format";
      findings.push(this.createPassFinding("CLAIM_BLOCK"));
    }

    // TX.ID.002 — Filing status required
    const status = inputs.form1040?.filing_status;
    if (status !== "Single") {
      this.ruleId = "TX.ID.002";
      this.ruleName = "Filing status required";
      findings.push(
        this.createFailFinding("CLAIM_BLOCK", {
          contradictionDetail: "Missing or invalid filing status",
          remediationPrompt: "Set filing_status to 'Single' for the simple 1040 scenario.",
          missingFields: ["form1040.filing_status"],
        })
      );
    } else {
      this.ruleId = "TX.ID.002";
      this.ruleName = "Filing status required";
      findings.push(this.createPassFinding("CLAIM_BLOCK"));
    }

    // TX.SIGN.030 — Signature and date
    const sig = inputs.form1040?.signature;
    const date = inputs.form1040?.date;
    if (!sig || !date) {
      this.ruleId = "TX.SIGN.030";
      this.ruleName = "Signature and date";
      findings.push(
        this.createFailFinding("SIGN_BLOCK", {
          contradictionDetail: "Missing signature or date",
          remediationPrompt: "Sign and date the return.",
          missingFields: [!sig ? "signature" : "date"],
        })
      );
    } else {
      this.ruleId = "TX.SIGN.030";
      this.ruleName = "Signature and date";
      findings.push(this.createPassFinding("SIGN_BLOCK"));
    }

    return findings;
  }
}
