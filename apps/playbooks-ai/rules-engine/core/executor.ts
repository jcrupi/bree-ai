/**
 * Rules Executor
 *
 * Generic execution loop for the playbook rules engine.
 * Runs rules in flow order; uses specialty adapters for native handlers.
 */

import type {
  Finding,
  PassFail,
  Rule,
  RuleCatalog,
  RuleContext,
  ValidationResult,
  WoundEncounter,
} from "./types.js";

export interface Adapter {
  specialty: string;
  ruleHandlers: Record<string, (inputs: Record<string, unknown>, context: RuleContext) => PassFail | Finding | Finding[] | unknown>;
}

function resolveInputs(
  rule: Rule,
  context: RuleContext,
  _catalog: RuleCatalog
): Record<string, unknown> {
  const inputs: Record<string, unknown> = {};
  const enc = context.encounter;
  const parsed = context.parsed;

  for (const key of rule.inputs) {
    if (key === "encounter") inputs[key] = enc;
    else if (key === "text") inputs[key] = enc.documentation ?? enc.wounds?.[0]?.text ?? "";
    else if (key === "wound_type") inputs[key] = parsed?.wound_type ?? enc.wounds?.[0]?.wound_type;
    else if (key === "location") inputs[key] = parsed?.location ?? enc.wounds?.[0]?.location ?? "other";
    else if (key === "etiology") inputs[key] = parsed?.etiology ?? enc.wounds?.[0]?.etiology;
    else if (key === "ai_icd_codes") inputs[key] = enc.ai_icd_codes ?? [];
    else if (key === "measurements") inputs[key] = enc.measurements ?? [];
    else if (key === "prior_measurements") inputs[key] = enc.prior_measurements ?? [];
    else if (key === "documentation") inputs[key] = enc.documentation ?? "";
    else if (key === "policy") inputs[key] = enc.policy;
    else if (key === "procedure") inputs[key] = enc.procedures?.[0];
    else if (key === "applications") inputs[key] = enc.procedures?.filter((p) => p.procedure_type === "APPLICATION") ?? [];
    else if (key === "assessments") {
      const ms = enc.measurements ?? [];
      const prior = enc.prior_measurements ?? [];
      inputs[key] = [...ms, ...prior].sort((a, b) => {
        const ta = new Date(a.measurement_timestamp ?? 0).getTime();
        const tb = new Date(b.measurement_timestamp ?? 0).getTime();
        return tb - ta;
      });
    } else if (key === "evidence_artifacts") inputs[key] = enc.evidence_artifacts ?? [];
    else if (key === "wound_area") {
      const m = enc.measurements?.[0];
      inputs[key] = m ? (m.area_cm2 ?? (m.length_cm ?? 0) * (m.width_cm ?? 0)) : undefined;
    }
    else if (key === "prepared_size") inputs[key] = enc.product_usages?.[0]?.prepared_size_cm2;
    else if (key === "applied_size" || key === "used") inputs[key] = enc.product_usages?.[0]?.applied_size_cm2;
    // Generic passthrough for unknown types (e.g. 1040-simple payloads)
    else inputs[key] = (enc as unknown as Record<string, unknown>)[key];
  }

  return inputs;
}

function isPassFail(v: unknown): v is PassFail {
  return v === "PASS" || v === "FAIL";
}

function isFinding(v: unknown): v is Finding {
  return typeof v === "object" && v !== null && "severity" in v && "ruleId" in v;
}

export function execute(
  catalog: RuleCatalog,
  encounter: WoundEncounter,
  adapter: Adapter
): ValidationResult {
  const context: RuleContext = {
    encounter,
    tables: catalog.tables ?? {},
    findings: [],
    parsed: undefined,
  };

  for (const ref of catalog.flow) {
    const rule = catalog.rules[ref.id];
    if (!rule) continue;

    const handlerName = rule.handler;
    const handler = handlerName ? adapter.ruleHandlers[handlerName] : undefined;

    if (!handler) continue;

    const inputs = resolveInputs(rule, context, catalog);
    const result = handler(inputs, context);

    if (isFinding(result)) {
      context.findings.push(result);
      if (result.status === "FAIL" && rule.shortCircuit) break;
    } else if (Array.isArray(result) && result.length > 0 && isFinding(result[0])) {
      context.findings.push(...(result as Finding[]));
      if (result.some((r) => r.status === "FAIL") && rule.shortCircuit) break;
    } else if (isPassFail(result) && result === "FAIL") {
      context.findings.push({
        ruleId: rule.id,
        severity: "error",
        message: `${rule.name} failed`,
        remediation: rule.remediation,
        status: "FAIL"
      });
      if (rule.shortCircuit) break;
    } else if (!isPassFail(result) && typeof result === "object" && result != null) {
      if ("wound_type" in result && "location" in result) {
        context.parsed = result as { wound_type: string; location: string; severity: string; etiology?: string };
      }
      if (Array.isArray(result) && ref.id === "STAGE.RECON.010") {
        context.encounter.reconciled_icd_codes = result as string[];
      }
    }
  }

  return {
    passed: context.findings.length === 0,
    findings: context.findings,
    ruleCatalogVersion: catalog.version,
    context: {
      parsed: context.parsed,
      reconciled_icd_codes: encounter.reconciled_icd_codes,
    },
  };
}
