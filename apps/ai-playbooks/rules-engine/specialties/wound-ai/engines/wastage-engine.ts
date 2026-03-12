import { BaseRuleEngine } from "../../../core/base.js";
import type { Finding, RuleContext } from "../../../core/types.js";

export interface WastageInputs {
  wound_area?: number;
  wound_area_cm2?: number;
  prepared_size?: number;
  prepared_size_cm2?: number;
  applied_size?: number;
  used?: number;
  allow_multi_unit?: boolean;
}

export class WastageEngine extends BaseRuleEngine<WastageInputs> {
  constructor() {
    super("BILL.600", "Wastage and JW/JZ Modifier Engine");
  }

  evaluate(inputs: WastageInputs, _context: RuleContext): Finding {
    const woundArea = inputs.wound_area ?? inputs.wound_area_cm2;
    const preparedSize = inputs.prepared_size ?? inputs.prepared_size_cm2;
    const appliedSize = inputs.applied_size ?? inputs.used;

    if (preparedSize == null) {
      return this.createPassFinding("CLAIM_BLOCK", {
        reason: "Prepared size not provided, JW/JZ rules might not apply",
        jwjz_applicable: false
      });
    }
    
    if (preparedSize <= 0) {
      return this.createFailFinding("CLAIM_BLOCK", {
        missingFields: ["prepared_size_cm2"],
        remediationPrompt: "Prepared size required for JW/JZ calculation",
        mrPointers: [this.createMrPointer("product_usage", "prepared_size_cm2")]
      });
    }

    if (woundArea == null || woundArea <= 0) {
      return this.createFailFinding("CLAIM_BLOCK", {
        missingFields: ["wound_area"],
        remediationPrompt: "Wound area required (from measurement)",
        mrPointers: [this.createMrPointer("wound_assessment", "area_cm2")]
      });
    }

    const used = Math.min(woundArea, preparedSize);
    const discarded = preparedSize - used;

    if (appliedSize != null && Math.abs(appliedSize - used) > 0.01) {
      return this.createFailFinding("CLAIM_BLOCK", {
        contradictionDetail: "Applied size mismatch",
        remediationPrompt: `Applied size (${appliedSize}) does not match calculated used size (${used})`
      });
    }
    
    if (woundArea > preparedSize && !inputs.allow_multi_unit) {
      return this.createFailFinding("CLAIM_BLOCK", {
        contradictionDetail: "Wound area > prepared size without multi-unit",
        remediationPrompt: `Wound area (${woundArea} cm²) exceeds prepared size (${preparedSize} cm²). Verify measurements or document multi-unit usage.`,
        mrPointers: [
            this.createMrPointer("wound_assessment", "area_cm2"),
            this.createMrPointer("product_usage", "prepared_size_cm2"),
        ]
      });
    }

    const modifiers: string[] = [];
    if (discarded > 0) modifiers.push("JW");
    else if (discarded === 0) modifiers.push("JZ");

    return this.createPassFinding("CLAIM_BLOCK", {
      prepared_size_cm2: preparedSize,
      wound_area_cm2: woundArea,
      used_size_cm2: used,
      discarded_size_cm2: discarded,
      modifiers_generated: modifiers
    });
  }
}
