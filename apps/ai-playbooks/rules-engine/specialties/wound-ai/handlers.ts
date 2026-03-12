/**
 * Wound AI Rule Handlers — Full Implementation
 *
 * Native implementations aligned with wound-ai.algos.agentx-v1.md and
 * wound-ai Python validation engines.
 */

import type {
  PassFail,
  RuleContext,
  WoundEncounter,
  WoundMeasurement,
  ProcedureEvent,
  EvidenceArtifact,
  Finding,
} from "../../core/types.js";
import { WastageEngine, type WastageInputs } from "./engines/wastage-engine.js";
import { ContradictionEngine, type ContradictionInputs } from "./engines/contradiction-engine.js";
import { UtilizationEngine, type UtilizationInputs } from "./engines/utilization-engine.js";

const STAGE_PATTERNS: Array<{ pattern: RegExp; wound_type: string; severity: string }> = [
  { pattern: /stage iv pressure|stage 4 pressure|pressure ulcer stage 4|pressure injury stage 4/i, wound_type: "pressure_ulcer_stage_4", severity: "severe" },
  { pattern: /stage iii pressure|stage 3 pressure|pressure ulcer stage 3|pressure injury stage 3/i, wound_type: "pressure_ulcer_stage_3", severity: "moderate" },
  { pattern: /stage ii pressure|stage 2 pressure|pressure ulcer stage 2|pressure injury stage 2/i, wound_type: "pressure_ulcer_stage_2", severity: "moderate" },
  { pattern: /stage i pressure|stage 1 pressure|pressure ulcer stage 1|pressure injury stage 1/i, wound_type: "pressure_ulcer_stage_1", severity: "mild" },
  { pattern: /unstageable pressure|deep tissue injury/i, wound_type: "pressure_ulcer_unstageable", severity: "severe" },
  { pattern: /venous stasis ulcer|vlu/i, wound_type: "venous_stasis_ulcer", severity: "moderate" },
  { pattern: /diabetic foot ulcer|dfu/i, wound_type: "diabetic_foot_ulcer", severity: "moderate" },
];

const STAGE_LOCATION_ICD: Record<string, string[]> = {
  pressure_ulcer_stage_1: ["L89.151", "L89.211", "L89.101"],
  pressure_ulcer_stage_2: ["L89.152", "L89.212", "L89.102"],
  pressure_ulcer_stage_3: ["L89.153", "L89.213", "L89.103"],
  pressure_ulcer_stage_4: ["L89.154", "L89.214", "L89.104"],
  pressure_ulcer_unstageable: ["L89.130", "L89.310", "L89.810"],
};

const LOCATION_INDEX: Record<string, number> = {
  sacrum: 0, sacral: 0, coccyx: 0, midline: 0,
  hip: 1, trochanter: 1, heel: 2,
};

const PERFUSION_ARTIFACT_TYPES = ["ABI_REPORT", "TBI_REPORT", "TcPO2_REPORT"];

function locationToIndex(location: string): number {
  const lower = (location || "").toLowerCase();
  for (const [key, idx] of Object.entries(LOCATION_INDEX)) {
    if (lower.includes(key)) return idx;
  }
  return 2;
}

function extractStageFromWoundType(woundType: string): number | null {
  const m = woundType.match(/stage_(\d)/);
  return m ? parseInt(m[1], 10) : null;
}

function extractStageFromIcd(icd: string): number | null {
  const m = icd.match(/L89\.1\d([0-4])/);
  return m ? parseInt(m[1], 10) : null;
}

function parseIsoDate(s: string | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function daysBetween(d1: Date, d2: Date): number {
  return Math.floor((d1.getTime() - d2.getTime()) / (24 * 60 * 60 * 1000));
}

function isNumeric(val: unknown): boolean {
  if (val == null) return false;
  if (typeof val === "number" && !isNaN(val)) return true;
  try {
    return !isNaN(parseFloat(String(val)));
  } catch {
    return false;
  }
}

// --- STAGE.PARSE.001 ---
export function parseWoundTypeAndSeverity(
  inputs: Record<string, unknown>,
  _context: RuleContext
): PassFail | unknown {
  const text = (inputs.text as string) || "";
  const lower = text.toLowerCase();

  for (const { pattern, wound_type, severity } of STAGE_PATTERNS) {
    if (pattern.test(lower)) {
      const location = lower.includes("sacrum") || lower.includes("sacral") ? "sacrum"
        : lower.includes("hip") || lower.includes("trochanter") ? "hip"
        : "other";
      const etiology = wound_type === "diabetic_foot_ulcer" ? "DFU"
        : wound_type === "venous_stasis_ulcer" ? "VLU"
        : undefined;
      return { wound_type, severity, location, etiology };
    }
  }

  if (lower.includes("pressure")) {
    return { wound_type: "pressure_ulcer_unstageable", severity: "moderate", location: "other" };
  }

  return { wound_type: "pressure_ulcer_unstageable", severity: "moderate", location: "other" };
}

// --- STAGE.RECON.010 ---
export function reconcileICDWithDocumentedStage(
  inputs: Record<string, unknown>,
  context: RuleContext
): PassFail | unknown {
  const woundType = (inputs.wound_type as string) || "";
  const location = (inputs.location as string) || "other";
  const aiIcdCodes = (inputs.ai_icd_codes as string[]) || context.encounter.ai_icd_codes || [];

  const documentedStage = extractStageFromWoundType(woundType);
  if (documentedStage == null) return aiIcdCodes;

  const aiStages = aiIcdCodes.map(extractStageFromIcd).filter((s): s is number => s != null);
  const maxAi = aiStages.length ? Math.max(...aiStages) : 0;

  const hasConflict = maxAi !== 0 && maxAi !== documentedStage;
  const hasPressureUlcer = aiIcdCodes.some((c) => c.startsWith("L89."));

  if (hasConflict || !hasPressureUlcer) {
    const codes = generateICD10FromStageAndLocation(
      { wound_type: woundType, location },
      context
    ) as string[];
    return codes;
  }

  return aiIcdCodes;
}

// --- STAGE.CODE.020 ---
export function generateICD10FromStageAndLocation(
  inputs: Record<string, unknown>,
  _context: RuleContext
): PassFail | unknown {
  const woundType = (inputs.wound_type as string) || "pressure_ulcer_unstageable";
  const location = (inputs.location as string) || "other";
  const idx = locationToIndex(location);
  const codes = STAGE_LOCATION_ICD[woundType] || STAGE_LOCATION_ICD.pressure_ulcer_unstageable;
  return [codes[idx] ?? codes[2]];
}

// --- MR.ID.001 (full) ---
export function encounterIntegrity(
  inputs: Record<string, unknown>,
  _context: RuleContext
): PassFail {
  const encounter = inputs.encounter as WoundEncounter;
  const wounds = encounter?.wounds ?? [];
  const procedures = encounter?.procedures ?? [];

  // STEP 1: Required fields
  const required = ["date_of_service", "rendering_clinician_id", "place_of_service", "patient_id"];
  for (const field of required) {
    const val = encounter?.[field as keyof WoundEncounter];
    if (val == null || (typeof val === "string" && val.trim() === "")) return "FAIL";
  }

  // STEP 2: Laterality consistency (when procedures have laterality)
  const woundLaterality = new Set(wounds.map((w) => w.laterality).filter(Boolean));
  for (const proc of procedures) {
    const lat = proc.procedure_context?.laterality ?? proc.laterality;
    if (lat && woundLaterality.size > 0 && !woundLaterality.has(lat)) return "FAIL";
  }

  // STEP 3: Signature status (when explicitly provided)
  if (encounter.signature_status != null) {
    if (encounter.signature_status !== "SIGNED") return "FAIL";
    if (encounter.signature_status === "SIGNED" && !encounter.signed_at) return "FAIL";
  }

  return "PASS";
}

// --- WND.MEAS.010 (full) ---
export function serialMeasurementIntegrity(
  inputs: Record<string, unknown>,
  _context: RuleContext
): PassFail {
  const measurements = inputs.measurements as WoundMeasurement[] | undefined;
  const priorMeasurements = inputs.prior_measurements as WoundMeasurement[] | undefined;
  const ms = Array.isArray(measurements) ? measurements : measurements ? [measurements] : [];
  const prior = Array.isArray(priorMeasurements) ? priorMeasurements : priorMeasurements ? [priorMeasurements] : [];
  const all = [...ms, ...prior].sort((a, b) => {
    const ta = parseIsoDate(a.measurement_timestamp)?.getTime() ?? 0;
    const tb = parseIsoDate(b.measurement_timestamp)?.getTime() ?? 0;
    return tb - ta;
  });

  if (all.length === 0) return "PASS";

  const current = all[0];
  const required = ["length_cm", "width_cm", "measurement_timestamp"];
  for (const field of required) {
    const val = current[field as keyof WoundMeasurement];
    if (val == null) return "FAIL";
  }
  const len = current.length_cm ?? 0;
  const wid = current.width_cm ?? 0;
  if (len <= 0 || wid <= 0) return "FAIL";

  const area = Math.round(len * wid * 100) / 100;
  if (area === 0) return "FAIL";

  // Static dimensions: all 3 identical to prior (depth only when both documented)
  if (all.length >= 2) {
    const prev = all[1];
    const lenMatch = current.length_cm === prev.length_cm;
    const widMatch = current.width_cm === prev.width_cm;
    const depMatch = current.depth_cm != null && prev.depth_cm != null && current.depth_cm === prev.depth_cm;
    const staticCount = (lenMatch ? 1 : 0) + (widMatch ? 1 : 0) + (depMatch ? 1 : 0);
    if (staticCount === 3) return "FAIL";
  }

  // Trend: no improvement over ≥3 visits
  if (all.length >= 3) {
    const a0 = (all[0].area_cm2 ?? (all[0].length_cm! * all[0].width_cm!));
    const a2 = (all[2].area_cm2 ?? (all[2].length_cm! * all[2].width_cm!));
    const trend = a2 > 0 ? (a0 - a2) / a2 : 0;
    if (trend >= 0) return "FAIL";
  }

  return "PASS";
}

// --- INF.300 (full: ≥2 infection evidence) ---
const contradictionEngineInstance = new ContradictionEngine();
export function contradictionEngine(
  inputs: Record<string, unknown>,
  context: RuleContext
): Finding {
  return contradictionEngineInstance.evaluate(inputs as unknown as ContradictionInputs, context);
}

// --- INF.310 (osteomyelitis for DFU) ---
export function osteomyelitisContradiction(
  inputs: Record<string, unknown>,
  _context: RuleContext
): PassFail {
  const encounter = inputs.encounter as WoundEncounter | undefined;
  const woundType = (inputs.wound_type as string) ?? "";
  const etiology = inputs.etiology as string ?? woundType.includes("diabetic") ? "DFU" : "";
  if (etiology !== "DFU" && !woundType.includes("diabetic")) return "PASS";

  const attestations = encounter?.attestations ?? {};
  const findings = encounter?.findings ?? {};
  const evidenceArtifacts = (inputs.evidence_artifacts as EvidenceArtifact[]) ?? encounter?.evidence_artifacts ?? [];

  const noOmClaimed = attestations.no_active_osteomyelitis === true;
  const clinicalFindings = (findings.clinical_findings ?? "").toLowerCase();

  const omEvidence: string[] = [];
  for (const a of evidenceArtifacts) {
    if (a.artifact_type === "IMAGING") {
      const meta = JSON.stringify(a.extracted_metadata ?? {}).toLowerCase();
      if (meta.includes("osteomyelitis")) omEvidence.push("imaging");
    }
  }
  if (clinicalFindings.includes("bone involvement")) omEvidence.push("bone involvement");
  if (clinicalFindings.includes("exposed bone")) omEvidence.push("exposed bone");

  if (noOmClaimed && omEvidence.length >= 1) return "FAIL";
  return "PASS";
}

// --- UTIL.500 (full) ---
const utilizationEngineInstance = new UtilizationEngine();
export function utilizationEngine(
  inputs: Record<string, unknown>,
  context: RuleContext
): Finding {
  return utilizationEngineInstance.evaluate(inputs as unknown as UtilizationInputs, context);
}

// --- BILL.600 (full) ---
const wastageEngineInstance = new WastageEngine();
export function wastageEngine(
  inputs: Record<string, unknown>,
  context: RuleContext
): Finding {
  return wastageEngineInstance.evaluate(inputs as unknown as WastageInputs, context);
}

// --- DFU.SOC.100 ---
export function dfuSocOffloading(
  inputs: Record<string, unknown>,
  _context: RuleContext
): PassFail {
  const woundType = (inputs.wound_type as string) ?? "";
  const etiology = (inputs.etiology as string) ?? (woundType.includes("diabetic") ? "DFU" : "");
  if (etiology !== "DFU") return "PASS";

  const policy = inputs.policy as { soc_requirements?: { offloading_required?: boolean } } | undefined;
  if (!policy?.soc_requirements?.offloading_required) return "PASS";

  const procedure = inputs.procedure as ProcedureEvent | undefined;
  const device = (procedure?.offloading_device_selected ?? "").trim().toLowerCase();
  const reapplied = procedure?.offloading_reapplied;

  if (device === "advised" || device === "patient_declined") return "FAIL";
  if (!device) return "FAIL";
  if (!reapplied) return "FAIL";

  return "PASS";
}

// --- VLU.SOC.100 ---
export function vluCompression(
  inputs: Record<string, unknown>,
  _context: RuleContext
): PassFail {
  const woundType = (inputs.wound_type as string) ?? "";
  const etiology = (inputs.etiology as string) ?? (woundType.includes("venous") ? "VLU" : "");
  if (etiology !== "VLU") return "PASS";

  const policy = inputs.policy as { soc_requirements?: { compression_required?: boolean; vlu_compression_required?: boolean } } | undefined;
  const req = policy?.soc_requirements?.compression_required ?? policy?.soc_requirements?.vlu_compression_required;
  if (!req) return "PASS";

  const procedure = inputs.procedure as ProcedureEvent | undefined;
  const device = (procedure?.compression_device_selected ?? "").trim().toLowerCase();
  const reapplied = procedure?.compression_reapplied;

  if (device === "advised" || device === "patient_declined") return "FAIL";
  if (!device) return "FAIL";
  if (!reapplied) return "FAIL";

  return "PASS";
}

// --- PERF.010 ---
export function perfusionGate(
  inputs: Record<string, unknown>,
  _context: RuleContext
): PassFail {
  const etiology = (inputs.etiology as string) ?? "";
  const upper = etiology.toUpperCase();
  if (!["DFU", "VLU", "ARTERIAL"].includes(upper)) return "PASS";

  const policy = inputs.policy as { soc_requirements?: { perfusion_required?: boolean } } | undefined;
  if (!policy?.soc_requirements?.perfusion_required) return "PASS";

  const artifacts = (inputs.evidence_artifacts as EvidenceArtifact[]) ?? [];
  for (const a of artifacts) {
    if (!PERFUSION_ARTIFACT_TYPES.includes(a.artifact_type ?? "")) continue;
    const meta = a.extracted_metadata ?? {};
    const val = meta.abi_value ?? meta.tbi_value ?? meta.tcpO2_value ?? meta.value;
    const hasNumeric = val != null && isNumeric(val);
    const hasDate = a.test_date != null && a.test_date.length > 0;
    const hasLaterality = (a.laterality ?? "").trim().length > 0;
    if (hasNumeric && hasDate && hasLaterality) return "PASS";
  }

  return "FAIL";
}

export const WOUND_HANDLERS: Record<string, (i: Record<string, unknown>, c: RuleContext) => PassFail | unknown> = {
  parseWoundTypeAndSeverity,
  reconcileICDWithDocumentedStage,
  generateICD10FromStageAndLocation,
  encounterIntegrity,
  serialMeasurementIntegrity,
  contradictionEngine,
  osteomyelitisContradiction,
  utilizationEngine,
  wastageEngine,
  dfuSocOffloading,
  vluCompression,
  perfusionGate,
};
