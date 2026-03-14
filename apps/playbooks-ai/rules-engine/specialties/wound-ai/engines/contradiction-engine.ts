import { BaseRuleEngine } from "../../../core/base.js";
import type { Finding, RuleContext, EvidenceArtifact, WoundEncounter } from "../../../core/types.js";

export interface ContradictionInputs {
  documentation?: string;
  encounter?: WoundEncounter;
  evidence_artifacts?: EvidenceArtifact[];
}

export class ContradictionEngine extends BaseRuleEngine<ContradictionInputs> {
  constructor() {
    super("INF.300", "Infection/OM Contradiction Engine");
  }

  evaluate(inputs: ContradictionInputs, context: RuleContext): Finding {
    const doc = (inputs.documentation || "").toLowerCase();
    const encounter = inputs.encounter ?? context.encounter;
    const attestations = encounter?.attestations ?? {};
    const vitals = encounter?.vitals ?? {};
    const medications = encounter?.current_medications ?? {};
    const findings = encounter?.findings ?? {};
    const evidenceArtifacts = inputs.evidence_artifacts ?? encounter?.evidence_artifacts ?? [];

    const signals = {
      infection_attestation: attestations.no_active_infection === true,
      culture_ordered: evidenceArtifacts.some((a) => a.artifact_type === "CULTURE"),
      antibiotics_active: medications.has_antibiotics === true,
      fever_documented: (vitals.temperature_f ?? 0) > 101.3,
      cellulitis_noted: (findings.clinical_findings ?? "").toLowerCase().includes("cellulitis"),
      purulent: doc.includes("purulent"),
      drainage: doc.includes("purulent drainage"),
      antibiotics_started: doc.includes("antibiotics started")
    };

    const noInfectionClaimed = signals.infection_attestation;
    
    const evidenceList: string[] = [];
    if (signals.culture_ordered) evidenceList.push("culture ordered");
    if (signals.antibiotics_active) evidenceList.push("antibiotics active");
    if (signals.fever_documented) evidenceList.push("fever documented");
    if (signals.cellulitis_noted) evidenceList.push("cellulitis noted");
    if (signals.purulent) evidenceList.push("purulent drainage documented");
    if (signals.drainage && !signals.purulent) evidenceList.push("purulent drainage documented");
    if (signals.antibiotics_started) evidenceList.push("antibiotics started");

    if (noInfectionClaimed && evidenceList.length >= 2) {
      return this.createFailFinding("SIGN_BLOCK", {
        contradictionDetail: "claimed no active infection but evidence present",
        remediationPrompt: `Note claims no infection but evidence present: ${evidenceList.join(', ')}. Clarify infection status and document resolution evidence or plan.`,
        evidenceRequired: ["culture_result", "clinical_resolution_note"],
        mrPointers: [
          this.createMrPointer("encounter", "attestations.no_active_infection", encounter?.id)
        ]
      });
    }

    return this.createPassFinding("SIGN_BLOCK");
  }
}
