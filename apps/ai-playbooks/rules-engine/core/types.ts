/**
 * Rules Engine Types
 *
 * Canonical types for the playbook rules engine. Aligned with
 * apps/playbook-ai/agentx/algos-rules-engine.agentx.md and wound-ai Python models.
 */

export type PassFail = "PASS" | "FAIL";
export type Severity = "error" | "warning" | "info" | "SIGN_BLOCK" | "CLAIM_BLOCK" | "RISK_FLAG";

export interface MRPointer {
  object: string;
  field: string;
  id?: string;
}

export interface RuleRef {
  id: string;
  name?: string;
  order: number;
}

export interface Rule {
  id: string;
  name: string;
  type: "native" | "interpreted";
  handler?: string;
  inputs: string[];
  output: "PASS_FAIL" | "array" | "object";
  description?: string;
  remediation?: string;
  shortCircuit?: boolean;
  requiredFields?: string[];
}

export interface Table {
  name: string;
  rows: Record<string, unknown>[];
  columns?: string[];
}

export interface RuleCatalog {
  specialty: string;
  version: number;
  created_at: string;
  flow: RuleRef[];
  rules: Record<string, Rule>;
  tables?: Record<string, unknown>;
}

export interface Finding {
  ruleId: string;
  ruleName?: string;
  severity: Severity;
  message: string;
  status?: PassFail;
  remediation?: string;
  contradictionDetail?: string;
  missingFields?: string[];
  evidenceRequired?: string[];
  mrPointers?: MRPointer[];
  findingPayload?: Record<string, unknown>;
}

export interface ValidationResult {
  passed: boolean;
  findings: Finding[];
  ruleCatalogVersion: number;
  context?: Record<string, unknown>;
}

export interface RuleContext {
  encounter: WoundEncounter;
  tables: Record<string, unknown>;
  findings: Finding[];
  parsed?: ParsedWoundData;
}

export interface WoundMeasurement {
  length_cm?: number;
  width_cm?: number;
  depth_cm?: number;
  area_cm2?: number;
  measurement_timestamp?: string;
}

export interface WoundBlock {
  text: string;
  wound_type?: string;
  location?: string;
  laterality?: string;
  stage?: number;
  etiology?: string;
}

export interface ProcedureEvent {
  id?: string;
  procedure_type?: string;
  laterality?: string;
  procedure_context?: { laterality?: string };
  offloading_device_selected?: string;
  offloading_reapplied?: boolean;
  compression_device_selected?: string;
  compression_reapplied?: boolean;
  created_at?: string;
}

export interface EvidenceArtifact {
  artifact_type?: string;
  test_date?: string;
  laterality?: string;
  extracted_metadata?: Record<string, unknown>;
}

export interface ProductUsage {
  id?: string;
  prepared_size_cm2?: number;
  applied_size_cm2?: number;
}

export interface PolicyVersion {
  utilization_package?: {
    spacing_days?: number;
    max_applications?: number;
    max_applications_per_episode?: number;
    min_area_improvement?: number;
    min_improvement_percent?: number;
  };
  soc_requirements?: {
    offloading_required?: boolean;
    compression_required?: boolean;
    vlu_compression_required?: boolean;
    perfusion_required?: boolean;
  };
  continued_use_threshold?: number;
  jwjz_applicability_rules?: {
    enabled?: boolean;
    use_jw_for_discarded?: boolean;
    use_jz_for_exact?: boolean;
    allow_multi_unit?: boolean;
  };
}

export interface WoundEncounter {
  id?: string;
  date_of_service?: string;
  rendering_clinician_id?: string;
  place_of_service?: string;
  patient_id?: string;
  documentation?: string;
  signature_status?: string;
  signed_at?: string;
  assessment_plan?: string;
  attestations?: Record<string, boolean>;
  vitals?: { temperature_f?: number };
  current_medications?: { has_antibiotics?: boolean };
  findings?: { clinical_findings?: string };
  wounds?: WoundBlock[];
  measurements?: WoundMeasurement[];
  prior_measurements?: WoundMeasurement[];
  procedures?: ProcedureEvent[];
  evidence_artifacts?: EvidenceArtifact[];
  policy?: PolicyVersion;
  product_usages?: ProductUsage[];
  ai_icd_codes?: string[];
  ai_cpt_codes?: string[];
  reconciled_icd_codes?: string[];
}

export interface ParsedWoundData {
  wound_type: string;
  location: string;
  severity: string;
  etiology?: string;
}
