/**
 * Base Engine for Validation Rules
 * Implements common deterministic functionality for all rule engines, migrated from python.
 */

import type { Finding, Severity, MRPointer, PassFail, RuleContext } from "./types.js";

/**
 * Base class for all rule engines
 * Each engine implements deterministic logic for a specific rule group
 */
export abstract class BaseRuleEngine<TInputs> {
  public ruleId: string;
  public ruleName: string;

  /**
   * Initialize rule engine
   * @param ruleId Rule code (e.g., 'MR.ID.001')
   * @param ruleName Human-readable name
   */
  constructor(ruleId: string, ruleName: string) {
    this.ruleId = ruleId;
    this.ruleName = ruleName;
  }

  /**
   * Evaluate rule against canonical inputs
   * @param inputs Strongly-typed Record derived from the executor mapping
   * @param context Immutable RuleContext from executor
   * @returns PassFail or any structured data; the executor handles translating this map into findings.
   * Note: The python version returned Finding directly. In TS, the handler outputs PassFail 
   * OR we can explicitly have them use createPassFinding() / createFailFinding() and return them.
   */
  public abstract evaluate(inputs: TInputs, context: RuleContext): PassFail | Finding | unknown;

  /**
   * Create PASS finding
   * @param severity Severity level
   * @param findingPayload Optional additional data
   */
  protected createPassFinding(
    severity: Severity,
    findingPayload?: Record<string, unknown>
  ): Finding {
    return {
      ruleId: this.ruleId,
      ruleName: this.ruleName,
      severity,
      status: "PASS",
      message: `${this.ruleName} passed`,
      findingPayload: findingPayload || {},
    };
  }

  /**
   * Create FAIL finding
   * @param severity SIGN_BLOCK | CLAIM_BLOCK | RISK_FLAG | error etc.
   * @param options Details about contradiction
   */
  protected createFailFinding(
    severity: Severity,
    options?: {
      missingFields?: string[];
      contradictionDetail?: string;
      remediationPrompt?: string;
      evidenceRequired?: string[];
      mrPointers?: MRPointer[];
      findingPayload?: Record<string, unknown>;
    }
  ): Finding {
    const opts = options || {};
    return {
      ruleId: this.ruleId,
      ruleName: this.ruleName,
      severity,
      status: "FAIL",
      message: opts.contradictionDetail || `${this.ruleName} failed`,
      missingFields: opts.missingFields || [],
      contradictionDetail: opts.contradictionDetail,
      remediation: opts.remediationPrompt,
      evidenceRequired: opts.evidenceRequired || [],
      mrPointers: opts.mrPointers || [],
      findingPayload: opts.findingPayload || {},
    };
  }

  /**
   * Create medical record pointer
   */
  protected createMrPointer(
    objectName: string,
    field: string,
    objectId?: string
  ): MRPointer {
    return {
      object: objectName,
      field,
      id: objectId,
    };
  }
}
