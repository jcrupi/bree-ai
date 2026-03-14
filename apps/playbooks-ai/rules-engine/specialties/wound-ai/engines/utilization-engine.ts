import { BaseRuleEngine } from "../../../core/base.js";
import type { Finding, RuleContext, WoundEncounter, ProcedureEvent, WoundMeasurement, PolicyVersion } from "../../../core/types.js";

function parseIsoDate(s: string | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function daysBetween(d1: Date, d2: Date): number {
  return Math.floor(Math.abs(d1.getTime() - d2.getTime()) / (24 * 60 * 60 * 1000));
}

export interface UtilizationInputs {
  policy?: PolicyVersion;
  applications?: ProcedureEvent[];
  assessments?: WoundMeasurement[];
  encounter?: WoundEncounter;
}

export class UtilizationEngine extends BaseRuleEngine<UtilizationInputs> {
  constructor() {
    super("UTIL.500", "Utilization Engine");
  }

  evaluate(inputs: UtilizationInputs, _context: RuleContext): Finding {
    const policy = inputs.policy;
    const applications = inputs.applications ?? [];
    const assessments = inputs.assessments ?? [];
    const encounter = inputs.encounter ?? _context.encounter;

    const util = policy?.utilization_package ?? {};
    const minDays = (util.spacing_days as number) ?? 7;
    const maxApps = (util.max_applications as number) ?? (util.max_applications_per_episode as number) ?? 12;
    const continuedThreshold = policy?.continued_use_threshold ?? 4;
    const improvementThresholdCm2 = (util.min_area_improvement as number) ?? 5.0;
    const improvementThresholdPct = (util.min_improvement_percent as number) ?? 20.0;

    const appProcs = applications.filter((p) => p.procedure_type === "APPLICATION");
    const sortedApps = [...appProcs].sort((a, b) => {
      const da = parseIsoDate(a.created_at)?.getTime() ?? 0;
      const db = parseIsoDate(b.created_at)?.getTime() ?? 0;
      return db - da; // DESC
    });

    if (sortedApps.length >= 2) {
      for (let i = 0; i < sortedApps.length - 1; i++) {
        const currentLabelDate = sortedApps[i].created_at;
        const previousLabelDate = sortedApps[i+1].created_at;
        const current = parseIsoDate(currentLabelDate);
        const prev = parseIsoDate(previousLabelDate);

        if (current && prev) {
          const days = daysBetween(current, prev);
          if (days < minDays) {
            return this.createFailFinding("CLAIM_BLOCK", {
              remediationPrompt: `Applications spaced too closely. Minimum ${minDays} days required between applications.`,
              findingPayload: {
                spacing_violation: {
                  required_days: minDays,
                  actual_days: days,
                  application_dates: [previousLabelDate, currentLabelDate]
                }
              },
              mrPointers: [
                this.createMrPointer("procedure_event", "date", sortedApps[i].id),
                this.createMrPointer("procedure_event", "date", sortedApps[i+1].id)
              ]
            });
          }
        }
      }
    }

    if (sortedApps.length > maxApps) {
      return this.createFailFinding("CLAIM_BLOCK", {
        remediationPrompt: `Episode limit of ${maxApps} applications exceeded.`,
        findingPayload: {
          app_limit_exceeded: { max_allowed: maxApps, current_count: sortedApps.length }
        },
        mrPointers: [this.createMrPointer("wound_episode", "episode_count")]
      });
    }

    if (sortedApps.length >= continuedThreshold && assessments.length >= 2) {
      // assessments theoretically sorted DESC (newest at index 0)
      const currentAssessment = assessments[0];
      const firstAssessment = assessments[assessments.length - 1];

      const a1 = firstAssessment.area_cm2 ?? (firstAssessment.length_cm! * firstAssessment.width_cm!);
      const a2 = currentAssessment.area_cm2 ?? (currentAssessment.length_cm! * currentAssessment.width_cm!);
      
      const areaReduction = a1 - a2;
      const pctReduction = a1 > 0 ? (areaReduction / a1) * 100 : 0;

      const improvementMet = areaReduction >= improvementThresholdCm2 || pctReduction >= improvementThresholdPct;

      if (!improvementMet) {
        const rationalePresent = (encounter?.assessment_plan ?? "").trim().length > 0;
        
        if (!rationalePresent) {
          return this.createFailFinding("CLAIM_BLOCK", {
            remediationPrompt: "Wound not improving per objective measurements. Document clinical rationale for continued use in Assessment/Plan sections.",
            findingPayload: {
              continued_use_fail: {
                area_reduction: areaReduction,
                required_reduction: improvementThresholdCm2,
                percent_reduction: pctReduction,
                required_percent: improvementThresholdPct
              }
            },
            evidenceRequired: ["physician_attestation"],
            mrPointers: [
              this.createMrPointer("wound_assessment", "area_cm2", undefined),
              this.createMrPointer("encounter", "assessment_plan", encounter?.id)
            ]
          });
        }
      }
    }

    const improvementDocumented = assessments.length >= 2 && sortedApps.length >= continuedThreshold;

    return this.createPassFinding("CLAIM_BLOCK", {
      spacing_ok: true,
      episode_count: sortedApps.length,
      improvement_documented: improvementDocumented
    });
  }
}
